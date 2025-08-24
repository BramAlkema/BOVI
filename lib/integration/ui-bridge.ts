/**
 * BOVI UI Bridge
 * Bridges existing HTML UI elements with the flow system
 */

import { emit, on } from "../bus.js";
import { flowRunner } from "../flow/index.js";
import type { FlowSpec } from "../flow/types.js";

/**
 * UI Bridge service that integrates existing UI with flow system
 */
export class UIBridgeService {
  private flowSpecs: Record<string, FlowSpec> = {};

  /**
   * Initialize UI bridge with flow specifications
   */
  initialize(flowSpecs: Record<string, FlowSpec>): void {
    this.flowSpecs = flowSpecs;

    // Integrate with existing UI elements
    this.integrateGroceries();
    this.integrateRent();
    this.integrateEnergy();

    console.log("🔌 UI bridge initialized");
  }

  /**
   * Integrate groceries flow with existing UI
   */
  private integrateGroceries(): void {
    const scanBtn = document.getElementById("scanBtn");
    if (scanBtn) {
      scanBtn.addEventListener("click", () => {
        emit("V.pda.started", {
          flow: "groceries",
          node: "scan_basket",
          items:
            this.flowSpecs.groceries?.nodes.find(n => n.id === "scan_basket")?.config?.items || [],
        });

        flowRunner.startFlow("groceries");
      });
    }

    // Integrate existing swap buttons with flow system
    const applySwapBtn = document.getElementById("applySwap");
    const cancelSwapBtn = document.getElementById("cancelSwap");

    if (applySwapBtn) {
      applySwapBtn.addEventListener("click", () => {
        flowRunner.overrideAction("groceries", "suggest_swap", "apply");
      });
    }

    if (cancelSwapBtn) {
      cancelSwapBtn.addEventListener("click", () => {
        flowRunner.cancelTimeout("groceries", "suggest_swap", "user_cancelled");
      });
    }

    // Listen for flow events to update UI
    on("I.default.applied", event => {
      if (event.detail.flow === "groceries") {
        this.updateGroceriesKPIs(event.detail);
      }
    });
  }

  /**
   * Integrate rent flow with existing UI
   */
  private integrateRent(): void {
    // Monitor input changes to trigger flow calculations
    const rentInputs = ["rentCurrent", "rentProposed", "rentIndex"];

    rentInputs.forEach(inputId => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.addEventListener("input", () => {
          const context = {
            current_rent: +(document.getElementById("rentCurrent") as HTMLInputElement).value,
            proposed_increase: +(document.getElementById("rentProposed") as HTMLInputElement).value,
            personal_index: +(document.getElementById("rentIndex") as HTMLInputElement).value,
          };

          // Update flow context and trigger calculation
          emit("B.calculate.started", {
            flow: "rent",
            node: "calculate_fair_counter",
            context,
          });
        });
      }
    });

    // Integrate existing rent buttons
    const submitBtn = document.getElementById("rentSubmit");
    const cancelBtn = document.getElementById("rentCancel");

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        flowRunner.overrideAction("rent", "submit_counter", "apply");
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        flowRunner.cancelTimeout("rent", "submit_counter", "user_cancelled");
      });
    }
  }

  /**
   * Integrate energy flow with existing UI
   */
  private integrateEnergy(): void {
    // Monitor tariff changes
    const tariffInputs = ["tariff", "baseline"];

    tariffInputs.forEach(inputId => {
      const input = document.getElementById(inputId) as HTMLInputElement;
      if (input) {
        input.addEventListener("input", () => {
          const context = {
            current_tariff: +(document.getElementById("tariff") as HTMLInputElement).value,
            cohort_baseline: +(document.getElementById("baseline") as HTMLInputElement).value,
            enrollment_deadline: (document.getElementById("deadline") as HTMLInputElement).value,
          };

          emit("V.calculate.started", {
            flow: "energy",
            node: "calculate_excess",
            context,
          });
        });
      }
    });

    // Integrate existing energy buttons
    const enrollBtn = document.getElementById("energyEnrol");
    const cancelBtn = document.getElementById("energyCancel");

    if (enrollBtn) {
      enrollBtn.addEventListener("click", () => {
        flowRunner.overrideAction("energy", "enroll_in_cohort", "apply");
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        flowRunner.cancelTimeout("energy", "enroll_in_cohort", "user_cancelled");
      });
    }
  }

  /**
   * Update KPIs from flow events
   */
  private updateGroceriesKPIs(eventDetail: any): void {
    // Update defaults applied counter
    const defaultsKPI = document.getElementById("defaultsKPI");
    if (defaultsKPI) {
      const current = parseInt(defaultsKPI.textContent || "0");
      defaultsKPI.textContent = (current + 1).toString();
    }

    // Update deal quality if available
    if (eventDetail.result?.quality) {
      const dqKPI = document.getElementById("dqKPI");
      const dqChip = document.getElementById("dqChip");

      if (dqKPI) dqKPI.textContent = eventDetail.result.quality;
      if (dqChip) dqChip.textContent = "Groceries";
    }
  }

  /**
   * Update flow specifications
   */
  updateFlowSpecs(flowSpecs: Record<string, FlowSpec>): void {
    this.flowSpecs = flowSpecs;
  }
}

// Export global instance
export const uiBridge = new UIBridgeService();
