/**
 * BOVI API Integration
 * Main entry point for BOVI system components
 */

// Re-export modular components
export * from './api/index.js';
export * from './monitoring/index.js';
export { systemInitializer, emergencyReset } from './integration/system-initialization.js';

// Legacy compatibility exports
export { api, systemHealthCheck } from './api/facade.js';
export { dashboard } from './monitoring/kpi-dashboard.js';

// Auto-initialization
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const { systemInitializer } = await import('./integration/system-initialization.js');
      await systemInitializer.initialize();
    } catch (error) {
      console.error('Failed to auto-initialize BOVI system:', error);
    }
  });
}