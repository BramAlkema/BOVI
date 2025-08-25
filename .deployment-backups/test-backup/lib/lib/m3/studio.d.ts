import type { Mode } from "../core/bus.js";
export interface M3FlowSpec {
    id: string;
    nodes: NodeSpec[];
    edges: EdgeSpec[];
}
export interface NodeSpec {
    id: string;
    type: `${Mode}.${string}`;
    label: string;
}
export interface EdgeSpec {
    from: string;
    to: string;
    label?: string;
}
export declare function renderStudio(flow: M3FlowSpec, mount: HTMLElement): void;
//# sourceMappingURL=studio.d.ts.map