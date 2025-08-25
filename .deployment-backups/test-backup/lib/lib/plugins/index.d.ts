export * from "./plugin-types.js";
export { PluginRegistry, pluginRegistry } from "./plugin-registry.js";
export { PluginManager, pluginManager } from "./plugin-manager.js";
export { NotificationPlugin } from "./built-in/notification-plugin.js";
export { UIComponentsPlugin } from "./built-in/ui-components-plugin.js";
export { FlowExtensionPlugin } from "./built-in/flow-extension-plugin.js";
export declare function registerBuiltInPlugins(): void;
export declare function initializePluginSystem(): Promise<void>;
//# sourceMappingURL=index.d.ts.map