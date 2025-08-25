import type { Plugin, PluginCategory } from "./plugin-types.js";
export declare class PluginManager {
    private initialized;
    initialize(): Promise<void>;
    register(plugin: Plugin): void;
    install(plugin: Plugin): Promise<void>;
    uninstall(id: string): Promise<void>;
    activate(id: string): Promise<void>;
    deactivate(id: string): Promise<void>;
    getStatus(): {
        initialized: boolean;
        totalPlugins: number;
        activePlugins: number;
        pluginsByCategory: Record<PluginCategory, number>;
    };
    listByCategory(category: PluginCategory): Plugin[];
    getConfig(id: string): Record<string, any>;
    configure(id: string, config: Record<string, any>): Promise<void>;
    restart(): Promise<void>;
    private createPluginContext;
    private registerBuiltInPlugins;
    private initializeCorePlugins;
}
export declare const pluginManager: PluginManager;
//# sourceMappingURL=plugin-manager.d.ts.map