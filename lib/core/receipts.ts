// M0: Receipts, Undo & Appeals (local-first)

export interface Receipt {
  id: string;
  action: string;         // e.g., "groceries.swap.default"
  when: string;           // ISO timestamp
  why: string;            // human explanation
  undoUntil?: string;     // ISO if reversible
  meta?: Record<string, unknown>;
}

export interface ReceiptAppeal {
  actionId: string; 
  opened: string; 
  status: "open" | "resolved"; 
  outcome?: string;
}

class ReceiptStore {
  private receipts: Receipt[] = [];
  private appeals: ReceiptAppeal[] = [];

  constructor() {
    try {
      const r = localStorage.getItem("bovi.receipts"); 
      if (r) this.receipts = JSON.parse(r);
      const a = localStorage.getItem("bovi.appeals");  
      if (a) this.appeals = JSON.parse(a);
    } catch { 
      /* ignore parse errors */ 
    }
  }

  add(r: Receipt) {
    this.receipts.unshift(r);
    localStorage.setItem("bovi.receipts", JSON.stringify(this.receipts));
    return r.id;
  }

  list(limit = 100) { 
    return this.receipts.slice(0, limit); 
  }

  undoableWithin(id: string): boolean {
    const r = this.receipts.find(x => x.id === id);
    if (!r?.undoUntil) return false;
    return Date.now() < Date.parse(r.undoUntil);
  }

  /** Caller must perform actual reversal; we only track state. */
  markUndone(id: string) {
    const r = this.receipts.find(x => x.id === id);
    if (r) r.undoUntil = undefined;
    localStorage.setItem("bovi.receipts", JSON.stringify(this.receipts));
  }

  openAppeal(actionId: string) {
    const a: ReceiptAppeal = { 
      actionId, 
      opened: new Date().toISOString(), 
      status: "open" 
    };
    this.appeals.unshift(a);
    localStorage.setItem("bovi.appeals", JSON.stringify(this.appeals));
    return a;
  }

  listAppeals(limit = 100) { 
    return this.appeals.slice(0, limit); 
  }

  resolveAppeal(actionId: string, outcome: string) {
    const a = this.appeals.find(x => x.actionId === actionId && x.status === "open");
    if (a) { 
      a.status = "resolved"; 
      a.outcome = outcome; 
      localStorage.setItem("bovi.appeals", JSON.stringify(this.appeals)); 
    }
  }
}

export const Receipts = new ReceiptStore();

/** Utility to create a standard receipt id */
export function rid(prefix = "act"): string {
  const r = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}_${r[0].toString(16)}${r[1].toString(16)}`;
}