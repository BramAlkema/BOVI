/**
 * BOVI Money-Veil Card UI
 * Personal inflation impact visualization
 */

import { calculateMoneyVeil } from "../services/money-veil.js";
import { generateWeeklyDigest } from "../services/weekly-digest.js";
import { StorageKeys, Defaults } from "../core/constants.js";

export function setupMoneyVeilCard(): void {
  // Create money-veil card if it doesn't exist
  const dashboard = document.querySelector("main");
  if (dashboard && !dashboard.querySelector(".money-veil-card")) {
    const card = createMoneyVeilCard();
    dashboard.appendChild(card);

    // Set up event handlers
    const digestBtn = card.querySelector("#weekly-digest-btn");
    digestBtn?.addEventListener("click", async () => {
      const digest = await generateWeeklyDigest();
      showDigestModal(digest);
    });
  }

  // Update money veil data
  updateMoneyVeilData();

  // Set up periodic updates
  setInterval(updateMoneyVeilData, 5 * 60 * 1000); // Every 5 minutes
}

function createMoneyVeilCard(): HTMLElement {
  const card = document.createElement("div");
  card.className = "money-veil-card panel";
  card.innerHTML = `
    <h3>💰 Personal Money Veil</h3>
    <div class="veil-metrics">
      <div class="metric">
        <span class="metric-label">Inflation Drift:</span>
        <span class="metric-value" id="inflation-drift">Loading...</span>
      </div>
      <div class="metric">
        <span class="metric-label">Bracket Creep:</span>
        <span class="metric-value" id="bracket-creep">Loading...</span>
      </div>
      <div class="metric">
        <span class="metric-label">Real Rate Impact:</span>
        <span class="metric-value" id="real-rate">Loading...</span>
      </div>
      <div class="metric total">
        <span class="metric-label">Net Impact:</span>
        <span class="metric-value" id="net-impact">Loading...</span>
      </div>
    </div>
    <div class="veil-actions">
      <button id="weekly-digest-btn" class="btn secondary">Weekly Digest</button>
      <button id="recalculate-btn" class="btn brand">Recalculate</button>
    </div>
  `;

  // Add recalculate handler
  const recalculateBtn = card.querySelector("#recalculate-btn");
  recalculateBtn?.addEventListener("click", updateMoneyVeilData);

  return card;
}

async function updateMoneyVeilData(): Promise<void> {
  try {
    // Get user financial data (mock for now)
    const income = parseFloat(localStorage.getItem(StorageKeys.USER_INCOME) || Defaults.USER_INCOME);
    const savings = parseFloat(localStorage.getItem(StorageKeys.USER_SAVINGS) || Defaults.USER_SAVINGS);
    const interestRate = 0.04; // 4%

    const veilData = await calculateMoneyVeil(income, savings, interestRate);

    // Update display
    const inflationDrift = document.querySelector("#inflation-drift");
    const bracketCreep = document.querySelector("#bracket-creep");
    const realRate = document.querySelector("#real-rate");
    const netImpact = document.querySelector("#net-impact");

    if (inflationDrift) {
      const driftValue = veilData.inflationDrift * 100;
      const drift = driftValue.toFixed(2);
      inflationDrift.textContent = `${driftValue > 0 ? "+" : ""}${drift}%`;
      inflationDrift.className = `metric-value ${driftValue > 0 ? "negative" : "positive"}`;
    }

    if (bracketCreep) bracketCreep.textContent = `£${Math.abs(veilData.bracketCreep).toFixed(2)}`;
    if (realRate) realRate.textContent = `£${veilData.realRate.toFixed(2)}`;
    if (netImpact) {
      netImpact.textContent = `£${veilData.netImpact.toFixed(2)}`;
      netImpact.className = `metric-value ${veilData.netImpact < 0 ? "negative" : "positive"}`;
    }
  } catch (error) {
    console.error("Money veil calculation error:", error);
    showError("Failed to calculate money veil impact");
  }
}

function showDigestModal(digest: any): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal money-veil-modal">
      <div class="modal-header">
        <h3>📊 Weekly Money-Veil Digest</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="digest-period">${digest.period}</div>
        
        <div class="digest-section">
          <h4>Highlights</h4>
          <ul>
            ${digest.highlights.map((h: string) => `<li>${h}</li>`).join("")}
          </ul>
        </div>
        
        <div class="digest-section">
          <h4>Net Change</h4>
          <div class="net-change ${digest.netChange < 0 ? "negative" : "positive"}">
            £${Math.abs(digest.netChange).toFixed(2)} ${digest.netChange < 0 ? "worse off" : "better off"}
          </div>
        </div>
        
        <div class="digest-section">
          <h4>Recommendations</h4>
          <ul>
            ${digest.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close handlers
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

function showError(message: string): void {
  const errorEl = document.createElement("div");
  errorEl.className = "toast error";
  errorEl.textContent = message;
  document.body.appendChild(errorEl);

  setTimeout(() => errorEl.remove(), 3000);
}
