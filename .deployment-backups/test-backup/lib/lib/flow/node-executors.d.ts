import type { FlowNode, FlowContext, NodeExecutionResult } from "./types.js";
import { FlowContextManager } from "./context.js";
export declare class NodeExecutorService {
    private contextManager;
    constructor(contextManager: FlowContextManager);
    executeNode(node: FlowNode, context: FlowContext): Promise<NodeExecutionResult>;
    private executePDANode;
    private executeCalculateNode;
    private executeAssessNode;
    private executeDetectNode;
    private executeDefaultNode;
    private executeSweepNode;
    private executeLearnNode;
    private calculateKPI;
}
//# sourceMappingURL=node-executors.d.ts.map