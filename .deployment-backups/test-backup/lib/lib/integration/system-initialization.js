import { emit } from "../bus.js";
import { api } from "../api/facade.js";
import { KPIMonitoringService } from "../monitoring/kpi-monitoring.js";
import { dashboard } from "../monitoring/kpi-dashboard.js";
import { initializePluginSystem } from "../plugins/index.js";
import { BoviEvents } from "../core/constants.js";
export class SystemInitializer {
    constructor() {
        this.initialized = false;
        this.kpiMonitoring = new KPIMonitoringService(api);
    }
    async initialize() {
        if (this.initialized) {
            console.warn("BOVI system already initialized");
            return;
        }
        try {
            console.log("🚀 Initializing BOVI system components...");
            await api.initialize();
            this.kpiMonitoring.start();
            await initializePluginSystem();
            emit("ui.ai_butler.toggled", { enabled: true });
            emit(BoviEvents.SYSTEM_INITIALIZED, {
                timestamp: new Date().toISOString(),
                version: "1.0.0",
            });
            this.initialized = true;
            console.log("✅ BOVI system initialization complete");
        }
        catch (error) {
            console.error("❌ Failed to initialize BOVI system:", error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        try {
            console.log("🔄 Shutting down BOVI system...");
            this.kpiMonitoring.stop();
            dashboard.clearMetrics();
            emit(BoviEvents.SYSTEM_SHUTDOWN, { timestamp: new Date().toISOString() });
            this.initialized = false;
            console.log("✅ BOVI system shutdown complete");
        }
        catch (error) {
            console.error("❌ Error during system shutdown:", error);
            throw error;
        }
    }
    getStatus() {
        return {
            initialized: this.initialized,
            apiReady: this.initialized,
            monitoringActive: this.kpiMonitoring.getStatus().running,
            healthScore: dashboard.getHealthScore(),
        };
    }
    async restart() {
        await this.shutdown();
        await this.initialize();
    }
}
export const systemInitializer = new SystemInitializer();
export async function emergencyReset() {
    await systemInitializer.shutdown();
    await api.emergencyReset();
    await systemInitializer.initialize();
}
//# sourceMappingURL=system-initialization.js.map