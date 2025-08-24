/**
 * BOVI Flow Runner
 * Orchestrates flow execution using modular components
 */

import { emit } from "../bus.js";
import type { FlowSpec, FlowNode, FlowContext, FlowState } from "./types.js";
import { FlowContextManager } from "./context.js";
import { FlowTimerService } from "./timer-integration.js";
import { NodeExecutorService } from "./node-executors.js";

/**
 * Main flow runner that orchestrates execution of BOVI flows
 */
export class FlowRunner {
  private flowSpecs: Map<string, FlowSpec> = new Map();
  private contextManager: FlowContextManager;
  private timerService: FlowTimerService;
  private nodeExecutor: NodeExecutorService;

  constructor() {
    this.contextManager = new FlowContextManager();
    this.timerService = new FlowTimerService(this.contextManager);
    this.nodeExecutor = new NodeExecutorService(this.contextManager);
  }

  /**
   * Load a flow specification
   */
  async loadFlow(flowSpec: FlowSpec): Promise<void> {
    this.flowSpecs.set(flowSpec.id, flowSpec);
    this.contextManager.createContext(flowSpec);
  }

  /**
   * Start executing a flow
   */
  startFlow(flowId: string, initialContext?: any): void {
    const context = this.contextManager.getContext(flowId);
    const flowSpec = this.flowSpecs.get(flowId);

    if (!context || !flowSpec) {
      console.error(`Flow ${flowId} not found or not loaded`);
      return;
    }

    // Initialize flow context
    this.contextManager.updateContext(flowId, {
      startTime: Date.now(),
      currentNode: this.getStartNode(flowSpec)?.id,
      completed: false,
      error: undefined,
    });

    // Merge initial context if provided
    if (initialContext) {
      Object.assign(flowSpec.context, initialContext);
    }

    // Emit flow started event
    emit("flow.started", {
      flow: flowId,
      context: flowSpec.context,
    });

    // Start executing from first node
    if (context.currentNode) {
      this.executeNode(context.currentNode, flowId);
    } else {
      this.completeFlow(flowId);
    }
  }

  /**
   * Execute a specific node
   */
  private async executeNode(nodeId: string, flowId: string): Promise<void> {
    const context = this.contextManager.getContext(flowId);
    const flowSpec = this.flowSpecs.get(flowId);
    const node = flowSpec?.nodes.find(n => n.id === nodeId);

    if (!context || !flowSpec || !node) {
      this.errorFlow(flowId, new Error(`Node ${nodeId} not found`), nodeId);
      return;
    }

    try {
      // Check if this is a timeout-based node
      if (this.shouldUseTimeout(node, context)) {
        this.timerService.startNodeTimeout(node, flowId, (nodeId, output) => {
          this.contextManager.storeNodeOutput(context, nodeId, output);
          this.moveToNextNode(flowId, nodeId);
        });
        return; // Exit here, timeout will handle completion
      }

      // Execute node immediately
      const output = await this.nodeExecutor.executeNode(node, context);
      this.contextManager.storeNodeOutput(context, nodeId, output);

      // Move to next node
      this.moveToNextNode(flowId, nodeId);
    } catch (error) {
      this.errorFlow(flowId, error as Error, nodeId);
    }
  }

  /**
   * Move to the next node in the flow
   */
  private moveToNextNode(flowId: string, currentNodeId: string): void {
    const context = this.contextManager.getContext(flowId);
    const flowSpec = this.flowSpecs.get(flowId);

    if (!context || !flowSpec) return;

    const nextNode = this.getNextNode(flowSpec, currentNodeId, context);

    if (nextNode) {
      this.contextManager.updateContext(flowId, { currentNode: nextNode.id });
      this.executeNode(nextNode.id, flowId);
    } else {
      this.completeFlow(flowId);
    }
  }

  /**
   * Complete a flow execution
   */
  private completeFlow(flowId: string): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    this.contextManager.updateContext(flowId, {
      completed: true,
      currentNode: undefined,
    });

    // Clear any active timers
    this.timerService.cancelAllTimers(flowId, "flow_completed");

    emit("flow.completed", {
      flow: flowId,
      outputs: context.nodeOutputs,
    });
  }

  /**
   * Handle flow error
   */
  private errorFlow(flowId: string, error: Error, nodeId?: string): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    this.contextManager.updateContext(flowId, {
      error,
      completed: true,
    });

    // Clear any active timers
    this.timerService.cancelAllTimers(flowId, "flow_error");

    emit("flow.error", {
      flow: flowId,
      error,
      node: nodeId,
    });
  }

  // Public API methods

  /**
   * Cancel timeout for a specific node
   */
  cancelTimeout(flowId: string, nodeId: string, reason: string = "user_action"): void {
    this.timerService.cancelNodeTimeout(flowId, nodeId, reason);
  }

  /**
   * Override a node action with user input
   */
  overrideAction(flowId: string, nodeId: string, action: string): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    // Cancel any active timeout
    this.timerService.cancelNodeTimeout(flowId, nodeId, "user_override");

    // Apply user action immediately
    emit("ui.action.override", {
      flow: flowId,
      node: nodeId,
      action,
    });

    // Store override result and continue flow
    const output = {
      action_applied: true,
      result: { applied: true, type: "user_override", action },
      type: "override",
    };

    this.contextManager.storeNodeOutput(context, nodeId, output);
    this.contextManager.setUserOverride(context, nodeId);

    this.moveToNextNode(flowId, nodeId);
  }

  /**
   * Stop a flow execution
   */
  stopFlow(flowId: string): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    // Clear all active timers
    this.timerService.cancelAllTimers(flowId, "flow_stopped");

    // Remove from active flows
    this.contextManager.removeContext(flowId);
  }

  /**
   * Get current flow state
   */
  getFlowState(flowId: string): FlowState {
    const context = this.contextManager.getContext(flowId);
    if (!context) return "idle";
    if (context.error) return "error";
    if (context.completed) return "completed";
    if (context.currentNode) return "running";
    return "idle";
  }

  /**
   * Get list of active flows
   */
  getActiveFlows(): string[] {
    return this.contextManager.getActiveFlows();
  }

  // Helper methods

  /**
   * Check if a node should use timeout-based execution
   */
  private shouldUseTimeout(node: FlowNode, context: FlowContext): boolean {
    return !!(node.config?.timeout_s && context.aiButlerEnabled);
  }

  /**
   * Get the start node of a flow
   */
  private getStartNode(flowSpec: FlowSpec): FlowNode | null {
    const incomingNodes = new Set(flowSpec.edges.map(e => e.to));
    return flowSpec.nodes.find(n => !incomingNodes.has(n.id)) || null;
  }

  /**
   * Get the next node based on edge conditions
   */
  private getNextNode(
    flowSpec: FlowSpec,
    currentNodeId: string,
    context: FlowContext
  ): FlowNode | null {
    const outgoingEdges = flowSpec.edges.filter(e => e.from === currentNodeId);

    for (const edge of outgoingEdges) {
      if (this.evaluateCondition(edge.condition, context)) {
        return flowSpec.nodes.find(n => n.id === edge.to) || null;
      }
    }

    return null;
  }

  /**
   * Evaluate edge condition
   */
  private evaluateCondition(condition: string, context: FlowContext): boolean {
    if (condition === "always") return true;
    if (condition === "never") return false;

    try {
      const evaluated = condition.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
        return String(this.contextManager.getContextValue(context, variable) || "null");
      });

      return new Function("return " + evaluated)();
    } catch {
      return false;
    }
  }
}
