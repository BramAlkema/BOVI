import { Bus } from "../core/bus.js";
import { Receipts, rid } from "../core/receipts.js";
const queue = [];
export function enqueueDefault(pd) {
    const exists = queue.find(existing => existing.flow === pd.flow && existing.node === pd.node);
    if (!exists) {
        queue.push(pd);
        Bus.emit("ui.toast", {
            kind: "info",
            msg: `Queued: ${pd.label}`,
        });
    }
}
export function getPendingCount() {
    return queue.length;
}
export function getPendingDefaults() {
    return [...queue];
}
export async function applyAllPendingDefaults() {
    let applied = 0;
    if (queue.length === 0) {
        Bus.emit("ui.toast", {
            kind: "info",
            msg: "No pending defaults to apply",
        });
        return 0;
    }
    Bus.emit("ui.toast", {
        kind: "info",
        msg: `Applying ${queue.length} default action${queue.length === 1 ? "" : "s"}...`,
    });
    while (queue.length) {
        const pd = queue.shift();
        try {
            await pd.apply();
            const id = rid("default");
            Receipts.add({
                id,
                action: `${pd.flow}.${pd.node}.defaultApplied`,
                when: new Date().toISOString(),
                why: `Applied default: ${pd.label}`,
                undoUntil: new Date(Date.now() + 10000).toISOString(),
                meta: { flow: pd.flow, node: pd.node },
            });
            Bus.emit("ui.toast", {
                kind: "success",
                msg: `✓ ${pd.label}`,
            });
            applied++;
        }
        catch (error) {
            Bus.emit("ui.toast", {
                kind: "error",
                msg: `Failed: ${pd.label}`,
            });
            console.error(`Failed to apply default for ${pd.flow}.${pd.node}:`, error);
        }
    }
    if (applied > 0) {
        Bus.emit("ui.toast", {
            kind: "success",
            msg: `Applied ${applied} safe default${applied === 1 ? "" : "s"}`,
        });
    }
    return applied;
}
export async function tryUndo(receiptId) {
    if (!Receipts.undoableWithin(receiptId)) {
        Bus.emit("ui.toast", {
            kind: "warn",
            msg: "Undo window elapsed",
        });
        return false;
    }
    Receipts.markUndone(receiptId);
    Bus.emit("ui.toast", {
        kind: "info",
        msg: "Action undone",
    });
    return true;
}
export function populateExampleDefaults() {
    enqueueDefault({
        flow: "groceries",
        node: "act1",
        label: "Swap to usual brand",
        apply: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        },
    });
    enqueueDefault({
        flow: "bills",
        node: "pay1",
        label: "Pay electricity bill",
        apply: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        },
    });
    enqueueDefault({
        flow: "pots",
        node: "sweep1",
        label: "Sweep to savings",
        apply: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
        },
    });
}
//# sourceMappingURL=safeCta.js.map