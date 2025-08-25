import { KPIMetric } from "../api-types.js";
export declare class KPIDashboard {
    private metrics;
    constructor();
    getMetrics(): KPIMetric[];
    getMetric(name: string): KPIMetric | undefined;
    getMetricsByStatus(status: "green" | "amber" | "red"): KPIMetric[];
    getHealthScore(): number;
    getHealthStatus(): "healthy" | "degraded" | "unhealthy";
    getHealthSummary(): {
        status: "healthy" | "degraded" | "unhealthy";
        score: number;
        issues: string[];
        greenCount: number;
        amberCount: number;
        redCount: number;
    };
    clearMetrics(): void;
    exportMetrics(): Record<string, KPIMetric>;
}
export declare function systemHealthCheck(dashboard: KPIDashboard): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    score: number;
    issues: string[];
}>;
export declare const dashboard: KPIDashboard;
//# sourceMappingURL=kpi-dashboard.d.ts.map