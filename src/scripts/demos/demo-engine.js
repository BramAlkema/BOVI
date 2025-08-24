/**
 * BOVI Demo Engine
 * Interactive demonstration system for BOVI modes
 */

import { $, dom, animate } from "../core/utils.js";

class DemoEngine {
  constructor() {
    this.demos = new Map();
    this.activeDemo = null;
  }
  
  /**
   * Register a new demo
   */
  registerDemo(id, demo) {
    this.demos.set(id, demo);
  }
  
  /**
   * Run a demo by ID
   */
  async runDemo(demoId, containerSelector) {
    const demo = this.demos.get(demoId);
    if (!demo) {
      console.warn(`Demo '${demoId}' not found`);
      return;
    }
    
    const container = $(containerSelector);
    if (!container) {
      console.warn(`Container '${containerSelector}' not found`);
      return;
    }
    
    this.activeDemo = demo;
    
    try {
      // Clear previous content
      dom.setContent(container, "");
      
      // Run the demo
      await demo.run(container);
      
      // Show the container with animation
      animate.slideIn(container);
      
    } catch (error) {
      console.error(`Error running demo '${demoId}':`, error);
      dom.setContent(container, "<p class=\"text-muted\">Demo failed to load</p>");
    }
  }
  
  /**
   * Get available demos
   */
  getAvailableDemos() {
    return Array.from(this.demos.keys());
  }
}

/**
 * Base Demo class
 */
export class Demo {
  constructor(id, title, mode, description) {
    this.id = id;
    this.title = title;
    this.mode = mode; // 'balanced', 'obligated', 'value', 'immediate'
    this.description = description;
  }
  
  /**
   * Override this method in concrete demos
   */
  async run(_container) {
    throw new Error("Demo.run() must be implemented by subclass");
  }
  
  /**
   * Helper to create demo content structure
   */
  createDemoStructure(container, content) {
    const demoEl = dom.createElement("div", "demo-result");
    demoEl.innerHTML = `
      <h4>${this.title}</h4>
      <div class="demo-content">${content}</div>
    `;
    container.appendChild(demoEl);
    return demoEl;
  }
  
  /**
   * Helper to create mode analysis
   */
  createModeAnalysis(analysis) {
    const modes = ["balanced", "obligated", "value", "immediate"];
    const modeNames = {
      balanced: "Balanced (Equality Matching)",
      obligated: "Obligated (Authority Ranking)", 
      value: "Value (Market Pricing)",
      immediate: "Immediate (Communal Sharing)"
    };
    
    const analysisHtml = modes.map(mode => {
      if (!analysis[mode]) return "";
      
      return `
        <div class="mode-item">
          <span class="mode-badge ${mode}">${mode[0].toUpperCase()}</span>
          <div>
            <strong>${modeNames[mode]}:</strong>
            <p class="text-small">${analysis[mode]}</p>
          </div>
        </div>
      `;
    }).join("");
    
    return `<div class="mode-analysis">${analysisHtml}</div>`;
  }
}

// Global demo engine instance
export const demoEngine = new DemoEngine();

// Demo registration helper
export const registerDemo = (demo) => {
  demoEngine.registerDemo(demo.id, demo);
};

// Demo execution helper
export const runDemo = (demoId, containerSelector) => {
  return demoEngine.runDemo(demoId, containerSelector);
};
