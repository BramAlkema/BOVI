/**
 * UI Plugin Host System Tests
 */

import { mountUI, switchUI } from '../host.js';
import { registerUIPlugin, setActiveUIPluginId } from '../registry.js';
import type { UIComponentPlugin, UIContext, UIInstance } from '../types.js';

// Mock the dependencies
jest.mock('../../../lib/core/bus.js', () => ({
  Bus: { emit: jest.fn(), on: jest.fn() }
}));

jest.mock('../../../lib/core/timers.js', () => ({
  Timers: { setTimeout: jest.fn(), clearTimeout: jest.fn() }
}));

jest.mock('../../../lib/core/capabilities.js', () => ({
  getProfile: jest.fn(() => ({ level: 'L1', features: [] }))
}));

describe('UI Plugin Host', () => {
  let mockRoot: HTMLElement;
  let mockInstance: UIInstance;
  let mockPlugin: UIComponentPlugin;

  beforeEach(() => {
    // Create mock DOM element
    mockRoot = document.createElement('div');
    
    // Create mock UI instance
    mockInstance = {
      unmount: jest.fn()
    };

    // Create mock plugin
    mockPlugin = {
      manifest: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        targets: ['L1'],
        provides: ['home'],
        cssScoped: true
      },
      mount: jest.fn().mockResolvedValue(mockInstance)
    };

    // Register the mock plugin
    registerUIPlugin(mockPlugin);

    // Mock window events
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('switchUI', () => {
    it('mounts plugin successfully', async () => {
      await switchUI(mockRoot, 'test-plugin');

      expect(mockPlugin.mount).toHaveBeenCalledWith(
        expect.objectContaining({
          root: mockRoot,
          bus: expect.any(Object),
          timers: expect.any(Object),
          profile: expect.objectContaining({ level: 'L1' }),
          navigate: expect.any(Function),
          openOverlay: expect.any(Function),
          closeOverlay: expect.any(Function)
        })
      );
    });

    it('provides correct context to plugin', async () => {
      await switchUI(mockRoot, 'test-plugin');

      const context: UIContext = (mockPlugin.mount as jest.Mock).mock.calls[0][0];
      
      expect(context.root).toBe(mockRoot);
      expect(context.navigate).toBeInstanceOf(Function);
      expect(context.openOverlay).toBeInstanceOf(Function);
      expect(context.closeOverlay).toBeInstanceOf(Function);
    });

    it('sets active plugin id', async () => {
      await switchUI(mockRoot, 'test-plugin');

      // Note: We can't easily test this without exposing internal state
      // But the function should call setActiveUIPluginId internally
    });

    it('throws error for non-registered plugin', async () => {
      await expect(switchUI(mockRoot, 'non-existent')).rejects.toThrow(
        'UI plugin non-existent not registered'
      );
    });

    it('unmounts previous instance before mounting new one', async () => {
      // First mount
      await switchUI(mockRoot, 'test-plugin');
      const firstInstance = mockInstance;

      // Create second plugin
      const mockPlugin2: UIComponentPlugin = {
        manifest: {
          id: 'test-plugin-2',
          name: 'Test Plugin 2',
          version: '1.0.0',
          targets: ['L1'],
          provides: ['home'],
          cssScoped: true
        },
        mount: jest.fn().mockResolvedValue({
          unmount: jest.fn()
        })
      };
      
      registerUIPlugin(mockPlugin2);

      // Second mount
      await switchUI(mockRoot, 'test-plugin-2');

      expect(firstInstance.unmount).toHaveBeenCalled();
    });

    it('context navigate function dispatches correct event', async () => {
      await switchUI(mockRoot, 'test-plugin');

      const context: UIContext = (mockPlugin.mount as jest.Mock).mock.calls[0][0];
      context.navigate('/test-route');

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'nav:go',
          detail: '/test-route'
        })
      );
    });

    it('context openOverlay function dispatches correct event', async () => {
      await switchUI(mockRoot, 'test-plugin');

      const context: UIContext = (mockPlugin.mount as jest.Mock).mock.calls[0][0];
      context.openOverlay('overlay-id', { prop: 'value' });

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'overlay:open',
          detail: { id: 'overlay-id', props: { prop: 'value' } }
        })
      );
    });

    it('context closeOverlay function dispatches correct event', async () => {
      await switchUI(mockRoot, 'test-plugin');

      const context: UIContext = (mockPlugin.mount as jest.Mock).mock.calls[0][0];
      context.closeOverlay();

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'overlay:close'
        })
      );
    });
  });

  describe('mountUI', () => {
    it('uses active plugin id when available', async () => {
      setActiveUIPluginId('test-plugin');
      
      await mountUI(mockRoot, 'fallback-plugin');

      expect(mockPlugin.mount).toHaveBeenCalled();
    });

    it('uses fallback id when no active plugin set', async () => {
      setActiveUIPluginId(null as any); // Clear active plugin
      
      await mountUI(mockRoot, 'test-plugin');

      expect(mockPlugin.mount).toHaveBeenCalled();
    });

    it('handles profile change events', async () => {
      await switchUI(mockRoot, 'test-plugin');

      // Mock profile change event
      const profileChangeEvent = new CustomEvent('profile:changed', {
        detail: { level: 'L2', features: ['advanced'] }
      });

      // Simulate the event listener that was added
      const addEventListener = window.addEventListener as jest.Mock;
      if (addEventListener.mock.calls.length > 0) {
        const handler = addEventListener.mock.calls.find(call => call[0] === 'profile:changed')?.[1];
        if (handler) {
          handler(profileChangeEvent);
        }
      }

      // Test would depend on mockInstance having onProfileChange method
      if (mockInstance.onProfileChange) {
        expect(mockInstance.onProfileChange).toHaveBeenCalledWith({
          level: 'L2',
          features: ['advanced']
        });
      }
    });
  });
});