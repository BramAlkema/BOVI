import { emit } from "../bus.js";
export class PluginRegistry {
    constructor() {
        this.plugins = new Map();
        this.statuses = new Map();
        this.configs = new Map();
        this.dependencies = new Map();
    }
    register(plugin) {
        const { id } = plugin.manifest;
        if (this.plugins.has(id)) {
            throw new Error(`Plugin ${id} is already registered`);
        }
        this.validateManifest(plugin.manifest);
        this.plugins.set(id, plugin);
        this.statuses.set(id, {
            state: "uninitialized",
            lastUpdated: Date.now(),
        });
        if (plugin.manifest.config?.defaults) {
            this.configs.set(id, { ...plugin.manifest.config.defaults });
        }
        if (plugin.manifest.dependencies?.plugins) {
            this.dependencies.set(id, new Set(plugin.manifest.dependencies.plugins));
        }
        emit("plugin:registered", { pluginId: id, manifest: plugin.manifest });
        console.log(`🔌 Plugin registered: ${id}`);
    }
    async unregister(id) {
        const plugin = this.plugins.get(id);
        if (!plugin)
            return;
        if (this.getStatus(id).state === "active") {
            await this.deactivate(id);
        }
        if (plugin.destroy) {
            try {
                await plugin.destroy();
            }
            catch (error) {
                console.error(`Error destroying plugin ${id}:`, error);
            }
        }
        this.plugins.delete(id);
        this.statuses.delete(id);
        this.configs.delete(id);
        this.dependencies.delete(id);
        console.log(`🔌 Plugin unregistered: ${id}`);
    }
    async initialize(id, context) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            throw new Error(`Plugin ${id} not found`);
        }
        const status = this.statuses.get(id);
        if (status.state !== "uninitialized") {
            return;
        }
        try {
            await this.checkDependencies(id);
            if (plugin.initialize) {
                await plugin.initialize(context);
            }
            this.updateStatus(id, { state: "initialized" });
            emit("plugin:initialized", { pluginId: id });
            console.log(`🚀 Plugin initialized: ${id}`);
        }
        catch (error) {
            this.updateStatus(id, {
                state: "error",
                error: error.message,
            });
            emit("plugin:error", { pluginId: id, error: error, phase: "initialization" });
            throw error;
        }
    }
    async activate(id, context) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            throw new Error(`Plugin ${id} not found`);
        }
        const status = this.statuses.get(id);
        if (status.state === "active") {
            return;
        }
        if (status.state === "uninitialized") {
            await this.initialize(id, context);
        }
        try {
            if (plugin.activate) {
                await plugin.activate(context);
            }
            this.updateStatus(id, { state: "active" });
            emit("plugin:activated", { pluginId: id });
            console.log(`✅ Plugin activated: ${id}`);
        }
        catch (error) {
            this.updateStatus(id, {
                state: "error",
                error: error.message,
            });
            emit("plugin:error", { pluginId: id, error: error, phase: "initialization" });
            throw error;
        }
    }
    async deactivate(id, context) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            throw new Error(`Plugin ${id} not found`);
        }
        const status = this.statuses.get(id);
        if (status.state !== "active") {
            return;
        }
        try {
            if (plugin.deactivate && context) {
                await plugin.deactivate(context);
            }
            this.updateStatus(id, { state: "inactive" });
            emit("plugin:deactivated", { pluginId: id });
            console.log(`⏸️ Plugin deactivated: ${id}`);
        }
        catch (error) {
            this.updateStatus(id, {
                state: "error",
                error: error.message,
            });
            emit("plugin:error", { pluginId: id, error: error, phase: "initialization" });
            throw error;
        }
    }
    get(id) {
        return this.plugins.get(id) || null;
    }
    getStatus(id) {
        return (this.statuses.get(id) || {
            state: "uninitialized",
            lastUpdated: 0,
        });
    }
    list() {
        return Array.from(this.plugins.values()).map(p => p.manifest);
    }
    listByCategory(category) {
        return this.list().filter(m => m.category === category);
    }
    getActive() {
        return Array.from(this.plugins.entries())
            .filter(([id]) => this.getStatus(id).state === "active")
            .map(([_, plugin]) => plugin);
    }
    async configure(id, config) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            throw new Error(`Plugin ${id} not found`);
        }
        const currentConfig = this.configs.get(id) || {};
        const newConfig = { ...currentConfig, ...config };
        this.configs.set(id, newConfig);
        if (plugin.configure) {
            await plugin.configure(newConfig);
        }
        emit("plugin:config-changed", { pluginId: id, config: newConfig });
    }
    getConfig(id) {
        return this.configs.get(id) || {};
    }
    validateManifest(manifest) {
        if (!manifest.id) {
            throw new Error("Plugin manifest must have an id");
        }
        if (!manifest.name) {
            throw new Error("Plugin manifest must have a name");
        }
        if (!manifest.version) {
            throw new Error("Plugin manifest must have a version");
        }
        if (!manifest.category) {
            throw new Error("Plugin manifest must have a category");
        }
    }
    async checkDependencies(id) {
        const deps = this.dependencies.get(id);
        if (!deps)
            return;
        for (const depId of deps) {
            if (!this.plugins.has(depId)) {
                throw new Error(`Plugin ${id} requires ${depId} but it is not registered`);
            }
            const depStatus = this.getStatus(depId);
            if (depStatus.state === "uninitialized" || depStatus.state === "error") {
                throw new Error(`Plugin ${id} requires ${depId} but it is not initialized`);
            }
        }
    }
    updateStatus(id, updates) {
        const current = this.statuses.get(id);
        this.statuses.set(id, {
            ...current,
            ...updates,
            lastUpdated: Date.now(),
        });
    }
}
export const pluginRegistry = new PluginRegistry();
//# sourceMappingURL=plugin-registry.js.map