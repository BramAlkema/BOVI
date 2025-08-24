/**
 * BOVI Integration Module Exports
 * Modular integration system for bridging UI with flow execution
 */

export { FlowLoaderService, flowLoader } from "./flow-loader.js";
export { StudioManagerService, studioManager } from "./studio-manager.js";
export { UIBridgeService, uiBridge } from "./ui-bridge.js";
export { AIButlerManagerService, aiButlerManager } from "./ai-butler-manager.js";
export { AuditTrailService, auditTrail } from "./audit-trail.js";
export { NotificationService, notificationService } from "./notification-service.js";
export { HybridSystemOrchestrator, hybridOrchestrator } from "./hybrid-orchestrator.js";

// Main initialization function for backward compatibility
export const initBoviSystem = async (): Promise<void> => {
  const { hybridOrchestrator } = await import("./hybrid-orchestrator.js");
  return hybridOrchestrator.initialize();
};

// Legacy exports for backward compatibility
export const showAuditTrail = (): void => {
  const { auditTrail } = require("./audit-trail.js");
  auditTrail.showAuditTrail();
};
