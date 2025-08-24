/**
 * BOVI Flow Runner
 * XState-based flow execution with timeout handling and BOVI mode awareness
 */

import { createMachine, interpret, assign, ActorRef } from 'xstate';
import { Bus, emit } from './bus';

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
  timeouts: Record<string, number>;
  userOverrides: Record<string, boolean>;
  startTime: number;
  aiButlerEnabled: boolean;
}

// Flow events
export type FlowEvent = 
  | { type: 'START'; flowId: string; context?: any }
  | { type: 'NODE_COMPLETED'; nodeId: string; outputs: any }
  | { type: 'TIMEOUT_STARTED'; nodeId: string; timeoutSeconds: number }
  | { type: 'TIMEOUT_CANCELLED'; nodeId: string; reason: string }
  | { type: 'TIMEOUT_EXPIRED'; nodeId: string }
  | { type: 'USER_OVERRIDE'; nodeId: string; action: string }
  | { type: 'ERROR'; error: Error; nodeId?: string };

// Create flow state machine
export const createFlowMachine = (flowSpec: FlowSpec) => {
  return createMachine<FlowContext, FlowEvent>({
    id: `flow-${flowSpec.id}`,
    initial: 'idle',
    context: {
      flowId: flowSpec.id,
      nodeOutputs: {},
      timeouts: {},
      userOverrides: {},
      startTime: 0,
      aiButlerEnabled: true
    },
    states: {
      idle: {
        on: {
          START: {
            target: 'running',
            actions: assign({
              startTime: () => Date.now(),
              currentNode: () => getStartNode(flowSpec)?.id
            })
          }
        }
      },
      
      running: {
        entry: 'emitFlowStarted',
        initial: 'executing_node',
        
        states: {
          executing_node: {
            entry: 'executeCurrentNode',
            on: {
              NODE_COMPLETED: {
                actions: ['storeNodeOutputs', 'moveToNextNode'],
                cond: 'hasNextNode'
              },
              TIMEOUT_STARTED: 'waiting_for_timeout',
              ERROR: '#error'
            }
          },
          
          waiting_for_timeout: {
            entry: 'startCountdown',
            exit: 'clearCountdown',
            on: {
              TIMEOUT_EXPIRED: {
                target: 'executing_node',
                actions: 'applyDefaultAction'
              },
              TIMEOUT_CANCELLED: {
                target: 'executing_node', 
                actions: 'recordUserOverride'
              },
              USER_OVERRIDE: {
                target: 'executing_node',
                actions: 'applyUserOverride'
              }
            }
          }
        },
        
        on: {
          ERROR: '#error'
        }
      },
      
      completed: {
        type: 'final',
        entry: 'emitFlowCompleted'
      },
      
      error: {
        id: 'error',
        entry: 'emitFlowError'
      }
    }
  }, {
    actions: {
      emitFlowStarted: (context) => {
        emit('flow.started', {
          flow: context.flowId,
          context: flowSpec.context
        });
      },
      
      emitFlowCompleted: (context) => {
        emit('flow.completed', {
          flow: context.flowId,
          outputs: context.nodeOutputs
        });
      },
      
      emitFlowError: (context, event) => {
        if (event.type === 'ERROR') {
          emit('flow.error', {
            flow: context.flowId,
            error: event.error,
            node: event.nodeId
          });
        }
      },
      
      executeCurrentNode: (context) => {
        if (!context.currentNode) return;
        
        const node = flowSpec.nodes.find(n => n.id === context.currentNode);
        if (!node) return;
        
        executeNode(node, context);
      },
      
      storeNodeOutputs: assign({
        nodeOutputs: (context, event) => {
          if (event.type === 'NODE_COMPLETED') {
            return {
              ...context.nodeOutputs,
              [event.nodeId]: event.outputs
            };
          }
          return context.nodeOutputs;
        }
      }),
      
      moveToNextNode: assign({
        currentNode: (context, event) => {
          if (event.type === 'NODE_COMPLETED') {
            return getNextNode(flowSpec, event.nodeId, context)?.id;
          }
          return context.currentNode;
        }
      }),
      
      startCountdown: (context, event) => {
        if (event.type === 'TIMEOUT_STARTED' && context.aiButlerEnabled) {
          startCountdownTimer(context.flowId, event.nodeId, event.timeoutSeconds);
        }
      },
      
      clearCountdown: (context) => {
        if (context.currentNode) {
          clearCountdownTimer(context.flowId, context.currentNode);
        }
      },
      
      applyDefaultAction: (context, event) => {
        if (event.type === 'TIMEOUT_EXPIRED') {
          const node = flowSpec.nodes.find(n => n.id === event.nodeId);
          if (node?.config?.action) {
            applyNodeAction(node, context, 'default');
          }
        }
      },
      
      recordUserOverride: assign({
        userOverrides: (context, event) => {
          if (event.type === 'TIMEOUT_CANCELLED') {
            return {
              ...context.userOverrides,
              [event.nodeId]: true
            };
          }
          return context.userOverrides;
        }
      }),
      
      applyUserOverride: (context, event) => {
        if (event.type === 'USER_OVERRIDE') {
          const node = flowSpec.nodes.find(n => n.id === event.nodeId);
          if (node) {
            applyNodeAction(node, context, event.action);
          }
        }
      }
    },
    
    guards: {
      hasNextNode: (context, event) => {
        if (event.type === 'NODE_COMPLETED') {
          return getNextNode(flowSpec, event.nodeId, context) !== null;
        }
        return false;
      }
    }
  });
};

