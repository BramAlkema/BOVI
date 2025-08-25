export interface IndexCommonsEntry {
    id: string;
    timestamp: string;
    sources: string[];
    median: number;
    mad: number;
    quality: number;
    notes: string;
    basket?: any[];
}
declare class IndexCommonsStore {
    private dbName;
    private version;
    private db;
    init(): Promise<void>;
    store(entry: IndexCommonsEntry): Promise<void>;
    getAll(): Promise<IndexCommonsEntry[]>;
    exportJSON(): Promise<string>;
}
export declare const indexCommons: IndexCommonsStore;
export {};
//# sourceMappingURL=index-commons.d.ts.map