export * from "./plugin-types.js";
export { PluginRegistry, pluginRegistry } from "./plugin-registry.js";
export { PluginManager, pluginManager } from "./plugin-manager.js";
export { NotificationPlugin } from "./built-in/notification-plugin.js";
export { UIComponentsPlugin } from "./built-in/ui-components-plugin.js";
export { FlowExtensionPlugin } from "./built-in/flow-extension-plugin.js";
import { pluginRegistry } from "./plugin-registry.js";
import { NotificationPlugin } from "./built-in/notification-plugin.js";
import { UIComponentsPlugin } from "./built-in/ui-components-plugin.js";
import { FlowExtensionPlugin } from "./built-in/flow-extension-plugin.js";
export function registerBuiltInPlugins() {
    console.log("📦 Registering built-in plugins...");
    try {
        pluginRegistry.register(new NotificationPlugin());
        pluginRegistry.register(new UIComponentsPlugin());
        pluginRegistry.register(new FlowExtensionPlugin());
        console.log("✅ Built-in plugins registered successfully");
    }
    catch (error) {
        console.error("❌ Failed to register built-in plugins:", error);
        throw error;
    }
}
export async function initializePluginSystem() {
    const { pluginManager } = await import("./plugin-manager.js");
    registerBuiltInPlugins();
    await pluginManager.initialize();
}
//# sourceMappingURL=index.js.map