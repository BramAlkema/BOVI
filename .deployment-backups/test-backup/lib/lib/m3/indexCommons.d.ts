export interface IndexSource {
    id: string;
    venue: string;
    price: number;
    ts: string;
    quality?: string;
    item?: string;
}
export interface IndexSnapshot {
    id: string;
    method: string;
    median: number;
    mad: number;
    sources: IndexSource[];
}
export declare class M3IndexCommons {
    private sources;
    constructor();
    add(src: IndexSource): void;
    list(limit?: number): IndexSource[];
    clear(): void;
    compute(): IndexSnapshot;
}
export declare function hamburgerSentinel(sources: IndexSource[]): {
    items: string[];
    median: number;
};
//# sourceMappingURL=indexCommons.d.ts.map