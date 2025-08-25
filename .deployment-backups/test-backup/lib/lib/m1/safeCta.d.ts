export interface PendingDefault {
    flow: string;
    node: string;
    label: string;
    apply: () => Promise<void>;
}
export declare function enqueueDefault(pd: PendingDefault): void;
export declare function getPendingCount(): number;
export declare function getPendingDefaults(): PendingDefault[];
export declare function applyAllPendingDefaults(): Promise<number>;
export declare function tryUndo(receiptId: string): Promise<boolean>;
export declare function populateExampleDefaults(): void;
//# sourceMappingURL=safeCta.d.ts.map