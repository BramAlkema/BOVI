export async function calculateMoneyVeil(income, savings, interestRate) {
    const personalInflation = await calculateLocalLTS();
    const officialInflation = 0.032;
    const inflationDrift = personalInflation - officialInflation;
    const bracketCreep = Math.max(0, inflationDrift * income * 0.2);
    const nominalReturn = savings * interestRate;
    const realReturn = savings * (interestRate - personalInflation);
    const realRate = realReturn - nominalReturn;
    const netImpact = bracketCreep + realRate;
    return {
        userId: "current-user",
        inflationDrift,
        bracketCreep,
        realRate,
        netImpact,
        lastCalculated: new Date().toISOString(),
    };
}
async function calculateLocalLTS() {
    return 0.0347;
}
//# sourceMappingURL=money-veil.js.map