export function calcMoneyVeil(i) {
    const driftBp = Math.round((i.userInflation - i.officialCpi) * 10000);
    const driftMonthly = +((i.cashBalance * (i.userInflation - i.officialCpi)) / 12).toFixed(2);
    const realRate = +(i.policyRate - i.userInflation).toFixed(4);
    const bracketCreep = Math.max(0, tax(i.annualIncome, i.taxBands, 1) - tax(i.annualIncome, i.taxBands, 1 + i.officialCpi));
    return { driftBp, driftMonthly, realRate, bracketCreep: +bracketCreep.toFixed(2) };
}
function tax(income, bands, indexFactor = 1) {
    let due = 0, last = 0;
    for (const b of bands) {
        const th = b.threshold * indexFactor;
        const base = Math.min(Math.max(income - last, 0), Math.max(th - last, 0));
        due += base * b.rate;
        last = th;
    }
    if (income > last)
        due += (income - last) * (bands[bands.length - 1]?.rate ?? 0);
    return due;
}
//# sourceMappingURL=moneyVeil.js.map