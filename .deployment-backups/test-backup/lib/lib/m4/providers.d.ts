export interface M4IndexProvider {
    id: string;
    name: string;
    method: string;
    url?: string;
    notes?: string;
}
export declare function listIndexProviders(): Promise<M4IndexProvider[]>;
export declare function chooseProvider(id: string): Promise<void>;
export declare function getChosenProvider(): string;
//# sourceMappingURL=providers.d.ts.map