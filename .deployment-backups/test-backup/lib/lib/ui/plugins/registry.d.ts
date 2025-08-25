import type { UIComponentPlugin } from "./types.js";
export declare function registerUIPlugin(p: UIComponentPlugin): void;
export declare function listUIPlugins(): import("./types.js").UIPluginManifest[];
export declare function getUIPlugin(id: string): UIComponentPlugin | null;
export declare function getActiveUIPluginId(): string | null;
export declare function setActiveUIPluginId(id: string): void;
//# sourceMappingURL=registry.d.ts.map