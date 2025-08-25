class ReceiptStore {
    constructor() {
        this.receipts = [];
        this.appeals = [];
        try {
            const r = localStorage.getItem("bovi.receipts");
            if (r)
                this.receipts = JSON.parse(r);
            const a = localStorage.getItem("bovi.appeals");
            if (a)
                this.appeals = JSON.parse(a);
        }
        catch {
        }
    }
    add(r) {
        this.receipts.unshift(r);
        localStorage.setItem("bovi.receipts", JSON.stringify(this.receipts));
        return r.id;
    }
    list(limit = 100) {
        return this.receipts.slice(0, limit);
    }
    undoableWithin(id) {
        const r = this.receipts.find(x => x.id === id);
        if (!r?.undoUntil)
            return false;
        return Date.now() < Date.parse(r.undoUntil);
    }
    markUndone(id) {
        const r = this.receipts.find(x => x.id === id);
        if (r)
            r.undoUntil = undefined;
        localStorage.setItem("bovi.receipts", JSON.stringify(this.receipts));
    }
    openAppeal(actionId) {
        const a = {
            actionId,
            opened: new Date().toISOString(),
            status: "open",
        };
        this.appeals.unshift(a);
        localStorage.setItem("bovi.appeals", JSON.stringify(this.appeals));
        return a;
    }
    listAppeals(limit = 100) {
        return this.appeals.slice(0, limit);
    }
    resolveAppeal(actionId, outcome) {
        const a = this.appeals.find(x => x.actionId === actionId && x.status === "open");
        if (a) {
            a.status = "resolved";
            a.outcome = outcome;
            localStorage.setItem("bovi.appeals", JSON.stringify(this.appeals));
        }
    }
}
export const Receipts = new ReceiptStore();
export function rid(prefix = "act") {
    const r = crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}_${r[0].toString(16)}${r[1].toString(16)}`;
}
//# sourceMappingURL=receipts.js.map