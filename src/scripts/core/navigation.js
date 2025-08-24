/**
 * BOVI Navigation System
 * Handles tab-based navigation and section visibility
 */

import { $$, events, dom } from './utils.js';

class NavigationManager {
  constructor() {
    this.currentTab = 'overview';
    this.tabButtons = $$('.tab');
    this.sections = $$('main > section');
    
    this.init();
  }
  
  init() {
    // Set up tab click handlers
    this.tabButtons.forEach(button => {
      events.on(button, 'click', (e) => {
        e.preventDefault();
        const tabId = button.dataset.tab;
        this.navigateToTab(tabId);
      });
    });
    
    // Handle browser back/forward
    events.on(window, 'popstate', (e) => {
      const tabId = e.state?.tab || 'overview';
      this.navigateToTab(tabId, false);
    });
    
    // Set initial state
    this.updateActiveTab();
    this.showSection(this.currentTab);
  }
  
  navigateToTab(tabId, pushState = true) {
    if (tabId === this.currentTab) return;
    
    this.currentTab = tabId;
    this.updateActiveTab();
    this.showSection(tabId);
    
    // Update browser history
    if (pushState) {
      history.pushState({ tab: tabId }, '', `#${tabId}`);
    }
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('bovi:navigate', {
      detail: { tab: tabId }
    }));
  }
  
  updateActiveTab() {
    this.tabButtons.forEach(button => {
      if (button.dataset.tab === this.currentTab) {
        button.setAttribute('aria-current', 'page');
        dom.addClass(button, 'active');
      } else {
        button.removeAttribute('aria-current');
        dom.removeClass(button, 'active');
      }
    });
  }
  
  showSection(tabId) {
    this.sections.forEach(section => {
      if (section.id === tabId) {
        dom.show(section);
        section.setAttribute('aria-hidden', 'false');
      } else {
        dom.hide(section);
        section.setAttribute('aria-hidden', 'true');
      }
    });
  }
  
  getCurrentTab() {
    return this.currentTab;
  }
  
  // Public API for programmatic navigation
  goTo(tabId) {
    this.navigateToTab(tabId);
  }
}

// Initialize navigation when DOM is ready
let navigationManager = null;

export const initNavigation = () => {
  if (!navigationManager) {
    navigationManager = new NavigationManager();
  }
  return navigationManager;
};

export const getNavigation = () => navigationManager;