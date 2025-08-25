import { pluginRegistry } from "./plugin-registry.js";
import { Bus } from "../bus.js";
import { api } from "../api/facade.js";
import { flowRunner } from "../flow/index.js";
import { dashboard } from "../monitoring/kpi-dashboard.js";
import { notificationService } from "../integration/notification-service.js";
export class PluginManager {
    constructor() {
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized) {
            console.warn("Plugin manager already initialized");
            return;
        }
        try {
            console.warn("🔌 Initializing plugin system...");
            const context = this.createPluginContext();
            await this.registerBuiltInPlugins();
            await this.initializeCorePlugins(context);
            this.initialized = true;
            console.warn("✅ Plugin system initialized");
        }
        catch (error) {
            console.error("❌ Failed to initialize plugin system:", error);
            throw error;
        }
    }
    register(plugin) {
        pluginRegistry.register(plugin);
    }
    async install(plugin) {
        const context = this.createPluginContext();
        this.register(plugin);
        await pluginRegistry.initialize(plugin.manifest.id, context);
        await pluginRegistry.activate(plugin.manifest.id, context);
        console.warn(`📦 Plugin installed: ${plugin.manifest.id}`);
    }
    async uninstall(id) {
        await pluginRegistry.unregister(id);
        console.warn(`🗑️ Plugin uninstalled: ${id}`);
    }
    async activate(id) {
        const context = this.createPluginContext();
        await pluginRegistry.activate(id, context);
    }
    async deactivate(id) {
        const context = this.createPluginContext();
        await pluginRegistry.deactivate(id, context);
    }
    getStatus() {
        const plugins = pluginRegistry.list();
        const activePlugins = pluginRegistry.getActive();
        const pluginsByCategory = {
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
    listByCategory(category) {
        return pluginRegistry
            .list()
            .filter(manifest => manifest.category === category)
            .map(manifest => pluginRegistry.get(manifest.id))
            .filter(Boolean);
    }
    getConfig(id) {
        return pluginRegistry.getConfig(id);
    }
    async configure(id, config) {
        await pluginRegistry.configure(id, config);
    }
    async restart() {
        console.warn("🔄 Restarting plugin system...");
        const activePlugins = pluginRegistry.getActive();
        const context = this.createPluginContext();
        for (const plugin of activePlugins) {
            await pluginRegistry.deactivate(plugin.manifest.id, context);
        }
        this.initialized = false;
        await this.initialize();
    }
    createPluginContext() {
        return {
            bus: Bus,
            timers: null,
            storage: localStorage,
            flowRunner,
            api,
            monitoring: dashboard,
            getPlugin: (id) => pluginRegistry.get(id),
            getPluginConfig: (id) => pluginRegistry.getConfig(id),
            setPluginConfig: (id, config) => {
                pluginRegistry.configure(id, config);
            },
            showNotification: (message, type) => {
                notificationService.showNotification(message, type);
            },
            log: (message, level = "warn") => {
                if (level === "warn") {
                    console.warn(`[Plugin] ${message}`);
                }
                else if (level === "error") {
                    console.error(`[Plugin] ${message}`);
                }
                else {
                    console.log(`[Plugin] ${message}`);
                }
            },
        };
    }
    async registerBuiltInPlugins() {
    }
    async initializeCorePlugins(context) {
        const corePlugins = pluginRegistry
            .list()
            .filter(manifest => manifest.id.startsWith("bovi-core-"))
            .map(manifest => manifest.id);
        for (const pluginId of corePlugins) {
            try {
                await pluginRegistry.initialize(pluginId, context);
                await pluginRegistry.activate(pluginId, context);
            }
            catch (error) {
                console.error(`Failed to initialize core plugin ${pluginId}:`, error);
            }
        }
    }
}
export const pluginManager = new PluginManager();
//# sourceMappingURL=plugin-manager.js.map