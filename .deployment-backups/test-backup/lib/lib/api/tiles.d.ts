export type BillsSafe = "OK" | "WATCH";
export declare function getBillsSafe(): Promise<BillsSafe>;
export declare function getBestDeal(): Promise<{
    label: string;
    delta: number;
}>;
export type EnergyStatus = "OK" | "Switching" | "Join cohort";
export declare function getEnergyStatus(): Promise<EnergyStatus>;
//# sourceMappingURL=tiles.d.ts.map