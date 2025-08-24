/**
 * BOVI Cohort Engine UI
 * Interface for joining and managing cohort auctions
 */

import {
  createCohortAuction,
  joinCohortAuction,
} from "../services/cohort-auctions.js";

export function setupCohortEngine(): void {
  // Add cohort opportunities to relevant sections
  addCohortOpportunities();

  // Set up periodic auction monitoring
  startCohortMonitoring();

  // Listen for cohort events
  window.addEventListener("bovi.joinCohort", async event => {
    const { auctionId } = (event as CustomEvent).detail;

    try {
      const result = await joinCohortAuction(auctionId);
      showCohortResult(result);
    } catch (error) {
      showNotification("Failed to join cohort", "error");
      console.error("Cohort joining error:", error);
    }
  });
}

function addCohortOpportunities(): void {
  // Add to energy section
  const energySection = document.querySelector("#energy");
  if (energySection && !energySection.querySelector(".cohort-opportunity")) {
    const opportunity = createCohortOpportunity("energy", "Switch with group for better rates");
    energySection.appendChild(opportunity);
  }

  // Add to groceries section
  const groceriesSection = document.querySelector("#groceries");
  if (groceriesSection && !groceriesSection.querySelector(".cohort-opportunity")) {
    const opportunity = createCohortOpportunity("groceries", "Bulk buying power for staples");
    groceriesSection.appendChild(opportunity);
  }
}

function createCohortOpportunity(category: string, description: string): HTMLElement {
  const opportunity = document.createElement("div");
  opportunity.className = "cohort-opportunity panel";
  opportunity.innerHTML = `
    <div class="cohort-header">
      <h4>👥 Cohort Opportunity</h4>
      <span class="category-badge">${category}</span>
    </div>
    <p class="cohort-description">${description}</p>
    <div class="cohort-stats">
      <div class="stat">
        <span class="label">Participants:</span>
        <span class="value" data-stat="participants">-</span>
      </div>
      <div class="stat">
        <span class="label">Potential Savings:</span>
        <span class="value" data-stat="savings">-</span>
      </div>
      <div class="stat">
        <span class="label">Join Deadline:</span>
        <span class="value" data-stat="deadline">-</span>
      </div>
    </div>
    <div class="cohort-actions">
      <button class="join-cohort-btn btn brand" data-category="${category}">Join Cohort</button>
      <button class="create-cohort-btn btn secondary" data-category="${category}">Create New</button>
    </div>
    <div class="bovi-guarantee">
      <span class="guarantee-badge">BOVI Guarantee</span>
      <span class="guarantee-text">You will save money or pay nothing extra</span>
    </div>
  `;

  // Add event handlers
  const joinBtn = opportunity.querySelector(".join-cohort-btn");
  const createBtn = opportunity.querySelector(".create-cohort-btn");

  joinBtn?.addEventListener("click", () => showCohortJoinModal(category));
  createBtn?.addEventListener("click", () => showCohortCreationModal(category));

  return opportunity;
}

