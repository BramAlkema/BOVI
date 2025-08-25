export interface Pot {
    id: string;
    name: string;
    priority: number;
    balance: number;
    rules: {
        min?: number;
        max?: number;
        lock?: boolean;
    };
}
export interface SweepRule {
    to: string;
    amount: {
        type: "fixed" | "percent";
        value: number;
    };
    jit?: boolean;
    due?: {
        cron: string;
    };
}
export declare function applySweeps(income: number, pots: Pot[], rules: SweepRule[]): {
    pots: Pot[];
    leftover: number;
};
//# sourceMappingURL=pots.d.ts.map