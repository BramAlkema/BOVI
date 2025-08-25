export interface Quote {
    itemId: string;
    venue: string;
    price: number;
    ts: number;
    size?: number;
}
export interface M2PDAResult {
    itemId: string;
    median: number;
    mad: number;
    unitPrice?: number;
    provenance: {
        venue: string;
        ts: number;
    }[];
    score: "👍" | "→" | "👎";
}
export declare const median: (xs: number[]) => number;
export declare const mad: (xs: number[]) => number;
export declare const normaliseShrink: (price: number, packNow: number, packBase: number) => number;
export declare function computePDA(quotes: Quote[], basePack?: number, packNow?: number, personalMedian?: number): M2PDAResult;
//# sourceMappingURL=pda.d.ts.map