import type { FlowSpec } from "../flow/types.js";
export declare class UIBridgeService {
    private flowSpecs;
    initialize(flowSpecs: Record<string, FlowSpec>): void;
    private integrateGroceries;
    private integrateRent;
    private integrateEnergy;
    private updateGroceriesKPIs;
    updateFlowSpecs(flowSpecs: Record<string, FlowSpec>): void;
}
export declare const uiBridge: UIBridgeService;
//# sourceMappingURL=ui-bridge.d.ts.map