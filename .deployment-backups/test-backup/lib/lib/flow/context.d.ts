import type { FlowContext, FlowSpec } from "./types.js";
export declare class FlowContextManager {
    private contexts;
    createContext(flowSpec: FlowSpec): FlowContext;
    getContext(flowId: string): FlowContext | undefined;
    updateContext(flowId: string, updates: Partial<FlowContext>): void;
    removeContext(flowId: string): void;
    getActiveFlows(): string[];
    clear(): void;
    getContextValue(context: FlowContext, path: string): any;
    getPreviousNodeOutput(context: FlowContext, key: string): any;
    storeNodeOutput(context: FlowContext, nodeId: string, output: any): void;
    setUserOverride(context: FlowContext, nodeId: string): void;
    addActiveTimer(context: FlowContext, timerId: string): void;
    removeActiveTimer(context: FlowContext, timerId: string): void;
    clearActiveTimers(context: FlowContext, cancelCallback?: (timerId: string) => void): void;
}
//# sourceMappingURL=context.d.ts.map