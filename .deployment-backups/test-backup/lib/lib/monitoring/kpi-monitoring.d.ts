import type { BoviAPI } from "../api/facade.js";
export declare class KPIMonitoringService {
    private api;
    private monitoringIntervals;
    private isRunning;
    constructor(api: BoviAPI);
    start(): void;
    stop(): void;
    private updateKPI;
    updateMetric(metricName: string): Promise<void>;
    getStatus(): {
        running: boolean;
        activeIntervals: number;
    };
}
//# sourceMappingURL=kpi-monitoring.d.ts.map