import { emit } from "../bus.js";
export class NodeExecutorService {
    constructor(contextManager) {
        this.contextManager = contextManager;
    }
    async executeNode(node, context) {
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
    async executePDANode(node, context) {
        const items = node.config?.items || [];
        let nominal = 0;
        let real = 0;
        let qualityScore = 0;
        emit("V.pda.started", {
            flow: context.flowId,
            node: node.id,
            items,
        });
        items.forEach((item) => {
            nominal += item.price;
            real += item.price * (context.flowId === "groceries" ? 0.86 : 1.0);
            qualityScore += (item.price - item.usual) / item.usual;
        });
        const quality = qualityScore / items.length < -0.02
            ? "Great"
            : qualityScore / items.length < 0.02
                ? "OK"
                : "Poor";
        const result = { nominal, real, quality };
        emit("V.pda.completed", {
            flow: context.flowId,
            node: node.id,
            ...result,
        });
        return result;
    }
    async executeCalculateNode(node, context) {
        const formula = node.config?.formula || "sum";
        const inputs = node.config?.inputs || [];
        let result = 0;
        if (formula === "sum") {
            result = inputs.reduce((acc, val) => acc + val, 0);
        }
        else if (formula === "average") {
            result = inputs.reduce((acc, val) => acc + val, 0) / inputs.length;
        }
        const output = { result };
        emit("V.calculate.completed", {
            flow: context.flowId,
            node: node.id,
            result,
        });
        return output;
    }
    async executeAssessNode(node, context) {
        const threshold = node.config?.threshold || 0.5;
        const assessment = Math.random() > threshold;
        const reason = assessment ? "meets criteria" : "below threshold";
        const result = { assessment, reason };
        emit("V.assess.completed", {
            flow: context.flowId,
            node: node.id,
            assessment,
        });
        return result;
    }
    async executeDetectNode(node, context) {
        const triggers = node.config?.triggers || [];
        let violationDetected = false;
        let affectedItems = [];
        if (triggers.includes("shrink")) {
            const items = this.contextManager.getPreviousNodeOutput(context, "items") || [];
            affectedItems = items.filter((item) => item.shrink);
            violationDetected = affectedItems.length > 0;
        }
        const result = {
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
    async executeDefaultNode(node, _context) {
        const action = node.config?.action || "default_action";
        const result = { applied: true, type: "immediate", action };
        return { action_applied: true, result };
    }
    async executeSweepNode(node, context) {
        const kpiConfig = node.config?.kpis || {};
        const kpis = {};
        Object.entries(kpiConfig).forEach(([kpiName, formula]) => {
            kpis[kpiName] = this.calculateKPI(formula, context);
        });
        const result = { kpis };
        emit("B.sweep.updated", {
            flow: context.flowId,
            node: node.id,
            kpis,
        });
        return result;
    }
    async executeLearnNode(node, context) {
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
    calculateKPI(formula, context) {
        if (formula.startsWith("last(")) {
            const path = formula.slice(5, -1);
            return this.contextManager.getContextValue(context, path);
        }
        if (formula.startsWith("count(")) {
            return Object.keys(context.nodeOutputs).length;
        }
        if (formula.startsWith("sum(")) {
            return Object.values(context.nodeOutputs).reduce((sum, output) => {
                return sum + (typeof output === "number" ? output : 0);
            }, 0);
        }
        return null;
    }
}
//# sourceMappingURL=node-executors.js.map