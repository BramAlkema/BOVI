export type TimerKey = `${string}:${string}`;
export declare class TimerManager {
    private intervals;
    private timeouts;
    start(flow: string, node: string, seconds: number, onApply: () => void): void;
    cancelById(flow: string, node: string): void;
    private cancel;
    private clear;
}
export declare const Timers: TimerManager;
export declare function mountCountdown(el: HTMLElement, flow: string, node: string): () => void;
//# sourceMappingURL=timers.d.ts.map