/**
 * BOVI Integration Layer - Legacy Entry Point
 * Re-exports the new modular integration system for backward compatibility
 */

// Re-export everything from the modular integration system
export * from './integration/index.js';

// Ensure global instances are available
export { 
  hybridOrchestrator,
  flowLoader,
  studioManager,
  uiBridge,
  aiButlerManager,
  auditTrail,
  notificationService
} from './integration/index.js';

// Legacy compatibility - main init function

export const initBoviSystem = async (): Promise<void> => {
  const { hybridOrchestrator } = await import('./integration/index.js');
  return hybridOrchestrator.initialize();
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoviSystem);
} else {
  initBoviSystem();
}

// Legacy exports for backward compatibility - these will be provided by the orchestrator
export const flowRunner = (await import('./flow/index.js')).flowRunner;
export const flowSpecs = {}; // Will be populated by flow loader
export const studios = {}; // Will be populated by studio manager
export const aiButlerEnabled = true; // Will be managed by AI butler manager