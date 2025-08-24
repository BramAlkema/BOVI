/**
 * BOVI Scenario Engine
 * Real-world scenario analysis system
 */

import { $, dom, animate } from "../core/utils.js";

class ScenarioEngine {
  constructor() {
    this.scenarios = new Map();
    this.currentScenario = null;
  }
  
  /**
   * Register a new scenario
   */
  registerScenario(id, scenario) {
    this.scenarios.set(id, scenario);
  }
  
  /**
   * Show scenario analysis
   */
  showScenario(scenarioId, containerSelector) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      console.warn(`Scenario '${scenarioId}' not found`);
      return;
    }
    
    const container = $(containerSelector);
    if (!container) {
      console.warn(`Container '${containerSelector}' not found`);
      return;
    }
    
    this.currentScenario = scenario;
    
    // Create scenario analysis content
    const content = this.renderScenarioAnalysis(scenario);
    dom.setContent(container, content);
    
    // Show with animation
    animate.slideIn(container);
  }
  
  /**
   * Render scenario analysis HTML
   */
  renderScenarioAnalysis(scenario) {
    const primaryMode = scenario.primaryMode || "balanced";
    const breakdown = scenario.breakdown || {};
    
    const modeCards = Object.entries(breakdown).map(([mode, description]) => {
      const isPrimary = mode === primaryMode;
      const modeLabel = this.getModeLabel(mode);
      
      return `
        <div class="mode-breakdown-card ${mode} ${isPrimary ? "primary" : ""}">
          <div class="mode-header">
            <span class="mode-badge ${mode}">${mode[0].toUpperCase()}</span>
            <strong>${modeLabel}${isPrimary ? " (Primary)" : ""}</strong>
          </div>
          <p class="text-small">${description}</p>
        </div>
      `;
    }).join("");
    
    return `
      <div class="scenario-analysis">
        <h3>${scenario.title}</h3>
        <div class="scenario-description">
          <p class="text-muted">${scenario.description || ""}</p>
        </div>
        <div class="mode-breakdown">
          <h4>BOVI Mode Analysis:</h4>
          <div class="mode-cards">
            ${modeCards}
          </div>
        </div>
        <div class="scenario-insights">
          ${this.renderInsights(scenario)}
        </div>
      </div>
    `;
  }
  
  /**
   * Render scenario insights
   */
  renderInsights(scenario) {
    if (!scenario.insights) return "";
    
    return `
      <div class="insights-section">
        <h4>Key Insights:</h4>
        <ul class="insights-list">
          ${scenario.insights.map(insight => `<li>${insight}</li>`).join("")}
        </ul>
      </div>
    `;
  }
  
  /**
   * Get human-readable mode labels
   */
  getModeLabel(mode) {
    const labels = {
      balanced: "Balanced (Equality Matching)",
      obligated: "Obligated (Authority Ranking)",
      value: "Value (Market Pricing)",
      immediate: "Immediate (Communal Sharing)"
    };
    return labels[mode] || mode;
  }
  
  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return Array.from(this.scenarios.keys());
  }
}

/**
 * Base Scenario class
 */
export class Scenario {
  constructor(id, title, primaryMode, description) {
    this.id = id;
    this.title = title;
    this.primaryMode = primaryMode;
    this.description = description;
    this.breakdown = {};
    this.insights = [];
  }
  
  /**
   * Add mode breakdown
   */
  addModeBreakdown(mode, description) {
    this.breakdown[mode] = description;
    return this;
  }
  
  /**
   * Add insights
   */
  addInsights(...insights) {
    this.insights.push(...insights);
    return this;
  }
}

// Global scenario engine instance
export const scenarioEngine = new ScenarioEngine();

// Scenario registration helper
export const registerScenario = (scenario) => {
  scenarioEngine.registerScenario(scenario.id, scenario);
};

// Scenario display helper
export const showScenario = (scenarioId, containerSelector) => {
  return scenarioEngine.showScenario(scenarioId, containerSelector);
};