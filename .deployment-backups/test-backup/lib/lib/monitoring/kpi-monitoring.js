import { emit } from "../bus.js";
export class KPIMonitoringService {
    constructor(api) {
        this.api = api;
        this.monitoringIntervals = [];
        this.isRunning = false;
    }
    start() {
        if (this.isRunning) {
            console.warn("KPI monitoring already running");
            return;
        }
        this.isRunning = true;
        const complianceInterval = setInterval(async () => {
            try {
                const compliance = await this.api.rules.checkRuleCompliance();
                this.updateKPI("rule_compliance", compliance.compliance, 0.9);
            }
            catch (error) {
                console.warn("Rule compliance monitoring failed:", error);
            }
        }, 60000);
        const fairnessInterval = setInterval(async () => {
            try {
                const report = await this.api.fairness.report();
                this.updateKPI("rail_fairness", report.averageFairness, 0.95);
            }
            catch (error) {
                console.warn("Rail fairness monitoring failed:", error);
            }
        }, 300000);
        const statsInterval = setInterval(async () => {
            try {
                const stats = await this.api.getSystemStats();
                this.updateKPI("appeals_pending", 1 - stats.appealsPending / 100, 0.8);
                this.updateKPI("clearinghouses_active", Math.min(stats.clearinghousesActive / 3, 1), 0.33);
            }
            catch (error) {
                console.warn("System stats monitoring failed:", error);
            }
        }, 600000);
        this.monitoringIntervals = [complianceInterval, fairnessInterval, statsInterval];
        console.log("📊 KPI monitoring service started");
    }
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.monitoringIntervals.forEach(interval => clearInterval(interval));
        this.monitoringIntervals = [];
        this.isRunning = false;
        console.log("📊 KPI monitoring service stopped");
    }
    updateKPI(name, value, threshold) {
        const status = value >= threshold ? "green" : value >= threshold * 0.8 ? "amber" : "red";
        const kpi = {
            name,
            value,
            threshold,
            status,
            trend: "stable",
        };
        emit("ui.kpi.updated", {
            flow: "system",
            kpi: name,
            value: kpi,
        });
    }
    async updateMetric(metricName) {
        switch (metricName) {
            case "rule_compliance": {
                const compliance = await this.api.rules.checkRuleCompliance();
                this.updateKPI("rule_compliance", compliance.compliance, 0.9);
                break;
            }
            case "rail_fairness": {
                const report = await this.api.fairness.report();
                this.updateKPI("rail_fairness", report.averageFairness, 0.95);
                break;
            }
            default:
                console.warn(`Unknown KPI metric: ${metricName}`);
        }
    }
    getStatus() {
        return {
            running: this.isRunning,
            activeIntervals: this.monitoringIntervals.length,
        };
    }
}
//# sourceMappingURL=kpi-monitoring.js.map