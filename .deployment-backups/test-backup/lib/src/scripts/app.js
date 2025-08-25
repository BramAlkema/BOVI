import { initNavigation } from "./core/navigation.js";
import { showScenario } from "./scenarios/scenario-engine.js";
import { runDemo } from "./demos/demo-engine.js";
import { $, $$, events } from "./core/utils.js";
import { setupKPIDashboardUI, generateDemoKPIData } from "../../lib/ui/kpi-dashboard-ui.js";
import { performanceCollector } from "../../lib/monitoring/performance-collector.js";
class BoviApp {
    constructor() {
        this.navigation = null;
        this.initialized = false;
    }
    async init() {
        if (this.initialized)
            return;
        try {
            this.navigation = initNavigation();
            await import("../data/scenarios.js");
            await this.loadDemos();
            this.setupEventListeners();
            setupKPIDashboardUI();
            performanceCollector.startSystemMonitoring();
            setTimeout(() => {
                generateDemoKPIData();
            }, 2000);
            this.handleInitialRoute();
            this.initialized = true;
            console.log("BOVI App initialized successfully");
        }
        catch (error) {
            console.error("Failed to initialize BOVI App:", error);
        }
    }
    async loadDemos() {
        try {
            await import("./demos/tally-demo.js");
        }
        catch (error) {
            console.warn("Some demos failed to load:", error);
        }
    }
    setupEventListeners() {
        events.delegate(document, "[data-demo]", "click", (e) => {
            const target = e.target;
            const demoId = target.dataset.demo;
            const containerId = target.dataset.container || `#${demoId}Result`;
            if (demoId) {
                runDemo(demoId, containerId);
            }
        });
        events.delegate(document, "[data-scenario]", "click", (e) => {
            const target = e.target;
            const scenarioId = target.dataset.scenario;
            const containerId = target.dataset.container || "#scenarioResult";
            if (scenarioId) {
                showScenario(scenarioId, containerId);
            }
        });
        events.on(window, "bovi:navigate", (e) => {
            this.onNavigate(e.detail.tab);
        });
        events.on(document, "keydown", (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    onNavigate(tab) {
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
    initializeModeTab(mode) {
        const demoButton = $(`#${mode}Demo`);
        if (demoButton && !demoButton.dataset.initialized) {
            demoButton.dataset.initialized = "true";
        }
    }
    initializeScenariosTab() {
        const scenarioCards = $$(".scenario");
        scenarioCards.forEach(card => {
            const htmlCard = card;
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
    initializeBundleTab() {
    }
    handleInitialRoute() {
        const hash = window.location.hash.slice(1);
        if (hash && this.navigation) {
            this.navigation.goTo(hash);
        }
    }
    handleKeyboardShortcuts(e) {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
            return;
        }
        if (e.altKey) {
            const shortcuts = {
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
        if (e.key === "Escape") {
            const activeResult = $(".demo-result:not([hidden]), .scenario-analysis:not([hidden])");
            if (activeResult && activeResult.parentElement) {
                activeResult.parentElement.hidden = true;
            }
        }
    }
}
let app = null;
const initApp = () => {
    if (!app) {
        app = new BoviApp();
    }
    return app.init();
};
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
}
else {
    initApp();
}
export { BoviApp, initApp };
//# sourceMappingURL=app.js.map