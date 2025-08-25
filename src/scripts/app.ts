/**
 * BOVI Main Application
 * Entry point and application initialization
 */

import { initNavigation, Navigation } from "./core/navigation.js";
import { showScenario } from "./scenarios/scenario-engine.js";
import { runDemo } from "./demos/demo-engine.js";
import { $, $$, events } from "./core/utils.js";
import { setupKPIDashboardUI, generateDemoKPIData } from "../../lib/ui/kpi-dashboard-ui.js";
import { performanceCollector } from "../../lib/monitoring/performance-collector.js";

class BoviApp {
  private navigation: Navigation | null = null;
  private initialized = false;

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize navigation system
      this.navigation = initNavigation();

      // Load scenario data
      await import("../data/scenarios.js");

      // Load demos
      await this.loadDemos();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize KPI dashboard
      setupKPIDashboardUI();
      
      // Start performance monitoring
      performanceCollector.startSystemMonitoring();
      
      // Generate demo KPI data for demonstration
      setTimeout(() => {
        generateDemoKPIData();
      }, 2000);

      // Handle initial route
      this.handleInitialRoute();

      this.initialized = true;
      console.log("BOVI App initialized successfully");
    } catch (error) {
      console.error("Failed to initialize BOVI App:", error);
    }
  }

  /**
   * Load demo modules
   */
  private async loadDemos(): Promise<void> {
    try {
      // Load tally demo
      await import("./demos/tally-demo.js");

      // Additional demos can be loaded here
      // await import('./demos/tax-demo.js');
      // await import('./demos/value-demo.js');
      // await import('./demos/immediate-demo.js');
    } catch (error) {
      console.warn("Some demos failed to load:", error);
    }
  }

  /**
   * Set up global event listeners
   */
  private setupEventListeners(): void {
    // Demo trigger buttons
    events.delegate(document, "[data-demo]", "click", (e: Event) => {
      const target = e.target as HTMLElement;
      const demoId = target.dataset.demo;
      const containerId = target.dataset.container || `#${demoId}Result`;
      if (demoId) {
        runDemo(demoId, containerId);
      }
    });

    // Scenario trigger buttons
    events.delegate(document, "[data-scenario]", "click", (e: Event) => {
      const target = e.target as HTMLElement;
      const scenarioId = target.dataset.scenario;
      const containerId = target.dataset.container || "#scenarioResult";
      if (scenarioId) {
        showScenario(scenarioId, containerId);
      }
    });

    // Handle navigation events
    events.on(window, "bovi:navigate", (e: Event) => {
      this.onNavigate((e as CustomEvent).detail.tab);
    });

    // Global keyboard shortcuts
    events.on(document, "keydown", (e: Event) => {
      this.handleKeyboardShortcuts(e as KeyboardEvent);
    });
  }

  /**
   * Handle navigation events
   */
  private onNavigate(tab: string): void {
    // Tab-specific initialization
    switch (tab) {
      case "balanced":
      case "obligated":
      case "value":
      case "immediate":
        this.initializeModeTab(tab);
        break;
      case "scenarios":
        this.initializeScenariosTab();
        break;
      case "bundle":
        this.initializeBundleTab();
        break;
    }
  }

  /**
   * Initialize mode-specific tabs
   */
  private initializeModeTab(mode: string): void {
    // Set up mode-specific demos and interactions
    const demoButton = $(`#${mode}Demo`);
    if (demoButton && !(demoButton as HTMLElement).dataset.initialized) {
      // Mark as initialized to prevent duplicate setup
      (demoButton as HTMLElement).dataset.initialized = "true";
    }
  }

  /**
   * Initialize scenarios tab
   */
  private initializeScenariosTab(): void {
    // Ensure scenario cards are interactive
    const scenarioCards = $$(".scenario");
    scenarioCards.forEach(card => {
      const htmlCard = card as HTMLElement;
      if (!htmlCard.dataset.initialized) {
        const scenarioId = htmlCard.dataset.scenario;
        if (scenarioId) {
          events.on(htmlCard, "click", () => {
            showScenario(scenarioId, "#scenarioResult");
          });
          htmlCard.dataset.initialized = "true";
        }
      }
    });
  }

  /**
   * Initialize bundle analysis tab
   */
  private initializeBundleTab(): void {
    // Set up bundle visualization and interactions
    // This could include interactive charts, mode switching demos, etc.
  }

  /**
   * Handle initial route on page load
   */
  private handleInitialRoute(): void {
    // Check URL hash for initial tab
    const hash = window.location.hash.slice(1);
    if (hash && this.navigation) {
      this.navigation.goTo(hash);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcuts(e: KeyboardEvent): void {
    // Only handle shortcuts when not in input elements
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return;
    }

    // Tab navigation shortcuts
    if (e.altKey) {
      const shortcuts: Record<string, string> = {
        "1": "overview",
        "2": "balanced",
        "3": "obligated",
        "4": "value",
        "5": "immediate",
        "6": "scenarios",
        "7": "bundle",
      };

      const tab = shortcuts[e.key];
      if (tab && this.navigation) {
        e.preventDefault();
        this.navigation.goTo(tab);
      }
    }

    // Escape key to close modals/results
    if (e.key === "Escape") {
      const activeResult = $(".demo-result:not([hidden]), .scenario-analysis:not([hidden])");
      if (activeResult && activeResult.parentElement) {
        activeResult.parentElement.hidden = true;
      }
    }
  }
}

// Initialize app when DOM is ready
let app: BoviApp | null = null;

const initApp = (): Promise<void> => {
  if (!app) {
    app = new BoviApp();
  }
  return app.init();
};

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Export for manual initialization if needed
export { BoviApp, initApp };