// Node execution logic by BOVI mode
const executeNode = async (node: FlowNode, context: FlowContext): Promise<void> => {
  const [mode, nodeType] = node.type.split('.');
  
  try {
    let outputs: any = {};
    
    switch (`${mode}.${nodeType}`) {
      case 'V.PDA':
        outputs = await executePDANode(node, context);
        emit('V.pda.completed', {
          flow: context.flowId,
          node: node.id,
          ...outputs
        });
        break;
        
      case 'V.Calculate':
        outputs = await executeCalculateNode(node, context);
        emit('V.calculate.completed', {
          flow: context.flowId,
          node: node.id,
          result: outputs.result
        });
        break;
        
      case 'V.Assess':
        outputs = await executeAssessNode(node, context);
        emit('V.assess.completed', {
          flow: context.flowId,
          node: node.id,
          assessment: outputs.assessment
        });
        break;
        
      case 'I.Detect':
        outputs = await executeDetectNode(node, context);
        if (outputs.violation_detected) {
          emit('I.detect.violation', {
            flow: context.flowId,
            node: node.id,
            violation: outputs.violation_type,
            affected: outputs.affected_items
          });
        }
        break;
        
      case 'I.Default':
      case 'B.Default':
      case 'O.Default':
        if (node.config?.timeout_s && context.aiButlerEnabled) {
          emit(`${mode.toLowerCase()}.default.started` as any, {
            flow: context.flowId,
            node: node.id,
            timeout_s: node.config.timeout_s,
            action: node.config.action
          });
          // Will be handled by timeout state
          return;
        } else {
          outputs = await executeDefaultNode(node, context);
        }
        break;
        
      case 'B.Sweep':
        outputs = await executeSweepNode(node, context);
        emit('B.sweep.updated', {
          flow: context.flowId,
          node: node.id,
          kpis: outputs.kpis
        });
        break;
        
      case 'B.Learn':
        outputs = await executeLearnNode(node, context);
        emit('B.learn.triggered', {
          flow: context.flowId,
          node: node.id,
          episode: node.config?.episode_id,
          priority: node.config?.priority
        });
        break;
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
    
    // Send completion event to state machine
    Bus.emit('NODE_COMPLETED', { nodeId: node.id, outputs });
    
  } catch (error) {
    Bus.emit('ERROR', { error: error as Error, nodeId: node.id });
  }
};

// Node execution implementations
const executePDANode = async (node: FlowNode, context: FlowContext): Promise<any> => {
  const items = node.config?.items || [];
  let nominal = 0;
  let real = 0;
  let qualityScore = 0;
  
  items.forEach((item: any) => {
    nominal += item.price;
    real += item.price * (context.flowId === 'groceries' ? 0.86 : 1.0); // Use deflator
    qualityScore += (item.price - item.usual) / item.usual;
  });
  
  const quality = qualityScore / items.length < -0.02 ? 'Great' : 
                  qualityScore / items.length < 0.02 ? 'OK' : 'Poor';
  
  return { nominal, real, quality };
};

const executeDetectNode = async (node: FlowNode, context: FlowContext): Promise<any> => {
  const triggers = node.config?.triggers || [];
  const threshold = node.config?.threshold || 0;
  
  // Check previous node outputs for violations
  const previousOutputs = Object.values(context.nodeOutputs);
  let violationDetected = false;
  let affectedItems: any[] = [];
  
  // Simple violation detection logic
  if (triggers.includes('shrink')) {
    // Check for shrinkflation items
    const items = getPreviousNodeOutput(context, 'items') || [];
    affectedItems = items.filter((item: any) => item.shrink);
    violationDetected = affectedItems.length > 0;
  }
  
  return {
    violation_detected: violationDetected,
    violation_type: violationDetected ? 'shrinkflation' : null,
    affected_items: affectedItems
  };
};

const executeDefaultNode = async (node: FlowNode, context: FlowContext): Promise<any> => {
  const action = node.config?.action || 'default_action';
  
  // Apply the default action
  const result = await applyNodeAction(node, context, action);
  
  return { action_applied: true, result };
};

const executeSweepNode = async (node: FlowNode, context: FlowContext): Promise<any> => {
  const kpiConfig = node.config?.kpis || {};
  const kpis: Record<string, any> = {};
  
  // Calculate KPIs based on configuration
  Object.entries(kpiConfig).forEach(([kpiName, formula]) => {
    kpis[kpiName] = calculateKPI(formula as string, context);
  });
  
  return { kpis };
};

const executeLearnNode = async (node: FlowNode, context: FlowContext): Promise<any> => {
  const episodeId = node.config?.episode_id;
  const priority = node.config?.priority || 'medium';
  
  // Queue episode for playback
  if (episodeId) {
    queueEpisode(episodeId, priority);
  }
  
  return { episode_queued: !!episodeId };
};

// Helper functions
const getStartNode = (flowSpec: FlowSpec): FlowNode | null => {
  // Find node with no incoming edges
  const incomingNodes = new Set(flowSpec.edges.map(e => e.to));
  return flowSpec.nodes.find(n => !incomingNodes.has(n.id)) || null;
};

const getNextNode = (flowSpec: FlowSpec, currentNodeId: string, context: FlowContext): FlowNode | null => {
  const outgoingEdges = flowSpec.edges.filter(e => e.from === currentNodeId);
  
  for (const edge of outgoingEdges) {
    if (evaluateCondition(edge.condition, context)) {
      return flowSpec.nodes.find(n => n.id === edge.to) || null;
    }
  }
  
  return null;
};

const evaluateCondition = (condition: string, context: FlowContext): boolean => {
  if (condition === 'always') return true;
  if (condition === 'never') return false;
  
  // Simple condition evaluation - in production, use a proper expression evaluator
  try {
    // Replace context variables
    const evaluated = condition.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
      return getContextValue(context, variable) || 'null';
    });
    
    return new Function('return ' + evaluated)();
  } catch {
    return false;
  }
};

