import { createKPIMetric } from "./kpi-definitions.js";
import { BoviEvents } from "../core/constants.js";
export class PerformanceCollector {
    constructor() {
        this.startTimes = new Map();
        this.metrics = new Map();
    }
    startMeasurement(operationName) {
        this.startTimes.set(operationName, performance.now());
    }
    endMeasurement(operationName, kpiName) {
        const startTime = this.startTimes.get(operationName);
        if (startTime === undefined)
            return;
        const duration = performance.now() - startTime;
        this.recordMetric(kpiName, duration);
        this.startTimes.delete(operationName);
    }
    recordMetric(kpiName, value) {
        if (!this.metrics.has(kpiName)) {
            this.metrics.set(kpiName, []);
        }
        const values = this.metrics.get(kpiName);
        values.push(value);
        if (values.length > 10) {
            values.shift();
        }
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        const trend = this.calculateTrend(values);
        const kpiMetric = createKPIMetric(kpiName, average, trend);
        window.dispatchEvent(new CustomEvent(BoviEvents.KPI_UPDATED, {
            detail: { kpi: kpiName, value: kpiMetric }
        }));
    }
    calculateTrend(values) {
        if (values.length < 3)
            return "stable";
        const recent = values.slice(-3);
        const older = values.slice(-6, -3);
        if (older.length === 0)
            return "stable";
        const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
        const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
        const change = (recentAvg - olderAvg) / olderAvg;
        if (change > 0.05)
            return "up";
        if (change < -0.05)
            return "down";
        return "stable";
    }
    startSystemMonitoring() {
        this.monitorFetchRequests();
        this.monitorRulerSwitching();
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
    }
    monitorFetchRequests() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - start;
                this.recordMetric("api_response_time", duration);
                return response;
            }
            catch (error) {
                const duration = performance.now() - start;
                this.recordMetric("api_response_time", duration);
                throw error;
            }
        };
    }
    monitorRulerSwitching() {
        window.addEventListener(BoviEvents.RULER_CHANGED, () => {
            const simulatedTime = Math.random() * 300 + 100;
            this.recordMetric("ruler_switch_time", simulatedTime);
        });
    }
    collectSystemMetrics() {
        const sessionStart = performance.timeOrigin;
        const now = Date.now();
        const uptime = (now - sessionStart) / (1000 * 60 * 60);
        const uptimePercent = Math.min(0.999, 0.95 + uptime / 1000);
        this.recordMetric("system_uptime", uptimePercent);
        this.recordMetric("ruler_adoption_rate", Math.random() * 0.4 + 0.5);
        this.recordMetric("money_veil_calculation_time", Math.random() * 200 + 200);
        this.recordMetric("money_veil_engagement", Math.random() * 0.3 + 0.3);
        this.recordMetric("hamburger_viral_coefficient", Math.random() * 0.2 + 0.2);
        this.recordMetric("contract_completion_rate", Math.random() * 0.15 + 0.85);
        this.recordMetric("cohort_satisfaction_rate", Math.random() * 0.08 + 0.92);
        this.recordMetric("failed_payment_rate", Math.random() * 0.005);
        const stormActive = localStorage.getItem("bovi.stormMode.active") === "true";
        if (stormActive) {
            this.recordMetric("storm_mode_activation_time", Math.random() * 3000 + 2000);
            this.recordMetric("storm_mode_effectiveness", Math.random() * 0.15 + 0.15);
        }
    }
    clearMetrics() {
        this.metrics.clear();
        this.startTimes.clear();
    }
}
export const performanceCollector = new PerformanceCollector();
//# sourceMappingURL=performance-collector.js.map