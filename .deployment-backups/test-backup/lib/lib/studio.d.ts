import { FlowSpec } from './flow.js';
export declare class InlineStudio {
    private container;
    private svg;
    private flowSpec;
    private layout;
    private activeNodes;
    private activeEdges;
    constructor(containerId: string);
    private setupEventListeners;
    private createSVG;
    renderFlow(flowSpec: FlowSpec): Promise<void>;
    private calculateLayout;
    private render;
    private renderEdge;
    private renderNode;
    private truncateText;
    private highlightNode;
    private unhighlightNode;
    private flashNode;
    private updateCountdown;
    private showFlowStart;
    private showFlowComplete;
    private showFlowError;
    private showNodeDetails;
    clear(): void;
}
export declare const createInlineStudio: (containerId: string) => InlineStudio;
//# sourceMappingURL=studio.d.ts.map