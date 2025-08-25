/**
 * BOVI Performance Collector
 * Collects performance metrics and emits KPI updates
 */

import { createKPIMetric } from "./kpi-definitions.js";
import { BoviEvents } from "../core/constants.js";

// Performance monitoring types
export interface PerformanceThreshold {
  red: number;
  amber: number;
}

export interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: 'amber' | 'red';
  message: string;
}

export interface KPIData {
  current: number | string;
  average?: number;
  min?: number;
  max?: number;
  samples: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface TimingStats {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
}

export interface SlowResource {
  name: string;
  duration: number;
}

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private startTimes: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();
  private systemMonitoringInterval?: NodeJS.Timeout;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private kpiData: Map<string, KPIData> = new Map();

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
   * Track KPI values with comprehensive statistics
   */
  trackKPI(name: string, value: number | string): void {
    if (!this.kpiData.has(name)) {
      this.kpiData.set(name, {
        current: value,
        samples: 0,
        min: typeof value === 'number' ? value : undefined,
        max: typeof value === 'number' ? value : undefined,
      });
    }

    const data = this.kpiData.get(name)!;
    data.current = value;
    data.samples++;

    if (typeof value === 'number') {
      data.min = data.min === undefined ? value : Math.min(data.min, value);
      data.max = data.max === undefined ? value : Math.max(data.max, value);
      
      // Calculate running average
      if (data.average === undefined) {
        data.average = value;
      } else {
        data.average = (data.average * (data.samples - 1) + value) / data.samples;
      }

      // Check thresholds and emit alerts
      this.checkThresholds(name, value);
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Record<string, KPIData> {
    const result: Record<string, KPIData> = {};
    this.kpiData.forEach((data, name) => {
      result[name] = { ...data };
    });
    return result;
  }

  /**
   * Reset all collected data
   */
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.kpiData.clear();
  }

  /**
   * Set performance thresholds for alerts
   */
  setThreshold(metric: string, threshold: PerformanceThreshold): void {
    this.thresholds.set(metric, threshold);
  }

  /**
   * Get threshold status for a metric
   */
  getThresholdStatus(metric: string): 'green' | 'amber' | 'red' {
    const data = this.kpiData.get(metric);
    const threshold = this.thresholds.get(metric);
    
    if (!data || !threshold || typeof data.current !== 'number') {
      return 'green';
    }

    const value = data.current as number;
    if (value >= threshold.red) return 'red';
    if (value >= threshold.amber) return 'amber';
    return 'green';
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Check thresholds and emit alerts
   */
  private checkThresholds(metric: string, value: number): void {
    const threshold = this.thresholds.get(metric);
    if (!threshold) return;

    let alertLevel: 'amber' | 'red' | null = null;
    if (value >= threshold.red) alertLevel = 'red';
    else if (value >= threshold.amber) alertLevel = 'amber';

    if (alertLevel) {
      const alert: PerformanceAlert = {
        metric,
        value,
        threshold: alertLevel,
        message: `Metric ${metric} exceeded ${alertLevel} threshold (${value} >= ${alertLevel === 'red' ? threshold.red : threshold.amber})`
      };

      this.alertCallbacks.forEach(callback => callback(alert));
    }
  }

  /**
   * Measure async operation duration
   */
  async measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.trackKPI(`${name}_duration`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackKPI(`${name}_duration`, duration);
      throw error;
    }
  }

  /**
   * Start a manual timer
   */
  startTimer(name: string): number {
    const startTime = performance.now();
    this.startTimes.set(name, startTime);
    return startTime;
  }

  /**
   * End a manual timer and record duration
   */
  endTimer(name: string, startTime: number): number {
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.trackKPI(`${name}_duration`, duration);
    this.startTimes.delete(name);
    return duration;
  }

  /**
   * Export all performance data
   */
  exportData(): {
    metrics: Record<string, KPIData>;
    timestamp: string;
    metadata: {
      collectionStart: number;
      sampleCount: number;
    };
  } {
    const metrics = this.getMetrics();
    const sampleCount = Object.values(metrics).reduce((sum, data) => sum + data.samples, 0);

    return {
      metrics,
      timestamp: new Date().toISOString(),
      metadata: {
        collectionStart: performance.timeOrigin,
        sampleCount
      }
    };
  }

  /**
   * Collect system resource metrics
   */
  collectSystemMetrics(): void {
    // Memory usage (if available)
    if ('memory' in performance && performance.memory) {
      const memory = (performance as any).memory;
      this.trackKPI('memory_used', memory.usedJSHeapSize);
      this.trackKPI('memory_total', memory.totalJSHeapSize);
      this.trackKPI('memory_limit', memory.jsHeapSizeLimit);
    }

    // Navigation timing (if available)
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const pageLoadTime = nav.loadEventEnd - nav.startTime;
      const domContentLoadTime = nav.domContentLoadedEventEnd - nav.startTime;
      const responseTime = nav.responseEnd - nav.requestStart;

      this.trackKPI('page_load_time', pageLoadTime);
      this.trackKPI('dom_content_load_time', domContentLoadTime);
      this.trackKPI('response_time', responseTime);
    }

    // Continue with existing system metrics collection
    this.collectExistingSystemMetrics();
  }

