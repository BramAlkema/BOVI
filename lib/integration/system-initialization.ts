/**
 * BOVI System Initialization
 * Orchestrates the startup of all BOVI system components
 */

import { Bus, emit } from "../bus.js";
import { api } from "../api/facade.js";
import { KPIMonitoringService } from "../monitoring/kpi-monitoring.js";
import { dashboard } from "../monitoring/kpi-dashboard.js";
import { initializePluginSystem } from "../plugins/index.js";
import { BoviEvents } from "../core/constants.js";

/**
 * System initialization service that coordinates startup of all components
 */
export class SystemInitializer {
  private kpiMonitoring: KPIMonitoringService;
  private initialized = false;

  constructor() {
    this.kpiMonitoring = new KPIMonitoringService(api);
  }

  /**
   * Initialize all BOVI system components
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("BOVI system already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing BOVI system components...");

      // Initialize API façade
      await api.initialize();

      // Start KPI monitoring
      this.kpiMonitoring.start();

      // Initialize plugin system
      await initializePluginSystem();

      // Emit system ready event
      emit("ui.ai_butler.toggled", { enabled: true });
      emit(BoviEvents.SYSTEM_INITIALIZED, {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });

      this.initialized = true;
      console.log("✅ BOVI system initialization complete");
    } catch (error) {
      console.error("❌ Failed to initialize BOVI system:", error);
      throw error;
    }
  }

  /**
   * Shutdown system components gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log("🔄 Shutting down BOVI system...");

      // Stop monitoring
      this.kpiMonitoring.stop();

      // Clear dashboard
      dashboard.clearMetrics();

      // Emit shutdown event
      emit(BoviEvents.SYSTEM_SHUTDOWN, { timestamp: new Date().toISOString() });

      this.initialized = false;
      console.log("✅ BOVI system shutdown complete");
    } catch (error) {
      console.error("❌ Error during system shutdown:", error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    apiReady: boolean;
    monitoringActive: boolean;
    healthScore: number;
    } {
    return {
      initialized: this.initialized,
      apiReady: this.initialized,
      monitoringActive: this.kpiMonitoring.getStatus().running,
      healthScore: dashboard.getHealthScore(),
    };
  }

  /**
   * Restart system components
   */
  async restart(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }
}

// Export global initializer instance
export const systemInitializer = new SystemInitializer();

/**
 * Convenience function for emergency system reset
 */
export async function emergencyReset(): Promise<void> {
  await systemInitializer.shutdown();
  await api.emergencyReset();
  await systemInitializer.initialize();
}
