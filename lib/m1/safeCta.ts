// M1: Safe Defaults CTA – orchestrator that applies all pending defaults

import { Bus } from "../core/bus.js";
import { Receipts, rid } from "../core/receipts.js";

/** Example pending defaults (replace with real hooks into flows) */
export interface PendingDefault {
  flow: string;
  node: string;
  label: string;
  apply: () => Promise<void>;
}

const queue: PendingDefault[] = [];

/** Allow other modules to enqueue defaults */
export function enqueueDefault(pd: PendingDefault) {
  // Prevent duplicates
  const exists = queue.find(existing => existing.flow === pd.flow && existing.node === pd.node);
  if (!exists) {
    queue.push(pd);
    Bus.emit("ui.toast", {
      kind: "info",
      msg: `Queued: ${pd.label}`,
    });
  }
}

/** Get current queue count */
export function getPendingCount(): number {
  return queue.length;
}

/** Get pending defaults */
export function getPendingDefaults(): PendingDefault[] {
  return [...queue];
}

/** Apply all, emitting toasts and receipts */
export async function applyAllPendingDefaults(): Promise<number> {
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
    const pd = queue.shift()!;

    try {
      await pd.apply();

      const id = rid("default");
      Receipts.add({
        id,
        action: `${pd.flow}.${pd.node}.defaultApplied`,
        when: new Date().toISOString(),
        why: `Applied default: ${pd.label}`,
        undoUntil: new Date(Date.now() + 10_000).toISOString(), // 10s undo window
        meta: { flow: pd.flow, node: pd.node },
      });

      Bus.emit("ui.toast", {
        kind: "success",
        msg: `✓ ${pd.label}`,
      });

      applied++;
    } catch (error) {
      Bus.emit("ui.toast", {
        kind: "error",
        msg: `Failed: ${pd.label}`,
      });

      // Log error but continue with other defaults
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

/** Example undo handler – caller must wire to a UI button */
export async function tryUndo(receiptId: string): Promise<boolean> {
  if (!Receipts.undoableWithin(receiptId)) {
    Bus.emit("ui.toast", {
      kind: "warn",
      msg: "Undo window elapsed",
    });
    return false;
  }

  // INTEGRATION: Implement domain-specific transaction reversal logic
  // For now, just mark as undone
  Receipts.markUndone(receiptId);

  Bus.emit("ui.toast", {
    kind: "info",
    msg: "Action undone",
  });

  return true;
}

/** Example function to populate defaults - wire to your flows */
export function populateExampleDefaults() {
  enqueueDefault({
    flow: "groceries",
    node: "act1",
    label: "Swap to usual brand",
    apply: async () => {
      // Mock grocery swap
      await new Promise(resolve => setTimeout(resolve, 500));
    },
  });

  enqueueDefault({
    flow: "bills",
    node: "pay1",
    label: "Pay electricity bill",
    apply: async () => {
      // Mock bill payment
      await new Promise(resolve => setTimeout(resolve, 300));
    },
  });

  enqueueDefault({
    flow: "pots",
    node: "sweep1",
    label: "Sweep to savings",
    apply: async () => {
      // Mock pot sweep
      await new Promise(resolve => setTimeout(resolve, 200));
    },
  });
}
