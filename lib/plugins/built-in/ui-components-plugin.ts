/**
 * Built-in UI Components Plugin
 * Registers all BOVI UI components as a single plugin
 */

import type { Plugin, PluginContext, UIPlugin } from '../plugin-types.js';
import { setupRulerSwitcher } from '../../ui/ruler-switcher.js';
import { setupMoneyVeilCard } from '../../ui/money-veil-card.js';
import { setupHamburgerSentinel } from '../../ui/hamburger-sentinel.js';
import { setupSmartContractUI } from '../../ui/smart-contracts.js';
import { setupCohortEngine } from '../../ui/cohort-engine.js';
import { setupStormModeUI } from '../../ui/storm-mode.js';

export class UIComponentsPlugin implements UIPlugin {
  manifest = {
    id: 'bovi-core-ui-components',
    name: 'BOVI UI Components',
    version: '1.0.0',
    category: 'ui-component' as const,
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

  private activeComponents: string[] = [];

  async initialize(context: PluginContext): Promise<void> {
    context.log('UI components plugin initializing');
    
    // Validate required services are available
    const apiPlugin = context.getPlugin('bovi-core-api');
    if (!apiPlugin) {
      throw new Error('UI Components plugin requires API plugin');
    }
  }

  async activate(context: PluginContext): Promise<void> {
    const config = context.getPluginConfig(this.manifest.id);
    
    // Initialize enabled UI components
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

  async deactivate(context: PluginContext): Promise<void> {
    // In a real implementation, we would clean up the UI components
    // For now, we just clear the active components list
    this.activeComponents = [];
    
    context.log('UI components plugin deactivated');
  }

  render(container: HTMLElement, context: PluginContext): void {
    // This could be used for a centralized UI management interface
    container.innerHTML = `
      <div class="ui-components-status">
        <h3>BOVI UI Components</h3>
        <p>Active components: ${this.activeComponents.join(', ')}</p>
        <p>Status: ${this.activeComponents.length} components loaded</p>
      </div>
    `;
  }

  unmount(): void {
    // Clean up any resources
    this.activeComponents = [];
  }

  async configure(config: Record<string, any>): Promise<void> {
    // Configuration changes would require deactivation and reactivation
    // to enable/disable specific components
    console.log('UI Components plugin configuration updated:', config);
  }

  getStatus() {
    return {
      state: 'active' as const,
      lastUpdated: Date.now(),
      metrics: {
        activeComponents: this.activeComponents.length,
        components: this.activeComponents
      }
    };
  }
}