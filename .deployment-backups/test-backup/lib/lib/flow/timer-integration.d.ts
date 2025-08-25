import type { FlowNode } from "./types.js";
import { FlowContextManager } from "./context.js";
export declare class FlowTimerService {
    private contextManager;
    constructor(contextManager: FlowContextManager);
    startNodeTimeout(node: FlowNode, flowId: string, onComplete: (nodeId: string, output: any) => void): void;
    cancelNodeTimeout(flowId: string, nodeId: string, reason?: string): void;
    cancelAllTimers(flowId: string, reason: string): void;
    private setupTimerEventHandlers;
}
//# sourceMappingURL=timer-integration.d.ts.map