function showCohortJoinModal(category: string): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal cohort-modal">
      <div class="modal-header">
        <h3>👥 Join ${category} Cohort</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="cohort-details">
          <p>Join a group of consumers to negotiate better ${category} rates together.</p>
          
          <div class="benefits">
            <h4>Benefits:</h4>
            <ul>
              <li>💪 Collective bargaining power</li>
              <li>💰 Guaranteed savings or no cost</li>
              <li>📊 Transparent pricing</li>
              <li>🔒 BOVI no-worse-off guarantee</li>
            </ul>
          </div>
          
          <div class="current-usage">
            <h4>Your Current Situation:</h4>
            <div class="usage-inputs">
              <input type="number" id="current-cost" placeholder="Current monthly cost (£)" class="form-input">
              <input type="number" id="usage-amount" placeholder="Monthly usage" class="form-input">
            </div>
          </div>
          
          <div class="cohort-preview" id="cohort-preview" style="display: none;">
            <h4>Projected Outcome:</h4>
            <div class="outcome-card">
              <div class="outcome-metric">
                <span class="label">Projected Monthly Cost:</span>
                <span class="value" id="projected-cost">£-</span>
              </div>
              <div class="outcome-metric">
                <span class="label">Monthly Savings:</span>
                <span class="value positive" id="projected-savings">£-</span>
              </div>
              <div class="guarantee-status" id="guarantee-status">
                <span class="guarantee-icon">✅</span>
                <span class="guarantee-text">BOVI guarantee: You will benefit</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button id="join-btn" class="btn brand" disabled>Join Cohort</button>
          <button class="modal-cancel btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Form logic
  const currentCostInput = modal.querySelector("#current-cost") as HTMLInputElement;
  const usageInput = modal.querySelector("#usage-amount") as HTMLInputElement;
  const joinBtn = modal.querySelector("#join-btn") as HTMLButtonElement;
  const preview = modal.querySelector("#cohort-preview") as HTMLElement;

  const updatePreview = () => {
    const currentCost = parseFloat(currentCostInput.value);
    const usage = parseFloat(usageInput.value);

    if (currentCost && usage) {
      // Mock calculation
      const projectedCost = currentCost * 0.92; // 8% savings
      const savings = currentCost - projectedCost;

      modal.querySelector("#projected-cost")!.textContent = `£${projectedCost.toFixed(2)}`;
      modal.querySelector("#projected-savings")!.textContent = `£${savings.toFixed(2)}`;

      preview.style.display = "block";
      joinBtn.disabled = false;
    }
  };

  currentCostInput.addEventListener("input", updatePreview);
  usageInput.addEventListener("input", updatePreview);

  joinBtn.addEventListener("click", async () => {
    try {
      // Mock auction ID - in production, would select from available auctions
      const result = await joinCohortAuction(`${category}_auction_${Date.now()}`);
      modal.remove();
      showCohortResult(result);
    } catch (error) {
      showNotification("Failed to join cohort", "error");
      console.error("Cohort error:", error);
    }
  });

  // Close handlers
  const closeBtn = modal.querySelector(".modal-close");
  const cancelBtn = modal.querySelector(".modal-cancel");

  [closeBtn, cancelBtn].forEach(btn => {
    btn?.addEventListener("click", () => modal.remove());
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

function showCohortCreationModal(category: string): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal cohort-modal">
      <div class="modal-header">
        <h3>🚀 Create ${category} Cohort</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p>Start a new cohort for ${category} and invite others to join for collective bargaining power.</p>
        
        <div class="form-group">
          <label>Target Group Size:</label>
          <input type="number" id="target-size" value="50" min="10" max="1000" class="form-input">
        </div>
        
        <div class="form-group">
          <label>Category Description:</label>
          <input type="text" id="category-desc" placeholder="Brief description of what you're organizing" class="form-input">
        </div>
        
        <div class="modal-actions">
          <button id="create-auction-btn" class="btn brand">Create Cohort</button>
          <button class="modal-cancel btn">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const createBtn = modal.querySelector("#create-auction-btn");
  const targetSizeInput = modal.querySelector("#target-size") as HTMLInputElement;

  createBtn?.addEventListener("click", async () => {
    const targetSize = parseInt(targetSizeInput.value) || 50;

    try {
      await createCohortAuction(category, targetSize);
      modal.remove();
      showNotification(`Created ${category} cohort! Share with friends to build momentum.`);
      updateCohortDisplays(); // Refresh UI
    } catch (error) {
      showNotification("Failed to create cohort", "error");
      console.error("Cohort creation error:", error);
    }
  });

  // Close handlers
  const closeBtn = modal.querySelector(".modal-close");
  const cancelBtn = modal.querySelector(".modal-cancel");

  [closeBtn, cancelBtn].forEach(btn => {
    btn?.addEventListener("click", () => modal.remove());
  });
}

function showCohortResult(result: any): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal cohort-result-modal">
      <div class="modal-header">
        <h3>${result.joined ? "✅ Joined Cohort!" : "⚠️ Cohort Update"}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="result-summary">
          ${
  result.joined
    ? `
            <p class="success">Successfully joined the cohort!</p>
            <div class="savings-highlight">
              <span class="label">Projected Savings:</span>
              <span class="value">£${result.projectedSavings.toFixed(2)}</span>
            </div>
          `
    : `
            <p class="info">Cohort not joined based on current conditions.</p>
          `
}
          
          <div class="guarantee-statement">
            <h4>BOVI Guarantee:</h4>
            <p>${result.guarantee}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".modal-close");
  closeBtn?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

function startCohortMonitoring(): void {
  // Update cohort displays every minute
  setInterval(updateCohortDisplays, 60 * 1000);

  // Initial update
  updateCohortDisplays();
}

function updateCohortDisplays(): void {
  const opportunities = document.querySelectorAll(".cohort-opportunity");
  opportunities.forEach(opportunity => {
    // Mock data update - in production, would fetch real auction data
    const participantsEl = opportunity.querySelector("[data-stat=\"participants\"]");
    const savingsEl = opportunity.querySelector("[data-stat=\"savings\"]");
    const deadlineEl = opportunity.querySelector("[data-stat=\"deadline\"]");

    if (participantsEl)
      participantsEl.textContent = Math.floor(Math.random() * 100 + 20).toString();
    if (savingsEl) savingsEl.textContent = `£${(Math.random() * 50 + 10).toFixed(2)}`;
    if (deadlineEl) deadlineEl.textContent = "3 days";
  });
}

function showNotification(message: string, type: "info" | "error" = "info"): void {
  const notification = document.createElement("div");
  notification.className = `toast ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}