const getContextValue = (context: FlowContext, path: string): any => {
  const parts = path.split('.');
  let value: any = context;
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value;
};

const getPreviousNodeOutput = (context: FlowContext, key: string): any => {
  const outputs = Object.values(context.nodeOutputs);
  return outputs[outputs.length - 1]?.[key];
};

const applyNodeAction = async (node: FlowNode, context: FlowContext, actionType: string): Promise<any> => {
  const mode = node.type.split('.')[0];
  
  emit(`${mode.toLowerCase()}.default.applied` as any, {
    flow: context.flowId,
    node: node.id,
    action: node.config?.action,
    result: { applied: true, type: actionType }
  });
  
  return { applied: true, type: actionType };
};

const calculateKPI = (formula: string, context: FlowContext): any => {
  // Simple KPI calculation - in production, implement proper formula engine
  if (formula.startsWith('last(')) {
    const path = formula.slice(5, -1);
    return getContextValue(context, path);
  }
  
  if (formula.startsWith('count(')) {
    // Count logic
    return 1;
  }
  
  if (formula.startsWith('sum(')) {
    // Sum logic
    return 0;
  }
  
  return null;
};

const queueEpisode = (episodeId: string, priority: string): void => {
  // Episode queuing logic - integrate with podcast system
  console.log(`Queuing episode ${episodeId} with priority ${priority}`);
};

// Countdown timer management
const activeCountdowns: Map<string, NodeJS.Timeout> = new Map();

const startCountdownTimer = (flowId: string, nodeId: string, seconds: number): void => {
  const key = `${flowId}:${nodeId}`;
  
  let remaining = seconds;
  const interval = setInterval(() => {
    remaining--;
    
    emit('ui.countdown.tick', {
      flow: flowId,
      node: nodeId,
      remaining
    });
    
    if (remaining <= 0) {
      clearInterval(interval);
      activeCountdowns.delete(key);
      Bus.emit('TIMEOUT_EXPIRED', { nodeId });
    }
  }, 1000);
  
  activeCountdowns.set(key, interval);
};

const clearCountdownTimer = (flowId: string, nodeId: string): void => {
  const key = `${flowId}:${nodeId}`;
  const timer = activeCountdowns.get(key);
  
  if (timer) {
    clearInterval(timer);
    activeCountdowns.delete(key);
  }
};

// Flow runner manager
export class FlowRunner {
  private flows: Map<string, ActorRef<FlowEvent, FlowContext>> = new Map();
  
  async loadFlow(flowSpec: FlowSpec): Promise<void> {
    const machine = createFlowMachine(flowSpec);
    const service = interpret(machine);
    
    service.start();
    this.flows.set(flowSpec.id, service);
  }
  
  startFlow(flowId: string, context?: any): void {
    const service = this.flows.get(flowId);
    if (service) {
      service.send({ type: 'START', flowId, context });
    }
  }
  
  cancelTimeout(flowId: string, nodeId: string, reason: string): void {
    const service = this.flows.get(flowId);
    if (service) {
      service.send({ type: 'TIMEOUT_CANCELLED', nodeId, reason });
      clearCountdownTimer(flowId, nodeId);
    }
  }
  
  overrideAction(flowId: string, nodeId: string, action: string): void {
    const service = this.flows.get(flowId);
    if (service) {
      service.send({ type: 'USER_OVERRIDE', nodeId, action });
    }
  }
  
  stopFlow(flowId: string): void {
    const service = this.flows.get(flowId);
    if (service) {
      service.stop();
      this.flows.delete(flowId);
    }
  }
}

// Global flow runner instance
export const flowRunner = new FlowRunner();