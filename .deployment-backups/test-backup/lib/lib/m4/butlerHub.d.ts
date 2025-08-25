export interface M4ButlerManifest {
    id: string;
    name: string;
    version: string;
    caps: string[];
}
export declare function installButler(_pkgUrl: string): Promise<void>;
export declare function listButlers(): Promise<M4ButlerManifest[]>;
export declare function activateButler(id: string): Promise<void>;
export declare function getActiveButler(): string;
//# sourceMappingURL=butlerHub.d.ts.map