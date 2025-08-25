export interface Receipt {
    id: string;
    action: string;
    when: string;
    why: string;
    undoUntil?: string;
    meta?: Record<string, unknown>;
}
export interface ReceiptAppeal {
    actionId: string;
    opened: string;
    status: "open" | "resolved";
    outcome?: string;
}
declare class ReceiptStore {
    private receipts;
    private appeals;
    constructor();
    add(r: Receipt): string;
    list(limit?: number): Receipt[];
    undoableWithin(id: string): boolean;
    markUndone(id: string): void;
    openAppeal(actionId: string): ReceiptAppeal;
    listAppeals(limit?: number): ReceiptAppeal[];
    resolveAppeal(actionId: string, outcome: string): void;
}
export declare const Receipts: ReceiptStore;
export declare function rid(prefix?: string): string;
export {};
//# sourceMappingURL=receipts.d.ts.map