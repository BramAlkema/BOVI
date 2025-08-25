export interface Ruler {
    id: string;
    name: string;
    method: string;
    lastUpdated: string;
    bpDrift: number;
}
export declare function getRulers(): Promise<Ruler[]>;
export declare function setActiveRuler(id: string): Promise<void>;
export declare function getActiveRulerId(): string;
export declare function getActiveRuler(): Promise<Ruler>;
//# sourceMappingURL=rulers.d.ts.map