export interface LTSIndexRef {
    baseYear: number;
    deflator: number;
}
export interface M3ContractTemplate {
    id: string;
    kind: "rent" | "subscription";
    amountLTS: number;
    index: LTSIndexRef;
    capBp?: number;
    floorBp?: number;
    carryOver?: boolean;
    undoWindowSec: number;
    text?: string;
}
export interface Rendered {
    json: Blob;
    txt: Blob;
    hash: string;
}
export declare function renderContract(ct: M3ContractTemplate): Promise<Rendered>;
//# sourceMappingURL=contracts.d.ts.map