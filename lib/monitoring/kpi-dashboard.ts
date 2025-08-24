/**
 * BOVI KPI Dashboard
 * Dashboard for monitoring and displaying system health metrics
 */

import { Bus } from "../bus.js";
import { KPIMetric } from "../api-types.js";

/**
 * KPI Dashboard for monitoring system health and displaying metrics
 */
export class KPIDashboard {
  private metrics: Map<string, KPIMetric> = new Map();

  constructor() {
    // Listen for KPI updates
    Bus.on("ui.kpi.updated", event => {
      if (typeof event.detail.value === "object" && "name" in event.detail.value) {
        this.metrics.set(event.detail.kpi, event.detail.value as KPIMetric);
      }
    });
  }

  /**
   * Get all current KPI metrics
   */
  getMetrics(): KPIMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific KPI metric
   */
  getMetric(name: string): KPIMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get metrics by status
   */
  getMetricsByStatus(status: "green" | "amber" | "red"): KPIMetric[] {
    return this.getMetrics().filter(m => m.status === status);
  }

  /**
   * Get overall system health score (0-1)
   */
  getHealthScore(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 1;

    const weights = { green: 1, amber: 0.5, red: 0 };
    const totalWeight = metrics.reduce((sum, m) => sum + weights[m.status], 0);

    return totalWeight / metrics.length;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): "healthy" | "degraded" | "unhealthy" {
    const score = this.getHealthScore();

    if (score >= 0.9) return "healthy";
    else if (score >= 0.7) return "degraded";
    else return "unhealthy";
  }

  /**
   * Get health summary with issues
   */
  getHealthSummary(): {
    status: "healthy" | "degraded" | "unhealthy";
    score: number;
    issues: string[];
    greenCount: number;
    amberCount: number;
    redCount: number;
    } {
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

  /**
   * Clear all metrics (useful for testing or reset)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Export metrics data for external use
   */
  exportMetrics(): Record<string, KPIMetric> {
    const result: Record<string, KPIMetric> = {};
    this.metrics.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }
}

/**
 * Quick system health check function
 */
export async function systemHealthCheck(dashboard: KPIDashboard): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  score: number;
  issues: string[];
}> {
  const summary = dashboard.getHealthSummary();
  return {
    status: summary.status,
    score: summary.score,
    issues: summary.issues,
  };
}

// Export global dashboard instance
export const dashboard = new KPIDashboard();
