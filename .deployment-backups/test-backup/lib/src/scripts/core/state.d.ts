interface StateManager<T = any> {
    get(): T;
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    update(updates: Partial<T>): void;
    subscribe(fn: <K extends keyof T>(key: K, value: T[K], oldValue: T[K]) => void): () => void;
}
export declare const state: {
    create: <T extends Record<string, any>>(initialState?: T) => StateManager<T>;
};
export {};
//# sourceMappingURL=state.d.ts.map