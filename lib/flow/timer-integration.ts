/**
 * BOVI Flow Timer Integration
 * Handles timeout-based node execution and event management
 */

import { Bus } from "../bus.js";
import { startTimer, cancelTimer, TimerConfig } from "../timer.js";
import type { FlowNode, FlowContext } from "./types.js";
import { FlowContextManager } from "./context.js";

/**
 * Timer integration service for flow execution
 */
export class FlowTimerService {
  constructor(private contextManager: FlowContextManager) {}

  /**
   * Start timeout for a node that requires time-based execution
   */
  startNodeTimeout(
    node: FlowNode,
    flowId: string,
    onComplete: (nodeId: string, output: any) => void
  ): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    const [mode] = node.type.split(".");
    const timerConfig: TimerConfig = {
      flow: flowId,
      node: node.id,
      timeout_s: node.config.timeout_s,
      action: node.config.action,
      mode: mode as "V" | "I" | "B" | "O",
    };

    const timerId = startTimer(timerConfig);
    this.contextManager.addActiveTimer(context, timerId);

    // Set up event handlers for this specific timer
    this.setupTimerEventHandlers(mode, flowId, node.id, timerId, onComplete);
  }

  /**
   * Cancel timeout for a specific node
   */
  cancelNodeTimeout(flowId: string, nodeId: string, reason: string = "user_action"): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    // Find and cancel active timer for this node
    // Note: In a production system, you'd maintain timer metadata
    const activeTimer = Array.from(context.activeTimers)[0]; // Simplified

    if (activeTimer) {
      cancelTimer(activeTimer, reason);
      this.contextManager.removeActiveTimer(context, activeTimer);
    }
  }

  /**
   * Cancel all timers for a flow
   */
  cancelAllTimers(flowId: string, reason: string): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    this.contextManager.clearActiveTimers(context, timerId => {
      cancelTimer(timerId, reason);
    });
  }

  /**
   * Set up event handlers for timer completion/cancellation
   */
  private setupTimerEventHandlers(
    mode: string,
    flowId: string,
    nodeId: string,
    timerId: string,
    onComplete: (nodeId: string, output: any) => void
  ): void {
    const context = this.contextManager.getContext(flowId);
    if (!context) return;

    const createHandlers = (eventPrefix: string) => {
      Bus.on(`${eventPrefix}.applied` as any, (event: any) => {
        if (event.detail?.flow === flowId && event.detail?.node === nodeId) {
          const output = {
            action_applied: true,
            result: event.detail?.result || {},
            type: "timeout",
          };

          this.contextManager.removeActiveTimer(context, timerId);
          onComplete(nodeId, output);
        }
      });

      Bus.on(`${eventPrefix}.cancelled` as any, (event: any) => {
        if (event.detail?.flow === flowId && event.detail?.node === nodeId) {
          this.contextManager.removeActiveTimer(context, timerId);
          this.contextManager.setUserOverride(context, nodeId);
        }
      });
    };

    // Create handlers based on mode
    switch (mode) {
    case "I":
      createHandlers("I.default");
      break;
    case "B":
      createHandlers("B.default");
      break;
    case "O":
      createHandlers("O.default");
      break;
    case "V":
      createHandlers("V.default");
      break;
    }
  }
}
