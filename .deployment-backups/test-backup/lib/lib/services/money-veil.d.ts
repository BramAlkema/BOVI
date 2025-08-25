export interface MoneyVeilData {
    userId: string;
    inflationDrift: number;
    bracketCreep: number;
    realRate: number;
    netImpact: number;
    lastCalculated: string;
}
export declare function calculateMoneyVeil(income: number, savings: number, interestRate: number): Promise<MoneyVeilData>;
//# sourceMappingURL=money-veil.d.ts.map