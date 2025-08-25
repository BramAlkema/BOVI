import { setupRulerSwitcher } from '../../ui/ruler-switcher.js';
import { setupMoneyVeilCard } from '../../ui/money-veil-card.js';
import { setupHamburgerSentinel } from '../../ui/hamburger-sentinel.js';
import { setupSmartContractUI } from '../../ui/smart-contracts.js';
import { setupCohortEngine } from '../../ui/cohort-engine.js';
import { setupStormModeUI } from '../../ui/storm-mode.js';
export class UIComponentsPlugin {
    constructor() {
        this.manifest = {
            id: 'bovi-core-ui-components',
            name: 'BOVI UI Components',
            version: '1.0.0',
            category: 'ui-component',
            description: 'Core BOVI UI components (ruler switcher, money veil, hamburger sentinel, etc.)',
            provides: [
                'ruler-switcher',
                'money-veil-card',
                'hamburger-sentinel',
                'smart-contracts',
                'cohort-engine',
                'storm-mode'
            ],
            requires: ['notifications', 'api'],
            config: {
                defaults: {
                    enableRulerSwitcher: true,
                    enableMoneyVeilCard: true,
                    enableHamburgerSentinel: true,
                    enableSmartContracts: true,
                    enableCohortEngine: true,
                    enableStormMode: true
                }
            }
        };
        this.activeComponents = [];
    }
    async initialize(context) {
        context.log('UI components plugin initializing');
        const apiPlugin = context.getPlugin('bovi-core-api');
        if (!apiPlugin) {
            throw new Error('UI Components plugin requires API plugin');
        }
    }
    async activate(context) {
        const config = context.getPluginConfig(this.manifest.id);
        if (config.enableRulerSwitcher) {
            setupRulerSwitcher();
            this.activeComponents.push('ruler-switcher');
        }
        if (config.enableMoneyVeilCard) {
            setupMoneyVeilCard();
            this.activeComponents.push('money-veil-card');
        }
        if (config.enableHamburgerSentinel) {
            setupHamburgerSentinel();
            this.activeComponents.push('hamburger-sentinel');
        }
        if (config.enableSmartContracts) {
            setupSmartContractUI();
            this.activeComponents.push('smart-contracts');
        }
        if (config.enableCohortEngine) {
            setupCohortEngine();
            this.activeComponents.push('cohort-engine');
        }
        if (config.enableStormMode) {
            setupStormModeUI();
            this.activeComponents.push('storm-mode');
        }
        context.log(`UI components plugin activated with: ${this.activeComponents.join(', ')}`);
        context.showNotification('BOVI UI components loaded', 'success');
    }
    async deactivate(context) {
        this.activeComponents = [];
        context.log('UI components plugin deactivated');
    }
    render(container, context) {
        container.innerHTML = `
      <div class="ui-components-status">
        <h3>BOVI UI Components</h3>
        <p>Active components: ${this.activeComponents.join(', ')}</p>
        <p>Status: ${this.activeComponents.length} components loaded</p>
      </div>
    `;
    }
    unmount() {
        this.activeComponents = [];
    }
    async configure(config) {
        console.log('UI Components plugin configuration updated:', config);
    }
    getStatus() {
        return {
            state: 'active',
            lastUpdated: Date.now(),
            metrics: {
                activeComponents: this.activeComponents.length,
                components: this.activeComponents
            }
        };
    }
}
//# sourceMappingURL=ui-components-plugin.js.map