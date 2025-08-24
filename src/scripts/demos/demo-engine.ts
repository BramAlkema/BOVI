/**
 * BOVI Demo Engine
 * Interactive demonstration system for BOVI modes
 */

import { $, dom, animate } from "../core/utils.js";
import { BoviMode } from "../../../lib/core/constants.js";

export interface DemoInterface {
  id: string;
  title: string;
  mode: string;
  description: string;
  run(container: HTMLElement): Promise<void>;
}

class DemoEngine {
  private demos = new Map<string, DemoInterface>();
  private activeDemo: DemoInterface | null = null;
  
  /**
   * Register a new demo
   */
  registerDemo(id: string, demo: DemoInterface): void {
    this.demos.set(id, demo);
  }
  
  /**
   * Run a demo by ID
   */
  async runDemo(demoId: string, containerSelector: string): Promise<void> {
    const demo = this.demos.get(demoId);
    if (!demo) {
      console.warn(`Demo '${demoId}' not found`);
      return;
    }
    
    const container = $(containerSelector) as HTMLElement;
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
  getAvailableDemos(): string[] {
    return Array.from(this.demos.keys());
  }
}

/**
 * Base Demo class
 */
export abstract class Demo implements DemoInterface {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly mode: string, // 'balanced', 'obligated', 'value', 'immediate'
    public readonly description: string
  ) {}
  
  /**
   * Override this method in concrete demos
   */
  abstract run(container: HTMLElement): Promise<void>;
  
  /**
   * Helper to create demo content structure
   */
  protected createDemoStructure(container: HTMLElement, content: string): HTMLElement {
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
  protected createModeAnalysis(analysis: Record<string, string>): string {
    const modes = ["balanced", "obligated", "value", "immediate"];
    const modeNames: Record<string, string> = {
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
export const registerDemo = (demo: DemoInterface): void => {
  demoEngine.registerDemo(demo.id, demo);
};

// Demo execution helper
export const runDemo = (demoId: string, containerSelector: string): Promise<void> => {
  return demoEngine.runDemo(demoId, containerSelector);
};