import { emit, on } from "../bus.js";
import { flowRunner } from "../flow/index.js";
export class UIBridgeService {
    constructor() {
        this.flowSpecs = {};
    }
    initialize(flowSpecs) {
        this.flowSpecs = flowSpecs;
        this.integrateGroceries();
        this.integrateRent();
        this.integrateEnergy();
        console.log("🔌 UI bridge initialized");
    }
    integrateGroceries() {
        const scanBtn = document.getElementById("scanBtn");
        if (scanBtn) {
            scanBtn.addEventListener("click", () => {
                emit("V.pda.started", {
                    flow: "groceries",
                    node: "scan_basket",
                    items: this.flowSpecs.groceries?.nodes.find(n => n.id === "scan_basket")?.config?.items || [],
                });
                flowRunner.startFlow("groceries");
            });
        }
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
        on("I.default.applied", event => {
            if (event.detail.flow === "groceries") {
                this.updateGroceriesKPIs(event.detail);
            }
        });
    }
    integrateRent() {
        const rentInputs = ["rentCurrent", "rentProposed", "rentIndex"];
        rentInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener("input", () => {
                    const context = {
                        current_rent: +document.getElementById("rentCurrent").value,
                        proposed_increase: +document.getElementById("rentProposed").value,
                        personal_index: +document.getElementById("rentIndex").value,
                    };
                    emit("B.calculate.started", {
                        flow: "rent",
                        node: "calculate_fair_counter",
                        context,
                    });
                });
            }
        });
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
    integrateEnergy() {
        const tariffInputs = ["tariff", "baseline"];
        tariffInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener("input", () => {
                    const context = {
                        current_tariff: +document.getElementById("tariff").value,
                        cohort_baseline: +document.getElementById("baseline").value,
                        enrollment_deadline: document.getElementById("deadline").value,
                    };
                    emit("V.calculate.started", {
                        flow: "energy",
                        node: "calculate_excess",
                        context,
                    });
                });
            }
        });
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
    updateGroceriesKPIs(eventDetail) {
        const defaultsKPI = document.getElementById("defaultsKPI");
        if (defaultsKPI) {
            const current = parseInt(defaultsKPI.textContent || "0");
            defaultsKPI.textContent = (current + 1).toString();
        }
        if (eventDetail.result?.quality) {
            const dqKPI = document.getElementById("dqKPI");
            const dqChip = document.getElementById("dqChip");
            if (dqKPI)
                dqKPI.textContent = eventDetail.result.quality;
            if (dqChip)
                dqChip.textContent = "Groceries";
        }
    }
    updateFlowSpecs(flowSpecs) {
        this.flowSpecs = flowSpecs;
    }
}
export const uiBridge = new UIBridgeService();
//# sourceMappingURL=ui-bridge.js.map