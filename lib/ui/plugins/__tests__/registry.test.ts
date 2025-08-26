/**
 * UI Plugin Registry Tests
 */

import {
  registerUIPlugin,
  getUIPlugin,
  getAllUIPlugins,
  setActiveUIPluginId,
  getActiveUIPluginId,
  __clearRegistryForTesting
} from '../registry.js';
import type { UIComponentPlugin } from '../types.js';

describe('UI Plugin Registry', () => {
  const mockPlugin: UIComponentPlugin = {
    manifest: {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      targets: ['L1'],
      provides: ['home'],
      cssScoped: true
    },
    mount: jest.fn()
  };

  const mockPlugin2: UIComponentPlugin = {
    manifest: {
      id: 'test-plugin-2',
      name: 'Test Plugin 2',
      version: '1.0.0',
      targets: ['L2'],
      provides: ['appShell'],
      cssScoped: false
    },
    mount: jest.fn()
  };

  beforeEach(() => {
    // Clear registry before each test
    __clearRegistryForTesting();
  });

  describe('registerUIPlugin', () => {
    it('registers a plugin successfully', () => {
      registerUIPlugin(mockPlugin);
      
      const retrieved = getUIPlugin('test-plugin');
      expect(retrieved).toBe(mockPlugin);
    });

    it('allows multiple plugins to be registered', () => {
      registerUIPlugin(mockPlugin);
      registerUIPlugin(mockPlugin2);
      
      expect(getUIPlugin('test-plugin')).toBe(mockPlugin);
      expect(getUIPlugin('test-plugin-2')).toBe(mockPlugin2);
    });

    it('overwrites existing plugin with same id', () => {
      const updatedPlugin: UIComponentPlugin = {
        ...mockPlugin,
        manifest: {
          ...mockPlugin.manifest,
          version: '2.0.0'
        }
      };

      registerUIPlugin(mockPlugin);
      registerUIPlugin(updatedPlugin);
      
      const retrieved = getUIPlugin('test-plugin');
      expect(retrieved?.manifest.version).toBe('2.0.0');
    });
  });

  describe('getUIPlugin', () => {
    beforeEach(() => {
      registerUIPlugin(mockPlugin);
    });

    it('retrieves registered plugin', () => {
      const plugin = getUIPlugin('test-plugin');
      expect(plugin).toBe(mockPlugin);
    });

    it('returns null for non-existent plugin', () => {
      const plugin = getUIPlugin('non-existent');
      expect(plugin).toBeNull();
    });
  });

  describe('getAllUIPlugins', () => {
    it('returns empty array when no plugins registered', () => {
      const plugins = getAllUIPlugins();
      expect(plugins).toEqual([]);
    });

    it('returns all registered plugins', () => {
      registerUIPlugin(mockPlugin);
      registerUIPlugin(mockPlugin2);
      
      const plugins = getAllUIPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin);
      expect(plugins).toContain(mockPlugin2);
    });
  });

  describe('active plugin management', () => {
    beforeEach(() => {
      registerUIPlugin(mockPlugin);
      registerUIPlugin(mockPlugin2);
    });

    it('sets and gets active plugin id', () => {
      setActiveUIPluginId('test-plugin');
      expect(getActiveUIPluginId()).toBe('test-plugin');
    });

    it('returns null initially when no active plugin set', () => {
      expect(getActiveUIPluginId()).toBeNull();
    });

    it('allows changing active plugin', () => {
      setActiveUIPluginId('test-plugin');
      setActiveUIPluginId('test-plugin-2');
      
      expect(getActiveUIPluginId()).toBe('test-plugin-2');
    });

    it('allows setting active plugin to non-registered id', () => {
      // This might be intentional to allow setting before registration
      setActiveUIPluginId('future-plugin');
      expect(getActiveUIPluginId()).toBe('future-plugin');
    });
  });
});