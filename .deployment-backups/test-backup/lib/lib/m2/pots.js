import { Bus } from "../core/bus.js";
export function applySweeps(income, pots, rules) {
    let remaining = income;
    const ordered = [...rules].sort((a, b) => (b.amount.type === "fixed" ? b.amount.value : Infinity) -
        (a.amount.type === "fixed" ? a.amount.value : Infinity));
    for (const r of ordered) {
        const p = pots.find(x => x.id === r.to);
        if (!p || p.rules.lock)
            continue;
        const amt = r.amount.type === "fixed" ? r.amount.value : Math.floor(remaining * r.amount.value);
        const headroom = (p.rules.max ?? Infinity) - p.balance;
        const add = Math.max(0, Math.min(amt, headroom));
        p.balance += add;
        remaining -= add;
        Bus.emit("B.sweep.applied", { potId: p.id, add });
        if (p.rules.min && p.balance < p.rules.min) {
            Bus.emit("B.pot.breached", { potId: p.id, kind: "min" });
        }
        if (p.rules.max && p.balance > p.rules.max) {
            Bus.emit("B.pot.breached", { potId: p.id, kind: "max" });
        }
    }
    return { pots, leftover: remaining };
}
//# sourceMappingURL=pots.js.map