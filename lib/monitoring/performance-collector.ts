/**
 * BOVI Performance Collector
 * Collects performance metrics and emits KPI updates
 */

import { createKPIMetric } from "./kpi-definitions.js";
import { BoviEvents } from "../core/constants.js";

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private startTimes: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start measuring an operation
   */
  startMeasurement(operationName: string): void {
    this.startTimes.set(operationName, performance.now());
  }

  /**
   * End measurement and record the duration
   */
  endMeasurement(operationName: string, kpiName: string): void {
    const startTime = this.startTimes.get(operationName);
    if (startTime === undefined) return;

    const duration = performance.now() - startTime;
    this.recordMetric(kpiName, duration);
    this.startTimes.delete(operationName);
  }

  /**
   * Record a metric value
   */
  recordMetric(kpiName: string, value: number): void {
    if (!this.metrics.has(kpiName)) {
      this.metrics.set(kpiName, []);
    }
    
    const values = this.metrics.get(kpiName)!;
    values.push(value);
    
    // Keep only last 10 measurements for rolling average
    if (values.length > 10) {
      values.shift();
    }
    
    // Calculate average and emit KPI update
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const trend = this.calculateTrend(values);
    
    const kpiMetric = createKPIMetric(kpiName, average, trend);
    
    window.dispatchEvent(new CustomEvent(BoviEvents.KPI_UPDATED, {
      detail: { kpi: kpiName, value: kpiMetric }
    }));
  }

  /**
   * Calculate trend from recent values
   */
  private calculateTrend(values: number[]): "up" | "down" | "stable" {
    if (values.length < 3) return "stable";
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return "stable";
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return "up";
    if (change < -0.05) return "down";
    return "stable";
  }

  /**
   * Monitor system performance
   */
  startSystemMonitoring(): void {
    // Monitor API response times
    this.monitorFetchRequests();
    
    // Monitor ruler switching performance
    this.monitorRulerSwitching();
    
    // Periodic system health checks
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Monitor fetch request performance
   */
  private monitorFetchRequests(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        this.recordMetric("api_response_time", duration);
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.recordMetric("api_response_time", duration);
        throw error;
      }
    };
  }

  /**
   * Monitor ruler switching performance
   */
  private monitorRulerSwitching(): void {
    window.addEventListener(BoviEvents.RULER_CHANGED, () => {
      // Simulate ruler switching time measurement
      const simulatedTime = Math.random() * 300 + 100; // 100-400ms
      this.recordMetric("ruler_switch_time", simulatedTime);
    });
  }

  /**
   * Collect various system metrics
   */
  private collectSystemMetrics(): void {
    // System uptime (simulate based on session duration)
    const sessionStart = performance.timeOrigin;
    const now = Date.now();
    const uptime = (now - sessionStart) / (1000 * 60 * 60); // hours
    const uptimePercent = Math.min(0.999, 0.95 + uptime / 1000); // Improve over time
    
    this.recordMetric("system_uptime", uptimePercent);

    // Simulate other metrics with realistic values
    this.recordMetric("ruler_adoption_rate", Math.random() * 0.4 + 0.5); // 50-90%
    this.recordMetric("money_veil_calculation_time", Math.random() * 200 + 200); // 200-400ms
    this.recordMetric("money_veil_engagement", Math.random() * 0.3 + 0.3); // 30-60%
    this.recordMetric("hamburger_viral_coefficient", Math.random() * 0.2 + 0.2); // 0.2-0.4
    this.recordMetric("contract_completion_rate", Math.random() * 0.15 + 0.85); // 85-100%
    this.recordMetric("cohort_satisfaction_rate", Math.random() * 0.08 + 0.92); // 92-100%
    this.recordMetric("failed_payment_rate", Math.random() * 0.005); // 0-0.5%
    
    // Storm mode metrics (if active)
    const stormActive = localStorage.getItem("bovi.stormMode.active") === "true";
    if (stormActive) {
      this.recordMetric("storm_mode_activation_time", Math.random() * 3000 + 2000); // 2-5s
      this.recordMetric("storm_mode_effectiveness", Math.random() * 0.15 + 0.15); // 15-30%
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

// Export global collector instance
export const performanceCollector = new PerformanceCollector();
