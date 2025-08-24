/**
 * BOVI Hybrid System Orchestrator
 * Main orchestrator that coordinates all integration components
 */

import { flowLoader } from "./flow-loader.js";
import { studioManager } from "./studio-manager.js";
import { uiBridge } from "./ui-bridge.js";
import { aiButlerManager } from "./ai-butler-manager.js";
import { auditTrail } from "./audit-trail.js";
import { notificationService } from "./notification-service.js";

/**
 * Hybrid system orchestrator that initializes and coordinates all integration components
 */
export class HybridSystemOrchestrator {
  private initialized = false;

  /**
   * Initialize the complete BOVI hybrid system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("BOVI hybrid system already initialized");
      return;
    }

    try {
      console.log("🚀 Initializing BOVI hybrid system...");

      // Step 1: Load flow specifications
      await flowLoader.loadFlowSpecs();

      // Step 2: Initialize studios for flow visualization
      const flowSpecs = flowLoader.getAllFlowSpecs();
      studioManager.initializeStudios(flowSpecs);

      // Step 3: Bridge existing UI with flow system
      uiBridge.initialize(flowSpecs);

      // Step 4: Set up AI Butler management
      aiButlerManager.initialize();

      // Step 5: Initialize notification service
      notificationService.initialize();

      this.initialized = true;
      console.log("✅ BOVI hybrid system initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize BOVI hybrid system:", error);
      throw error;
    }
  }

  /**
   * Shutdown the hybrid system
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      console.log("🔄 Shutting down BOVI hybrid system...");

      // Stop monitoring services
      notificationService.stop();

      // Clear studios
      studioManager.clearAll();

      this.initialized = false;
      console.log("✅ BOVI hybrid system shutdown complete");
    } catch (error) {
      console.error("❌ Error during hybrid system shutdown:", error);
      throw error;
    }
  }

  /**
   * Restart the hybrid system
   */
  async restart(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    flowsLoaded: number;
    studiosActive: number;
    aiButlerEnabled: boolean;
    } {
    const flowSpecs = flowLoader.getAllFlowSpecs();
    const studios = studioManager.getAllStudios();

    return {
      initialized: this.initialized,
      flowsLoaded: Object.keys(flowSpecs).length,
      studiosActive: Object.keys(studios).length,
      aiButlerEnabled: aiButlerManager.isEnabled(),
    };
  }

  /**
   * Get loaded flows and studios
   */
  getComponents(): {
    flowSpecs: Record<string, any>;
    studios: Record<string, any>;
    } {
    return {
      flowSpecs: flowLoader.getAllFlowSpecs(),
      studios: studioManager.getAllStudios(),
    };
  }

  /**
   * Show audit trail
   */
  showAuditTrail(): void {
    auditTrail.showAuditTrail();
  }

  /**
   * Export audit logs
   */
  exportAuditLogs(): void {
    auditTrail.exportLogs();
  }

  /**
   * Show notification
   */
  showNotification(message: string, type?: "info" | "success" | "error"): void {
    notificationService.showNotification(message, type);
  }
}

// Export global instance
export const hybridOrchestrator = new HybridSystemOrchestrator();
