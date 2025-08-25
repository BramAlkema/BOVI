const _intents = [];
export function joinCohort(i) {
    _intents.push(i);
}
export function clearCohort(bids, rule, baseline) {
    if (_intents.length < rule.minJoiners) {
        return { enrolled: [], savingPerUser: 0 };
    }
    const winner = [...bids].sort((a, b) => a.price - b.price)[0];
    const enrolled = _intents
        .filter(i => (i.maxPrice ?? Infinity) >= winner.price)
        .map(i => i.userId);
    const savingPerUser = Math.max(0, baseline - winner.price);
    return { winner, enrolled, savingPerUser: +savingPerUser.toFixed(2) };
}
//# sourceMappingURL=cohort.js.map