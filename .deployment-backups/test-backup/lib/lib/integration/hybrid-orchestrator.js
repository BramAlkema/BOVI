import { flowLoader } from "./flow-loader.js";
import { studioManager } from "./studio-manager.js";
import { uiBridge } from "./ui-bridge.js";
import { aiButlerManager } from "./ai-butler-manager.js";
import { auditTrail } from "./audit-trail.js";
import { notificationService } from "./notification-service.js";
export class HybridSystemOrchestrator {
    constructor() {
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized) {
            console.warn("BOVI hybrid system already initialized");
            return;
        }
        try {
            console.log("🚀 Initializing BOVI hybrid system...");
            await flowLoader.loadFlowSpecs();
            const flowSpecs = flowLoader.getAllFlowSpecs();
            studioManager.initializeStudios(flowSpecs);
            uiBridge.initialize(flowSpecs);
            aiButlerManager.initialize();
            notificationService.initialize();
            this.initialized = true;
            console.log("✅ BOVI hybrid system initialized successfully");
        }
        catch (error) {
            console.error("❌ Failed to initialize BOVI hybrid system:", error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.initialized) {
            return;
        }
        try {
            console.log("🔄 Shutting down BOVI hybrid system...");
            notificationService.stop();
            studioManager.clearAll();
            this.initialized = false;
            console.log("✅ BOVI hybrid system shutdown complete");
        }
        catch (error) {
            console.error("❌ Error during hybrid system shutdown:", error);
            throw error;
        }
    }
    async restart() {
        await this.shutdown();
        await this.initialize();
    }
    getStatus() {
        const flowSpecs = flowLoader.getAllFlowSpecs();
        const studios = studioManager.getAllStudios();
        return {
            initialized: this.initialized,
            flowsLoaded: Object.keys(flowSpecs).length,
            studiosActive: Object.keys(studios).length,
            aiButlerEnabled: aiButlerManager.isEnabled(),
        };
    }
    getComponents() {
        return {
            flowSpecs: flowLoader.getAllFlowSpecs(),
            studios: studioManager.getAllStudios(),
        };
    }
    showAuditTrail() {
        auditTrail.showAuditTrail();
    }
    exportAuditLogs() {
        auditTrail.exportLogs();
    }
    showNotification(message, type) {
        notificationService.showNotification(message, type);
    }
}
export const hybridOrchestrator = new HybridSystemOrchestrator();
//# sourceMappingURL=hybrid-orchestrator.js.map