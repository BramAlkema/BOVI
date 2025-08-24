/**
 * BOVI Navigation System
 * Handles tab-based navigation and section visibility
 */

import { $$, events, dom } from "./utils.js";

export interface Navigation {
  getCurrentTab(): string;
  goTo(tabId: string): void;
}

class NavigationManager implements Navigation {
  private currentTab = "overview";
  private tabButtons: Element[];
  private sections: Element[];
  
  constructor() {
    this.tabButtons = $$(".tab");
    this.sections = $$("main > section");
    
    this.init();
  }
  
  private init(): void {
    // Set up tab click handlers
    this.tabButtons.forEach(button => {
      events.on(button, "click", (e: Event) => {
        e.preventDefault();
        const tabId = (button as HTMLElement).dataset.tab;
        if (tabId) {
          this.navigateToTab(tabId);
        }
      });
    });
    
    // Handle browser back/forward
    events.on(window, "popstate", (e: Event) => {
      const tabId = ((e as PopStateEvent).state as any)?.tab || "overview";
      this.navigateToTab(tabId, false);
    });
    
    // Set initial state
    this.updateActiveTab();
    this.showSection(this.currentTab);
  }
  
  private navigateToTab(tabId: string, pushState = true): void {
    if (tabId === this.currentTab) return;
    
    this.currentTab = tabId;
    this.updateActiveTab();
    this.showSection(tabId);
    
    // Update browser history
    if (pushState) {
      history.pushState({ tab: tabId }, "", `#${tabId}`);
    }
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent("bovi:navigate", {
      detail: { tab: tabId }
    }));
  }
  
  private updateActiveTab(): void {
    this.tabButtons.forEach(button => {
      const htmlButton = button as HTMLElement;
      if (htmlButton.dataset.tab === this.currentTab) {
        htmlButton.setAttribute("aria-current", "page");
        dom.addClass(htmlButton, "active");
      } else {
        htmlButton.removeAttribute("aria-current");
        dom.removeClass(htmlButton, "active");
      }
    });
  }
  
  private showSection(tabId: string): void {
    this.sections.forEach(section => {
      const htmlSection = section as HTMLElement;
      if (htmlSection.id === tabId) {
        dom.show(htmlSection);
        htmlSection.setAttribute("aria-hidden", "false");
      } else {
        dom.hide(htmlSection);
        htmlSection.setAttribute("aria-hidden", "true");
      }
    });
  }
  
  getCurrentTab(): string {
    return this.currentTab;
  }
  
  // Public API for programmatic navigation
  goTo(tabId: string): void {
    this.navigateToTab(tabId);
  }
}

// Initialize navigation when DOM is ready
let navigationManager: NavigationManager | null = null;

export const initNavigation = (): Navigation => {
  if (!navigationManager) {
    navigationManager = new NavigationManager();
  }
  return navigationManager;
};

export const getNavigation = (): Navigation | null => navigationManager;