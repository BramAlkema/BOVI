import { indexCommons } from './services/index-commons.js';
import { notificationService } from './integration/notification-service.js';
import { setupRulerSwitcher } from './ui/ruler-switcher.js';
import { setupMoneyVeilCard } from './ui/money-veil-card.js';
import { setupHamburgerSentinel } from './ui/hamburger-sentinel.js';
import { setupSmartContractUI } from './ui/smart-contracts.js';
import { setupCohortEngine } from './ui/cohort-engine.js';
import { setupStormModeUI } from './ui/storm-mode.js';
export async function initializeShippingFeatures() {
    console.log('🚀 Initializing BOVI shipping features...');
    try {
        await indexCommons.init();
        setupRulerSwitcher();
        setupMoneyVeilCard();
        setupHamburgerSentinel();
        setupSmartContractUI();
        setupCohortEngine();
        setupStormModeUI();
        notificationService.initialize();
        console.log('✅ Shipping features initialized');
    }
    catch (error) {
        console.error('❌ Failed to initialize shipping features:', error);
        throw error;
    }
}
function showNotification(message, type = 'success') {
    notificationService.showNotification(message, type === 'success' ? 'success' : 'error');
}
function showStormModeAlert() {
    notificationService.showNotification('⛈️ High inflation detected! Consider activating Storm Mode.', 'error');
}
function updateStormModeStatus(active, status) {
    const statusEl = document.querySelector('#storm-status');
    if (statusEl) {
        statusEl.textContent = status;
        statusEl.parentElement?.classList.toggle('active', active);
    }
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeShippingFeatures);
    }
    else {
        initializeShippingFeatures();
    }
}
//# sourceMappingURL=shipping-integration.js.map