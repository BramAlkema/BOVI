export declare class PerformanceCollector {
    private startTimes;
    private metrics;
    startMeasurement(operationName: string): void;
    endMeasurement(operationName: string, kpiName: string): void;
    recordMetric(kpiName: string, value: number): void;
    private calculateTrend;
    startSystemMonitoring(): void;
    private monitorFetchRequests;
    private monitorRulerSwitching;
    private collectSystemMetrics;
    clearMetrics(): void;
}
export declare const performanceCollector: PerformanceCollector;
//# sourceMappingURL=performance-collector.d.ts.map