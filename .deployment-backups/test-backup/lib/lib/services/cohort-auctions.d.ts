export interface CohortAuction {
    id: string;
    category: string;
    participants: number;
    currentBest: number;
    improvement: number;
    noWorseOffCheck: boolean;
    joinDeadline: string;
    targetSize: number;
    status: "forming" | "active" | "completed";
}
export declare function createCohortAuction(category: string, targetSize?: number): Promise<CohortAuction>;
export declare function joinCohortAuction(auctionId: string): Promise<{
    joined: boolean;
    projectedSavings: number;
    guarantee: string;
}>;
export declare function getActiveAuctions(): CohortAuction[];
//# sourceMappingURL=cohort-auctions.d.ts.map