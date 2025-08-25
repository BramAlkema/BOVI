/**
 * BOVI Flow Node Executors
 * Implementations for different node types in the flow DSL
 */

import { emit } from "../bus.js";
import type {
  FlowNode,
  FlowContext,
  PDAResult,
  CalculateResult,
  AssessResult,
  DetectResult,
  DefaultResult,
  SweepResult,
  LearnResult,
  NodeExecutionResult,
} from "./types.js";
import { FlowContextManager } from "./context.js";

/**
 * Node execution service that handles different node types
 */
export class NodeExecutorService {
  constructor(private contextManager: FlowContextManager) {}

  /**
   * Execute a node based on its type
   */
  async executeNode(node: FlowNode, context: FlowContext): Promise<NodeExecutionResult> {
    const [mode, nodeType] = node.type.split(".");

    switch (`${mode}.${nodeType}`) {
    case "V.PDA":
      return this.executePDANode(node, context);

    case "V.Calculate":
      return this.executeCalculateNode(node, context);

    case "V.Assess":
      return this.executeAssessNode(node, context);

    case "I.Detect":
      return this.executeDetectNode(node, context);

    case "I.Default":
    case "B.Default":
    case "O.Default":
      return this.executeDefaultNode(node, context);

    case "B.Sweep":
      return this.executeSweepNode(node, context);

    case "B.Learn":
      return this.executeLearnNode(node, context);

    default:
      throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Execute PDA (Personal Data Assessment) node
   */
  private async executePDANode(node: FlowNode, context: FlowContext): Promise<PDAResult> {
    const items = node.config?.items || [];
    let nominal = 0;
    let real = 0;
    let qualityScore = 0;

    emit("V.pda.started", {
      flow: context.flowId,
      node: node.id,
      items,
    });

    items.forEach((item: any) => {
      nominal += item.price;
      real += item.price * (context.flowId === "groceries" ? 0.86 : 1.0);
      qualityScore += (item.price - item.usual) / item.usual;
    });

    const quality =
      qualityScore / items.length < -0.02
        ? "Great"
        : qualityScore / items.length < 0.02
          ? "OK"
          : "Poor";

    const result: PDAResult = { nominal, real, quality };

    emit("V.pda.completed", {
      flow: context.flowId,
      node: node.id,
      ...result,
    });

    return result;
  }

  /**
   * Execute calculation node
   */
  private async executeCalculateNode(
    node: FlowNode,
    context: FlowContext
  ): Promise<CalculateResult> {
    const formula = node.config?.formula || "sum";
    const inputs = node.config?.inputs || [];

    let result = 0;

    if (formula === "sum") {
      result = inputs.reduce((acc: number, val: number) => acc + val, 0);
    } else if (formula === "average") {
      result = inputs.reduce((acc: number, val: number) => acc + val, 0) / inputs.length;
    }

    const output: CalculateResult = { result };

    emit("V.calculate.completed", {
      flow: context.flowId,
      node: node.id,
      result,
    });

    return output;
  }

  /**
   * Execute assessment node
   */
  private async executeAssessNode(node: FlowNode, context: FlowContext): Promise<AssessResult> {
    // const _criteria = node.config?.criteria || {}; // Reserved for future use
    const threshold = node.config?.threshold || 0.5;

    // Simple assessment logic
    const assessment = Math.random() > threshold;
    const reason = assessment ? "meets criteria" : "below threshold";

    const result: AssessResult = { assessment, reason };

    emit("V.assess.completed", {
      flow: context.flowId,
      node: node.id,
      assessment,
    });

    return result;
  }

  /**
   * Execute detection node
   */
  private async executeDetectNode(node: FlowNode, context: FlowContext): Promise<DetectResult> {
    const triggers = node.config?.triggers || [];
    // const threshold = node.config?.threshold || 0; // Reserved for future use

    // Check previous node outputs for violations
    let violationDetected = false;
    let affectedItems: any[] = [];

    if (triggers.includes("shrink")) {
      const items = this.contextManager.getPreviousNodeOutput(context, "items") || [];
      affectedItems = items.filter((item: any) => item.shrink);
      violationDetected = affectedItems.length > 0;
    }

    const result: DetectResult = {
      violation_detected: violationDetected,
      violation_type: violationDetected ? "shrinkflation" : null,
      affected_items: affectedItems,
    };

    if (violationDetected) {
      emit("I.detect.violation", {
        flow: context.flowId,
        node: node.id,
        violation: result.violation_type || "unknown",
        affected: affectedItems,
      });
    }

    return result;
  }

  /**
   * Execute default action node
   */
  private async executeDefaultNode(node: FlowNode, _context: FlowContext): Promise<DefaultResult> {
    const action = node.config?.action || "default_action";

    // Simulate applying the action
    const result = { applied: true, type: "immediate", action };

    return { action_applied: true, result };
  }

  /**
   * Execute sweep (KPI collection) node
   */
  private async executeSweepNode(node: FlowNode, context: FlowContext): Promise<SweepResult> {
    const kpiConfig = node.config?.kpis || {};
    const kpis: Record<string, any> = {};

    Object.entries(kpiConfig).forEach(([kpiName, formula]) => {
      kpis[kpiName] = this.calculateKPI(formula as string, context);
    });

    const result: SweepResult = { kpis };

    emit("B.sweep.updated", {
      flow: context.flowId,
      node: node.id,
      kpis,
    });

    return result;
  }

  /**
   * Execute learning trigger node
   */
  private async executeLearnNode(node: FlowNode, context: FlowContext): Promise<LearnResult> {
    const episodeId = node.config?.episode_id;
    const priority = node.config?.priority || "medium";

    if (episodeId) {
      console.log(`Queuing episode ${episodeId} with priority ${priority}`);

      emit("B.learn.triggered", {
        flow: context.flowId,
        node: node.id,
        episode: episodeId,
        priority,
      });
    }

    return { episode_queued: !!episodeId };
  }

  /**
   * Calculate KPI value based on formula
   */
  private calculateKPI(formula: string, context: FlowContext): any {
    if (formula.startsWith("last(")) {
      const path = formula.slice(5, -1);
      return this.contextManager.getContextValue(context, path);
    }

    if (formula.startsWith("count(")) {
      return Object.keys(context.nodeOutputs).length;
    }

    if (formula.startsWith("sum(")) {
      return Object.values(context.nodeOutputs).reduce((sum: number, output: any) => {
        return sum + (typeof output === "number" ? output : 0);
      }, 0);
    }

    return null;
  }
}
