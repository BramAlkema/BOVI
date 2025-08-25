/**
 * BOVI Event Bus Tests
 */

import { Bus, EventBus } from '../bus.js';

describe('BOVI Event Bus', () => {
  let bus: EventBus;

  beforeEach(() => {
    // Create fresh bus instance for each test
    bus = new EventBus();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('event emission and listening', () => {
    it('emits and receives typed events', () => {
      const handler = jest.fn();
      
      bus.on('ui.toast', handler);
      bus.emit('ui.toast', { kind: 'info', msg: 'test message' });
      
      expect(handler).toHaveBeenCalledWith({ kind: 'info', msg: 'test message' });
    });

    it('supports multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      bus.on('ui.toast', handler1);
      bus.on('ui.toast', handler2);
      bus.emit('ui.toast', { kind: 'success', msg: 'test' });
      
      expect(handler1).toHaveBeenCalledWith({ kind: 'success', msg: 'test' });
      expect(handler2).toHaveBeenCalledWith({ kind: 'success', msg: 'test' });
    });

    it('does not call handlers for different events', () => {
      const handler = jest.fn();
      
      bus.on('ui.toast', handler);
      bus.emit('profile.changed', { profile: 'L2' });
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('handles immediate mode events', () => {
      const handler = jest.fn();
      
      bus.on('I.default.started', handler);
      bus.emit('I.default.started', { flow: 'test', node: 'node1', seconds: 30 });
      
      expect(handler).toHaveBeenCalledWith({ flow: 'test', node: 'node1', seconds: 30 });
    });

    it('handles balanced mode events', () => {
      const handler = jest.fn();
      
      bus.on('B.sweep.applied', handler);
      bus.emit('B.sweep.applied', { potId: 'pot1', add: 100 });
      
      expect(handler).toHaveBeenCalledWith({ potId: 'pot1', add: 100 });
    });
  });

  describe('event handler management', () => {
    it('returns unsubscribe function', () => {
      const handler = jest.fn();
      
      const unsubscribe = bus.on('ui.toast', handler);
      bus.emit('ui.toast', { kind: 'info', msg: 'first' });
      
      expect(handler).toHaveBeenCalledWith({ kind: 'info', msg: 'first' });
      
      // Unsubscribe and test handler is no longer called
      unsubscribe();
      bus.emit('ui.toast', { kind: 'info', msg: 'second' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('allows multiple subscriptions and unsubscribes', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const unsubscribe1 = bus.on('ui.toast', handler1);
      const unsubscribe2 = bus.on('ui.toast', handler2);
      
      bus.emit('ui.toast', { kind: 'info', msg: 'test' });
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      
      unsubscribe1();
      bus.emit('ui.toast', { kind: 'info', msg: 'test2' });
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(2);
    });
  });

  describe('type safety', () => {
    it('enforces correct event types', () => {
      const handler = jest.fn();
      
      bus.on('profile.changed', handler);
      bus.emit('profile.changed', { profile: 'L1' });
      
      expect(handler).toHaveBeenCalledWith({ profile: 'L1' });
    });

    it('handles all defined event types', () => {
      const handlers = {
        'I.default.started': jest.fn(),
        'I.default.ticked': jest.fn(),
        'I.default.cancelled': jest.fn(),
        'I.default.applied': jest.fn(),
        'B.sweep.applied': jest.fn(),
        'B.pot.breached': jest.fn(),
        'ui.toast': jest.fn(),
        'profile.changed': jest.fn()
      };

      // Subscribe to all events
      Object.entries(handlers).forEach(([event, handler]) => {
        bus.on(event as any, handler);
      });

      // Emit all events with proper payloads
      bus.emit('I.default.started', { flow: 'test', node: 'node1', seconds: 30 });
      bus.emit('I.default.ticked', { flow: 'test', node: 'node1', secondsLeft: 25 });
      bus.emit('I.default.cancelled', { flow: 'test', node: 'node1' });
      bus.emit('I.default.applied', { flow: 'test', node: 'node1' });
      bus.emit('B.sweep.applied', { potId: 'pot1', add: 100 });
      bus.emit('B.pot.breached', { potId: 'pot1', kind: 'max' });
      bus.emit('ui.toast', { kind: 'success', msg: 'test' });
      bus.emit('profile.changed', { profile: 'L2' });

      // Verify all handlers were called
      Object.values(handlers).forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('global bus instance', () => {
    it('provides a singleton Bus instance', () => {
      const handler = jest.fn();
      
      Bus.on('ui.toast', handler);
      Bus.emit('ui.toast', { kind: 'info', msg: 'global test' });
      
      expect(handler).toHaveBeenCalledWith({ kind: 'info', msg: 'global test' });
    });
  });
});