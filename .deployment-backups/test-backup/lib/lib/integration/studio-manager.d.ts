import type { FlowSpec } from "../flow/types.js";
import { InlineStudio } from "../studio.js";
export declare class StudioManagerService {
    private studios;
    initializeStudios(flowSpecs: Record<string, FlowSpec>): void;
    createStudioForFlow(flowId: string, flowSpec: FlowSpec): void;
    getStudio(flowId: string): InlineStudio | undefined;
    getAllStudios(): Record<string, InlineStudio>;
    updateStudio(flowId: string, flowSpec: FlowSpec): Promise<void>;
    removeStudio(flowId: string): void;
    clearAll(): void;
}
export declare const studioManager: StudioManagerService;
//# sourceMappingURL=studio-manager.d.ts.map