export interface MoneyVeil {
    driftBp: number;
    driftMonthly: number;
    realRate: number;
    bracketCreep: number;
}
export interface Inputs {
    cashBalance: number;
    policyRate: number;
    userInflation: number;
    officialCpi: number;
    wageYoY: number;
    annualIncome: number;
    taxBands: {
        threshold: number;
        rate: number;
    }[];
}
export declare function calcMoneyVeil(i: Inputs): MoneyVeil;
//# sourceMappingURL=moneyVeil.d.ts.map