/**
 * BOVI Plugin System Exports
 * Enhanced plugin system with lifecycle management
 */

export * from "./plugin-types.js";
export { PluginRegistry, pluginRegistry } from "./plugin-registry.js";
export { PluginManager, pluginManager } from "./plugin-manager.js";

// Built-in plugins
export { NotificationPlugin } from "./built-in/notification-plugin.js";
export { UIComponentsPlugin } from "./built-in/ui-components-plugin.js";
export { FlowExtensionPlugin } from "./built-in/flow-extension-plugin.js";

// Auto-register built-in plugins
import { pluginRegistry } from "./plugin-registry.js";
import { NotificationPlugin } from "./built-in/notification-plugin.js";
import { UIComponentsPlugin } from "./built-in/ui-components-plugin.js";
import { FlowExtensionPlugin } from "./built-in/flow-extension-plugin.js";

/**
 * Register all built-in plugins
 */
export function registerBuiltInPlugins(): void {
  console.log("📦 Registering built-in plugins...");

  try {
    // Register core plugins
    pluginRegistry.register(new NotificationPlugin());
    pluginRegistry.register(new UIComponentsPlugin());
    pluginRegistry.register(new FlowExtensionPlugin());

    console.log("✅ Built-in plugins registered successfully");
  } catch (error) {
    console.error("❌ Failed to register built-in plugins:", error);
    throw error;
  }
}

/**
 * Initialize plugin system with built-in plugins
 */
export async function initializePluginSystem(): Promise<void> {
  const { pluginManager } = await import("./plugin-manager.js");

  // Register built-in plugins first
  registerBuiltInPlugins();

  // Initialize plugin system
  await pluginManager.initialize();
}
