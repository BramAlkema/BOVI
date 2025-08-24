/**
 * BOVI Shipping Integration
 * Connects shipping APIs to existing UI and flow system
 */

import { indexCommons } from './services/index-commons.js';
import { notificationService } from './integration/notification-service.js';
import { setupRulerSwitcher } from './ui/ruler-switcher.js';
import { setupMoneyVeilCard } from './ui/money-veil-card.js';
import { setupHamburgerSentinel } from './ui/hamburger-sentinel.js';
import { setupSmartContractUI } from './ui/smart-contracts.js';
import { setupCohortEngine } from './ui/cohort-engine.js';
import { setupStormModeUI } from './ui/storm-mode.js';

// =============================================================================
// UI INTEGRATION LAYER
// =============================================================================

/**
 * Initialize shipping features with existing BOVI system
 */
export async function initializeShippingFeatures(): Promise<void> {
  console.log('🚀 Initializing BOVI shipping features...');
  
  try {
    // Initialize Index Commons store
    await indexCommons.init();
    
    // Set up UI modules
    setupRulerSwitcher();
    setupMoneyVeilCard();
    setupHamburgerSentinel();
    setupSmartContractUI();
    setupCohortEngine();
    setupStormModeUI();
    
    // Start background notification service
    notificationService.initialize();
    
    console.log('✅ Shipping features initialized');
  } catch (error) {
    console.error('❌ Failed to initialize shipping features:', error);
    throw error;
  }
}


// =============================================================================
// HELPER FUNCTIONS FOR LEGACY COMPATIBILITY
// =============================================================================

function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  notificationService.showNotification(message, type === 'success' ? 'success' : 'error');
}

function showStormModeAlert(): void {
  notificationService.showNotification('⛈️ High inflation detected! Consider activating Storm Mode.', 'error');
}

function updateStormModeStatus(active: boolean, status: string): void {
  const statusEl = document.querySelector('#storm-status');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.parentElement?.classList.toggle('active', active);
  }
}

// =============================================================================
// EXPORT FOR INTEGRATION
// =============================================================================

// Auto-initialize shipping features when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShippingFeatures);
  } else {
    initializeShippingFeatures();
  }
}