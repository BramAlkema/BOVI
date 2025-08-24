/**
 * BOVI Main Application
 * Entry point and application initialization
 */

import { initNavigation } from "./core/navigation.js";
import { showScenario } from "./scenarios/scenario-engine.js";
import { runDemo } from "./demos/demo-engine.js";
import { $, $$, events } from "./core/utils.js";

class BoviApp {
  constructor() {
    this.navigation = null;
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
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
  async loadDemos() {
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
  setupEventListeners() {
    // Demo trigger buttons
    events.delegate(document, "[data-demo]", "click", e => {
      const demoId = e.target.dataset.demo;
      const containerId = e.target.dataset.container || `#${demoId}Result`;
      runDemo(demoId, containerId);
    });

    // Scenario trigger buttons
    events.delegate(document, "[data-scenario]", "click", e => {
      const scenarioId = e.target.dataset.scenario;
      const containerId = e.target.dataset.container || "#scenarioResult";
      showScenario(scenarioId, containerId);
    });

    // Handle navigation events
    events.on(window, "bovi:navigate", e => {
      this.onNavigate(e.detail.tab);
    });

    // Global keyboard shortcuts
    events.on(document, "keydown", e => {
      this.handleKeyboardShortcuts(e);
    });
  }

  /**
   * Handle navigation events
   */
  onNavigate(tab) {
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
  initializeModeTab(mode) {
    // Set up mode-specific demos and interactions
    const demoButton = $(`#${mode}Demo`);
    if (demoButton && !demoButton.dataset.initialized) {
      // Mark as initialized to prevent duplicate setup
      demoButton.dataset.initialized = "true";
    }
  }

  /**
   * Initialize scenarios tab
   */
  initializeScenariosTab() {
    // Ensure scenario cards are interactive
    const scenarioCards = $$(".scenario");
    scenarioCards.forEach(card => {
      if (!card.dataset.initialized) {
        const scenarioId = card.dataset.scenario;
        if (scenarioId) {
          events.on(card, "click", () => {
            showScenario(scenarioId, "#scenarioResult");
          });
          card.dataset.initialized = "true";
        }
      }
    });
  }

  /**
   * Initialize bundle analysis tab
   */
  initializeBundleTab() {
    // Set up bundle visualization and interactions
    // This could include interactive charts, mode switching demos, etc.
  }

  /**
   * Handle initial route on page load
   */
  handleInitialRoute() {
    // Check URL hash for initial tab
    const hash = window.location.hash.slice(1);
    if (hash && this.navigation) {
      this.navigation.goTo(hash);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not in input elements
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    // Tab navigation shortcuts
    if (e.altKey) {
      const shortcuts = {
        1: "overview",
        2: "balanced",
        3: "obligated",
        4: "value",
        5: "immediate",
        6: "scenarios",
        7: "bundle",
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
let app = null;

const initApp = () => {
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
