import type { Plugin, PluginManifest, PluginStatus, PluginCategory, PluginContext } from "./plugin-types.js";
export declare class PluginRegistry {
    private plugins;
    private statuses;
    private configs;
    private dependencies;
    register(plugin: Plugin): void;
    unregister(id: string): Promise<void>;
    initialize(id: string, context: PluginContext): Promise<void>;
    activate(id: string, context: PluginContext): Promise<void>;
    deactivate(id: string, context?: PluginContext): Promise<void>;
    get(id: string): Plugin | null;
    getStatus(id: string): PluginStatus;
    list(): PluginManifest[];
    listByCategory(category: PluginCategory): PluginManifest[];
    getActive(): Plugin[];
    configure(id: string, config: Record<string, any>): Promise<void>;
    getConfig(id: string): Record<string, any>;
    private validateManifest;
    private checkDependencies;
    private updateStatus;
}
export declare const pluginRegistry: PluginRegistry;
//# sourceMappingURL=plugin-registry.d.ts.map