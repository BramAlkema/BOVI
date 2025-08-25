export interface Ruler {
    id: string;
    name: string;
    method: string;
    lastUpdated: string;
    bpDrift: number;
}
export declare function getRulers(): Promise<Ruler[]>;
export declare function switchRuler(rulerId: string): Promise<void>;
export declare function getActiveRuler(): Promise<Ruler>;
export declare function getActiveRulerId(): string;
//# sourceMappingURL=rulers.d.ts.map