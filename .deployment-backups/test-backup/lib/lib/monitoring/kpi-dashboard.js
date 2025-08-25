import { Bus } from "../bus.js";
import { BoviEvents } from "../core/constants.js";
export class KPIDashboard {
    constructor() {
        this.metrics = new Map();
        Bus.on(BoviEvents.KPI_UPDATED, event => {
            if (typeof event.detail.value === "object" && "name" in event.detail.value) {
                this.metrics.set(event.detail.kpi, event.detail.value);
            }
        });
    }
    getMetrics() {
        return Array.from(this.metrics.values());
    }
    getMetric(name) {
        return this.metrics.get(name);
    }
    getMetricsByStatus(status) {
        return this.getMetrics().filter(m => m.status === status);
    }
    getHealthScore() {
        const metrics = this.getMetrics();
        if (metrics.length === 0)
            return 1;
        const weights = { green: 1, amber: 0.5, red: 0 };
        const totalWeight = metrics.reduce((sum, m) => sum + weights[m.status], 0);
        return totalWeight / metrics.length;
    }
    getHealthStatus() {
        const score = this.getHealthScore();
        if (score >= 0.9)
            return "healthy";
        else if (score >= 0.7)
            return "degraded";
        else
            return "unhealthy";
    }
    getHealthSummary() {
        const score = this.getHealthScore();
        const status = this.getHealthStatus();
        const redMetrics = this.getMetricsByStatus("red");
        const amberMetrics = this.getMetricsByStatus("amber");
        const greenMetrics = this.getMetricsByStatus("green");
        const issues = [
            ...redMetrics.map(m => `Critical: ${m.name} (${(m.value * 100).toFixed(1)}%)`),
            ...amberMetrics.map(m => `Warning: ${m.name} (${(m.value * 100).toFixed(1)}%)`),
        ];
        return {
            status,
            score,
            issues,
            greenCount: greenMetrics.length,
            amberCount: amberMetrics.length,
            redCount: redMetrics.length,
        };
    }
    clearMetrics() {
        this.metrics.clear();
    }
    exportMetrics() {
        const result = {};
        this.metrics.forEach((value, key) => {
            result[key] = { ...value };
        });
        return result;
    }
}
export async function systemHealthCheck(dashboard) {
    const summary = dashboard.getHealthSummary();
    return {
        status: summary.status,
        score: summary.score,
        issues: summary.issues,
    };
}
export const dashboard = new KPIDashboard();
//# sourceMappingURL=kpi-dashboard.js.map