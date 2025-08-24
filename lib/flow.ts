/**
 * BOVI Flow Runner
 * Vanilla JavaScript flow execution with timer-based timeout handling
 */

import { Bus, emit, BoviEventMap } from './bus.js';
import { Timer, startTimer, cancelTimer, TimerConfig } from './timer.js';

// Flow DSL Types  
export interface FlowNode {
  id: string;
  type: string; // B.*, O.*, V.*, I.*
  label: string;
  description?: string;
  config?: any;
  outputs?: string[];
}

export interface FlowEdge {
  from: string;
  to: string;
  label: string;
  condition: string;
}

export interface FlowSpec {
  id: string;
  title: string;
  description: string;
  context: any;
  nodes: FlowNode[];
  edges: FlowEdge[];
  meta: {
    version: string;
    bovi_modes: string[];
    primary_mode: string;
    created: string;
    tags: string[];
  };
}

// Flow execution context
export interface FlowContext {
  flowId: string;
  currentNode?: string;
  nodeOutputs: Record<string, any>;
  activeTimers: Set<string>;
  userOverrides: Record<string, boolean>;
  startTime: number;
  aiButlerEnabled: boolean;
  completed: boolean;
  error?: Error;
}

// Flow execution states
type FlowState = 'idle' | 'running' | 'completed' | 'error';

// Flow runner with vanilla JavaScript state management
export class FlowRunner {
  private flows: Map<string, FlowContext> = new Map();
  private flowSpecs: Map<string, FlowSpec> = new Map();

  async loadFlow(flowSpec: FlowSpec): Promise<void> {
    this.flowSpecs.set(flowSpec.id, flowSpec);
    
    const context: FlowContext = {
      flowId: flowSpec.id,
      nodeOutputs: {},
      activeTimers: new Set(),
      userOverrides: {},
      startTime: 0,
      aiButlerEnabled: true,
      completed: false
    };
    
    this.flows.set(flowSpec.id, context);
  }

  startFlow(flowId: string, initialContext?: any): void {
    const context = this.flows.get(flowId);
    const flowSpec = this.flowSpecs.get(flowId);
    
    if (!context || !flowSpec) {
      console.error(`Flow ${flowId} not found or not loaded`);
      return;
    }

    // Initialize flow context
    context.startTime = Date.now();
    context.currentNode = this.getStartNode(flowSpec)?.id;
    context.completed = false;
    context.error = undefined;

    // Merge initial context if provided
    if (initialContext) {
      Object.assign(flowSpec.context, initialContext);
    }

    // Emit flow started event
    emit('flow.started', {
      flow: flowId,
      context: flowSpec.context
    });

    // Start executing from first node
    if (context.currentNode) {
      this.executeNode(context.currentNode, flowId);
    } else {
      this.completeFlow(flowId);
    }
  }

