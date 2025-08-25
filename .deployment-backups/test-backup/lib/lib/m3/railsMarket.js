const REG = new Map();
export function registerRail(r) {
    REG.set(r.id, r);
}
export async function listQuotes(p) {
    const out = [];
    for (const r of REG.values()) {
        out.push(await r.quote(p));
    }
    return out;
}
export async function bestQuote(p) {
    const qs = await listQuotes(p);
    return qs.sort((a, b) => a.fee - b.fee || a.etaSec - b.etaSec)[0];
}
//# sourceMappingURL=railsMarket.js.map