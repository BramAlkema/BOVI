/**
 * BOVI Flow Context Management
 * Utilities for managing flow execution context and state
 */

import type { FlowContext, FlowSpec } from "./types.js";

/**
 * Context manager for flow execution state
 */
export class FlowContextManager {
  private contexts: Map<string, FlowContext> = new Map();

  /**
   * Create a new flow context
   */
  createContext(flowSpec: FlowSpec): FlowContext {
    const context: FlowContext = {
      flowId: flowSpec.id,
      nodeOutputs: {},
      activeTimers: new Set(),
      userOverrides: {},
      startTime: 0,
      aiButlerEnabled: true,
      completed: false,
    };

    this.contexts.set(flowSpec.id, context);
    return context;
  }

  /**
   * Get flow context by ID
   */
  getContext(flowId: string): FlowContext | undefined {
    return this.contexts.get(flowId);
  }

  /**
   * Update context with new state
   */
  updateContext(flowId: string, updates: Partial<FlowContext>): void {
    const context = this.contexts.get(flowId);
    if (context) {
      Object.assign(context, updates);
    }
  }

  /**
   * Remove context (cleanup)
   */
  removeContext(flowId: string): void {
    this.contexts.delete(flowId);
  }

  /**
   * Get all active flow IDs
   */
  getActiveFlows(): string[] {
    return Array.from(this.contexts.keys()).filter(flowId => {
      const context = this.contexts.get(flowId);
      return context && !context.completed && !context.error;
    });
  }

  /**
   * Clear all contexts
   */
  clear(): void {
    this.contexts.clear();
  }

  /**
   * Get context value by path (dot notation)
   */
  getContextValue(context: FlowContext, path: string): any {
    const parts = path.split(".");
    let value: any = context;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  /**
   * Get output from previous node
   */
  getPreviousNodeOutput(context: FlowContext, key: string): any {
    const outputs = Object.values(context.nodeOutputs);
    return outputs[outputs.length - 1]?.[key];
  }

  /**
   * Store node execution result
   */
  storeNodeOutput(context: FlowContext, nodeId: string, output: any): void {
    context.nodeOutputs[nodeId] = output;
  }

  /**
   * Mark user override for a node
   */
  setUserOverride(context: FlowContext, nodeId: string): void {
    context.userOverrides[nodeId] = true;
  }

  /**
   * Add active timer to context
   */
  addActiveTimer(context: FlowContext, timerId: string): void {
    context.activeTimers.add(timerId);
  }

  /**
   * Remove active timer from context
   */
  removeActiveTimer(context: FlowContext, timerId: string): void {
    context.activeTimers.delete(timerId);
  }

  /**
   * Clear all active timers for a context
   */
  clearActiveTimers(context: FlowContext, cancelCallback?: (timerId: string) => void): void {
    if (cancelCallback) {
      context.activeTimers.forEach(timerId => cancelCallback(timerId));
    }
    context.activeTimers.clear();
  }
}
