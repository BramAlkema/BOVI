import type { FlowSpec, FlowState } from "./types.js";
export declare class FlowRunner {
    private flowSpecs;
    private contextManager;
    private timerService;
    private nodeExecutor;
    constructor();
    loadFlow(flowSpec: FlowSpec): Promise<void>;
    startFlow(flowId: string, initialContext?: any): void;
    private executeNode;
    private moveToNextNode;
    private completeFlow;
    private errorFlow;
    cancelTimeout(flowId: string, nodeId: string, reason?: string): void;
    overrideAction(flowId: string, nodeId: string, action: string): void;
    stopFlow(flowId: string): void;
    getFlowState(flowId: string): FlowState;
    getActiveFlows(): string[];
    private shouldUseTimeout;
    private getStartNode;
    private getNextNode;
    private evaluateCondition;
}
//# sourceMappingURL=runner.d.ts.map