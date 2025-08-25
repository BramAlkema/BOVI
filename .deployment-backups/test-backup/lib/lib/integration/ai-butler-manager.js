import { emit, on } from "../bus.js";
import { flowRunner } from "../flow/index.js";
export class AIButlerManagerService {
    constructor() {
        this.aiButlerEnabled = true;
    }
    initialize() {
        this.setupAIButlerToggle();
        this.setupCountdownDisplays();
        this.setupToastNotifications();
        console.log("🤖 AI Butler manager initialized");
    }
    setupAIButlerToggle() {
        const toggleBtn = document.getElementById("toggleAI");
        const aiStateSpan = document.getElementById("aiState");
        if (toggleBtn && aiStateSpan) {
            toggleBtn.addEventListener("click", () => {
                this.aiButlerEnabled = !this.aiButlerEnabled;
                aiStateSpan.textContent = this.aiButlerEnabled ? "ON" : "OFF";
                emit("ui.ai_butler.toggled", { enabled: this.aiButlerEnabled });
                const activeFlows = flowRunner.getActiveFlows();
                activeFlows.forEach(flowId => {
                    console.log(`AI Butler ${this.aiButlerEnabled ? "enabled" : "disabled"} for flow: ${flowId}`);
                });
            });
        }
    }
    setupCountdownDisplays() {
        on("ui.countdown.tick", event => {
            this.updateCountdownDisplays(event.detail.flow, event.detail.node, event.detail.remaining);
        });
        on("I.default.applied", event => {
            this.clearCountdownDisplay(event.detail.flow, event.detail.node);
        });
        on("B.default.applied", event => {
            this.clearCountdownDisplay(event.detail.flow, event.detail.node);
        });
        on("O.default.applied", event => {
            this.clearCountdownDisplay(event.detail.flow, event.detail.node);
        });
    }
    setupToastNotifications() {
        const toastElement = document.getElementById("toast");
        if (!toastElement)
            return;
        const showToast = (message) => {
            toastElement.textContent = message;
            toastElement.classList.add("show");
            setTimeout(() => {
                toastElement.classList.remove("show");
            }, 2400);
        };
        on("I.default.applied", event => {
            showToast(`✅ ${event.detail.action} applied automatically`);
        });
        on("B.default.applied", () => {
            showToast("⚖️ Fair counter-offer submitted");
        });
        on("O.default.applied", () => {
            showToast("👥 Enrolled in collective action");
        });
        on("flow.error", event => {
            showToast(`❌ Error in ${event.detail.flow} flow`);
        });
    }
    updateCountdownDisplays(flowId, nodeId, remaining) {
        const flowCountdowns = [
            `${flowId}Countdown`,
            `${flowId}-countdown`,
            `${nodeId}-countdown`,
            "countdown",
        ];
        flowCountdowns.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (this.aiButlerEnabled && remaining > 0) {
                    element.textContent = `Auto-apply in ${remaining}s`;
                    element.style.display = "block";
                }
                else if (!this.aiButlerEnabled) {
                    element.textContent = "AI Butler is OFF";
                    element.style.display = "block";
                }
                else {
                    element.style.display = "none";
                }
            }
        });
        if (flowId === "groceries" && nodeId === "suggest_swap") {
            const swapCountdown = document.querySelector(".countdown");
            if (swapCountdown) {
                swapCountdown.textContent = this.aiButlerEnabled ? `${remaining}s` : "OFF";
            }
        }
    }
    clearCountdownDisplay(flowId, nodeId) {
        const countdownElements = [
            `${flowId}Countdown`,
            `${flowId}-countdown`,
            `${nodeId}-countdown`,
            "countdown",
        ];
        countdownElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = "none";
                element.textContent = "";
            }
        });
        const genericCountdowns = document.querySelectorAll(".countdown");
        genericCountdowns.forEach(element => {
            element.textContent = "";
            element.style.display = "none";
        });
    }
    isEnabled() {
        return this.aiButlerEnabled;
    }
    setEnabled(enabled) {
        this.aiButlerEnabled = enabled;
        emit("ui.ai_butler.toggled", { enabled });
    }
    toggle() {
        this.setEnabled(!this.aiButlerEnabled);
    }
}
export const aiButlerManager = new AIButlerManagerService();
//# sourceMappingURL=ai-butler-manager.js.map