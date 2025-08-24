/**
 * BOVI AI Butler Manager
 * Manages AI Butler state and countdown displays
 */

import { emit, on } from "../bus.js";
import { flowRunner } from "../flow/index.js";

/**
 * AI Butler manager service that handles butler state and UI integration
 */
export class AIButlerManagerService {
  private aiButlerEnabled = true;

  /**
   * Initialize AI Butler integration
   */
  initialize(): void {
    this.setupAIButlerToggle();
    this.setupCountdownDisplays();
    this.setupToastNotifications();

    console.log("🤖 AI Butler manager initialized");
  }

  /**
   * Set up AI Butler toggle functionality
   */
  private setupAIButlerToggle(): void {
    // Get existing AI toggle
    const toggleBtn = document.getElementById("toggleAI");
    const aiStateSpan = document.getElementById("aiState");

    if (toggleBtn && aiStateSpan) {
      toggleBtn.addEventListener("click", () => {
        this.aiButlerEnabled = !this.aiButlerEnabled;
        aiStateSpan.textContent = this.aiButlerEnabled ? "ON" : "OFF";

        emit("ui.ai_butler.toggled", { enabled: this.aiButlerEnabled });

        // Update all flow runners
        const activeFlows = flowRunner.getActiveFlows();
        activeFlows.forEach(flowId => {
          // Note: This would need to be updated based on actual flow runner implementation
          console.log(
            `AI Butler ${this.aiButlerEnabled ? "enabled" : "disabled"} for flow: ${flowId}`
          );
        });
      });
    }
  }

  /**
   * Set up countdown display management
   */
  private setupCountdownDisplays(): void {
    // Update countdown displays for each flow
    on("ui.countdown.tick", event => {
      this.updateCountdownDisplays(event.detail.flow, event.detail.node, event.detail.remaining);
    });

    // Handle timer completion events
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

  /**
   * Set up toast notifications for flow events
   */
  private setupToastNotifications(): void {
    const toastElement = document.getElementById("toast");
    if (!toastElement) return;

    const showToast = (message: string): void => {
      toastElement.textContent = message;
      toastElement.classList.add("show");
      setTimeout(() => {
        toastElement.classList.remove("show");
      }, 2400);
    };

    // Toast for significant events
    on("I.default.applied", event => {
      showToast(`✅ ${event.detail.action} applied automatically`);
    });

    on("B.default.applied", event => {
      showToast("⚖️ Fair counter-offer submitted");
    });

    on("O.default.applied", event => {
      showToast("👥 Enrolled in collective action");
    });

    on("flow.error", event => {
      showToast(`❌ Error in ${event.detail.flow} flow`);
    });
  }

  /**
   * Update countdown displays in the UI
   */
  private updateCountdownDisplays(flowId: string, nodeId: string, remaining: number): void {
    // Update flow-specific countdowns
    const flowCountdowns = [
      `${flowId}Countdown`,
      `${flowId}-countdown`,
      `${nodeId}-countdown`,
      "countdown", // Generic countdown element
    ];

    flowCountdowns.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (this.aiButlerEnabled && remaining > 0) {
          element.textContent = `Auto-apply in ${remaining}s`;
          element.style.display = "block";
        } else if (!this.aiButlerEnabled) {
          element.textContent = "AI Butler is OFF";
          element.style.display = "block";
        } else {
          element.style.display = "none";
        }
      }
    });

    // Update specific UI elements based on flow
    if (flowId === "groceries" && nodeId === "suggest_swap") {
      const swapCountdown = document.querySelector(".countdown");
      if (swapCountdown) {
        swapCountdown.textContent = this.aiButlerEnabled ? `${remaining}s` : "OFF";
      }
    }
  }

  /**
   * Clear countdown display when timer completes or is cancelled
   */
  private clearCountdownDisplay(flowId: string, nodeId: string): void {
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

    // Clear specific countdown elements
    const genericCountdowns = document.querySelectorAll(".countdown");
    genericCountdowns.forEach(element => {
      (element as HTMLElement).textContent = "";
      (element as HTMLElement).style.display = "none";
    });
  }

  /**
   * Get AI Butler enabled state
   */
  isEnabled(): boolean {
    return this.aiButlerEnabled;
  }

  /**
   * Set AI Butler enabled state
   */
  setEnabled(enabled: boolean): void {
    this.aiButlerEnabled = enabled;
    emit("ui.ai_butler.toggled", { enabled });
  }

  /**
   * Toggle AI Butler state
   */
  toggle(): void {
    this.setEnabled(!this.aiButlerEnabled);
  }
}

// Export global instance
export const aiButlerManager = new AIButlerManagerService();
