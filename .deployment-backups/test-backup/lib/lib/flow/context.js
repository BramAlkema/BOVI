export class FlowContextManager {
    constructor() {
        this.contexts = new Map();
    }
    createContext(flowSpec) {
        const context = {
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
    getContext(flowId) {
        return this.contexts.get(flowId);
    }
    updateContext(flowId, updates) {
        const context = this.contexts.get(flowId);
        if (context) {
            Object.assign(context, updates);
        }
    }
    removeContext(flowId) {
        this.contexts.delete(flowId);
    }
    getActiveFlows() {
        return Array.from(this.contexts.keys()).filter(flowId => {
            const context = this.contexts.get(flowId);
            return context && !context.completed && !context.error;
        });
    }
    clear() {
        this.contexts.clear();
    }
    getContextValue(context, path) {
        const parts = path.split(".");
        let value = context;
        for (const part of parts) {
            value = value?.[part];
        }
        return value;
    }
    getPreviousNodeOutput(context, key) {
        const outputs = Object.values(context.nodeOutputs);
        return outputs[outputs.length - 1]?.[key];
    }
    storeNodeOutput(context, nodeId, output) {
        context.nodeOutputs[nodeId] = output;
    }
    setUserOverride(context, nodeId) {
        context.userOverrides[nodeId] = true;
    }
    addActiveTimer(context, timerId) {
        context.activeTimers.add(timerId);
    }
    removeActiveTimer(context, timerId) {
        context.activeTimers.delete(timerId);
    }
    clearActiveTimers(context, cancelCallback) {
        if (cancelCallback) {
            context.activeTimers.forEach(timerId => cancelCallback(timerId));
        }
        context.activeTimers.clear();
    }
}
//# sourceMappingURL=context.js.map