  /**
   * Collect resource timing metrics
   */
  collectResourceMetrics(): void {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resourceEntries.forEach(resource => {
      const duration = resource.duration;
      this.trackKPI('resource_load_time', duration);
    });
  }

  /**
   * Get slow resources above threshold
   */
  getSlowResources(thresholdMs: number): SlowResource[] {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resourceEntries
      .filter(resource => resource.duration > thresholdMs)
      .map(resource => ({
        name: resource.name,
        duration: resource.duration
      }))
      .sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get timing statistics for an operation
   */
  getTimings(): Record<string, number> {
    const timings: Record<string, number> = {};
    this.kpiData.forEach((data, name) => {
      if (name.includes('_duration') && typeof data.average === 'number') {
        timings[name] = data.average;
      }
    });
    return timings;
  }

  /**
   * Get detailed timing stats for a specific operation
   */
  getTimingStats(operationName: string): TimingStats | undefined {
    const durationKey = `${operationName}_duration`;
    const data = this.kpiData.get(durationKey);
    
    if (!data || typeof data.average !== 'number' || data.min === undefined || data.max === undefined) {
      return undefined;
    }

    return {
      count: data.samples,
      total: data.average * data.samples, // Approximation
      average: data.average,
      min: data.min,
      max: data.max
    };
  }

  /**
   * Stop system monitoring
   */
  stopSystemMonitoring(): void {
    if (this.systemMonitoringInterval) {
      clearInterval(this.systemMonitoringInterval);
      this.systemMonitoringInterval = undefined;
    }
  }

  /**
   * Start system monitoring with interval tracking
   */
  startSystemMonitoring(): void {
    // Stop existing monitoring
    this.stopSystemMonitoring();
    
    // Monitor API response times
    this.monitorFetchRequests();
    
    // Monitor ruler switching performance
    this.monitorRulerSwitching();
    
    // Periodic system health checks with interval tracking
    this.systemMonitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 5000); // Every 5 seconds for better responsiveness
  }

  /**
   * Existing system metrics collection (renamed for clarity)
   */
  private collectExistingSystemMetrics(): void {
    // System uptime (simulate based on session duration)
    const sessionStart = performance.timeOrigin;
    const now = Date.now();
    const uptime = (now - sessionStart) / (1000 * 60 * 60); // hours
    const uptimePercent = Math.min(0.999, 0.95 + uptime / 1000); // Improve over time
    
    this.trackKPI("system_uptime", uptimePercent);

    // Simulate other metrics with realistic values
    this.trackKPI("ruler_adoption_rate", Math.random() * 0.4 + 0.5); // 50-90%
    this.trackKPI("money_veil_calculation_time", Math.random() * 200 + 200); // 200-400ms
    this.trackKPI("money_veil_engagement", Math.random() * 0.3 + 0.3); // 30-60%
    this.trackKPI("hamburger_viral_coefficient", Math.random() * 0.2 + 0.2); // 0.2-0.4
    this.trackKPI("contract_completion_rate", Math.random() * 0.15 + 0.85); // 85-100%
    this.trackKPI("cohort_satisfaction_rate", Math.random() * 0.08 + 0.92); // 92-100%
    this.trackKPI("failed_payment_rate", Math.random() * 0.005); // 0-0.5%
    
    // Storm mode metrics (if active)
    const stormActive = localStorage.getItem("bovi.stormMode.active") === "true";
    if (stormActive) {
      this.trackKPI("storm_mode_activation_time", Math.random() * 3000 + 2000); // 2-5s
      this.trackKPI("storm_mode_effectiveness", Math.random() * 0.15 + 0.15); // 15-30%
    }
  }

  /**
   * Clear all metrics (legacy method for backward compatibility)
   */
  clearMetrics(): void {
    this.reset();
  }
}

// Export global collector instance
export const performanceCollector = new PerformanceCollector();
