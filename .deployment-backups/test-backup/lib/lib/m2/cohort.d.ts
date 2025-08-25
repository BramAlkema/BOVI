export interface Intent {
    userId: string;
    product: "energy" | "broadband";
    maxPrice?: number;
    usage?: number;
}
export interface Bid {
    supplierId: string;
    price: number;
    terms?: Record<string, string>;
}
export interface ClearRule {
    minJoiners: number;
    safe: "noWorseOff";
}
export interface Result {
    winner?: Bid;
    enrolled: string[];
    savingPerUser: number;
}
export declare function joinCohort(i: Intent): void;
export declare function clearCohort(bids: Bid[], rule: ClearRule, baseline: number): Result;
//# sourceMappingURL=cohort.d.ts.map