import type { FlowSpec } from "../flow/types.js";
export declare class FlowLoaderService {
    private flowSpecs;
    loadFlowSpecs(flowIds?: string[]): Promise<void>;
    getFlowSpec(flowId: string): FlowSpec | undefined;
    getAllFlowSpecs(): Record<string, FlowSpec>;
    isFlowLoaded(flowId: string): boolean;
    reloadFlow(flowId: string): Promise<void>;
}
export declare const flowLoader: FlowLoaderService;
//# sourceMappingURL=flow-loader.d.ts.map