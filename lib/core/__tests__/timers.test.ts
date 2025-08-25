/**
 * BOVI Timers System Tests
 */

import { Timers, TimerManager, mountCountdown } from '../timers.js';
import { Bus } from '../bus.js';

describe('BOVI Timers', () => {
  let timerManager: TimerManager;

  beforeEach(() => {
    // Create fresh timer manager for each test
    timerManager = new TimerManager();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  describe('timer start functionality', () => {
    it('starts timer with callback execution', () => {
      const onApply = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      timerManager.start('test-flow', 'test-node', 2, onApply);
      
      // Should emit started event immediately
      expect(busSpy).toHaveBeenCalledWith('I.default.started', {
        flow: 'test-flow',
        node: 'test-node',
        seconds: 2
      });
      
      // Should not have called onApply yet
      expect(onApply).not.toHaveBeenCalled();
      
      // After 1 second, should emit tick
      jest.advanceTimersByTime(1000);
      expect(busSpy).toHaveBeenCalledWith('I.default.ticked', {
        flow: 'test-flow',
        node: 'test-node',
        secondsLeft: 1
      });
      
      // After 2 seconds total, should emit applied and call callback
      jest.advanceTimersByTime(1000);
      expect(busSpy).toHaveBeenCalledWith('I.default.applied', {
        flow: 'test-flow',
        node: 'test-node'
      });
      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('handles zero seconds correctly', () => {
      const onApply = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      timerManager.start('test-flow', 'test-node', 0, onApply);
      
      expect(busSpy).toHaveBeenCalledWith('I.default.started', {
        flow: 'test-flow',
        node: 'test-node',
        seconds: 0
      });
      
      // Should execute immediately
      jest.advanceTimersByTime(0);
      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('cancels existing timer when starting new one with same key', () => {
      const onApply1 = jest.fn();
      const onApply2 = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      // Start first timer
      timerManager.start('test-flow', 'test-node', 3, onApply1);
      
      // Start second timer with same key
      timerManager.start('test-flow', 'test-node', 1, onApply2);
      
      // Should emit cancelled for first timer
      expect(busSpy).toHaveBeenCalledWith('I.default.cancelled', {
        flow: 'test-flow',
        node: 'test-node'
      });
      
      // First callback should never be called
      jest.advanceTimersByTime(3000);
      expect(onApply1).not.toHaveBeenCalled();
      expect(onApply2).toHaveBeenCalledTimes(1);
    });
  });

  describe('timer cancellation', () => {
    it('cancels timer by id', () => {
      const onApply = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      timerManager.start('test-flow', 'test-node', 2, onApply);
      
      // Cancel the timer
      timerManager.cancelById('test-flow', 'test-node');
      
      // Should emit cancelled event
      expect(busSpy).toHaveBeenCalledWith('I.default.cancelled', {
        flow: 'test-flow',
        node: 'test-node'
      });
      
      // Callback should never be called
      jest.advanceTimersByTime(3000);
      expect(onApply).not.toHaveBeenCalled();
    });

    it('handles cancellation of non-existent timer gracefully', () => {
      const busSpy = jest.spyOn(Bus, 'emit');
      
      // Try to cancel non-existent timer
      timerManager.cancelById('non-existent', 'timer');
      
      // Should not emit cancelled event
      expect(busSpy).not.toHaveBeenCalledWith('I.default.cancelled', expect.any(Object));
    });
  });

  describe('global timers instance', () => {
    it('provides singleton Timers instance', () => {
      const onApply = jest.fn();
      
      Timers.start('global-test', 'node', 1, onApply);
      
      jest.advanceTimersByTime(1000);
      
      expect(onApply).toHaveBeenCalledTimes(1);
    });
  });

  describe('mountCountdown helper', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      mockElement.style.display = 'none';
    });

    it('updates element text during countdown', () => {
      const cleanup = mountCountdown(mockElement, 'test-flow', 'test-node');
      
      // Start a timer to trigger the countdown
      const onApply = jest.fn();
      timerManager.start('test-flow', 'test-node', 3, onApply);
      
      expect(mockElement.textContent).toBe('Auto-apply in 3s');
      expect(mockElement.style.display).toBe('block');
      
      // Advance time
      jest.advanceTimersByTime(1000);
      expect(mockElement.textContent).toBe('Auto-apply in 2s');
      
      jest.advanceTimersByTime(1000);
      expect(mockElement.textContent).toBe('Auto-apply in 1s');
      
      // Complete the timer
      jest.advanceTimersByTime(1000);
      expect(mockElement.textContent).toBe('Applied');
      
      cleanup();
    });

    it('handles cancellation display', () => {
      const cleanup = mountCountdown(mockElement, 'test-flow', 'test-node');
      
      // Start and immediately cancel
      const onApply = jest.fn();
      timerManager.start('test-flow', 'test-node', 3, onApply);
      timerManager.cancelById('test-flow', 'test-node');
      
      expect(mockElement.textContent).toBe('Cancelled');
      
      cleanup();
    });

    it('ignores events for different flow/node', () => {
      const cleanup = mountCountdown(mockElement, 'test-flow', 'test-node');
      
      // Start timer for different flow/node
      const onApply = jest.fn();
      timerManager.start('other-flow', 'other-node', 2, onApply);
      
      // Element should not be updated
      expect(mockElement.textContent).toBe('');
      expect(mockElement.style.display).toBe('none');
      
      cleanup();
    });

    it('cleans up event listeners', () => {
      const cleanup = mountCountdown(mockElement, 'test-flow', 'test-node');
      
      // Clean up
      cleanup();
      
      // Start timer after cleanup
      const onApply = jest.fn();
      timerManager.start('test-flow', 'test-node', 2, onApply);
      
      // Element should not be updated
      expect(mockElement.textContent).toBe('');
      expect(mockElement.style.display).toBe('none');
    });
  });

  describe('fractional seconds handling', () => {
    it('floors fractional seconds', () => {
      const onApply = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      timerManager.start('test-flow', 'test-node', 2.7, onApply);
      
      expect(busSpy).toHaveBeenCalledWith('I.default.started', {
        flow: 'test-flow',
        node: 'test-node',
        seconds: 2 // Should be floored
      });
    });

    it('handles negative seconds as zero', () => {
      const onApply = jest.fn();
      const busSpy = jest.spyOn(Bus, 'emit');
      
      timerManager.start('test-flow', 'test-node', -5, onApply);
      
      expect(busSpy).toHaveBeenCalledWith('I.default.started', {
        flow: 'test-flow',
        node: 'test-node',
        seconds: 0
      });
    });
  });
});