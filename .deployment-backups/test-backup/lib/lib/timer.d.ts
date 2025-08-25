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
declare class TimerManager {
    private timers;
    private idCounter;
    start(config: TimerConfig): string;
    cancel(timerId: string, reason?: string): boolean;
    private executeDefaultAction;
    private performAction;
    private executeImmediateFallback;
    private executeBalancedFallback;
    private executeObligatedFallback;
    getActiveTimers(): ActiveTimer[];
    getRemainingTime(timerId: string): number;
    cleanup(): void;
}
export declare const Timer: TimerManager;
export declare const startTimer: (config: TimerConfig) => string;
export declare const cancelTimer: (timerId: string, reason?: string) => boolean;
export declare const getRemainingTime: (timerId: string) => number;
export declare const getActiveTimers: () => ActiveTimer[];
export {};
//# sourceMappingURL=timer.d.ts.map