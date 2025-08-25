export function fairRent(current, proposedPct, userDeflator, caps) {
    const target = current * (1 + userDeflator);
    let counter = target;
    if (typeof caps.capBp === "number") {
        counter = Math.min(counter, current * (1 + caps.capBp / 10000));
    }
    if (typeof caps.floorBp === "number") {
        counter = Math.max(counter, current * (1 + caps.floorBp / 10000));
    }
    return +counter.toFixed(2);
}
//# sourceMappingURL=rentCounter.js.map