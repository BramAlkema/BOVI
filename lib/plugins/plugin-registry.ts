/**
 * BOVI Plugin Registry
 * Enhanced plugin registration and management system
 */

import type { 
  Plugin, 
  PluginManifest, 
  PluginStatus, 
  PluginCategory,
  PluginContext 
} from './plugin-types.js';
import { emit } from '../bus.js';

/**
 * Enhanced plugin registry with lifecycle management
 */
export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private statuses = new Map<string, PluginStatus>();
  private configs = new Map<string, Record<string, any>>();
  private dependencies = new Map<string, Set<string>>();
  
  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    const { id } = plugin.manifest;
    
    if (this.plugins.has(id)) {
      throw new Error(`Plugin ${id} is already registered`);
    }
    
    // Validate manifest
    this.validateManifest(plugin.manifest);
    
    // Register plugin
    this.plugins.set(id, plugin);
    this.statuses.set(id, {
      state: 'uninitialized',
      lastUpdated: Date.now()
    });
    
    // Load default config
    if (plugin.manifest.config?.defaults) {
      this.configs.set(id, { ...plugin.manifest.config.defaults });
    }
    
    // Track dependencies
    if (plugin.manifest.dependencies?.plugins) {
      this.dependencies.set(id, new Set(plugin.manifest.dependencies.plugins));
    }
    
    emit('plugin:registered', { plugin });
    console.log(`🔌 Plugin registered: ${id}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    
    // Deactivate if active
    if (this.getStatus(id).state === 'active') {
      await this.deactivate(id);
    }
    
    // Destroy plugin
    if (plugin.destroy) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`Error destroying plugin ${id}:`, error);
      }
    }
    
    // Remove from registry
    this.plugins.delete(id);
    this.statuses.delete(id);
    this.configs.delete(id);
    this.dependencies.delete(id);
    
    console.log(`🔌 Plugin unregistered: ${id}`);
  }

  /**
   * Initialize a plugin
   */
  async initialize(id: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }
    
    const status = this.statuses.get(id)!;
    if (status.state !== 'uninitialized') {
      return;
    }
    
    try {
      // Check dependencies
      await this.checkDependencies(id);
      
      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize(context);
      }
      
      // Update status
      this.updateStatus(id, { state: 'initialized' });
      
      emit('plugin:initialized', { plugin });
      console.log(`🚀 Plugin initialized: ${id}`);
      
    } catch (error) {
      this.updateStatus(id, { 
        state: 'error', 
        error: (error as Error).message 
      });
      emit('plugin:error', { plugin, error: error as Error });
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activate(id: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }
    
    const status = this.statuses.get(id)!;
    if (status.state === 'active') {
      return;
    }
    
    if (status.state === 'uninitialized') {
      await this.initialize(id, context);
    }
    
    try {
      // Activate plugin
      if (plugin.activate) {
        await plugin.activate(context);
      }
      
      // Update status
      this.updateStatus(id, { state: 'active' });
      
      emit('plugin:activated', { plugin });
      console.log(`✅ Plugin activated: ${id}`);
      
    } catch (error) {
      this.updateStatus(id, { 
        state: 'error', 
        error: (error as Error).message 
      });
      emit('plugin:error', { plugin, error: error as Error });
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(id: string, context?: PluginContext): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }
    
    const status = this.statuses.get(id)!;
    if (status.state !== 'active') {
      return;
    }
    
    try {
      // Deactivate plugin
      if (plugin.deactivate && context) {
        await plugin.deactivate(context);
      }
      
      // Update status
      this.updateStatus(id, { state: 'inactive' });
      
      emit('plugin:deactivated', { plugin });
      console.log(`⏸️ Plugin deactivated: ${id}`);
      
    } catch (error) {
      this.updateStatus(id, { 
        state: 'error', 
        error: (error as Error).message 
      });
      emit('plugin:error', { plugin, error: error as Error });
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  get(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }

  /**
   * Get plugin status
   */
  getStatus(id: string): PluginStatus {
    return this.statuses.get(id) || {
      state: 'uninitialized',
      lastUpdated: 0
    };
  }

  /**
   * List all plugins
   */
  list(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  /**
   * List plugins by category
   */
  listByCategory(category: PluginCategory): PluginManifest[] {
    return this.list().filter(m => m.category === category);
  }

  /**
   * Get active plugins
   */
  getActive(): Plugin[] {
    return Array.from(this.plugins.entries())
      .filter(([id]) => this.getStatus(id).state === 'active')
      .map(([_, plugin]) => plugin);
  }

  /**
   * Configure plugin
   */
  async configure(id: string, config: Record<string, any>): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Plugin ${id} not found`);
    }
    
    // Merge with existing config
    const currentConfig = this.configs.get(id) || {};
    const newConfig = { ...currentConfig, ...config };
    this.configs.set(id, newConfig);
    
    // Apply configuration
    if (plugin.configure) {
      await plugin.configure(newConfig);
    }
    
    emit('plugin:config-changed', { plugin, config: newConfig });
  }

  /**
   * Get plugin configuration
   */
  getConfig(id: string): Record<string, any> {
    return this.configs.get(id) || {};
  }

  // Private methods

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest must have an id');
    }
    
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
    
    if (!manifest.category) {
      throw new Error('Plugin manifest must have a category');
    }
  }

  private async checkDependencies(id: string): Promise<void> {
    const deps = this.dependencies.get(id);
    if (!deps) return;
    
    for (const depId of deps) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Plugin ${id} requires ${depId} but it is not registered`);
      }
      
      const depStatus = this.getStatus(depId);
      if (depStatus.state === 'uninitialized' || depStatus.state === 'error') {
        throw new Error(`Plugin ${id} requires ${depId} but it is not initialized`);
      }
    }
  }

  private updateStatus(id: string, updates: Partial<PluginStatus>): void {
    const current = this.statuses.get(id)!;
    this.statuses.set(id, {
      ...current,
      ...updates,
      lastUpdated: Date.now()
    });
  }
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry();