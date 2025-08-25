import { emit } from './bus.js';
class TimerManager {
    constructor() {
        this.timers = new Map();
        this.idCounter = 0;
    }
    start(config) {
        const id = `${config.flow}-${config.node}-${++this.idCounter}`;
        const startTime = Date.now();
        emit(`${config.mode}.default.started`, {
            flow: config.flow,
            node: config.node,
            timeout_s: config.timeout_s,
            action: config.action
        });
        const timeoutHandle = window.setTimeout(() => {
            this.executeDefaultAction(id);
        }, config.timeout_s * 1000);
        const intervalHandle = window.setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, config.timeout_s - elapsed);
            emit('ui.countdown.tick', {
                flow: config.flow,
                node: config.node,
                remaining: Math.ceil(remaining)
            });
            if (remaining <= 0) {
                const timer = this.timers.get(id);
                if (timer?.intervalHandle) {
                    clearInterval(timer.intervalHandle);
                }
            }
        }, 1000);
        const timer = {
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
    cancel(timerId, reason = 'user_action') {
        const timer = this.timers.get(timerId);
        if (!timer || timer.cancelled) {
            return false;
        }
        clearTimeout(timer.timeoutHandle);
        if (timer.intervalHandle) {
            clearInterval(timer.intervalHandle);
        }
        timer.cancelled = true;
        emit(`${timer.config.mode}.default.cancelled`, {
            flow: timer.config.flow,
            node: timer.config.node,
            reason
        });
        return true;
    }
    executeDefaultAction(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || timer.cancelled) {
            return;
        }
        if (timer.intervalHandle) {
            clearInterval(timer.intervalHandle);
        }
        const result = this.performAction(timer.config.action, timer.config);
        emit(`${timer.config.mode}.default.applied`, {
            flow: timer.config.flow,
            node: timer.config.node,
            action: timer.config.action,
            result
        });
        this.timers.delete(timerId);
    }
    performAction(action, config) {
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
    executeImmediateFallback(level, config) {
        return {
            mode: 'immediate',
            level,
            message: `Selected ${level} quality items for immediate consumption`,
            timestamp: Date.now()
        };
    }
    executeBalancedFallback(config) {
        return {
            mode: 'balanced',
            message: 'Applied fair counter-offer calculation',
            calculation: 'based on market rates and personal circumstances',
            timestamp: Date.now()
        };
    }
    executeObligatedFallback(config) {
        return {
            mode: 'obligated',
            message: 'Complied with group/authority recommendation',
            authority: 'collective decision',
            timestamp: Date.now()
        };
    }
    getActiveTimers() {
        return Array.from(this.timers.values()).filter(t => !t.cancelled);
    }
    getRemainingTime(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || timer.cancelled) {
            return 0;
        }
        const elapsed = (Date.now() - timer.startTime) / 1000;
        return Math.max(0, timer.config.timeout_s - elapsed);
    }
    cleanup() {
        this.timers.forEach((timer) => {
            this.cancel(timer.id, 'cleanup');
        });
        this.timers.clear();
    }
}
export const Timer = new TimerManager();
export const startTimer = (config) => Timer.start(config);
export const cancelTimer = (timerId, reason) => Timer.cancel(timerId, reason);
export const getRemainingTime = (timerId) => Timer.getRemainingTime(timerId);
export const getActiveTimers = () => Timer.getActiveTimers();
//# sourceMappingURL=timer.js.map