  private async executeNode(nodeId: string, flowId: string): Promise<void> {
    const context = this.flows.get(flowId);
    const flowSpec = this.flowSpecs.get(flowId);
    const node = flowSpec?.nodes.find(n => n.id === nodeId);

    if (!context || !flowSpec || !node) {
      this.errorFlow(flowId, new Error(`Node ${nodeId} not found`), nodeId);
      return;
    }

    try {
      const [mode, nodeType] = node.type.split('.');
      let outputs: any = {};
      let requiresTimeout = false;

      // Execute node based on its type
      switch (`${mode}.${nodeType}`) {
        case 'V.PDA':
          outputs = await this.executePDANode(node, context);
          emit('V.pda.completed', {
            flow: flowId,
            node: nodeId,
            ...outputs
          });
          break;

        case 'V.Calculate':
          outputs = await this.executeCalculateNode(node, context);
          emit('V.calculate.completed', {
            flow: flowId,
            node: nodeId,
            result: outputs.result
          });
          break;

        case 'V.Assess':
          outputs = await this.executeAssessNode(node, context);
          emit('V.assess.completed', {
            flow: flowId,
            node: nodeId,
            assessment: outputs.assessment
          });
          break;

        case 'I.Detect':
          outputs = await this.executeDetectNode(node, context);
          if (outputs.violation_detected) {
            emit('I.detect.violation', {
              flow: flowId,
              node: nodeId,
              violation: outputs.violation_type,
              affected: outputs.affected_items
            });
          }
          break;

        case 'I.Default':
        case 'B.Default':
        case 'O.Default':
          if (node.config?.timeout_s && context.aiButlerEnabled) {
            requiresTimeout = true;
            this.startNodeTimeout(node, flowId);
            return; // Exit here, timeout will handle completion
          } else {
            outputs = await this.executeDefaultNode(node, context);
          }
          break;

        case 'B.Sweep':
          outputs = await this.executeSweepNode(node, context);
          emit('B.sweep.updated', {
            flow: flowId,
            node: nodeId,
            kpis: outputs.kpis
          });
          break;

        case 'B.Learn':
          outputs = await this.executeLearnNode(node, context);
          emit('B.learn.triggered', {
            flow: flowId,
            node: nodeId,
            episode: node.config?.episode_id,
            priority: node.config?.priority
          });
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Store node outputs
      context.nodeOutputs[nodeId] = outputs;

      // Move to next node
      this.moveToNextNode(flowId, nodeId);

    } catch (error) {
      this.errorFlow(flowId, error as Error, nodeId);
    }
  }

  private startNodeTimeout(node: FlowNode, flowId: string): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    const [mode] = node.type.split('.');
    const timerConfig: TimerConfig = {
      flow: flowId,
      node: node.id,
      timeout_s: node.config.timeout_s,
      action: node.config.action,
      mode: mode as 'V' | 'I' | 'B' | 'O'
    };

    const timerId = startTimer(timerConfig);
    context.activeTimers.add(timerId);

    // Create specific event handlers for each mode
    if (mode === 'I') {
      Bus.on('I.default.applied', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.nodeOutputs[node.id] = {
            action_applied: true,
            result: event.detail.result,
            type: 'timeout'
          };
          context.activeTimers.delete(timerId);
          this.moveToNextNode(flowId, node.id);
        }
      });
      Bus.on('I.default.cancelled', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.activeTimers.delete(timerId);
          context.userOverrides[node.id] = true;
        }
      });
    } else if (mode === 'B') {
      Bus.on('B.default.applied', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.nodeOutputs[node.id] = {
            action_applied: true,
            result: event.detail.result,
            type: 'timeout'
          };
          context.activeTimers.delete(timerId);
          this.moveToNextNode(flowId, node.id);
        }
      });
      Bus.on('B.default.cancelled', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.activeTimers.delete(timerId);
          context.userOverrides[node.id] = true;
        }
      });
    } else if (mode === 'O') {
      Bus.on('O.default.applied', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.nodeOutputs[node.id] = {
            action_applied: true,
            result: event.detail.result,
            type: 'timeout'
          };
          context.activeTimers.delete(timerId);
          this.moveToNextNode(flowId, node.id);
        }
      });
      Bus.on('O.default.cancelled', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.activeTimers.delete(timerId);
          context.userOverrides[node.id] = true;
        }
      });
    } else if (mode === 'V') {
      Bus.on('V.default.applied', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.nodeOutputs[node.id] = {
            action_applied: true,
            result: event.detail.result,
            type: 'timeout'
          };
          context.activeTimers.delete(timerId);
          this.moveToNextNode(flowId, node.id);
        }
      });
      Bus.on('V.default.cancelled', (event) => {
        if (event.detail.flow === flowId && event.detail.node === node.id) {
          context.activeTimers.delete(timerId);
          context.userOverrides[node.id] = true;
        }
      });
    }
  }

  private moveToNextNode(flowId: string, currentNodeId: string): void {
    const context = this.flows.get(flowId);
    const flowSpec = this.flowSpecs.get(flowId);

    if (!context || !flowSpec) return;

    const nextNode = this.getNextNode(flowSpec, currentNodeId, context);
    
    if (nextNode) {
      context.currentNode = nextNode.id;
      this.executeNode(nextNode.id, flowId);
    } else {
      this.completeFlow(flowId);
    }
  }

  private completeFlow(flowId: string): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    context.completed = true;
    context.currentNode = undefined;

    // Clear any active timers
    context.activeTimers.forEach(timerId => {
      cancelTimer(timerId, 'flow_completed');
    });
    context.activeTimers.clear();

    emit('flow.completed', {
      flow: flowId,
      outputs: context.nodeOutputs
    });
  }

  private errorFlow(flowId: string, error: Error, nodeId?: string): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    context.error = error;
    context.completed = true;

    // Clear any active timers
    context.activeTimers.forEach(timerId => {
      cancelTimer(timerId, 'flow_error');
    });
    context.activeTimers.clear();

    emit('flow.error', {
      flow: flowId,
      error,
      node: nodeId
    });
  }

  // Public methods for user interaction
  cancelTimeout(flowId: string, nodeId: string, reason: string = 'user_action'): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    // Find active timer for this node
    const activeTimer = Array.from(context.activeTimers).find(timerId => {
      // This is a simplified way - in production you'd store timer metadata
      return true; // For now, cancel any active timer
    });

    if (activeTimer) {
      cancelTimer(activeTimer, reason);
      context.activeTimers.delete(activeTimer);
    }
  }

  overrideAction(flowId: string, nodeId: string, action: string): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    // Cancel any active timeout
    this.cancelTimeout(flowId, nodeId, 'user_override');

    // Apply user action immediately
    emit('ui.action.override', {
      flow: flowId,
      node: nodeId,
      action
    });

    // Store override result and continue flow
    context.nodeOutputs[nodeId] = {
      action_applied: true,
      result: { applied: true, type: 'user_override', action },
      type: 'override'
    };
    context.userOverrides[nodeId] = true;

    this.moveToNextNode(flowId, nodeId);
  }

  stopFlow(flowId: string): void {
    const context = this.flows.get(flowId);
    if (!context) return;

    // Clear all active timers
    context.activeTimers.forEach(timerId => {
      cancelTimer(timerId, 'flow_stopped');
    });
    context.activeTimers.clear();

    // Remove from active flows
    this.flows.delete(flowId);
  }

  getFlowState(flowId: string): FlowState {
    const context = this.flows.get(flowId);
    if (!context) return 'idle';
    if (context.error) return 'error';
    if (context.completed) return 'completed';
    if (context.currentNode) return 'running';
    return 'idle';
  }

  // Node execution implementations
  private async executePDANode(node: FlowNode, context: FlowContext): Promise<any> {
    const items = node.config?.items || [];
    let nominal = 0;
    let real = 0;
    let qualityScore = 0;

    emit('V.pda.started', {
      flow: context.flowId,
      node: node.id,
      items
    });

    items.forEach((item: any) => {
      nominal += item.price;
      real += item.price * (context.flowId === 'groceries' ? 0.86 : 1.0);
      qualityScore += (item.price - item.usual) / item.usual;
    });

    const quality = qualityScore / items.length < -0.02 ? 'Great' : 
                    qualityScore / items.length < 0.02 ? 'OK' : 'Poor';

    return { nominal, real, quality };
  }

  private async executeCalculateNode(node: FlowNode, context: FlowContext): Promise<any> {
    // Simple calculation based on config
    const formula = node.config?.formula || 'sum';
    const inputs = node.config?.inputs || [];
    
    let result = 0;
    
    if (formula === 'sum') {
      result = inputs.reduce((acc: number, val: number) => acc + val, 0);
    } else if (formula === 'average') {
      result = inputs.reduce((acc: number, val: number) => acc + val, 0) / inputs.length;
    }

    return { result };
  }

  private async executeAssessNode(node: FlowNode, context: FlowContext): Promise<any> {
    const criteria = node.config?.criteria || {};
    const threshold = node.config?.threshold || 0.5;
    
    // Simple assessment logic
    const assessment = Math.random() > threshold;
    
    return { assessment, reason: assessment ? 'meets criteria' : 'below threshold' };
  }

  private async executeDetectNode(node: FlowNode, context: FlowContext): Promise<any> {
    const triggers = node.config?.triggers || [];
    const threshold = node.config?.threshold || 0;

    // Check previous node outputs for violations
    let violationDetected = false;
    let affectedItems: any[] = [];

    if (triggers.includes('shrink')) {
      const items = this.getPreviousNodeOutput(context, 'items') || [];
      affectedItems = items.filter((item: any) => item.shrink);
      violationDetected = affectedItems.length > 0;
    }

    return {
      violation_detected: violationDetected,
      violation_type: violationDetected ? 'shrinkflation' : null,
      affected_items: affectedItems
    };
  }

  private async executeDefaultNode(node: FlowNode, context: FlowContext): Promise<any> {
    const action = node.config?.action || 'default_action';
    
    // Simulate applying the action
    const result = { applied: true, type: 'immediate', action };
    
    return { action_applied: true, result };
  }

  private async executeSweepNode(node: FlowNode, context: FlowContext): Promise<any> {
    const kpiConfig = node.config?.kpis || {};
    const kpis: Record<string, any> = {};

    Object.entries(kpiConfig).forEach(([kpiName, formula]) => {
      kpis[kpiName] = this.calculateKPI(formula as string, context);
    });

    return { kpis };
  }

  private async executeLearnNode(node: FlowNode, context: FlowContext): Promise<any> {
    const episodeId = node.config?.episode_id;
    const priority = node.config?.priority || 'medium';

    if (episodeId) {
      console.log(`Queuing episode ${episodeId} with priority ${priority}`);
    }

    return { episode_queued: !!episodeId };
  }

  // Helper methods
  private getStartNode(flowSpec: FlowSpec): FlowNode | null {
    const incomingNodes = new Set(flowSpec.edges.map(e => e.to));
    return flowSpec.nodes.find(n => !incomingNodes.has(n.id)) || null;
  }

  private getNextNode(flowSpec: FlowSpec, currentNodeId: string, context: FlowContext): FlowNode | null {
    const outgoingEdges = flowSpec.edges.filter(e => e.from === currentNodeId);

    for (const edge of outgoingEdges) {
      if (this.evaluateCondition(edge.condition, context)) {
        return flowSpec.nodes.find(n => n.id === edge.to) || null;
      }
    }

    return null;
  }

  private evaluateCondition(condition: string, context: FlowContext): boolean {
    if (condition === 'always') return true;
    if (condition === 'never') return false;

    try {
      const evaluated = condition.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
        return String(this.getContextValue(context, variable) || 'null');
      });

      return new Function('return ' + evaluated)();
    } catch {
      return false;
    }
  }

  private getContextValue(context: FlowContext, path: string): any {
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private getPreviousNodeOutput(context: FlowContext, key: string): any {
    const outputs = Object.values(context.nodeOutputs);
    return outputs[outputs.length - 1]?.[key];
  }

  private calculateKPI(formula: string, context: FlowContext): any {
    if (formula.startsWith('last(')) {
      const path = formula.slice(5, -1);
      return this.getContextValue(context, path);
    }

    if (formula.startsWith('count(')) {
      return Object.keys(context.nodeOutputs).length;
    }

    if (formula.startsWith('sum(')) {
      return Object.values(context.nodeOutputs).reduce((sum: number, output: any) => {
        return sum + (typeof output === 'number' ? output : 0);
      }, 0);
    }

    return null;
  }
}

// Global flow runner instance
export const flowRunner = new FlowRunner();