/**
 * BOVI Timer Manager
 * Vanilla JavaScript timer system for Flow DSL timeouts
 */

import { Bus, emit } from './bus.js';

export interface TimerConfig {
  flow: string;
  node: string;
  timeout_s: number;
  action: string;
  mode: 'V' | 'I' | 'B' | 'O';
}

export interface ActiveTimer {
  id: string;
  config: TimerConfig;
  startTime: number;
  timeoutHandle: number;
  intervalHandle?: number;
  cancelled: boolean;
}

class TimerManager {
  private timers = new Map<string, ActiveTimer>();
  private idCounter = 0;

  start(config: TimerConfig): string {
    const id = `${config.flow}-${config.node}-${++this.idCounter}`;
    const startTime = Date.now();
    
    // Emit timer started event
    emit(`${config.mode}.default.started` as keyof import('./bus.js').BoviEventMap, {
      flow: config.flow,
      node: config.node,
      timeout_s: config.timeout_s,
      action: config.action
    });

    // Set up timeout for default action
    const timeoutHandle = window.setTimeout(() => {
      this.executeDefaultAction(id);
    }, config.timeout_s * 1000);

    // Set up countdown ticker (every second)
    const intervalHandle = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, config.timeout_s - elapsed);
      
      emit('ui.countdown.tick', {
        flow: config.flow,
        node: config.node,
        remaining: Math.ceil(remaining)
      });
      
      // Stop ticking when we reach zero
      if (remaining <= 0) {
        const timer = this.timers.get(id);
        if (timer?.intervalHandle) {
          clearInterval(timer.intervalHandle);
        }
      }
    }, 1000);

    const timer: ActiveTimer = {
      id,
      config,
      startTime,
      timeoutHandle,
      intervalHandle,
      cancelled: false
    };

    this.timers.set(id, timer);
    return id;
  }

  cancel(timerId: string, reason: string = 'user_action'): boolean {
    const timer = this.timers.get(timerId);
    if (!timer || timer.cancelled) {
      return false;
    }

    // Clear timeout and interval
    clearTimeout(timer.timeoutHandle);
    if (timer.intervalHandle) {
      clearInterval(timer.intervalHandle);
    }

    // Mark as cancelled
    timer.cancelled = true;

    // Emit cancellation event
    emit(`${timer.config.mode}.default.cancelled` as keyof import('./bus.js').BoviEventMap, {
      flow: timer.config.flow,
      node: timer.config.node,
      reason
    });

    return true;
  }

  private executeDefaultAction(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer || timer.cancelled) {
      return;
    }

    // Clear the interval ticker
    if (timer.intervalHandle) {
      clearInterval(timer.intervalHandle);
    }

    // Execute the default action based on the action string
    const result = this.performAction(timer.config.action, timer.config);

    // Emit completion event
    emit(`${timer.config.mode}.default.applied` as keyof import('./bus.js').BoviEventMap, {
      flow: timer.config.flow,
      node: timer.config.node,
      action: timer.config.action,
      result
    });

    // Clean up
    this.timers.delete(timerId);
  }

  private performAction(action: string, config: TimerConfig): any {
    // Parse and execute the action
    // This is where Flow DSL actions get translated to actual operations
    
    switch (action) {
      case 'I.Fallback.high':
        return this.executeImmediateFallback('high', config);
        
      case 'I.Fallback.usual':
        return this.executeImmediateFallback('usual', config);
        
      case 'B.Fallback.fair':
        return this.executeBalancedFallback(config);
        
      case 'O.Fallback.comply':
        return this.executeObligatedFallback(config);
        
      default:
        console.warn(`Unknown action: ${action}`);
        return { action, status: 'unknown' };
    }
  }

  private executeImmediateFallback(level: 'high' | 'usual', config: TimerConfig): any {
    // Immediate mode: choose best items based on level
    return {
      mode: 'immediate',
      level,
      message: `Selected ${level} quality items for immediate consumption`,
      timestamp: Date.now()
    };
  }

  private executeBalancedFallback(config: TimerConfig): any {
    // Balanced mode: calculate fair distribution
    return {
      mode: 'balanced',
      message: 'Applied fair counter-offer calculation',
      calculation: 'based on market rates and personal circumstances',
      timestamp: Date.now()
    };
  }

  private executeObligatedFallback(config: TimerConfig): any {
    // Obligated mode: follow authority/group decision
    return {
      mode: 'obligated',
      message: 'Complied with group/authority recommendation',
      authority: 'collective decision',
      timestamp: Date.now()
    };
  }

  getActiveTimers(): ActiveTimer[] {
    return Array.from(this.timers.values()).filter(t => !t.cancelled);
  }

  getRemainingTime(timerId: string): number {
    const timer = this.timers.get(timerId);
    if (!timer || timer.cancelled) {
      return 0;
    }

    const elapsed = (Date.now() - timer.startTime) / 1000;
    return Math.max(0, timer.config.timeout_s - elapsed);
  }

  // Cleanup method for when timers are no longer needed
  cleanup(): void {
    this.timers.forEach((timer) => {
      this.cancel(timer.id, 'cleanup');
    });
    this.timers.clear();
  }
}

// Global timer manager instance
export const Timer = new TimerManager();

// Convenience functions
export const startTimer = (config: TimerConfig): string => Timer.start(config);
export const cancelTimer = (timerId: string, reason?: string): boolean => Timer.cancel(timerId, reason);
export const getRemainingTime = (timerId: string): number => Timer.getRemainingTime(timerId);
export const getActiveTimers = (): ActiveTimer[] => Timer.getActiveTimers();