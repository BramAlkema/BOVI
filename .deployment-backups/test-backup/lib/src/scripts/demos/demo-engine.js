import { $, dom, animate } from "../core/utils.js";
class DemoEngine {
    constructor() {
        this.demos = new Map();
        this.activeDemo = null;
    }
    registerDemo(id, demo) {
        this.demos.set(id, demo);
    }
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
            dom.setContent(container, "");
            await demo.run(container);
            animate.slideIn(container);
        }
        catch (error) {
            console.error(`Error running demo '${demoId}':`, error);
            dom.setContent(container, "<p class=\"text-muted\">Demo failed to load</p>");
        }
    }
    getAvailableDemos() {
        return Array.from(this.demos.keys());
    }
}
export class Demo {
    constructor(id, title, mode, description) {
        this.id = id;
        this.title = title;
        this.mode = mode;
        this.description = description;
    }
    createDemoStructure(container, content) {
        const demoEl = dom.createElement("div", "demo-result");
        demoEl.innerHTML = `
      <h4>${this.title}</h4>
      <div class="demo-content">${content}</div>
    `;
        container.appendChild(demoEl);
        return demoEl;
    }
    createModeAnalysis(analysis) {
        const modes = ["balanced", "obligated", "value", "immediate"];
        const modeNames = {
            balanced: "Balanced (Equality Matching)",
            obligated: "Obligated (Authority Ranking)",
            value: "Value (Market Pricing)",
            immediate: "Immediate (Communal Sharing)"
        };
        const analysisHtml = modes.map(mode => {
            if (!analysis[mode])
                return "";
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
export const demoEngine = new DemoEngine();
export const registerDemo = (demo) => {
    demoEngine.registerDemo(demo.id, demo);
};
export const runDemo = (demoId, containerSelector) => {
    return demoEngine.runDemo(demoId, containerSelector);
};
//# sourceMappingURL=demo-engine.js.map