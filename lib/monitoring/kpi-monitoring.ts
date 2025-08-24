/**
 * BOVI KPI Monitoring Service
 * Background monitoring of key performance indicators
 */

import { emit } from "../bus.js";
import { KPIMetric } from "../api-types.js";
import type { BoviAPI } from "../api/facade.js";

/**
 * KPI monitoring service that tracks system health metrics
 */
export class KPIMonitoringService {
  private monitoringIntervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  constructor(private api: BoviAPI) {}

  /**
   * Start KPI monitoring background tasks
   */
  start(): void {
    if (this.isRunning) {
      console.warn("KPI monitoring already running");
      return;
    }

    this.isRunning = true;

    // Monitor rule compliance
    const complianceInterval = setInterval(async () => {
      try {
        const compliance = await this.api.rules.checkRuleCompliance();
        this.updateKPI("rule_compliance", compliance.compliance, 0.9);
      } catch (error) {
        console.warn("Rule compliance monitoring failed:", error);
      }
    }, 60000); // Every minute

    // Monitor rail fairness
    const fairnessInterval = setInterval(async () => {
      try {
        const report = await this.api.fairness.report();
        this.updateKPI("rail_fairness", report.averageFairness, 0.95);
      } catch (error) {
        console.warn("Rail fairness monitoring failed:", error);
      }
    }, 300000); // Every 5 minutes

    // Monitor system stats
    const statsInterval = setInterval(async () => {
      try {
        const stats = await this.api.getSystemStats();
        this.updateKPI("appeals_pending", 1 - stats.appealsPending / 100, 0.8); // Inverse metric
        this.updateKPI("clearinghouses_active", Math.min(stats.clearinghousesActive / 3, 1), 0.33);
      } catch (error) {
        console.warn("System stats monitoring failed:", error);
      }
    }, 600000); // Every 10 minutes

    this.monitoringIntervals = [complianceInterval, fairnessInterval, statsInterval];

    console.log("📊 KPI monitoring service started");
  }

  /**
   * Stop KPI monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals = [];
    this.isRunning = false;

    console.log("📊 KPI monitoring service stopped");
  }

  /**
   * Update KPI metric and emit event
   */
  private updateKPI(name: string, value: number, threshold: number): void {
    const status = value >= threshold ? "green" : value >= threshold * 0.8 ? "amber" : "red";

    const kpi: KPIMetric = {
      name,
      value,
      threshold,
      status,
      trend: "stable", // Would calculate from historical data
    };

    emit("ui.kpi.updated", {
      flow: "system",
      kpi: name,
      value: kpi,
    });
  }

  /**
   * Manually trigger KPI update for specific metric
   */
  async updateMetric(metricName: string): Promise<void> {
    switch (metricName) {
    case "rule_compliance":
      const compliance = await this.api.rules.checkRuleCompliance();
      this.updateKPI("rule_compliance", compliance.compliance, 0.9);
      break;

    case "rail_fairness":
      const report = await this.api.fairness.report();
      this.updateKPI("rail_fairness", report.averageFairness, 0.95);
      break;

    default:
      console.warn(`Unknown KPI metric: ${metricName}`);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): { running: boolean; activeIntervals: number } {
    return {
      running: this.isRunning,
      activeIntervals: this.monitoringIntervals.length,
    };
  }
}
