/**
 * BOVI Plugin Manager
 * High-level plugin management and coordination
 */

import type { PluginContext, Plugin, PluginCategory } from "./plugin-types.js";
import { pluginRegistry } from "./plugin-registry.js";
import { Bus } from "../bus.js";
import { api } from "../api/facade.js";
import { flowRunner } from "../flow/index.js";
import { dashboard } from "../monitoring/kpi-dashboard.js";
import { notificationService } from "../integration/notification-service.js";

/**
 * Plugin manager that provides high-level plugin coordination
 */
export class PluginManager {
  private initialized = false;

  /**
   * Initialize the plugin system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("Plugin manager already initialized");
      return;
    }

    try {
      console.log("🔌 Initializing plugin system...");

      // Create plugin context
      const context = this.createPluginContext();

      // Auto-discover and register built-in plugins
      await this.registerBuiltInPlugins();

      // Initialize core plugins
      await this.initializeCorePlugins(context);

      this.initialized = true;
      console.log("✅ Plugin system initialized");
    } catch (error) {
      console.error("❌ Failed to initialize plugin system:", error);
      throw error;
    }
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    pluginRegistry.register(plugin);
  }

  /**
   * Install and activate a plugin
   */
  async install(plugin: Plugin): Promise<void> {
    const context = this.createPluginContext();

    // Register plugin
    this.register(plugin);

    // Initialize and activate
    await pluginRegistry.initialize(plugin.manifest.id, context);
    await pluginRegistry.activate(plugin.manifest.id, context);

    console.log(`📦 Plugin installed: ${plugin.manifest.id}`);
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(id: string): Promise<void> {
    await pluginRegistry.unregister(id);
    console.log(`🗑️ Plugin uninstalled: ${id}`);
  }

  /**
   * Activate a plugin
   */
  async activate(id: string): Promise<void> {
    const context = this.createPluginContext();
    await pluginRegistry.activate(id, context);
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(id: string): Promise<void> {
    const context = this.createPluginContext();
    await pluginRegistry.deactivate(id, context);
  }

  /**
   * Get plugin manager status
   */
  getStatus(): {
    initialized: boolean;
    totalPlugins: number;
    activePlugins: number;
    pluginsByCategory: Record<PluginCategory, number>;
    } {
    const plugins = pluginRegistry.list();
    const activePlugins = pluginRegistry.getActive();

    const pluginsByCategory: Record<PluginCategory, number> = {
      "ui-component": 0,
      service: 0,
      integration: 0,
      "flow-extension": 0,
      monitoring: 0,
      notification: 0,
    };

    plugins.forEach(plugin => {
      pluginsByCategory[plugin.category]++;
    });

    return {
      initialized: this.initialized,
      totalPlugins: plugins.length,
      activePlugins: activePlugins.length,
      pluginsByCategory,
    };
  }

  /**
   * List plugins by category
   */
  listByCategory(category: PluginCategory): Plugin[] {
    return pluginRegistry
      .list()
      .filter(manifest => manifest.category === category)
      .map(manifest => pluginRegistry.get(manifest.id)!)
      .filter(Boolean);
  }

  /**
   * Get plugin configuration
   */
  getConfig(id: string): Record<string, any> {
    return pluginRegistry.getConfig(id);
  }

  /**
   * Configure plugin
   */
  async configure(id: string, config: Record<string, any>): Promise<void> {
    await pluginRegistry.configure(id, config);
  }

  /**
   * Restart plugin system
   */
  async restart(): Promise<void> {
    console.log("🔄 Restarting plugin system...");

    // Deactivate all plugins
    const activePlugins = pluginRegistry.getActive();
    const context = this.createPluginContext();

    for (const plugin of activePlugins) {
      await pluginRegistry.deactivate(plugin.manifest.id, context);
    }

    // Reinitialize
    this.initialized = false;
    await this.initialize();
  }

  // Private methods

  /**
   * Create plugin context with access to BOVI systems
   */
  private createPluginContext(): PluginContext {
    return {
      // Core systems
      bus: Bus,
      timers: null, // Would be populated with actual timer manager
      storage: localStorage,

      // BOVI systems
      flowRunner,
      api,
      monitoring: dashboard,

      // Plugin management
      getPlugin: (id: string) => pluginRegistry.get(id),
      getPluginConfig: (id: string) => pluginRegistry.getConfig(id),
      setPluginConfig: (id: string, config: Record<string, any>) => {
        pluginRegistry.configure(id, config);
      },

      // Utility functions
      showNotification: (message: string, type?: "info" | "success" | "error") => {
        notificationService.showNotification(message, type);
      },
      log: (message: string, level?: "info" | "warn" | "error") => {
        console[level || "info"](`[Plugin] ${message}`);
      },
    };
  }

  /**
   * Register built-in plugins
   */
  private async registerBuiltInPlugins(): Promise<void> {
    // This would register built-in plugins
    // For now, we'll just log that built-ins are being discovered
    console.log("🔍 Discovering built-in plugins...");

    // In a real implementation, this would:
    // 1. Scan for plugin files in specific directories
    // 2. Load plugin manifests
    // 3. Register discovered plugins

    // Example built-in plugins that could be registered:
    // - UI components (ruler switcher, money veil card, etc.)
    // - Service integrations (notification service, etc.)
    // - Monitoring extensions
    // - Flow extensions
  }

  /**
   * Initialize core plugins required for basic functionality
   */
  private async initializeCorePlugins(context: PluginContext): Promise<void> {
    const corePlugins = pluginRegistry
      .list()
      .filter(manifest => manifest.id.startsWith("bovi-core-"))
      .map(manifest => manifest.id);

    for (const pluginId of corePlugins) {
      try {
        await pluginRegistry.initialize(pluginId, context);
        await pluginRegistry.activate(pluginId, context);
      } catch (error) {
        console.error(`Failed to initialize core plugin ${pluginId}:`, error);
      }
    }
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();
