import { emit } from "../bus.js";
import { FlowContextManager } from "./context.js";
import { FlowTimerService } from "./timer-integration.js";
import { NodeExecutorService } from "./node-executors.js";
export class FlowRunner {
    constructor() {
        this.flowSpecs = new Map();
        this.contextManager = new FlowContextManager();
        this.timerService = new FlowTimerService(this.contextManager);
        this.nodeExecutor = new NodeExecutorService(this.contextManager);
    }
    async loadFlow(flowSpec) {
        this.flowSpecs.set(flowSpec.id, flowSpec);
        this.contextManager.createContext(flowSpec);
    }
    startFlow(flowId, initialContext) {
        const context = this.contextManager.getContext(flowId);
        const flowSpec = this.flowSpecs.get(flowId);
        if (!context || !flowSpec) {
            console.error(`Flow ${flowId} not found or not loaded`);
            return;
        }
        this.contextManager.updateContext(flowId, {
            startTime: Date.now(),
            currentNode: this.getStartNode(flowSpec)?.id,
            completed: false,
            error: undefined,
        });
        if (initialContext) {
            Object.assign(flowSpec.context, initialContext);
        }
        emit("flow.started", {
            flow: flowId,
            context: flowSpec.context,
        });
        if (context.currentNode) {
            this.executeNode(context.currentNode, flowId);
        }
        else {
            this.completeFlow(flowId);
        }
    }
    async executeNode(nodeId, flowId) {
        const context = this.contextManager.getContext(flowId);
        const flowSpec = this.flowSpecs.get(flowId);
        const node = flowSpec?.nodes.find(n => n.id === nodeId);
        if (!context || !flowSpec || !node) {
            this.errorFlow(flowId, new Error(`Node ${nodeId} not found`), nodeId);
            return;
        }
        try {
            if (this.shouldUseTimeout(node, context)) {
                this.timerService.startNodeTimeout(node, flowId, (nodeId, output) => {
                    this.contextManager.storeNodeOutput(context, nodeId, output);
                    this.moveToNextNode(flowId, nodeId);
                });
                return;
            }
            const output = await this.nodeExecutor.executeNode(node, context);
            this.contextManager.storeNodeOutput(context, nodeId, output);
            this.moveToNextNode(flowId, nodeId);
        }
        catch (error) {
            this.errorFlow(flowId, error, nodeId);
        }
    }
    moveToNextNode(flowId, currentNodeId) {
        const context = this.contextManager.getContext(flowId);
        const flowSpec = this.flowSpecs.get(flowId);
        if (!context || !flowSpec)
            return;
        const nextNode = this.getNextNode(flowSpec, currentNodeId, context);
        if (nextNode) {
            this.contextManager.updateContext(flowId, { currentNode: nextNode.id });
            this.executeNode(nextNode.id, flowId);
        }
        else {
            this.completeFlow(flowId);
        }
    }
    completeFlow(flowId) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        this.contextManager.updateContext(flowId, {
            completed: true,
            currentNode: undefined,
        });
        this.timerService.cancelAllTimers(flowId, "flow_completed");
        emit("flow.completed", {
            flow: flowId,
            outputs: context.nodeOutputs,
        });
    }
    errorFlow(flowId, error, nodeId) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        this.contextManager.updateContext(flowId, {
            error,
            completed: true,
        });
        this.timerService.cancelAllTimers(flowId, "flow_error");
        emit("flow.error", {
            flow: flowId,
            error,
            node: nodeId,
        });
    }
    cancelTimeout(flowId, nodeId, reason = "user_action") {
        this.timerService.cancelNodeTimeout(flowId, nodeId, reason);
    }
    overrideAction(flowId, nodeId, action) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        this.timerService.cancelNodeTimeout(flowId, nodeId, "user_override");
        emit("ui.action.override", {
            flow: flowId,
            node: nodeId,
            action,
        });
        const output = {
            action_applied: true,
            result: { applied: true, type: "user_override", action },
            type: "override",
        };
        this.contextManager.storeNodeOutput(context, nodeId, output);
        this.contextManager.setUserOverride(context, nodeId);
        this.moveToNextNode(flowId, nodeId);
    }
    stopFlow(flowId) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        this.timerService.cancelAllTimers(flowId, "flow_stopped");
        this.contextManager.removeContext(flowId);
    }
    getFlowState(flowId) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return "idle";
        if (context.error)
            return "error";
        if (context.completed)
            return "completed";
        if (context.currentNode)
            return "running";
        return "idle";
    }
    getActiveFlows() {
        return this.contextManager.getActiveFlows();
    }
    shouldUseTimeout(node, context) {
        return !!(node.config?.timeout_s && context.aiButlerEnabled);
    }
    getStartNode(flowSpec) {
        const incomingNodes = new Set(flowSpec.edges.map(e => e.to));
        return flowSpec.nodes.find(n => !incomingNodes.has(n.id)) || null;
    }
    getNextNode(flowSpec, currentNodeId, context) {
        const outgoingEdges = flowSpec.edges.filter(e => e.from === currentNodeId);
        for (const edge of outgoingEdges) {
            if (this.evaluateCondition(edge.condition, context)) {
                return flowSpec.nodes.find(n => n.id === edge.to) || null;
            }
        }
        return null;
    }
    evaluateCondition(condition, context) {
        if (condition === "always")
            return true;
        if (condition === "never")
            return false;
        try {
            const evaluated = condition.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
                return String(this.contextManager.getContextValue(context, variable) || "null");
            });
            return new Function("return " + evaluated)();
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=runner.js.map