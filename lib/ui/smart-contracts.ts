/**
 * BOVI Smart Contracts UI
 * Interface for creating and managing off-chain contracts
 */

import {
  createSmartContract,
  type ContractClause,
  type SmartContract,
} from "../services/smart-contracts.js";

export function setupSmartContractUI(): void {
  // Add contract creation to relevant contexts
  addContractButtons();

  // Listen for contract creation requests
  window.addEventListener("bovi.createContract", async event => {
    const { templateId, parties, terms } = (event as CustomEvent).detail;

    try {
      const result = await createSmartContract(templateId, parties, terms);

      // Show contract and receipts
      showContractModal(result.contract, result.receipt);

      showNotification("Smart contract created successfully!");
    } catch (error) {
      showNotification("Failed to create contract", "error");
      console.error("Contract creation error:", error);
    }
  });
}

function addContractButtons(): void {
  // Add to rent section
  const rentSection = document.querySelector("#rent");
  if (rentSection && !rentSection.querySelector(".contract-button")) {
    const button = createContractButton("rent", ["tenant", "landlord"]);
    rentSection.appendChild(button);
  }

  // Add to other relevant sections
  const sections = [
    { selector: "#energy", templateId: "subscription", parties: ["consumer", "supplier"] },
    { selector: ".salary-section", templateId: "salary", parties: ["employee", "employer"] },
  ];

  sections.forEach(({ selector, templateId, parties }) => {
    const section = document.querySelector(selector);
    if (section && !section.querySelector(".contract-button")) {
      const button = createContractButton(templateId, parties);
      section.appendChild(button);
    }
  });
}

function createContractButton(templateId: string, parties: string[]): HTMLElement {
  const button = document.createElement("button");
  button.className = "btn secondary contract-button";
  button.textContent = "📄 Create Smart Contract";

  button.addEventListener("click", () => {
    showContractCreationModal(templateId, parties);
  });

  return button;
}

function showContractCreationModal(templateId: string, parties: string[]): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal contract-modal">
      <div class="modal-header">
        <h3>📄 Create Smart Contract</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="contract-form">
          <div class="form-group">
            <label>Template:</label>
            <select name="templateId" class="form-input">
              <option value="rent" ${templateId === "rent" ? "selected" : ""}>Rent Agreement</option>
              <option value="salary" ${templateId === "salary" ? "selected" : ""}>Salary Review</option>
              <option value="loan" ${templateId === "loan" ? "selected" : ""}>Loan Agreement</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Parties:</label>
            <div class="parties-inputs">
              ${parties
    .map(
      (party, i) => `
                <input type="text" name="party-${i}" placeholder="${party}" value="${party}" class="form-input">
              `
    )
    .join("")}
            </div>
          </div>
          
          <div class="form-group">
            <label>LTS Index:</label>
            <select name="ltsIndex" class="form-input">
              <option value="bovi-local">BOVI Local LTS</option>
              <option value="bovi-cohort">BOVI Cohort LTS</option>
              <option value="ons-cpi">ONS Official CPI</option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Cap (basis points):</label>
              <input type="number" name="capBp" placeholder="e.g., 300" class="form-input">
            </div>
            <div class="form-group">
              <label>Floor (basis points):</label>
              <input type="number" name="floorBp" placeholder="e.g., -100" class="form-input">
            </div>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" name="carry" checked>
              Carry over unused adjustments
            </label>
          </div>
          
          <div class="form-group">
            <label>Undo window (hours):</label>
            <input type="number" name="undoWindowHours" value="72" class="form-input">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn brand">Create Contract</button>
            <button type="button" class="modal-cancel btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Form handler
  const form = modal.querySelector("#contract-form") as HTMLFormElement;
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData(form);
    const clause: ContractClause = {
      ltsIndex: formData.get("ltsIndex") as string,
      capBp: parseInt(formData.get("capBp") as string) || undefined,
      floorBp: parseInt(formData.get("floorBp") as string) || undefined,
      carry: formData.has("carry"),
      undoWindowHours: parseInt(formData.get("undoWindowHours") as string) || 72,
    };

    const contractParties = parties
      .map((_, i) => formData.get(`party-${i}`) as string)
      .filter(Boolean);
    const template = formData.get("templateId") as "rent" | "salary" | "loan";

    try {
      const result = await createSmartContract(template, contractParties, clause);
      modal.remove();
      showContractModal(result.contract, result.receipt);
      showNotification("Smart contract created successfully!");
    } catch (error) {
      showNotification("Failed to create contract", "error");
      console.error("Contract creation error:", error);
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

function showContractModal(contract: SmartContract, receipt: { pdf: Blob; json: string }): void {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal contract-result-modal">
      <div class="modal-header">
        <h3>📄 Smart Contract Created</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="contract-summary">
          <h4>${contract.templateId} Contract</h4>
          <p><strong>ID:</strong> ${contract.id}</p>
          <p><strong>Parties:</strong> ${contract.parties.join(", ")}</p>
          <p><strong>Terms:</strong></p>
          <div class="contract-terms">${contract.humanReadable}</div>
          <p><strong>Effective:</strong> ${new Date(contract.effectiveFrom).toLocaleDateString()}</p>
          <p><strong>Undo Until:</strong> ${new Date(contract.undoDeadline).toLocaleDateString()}</p>
        </div>
        
        <div class="contract-actions">
          <button id="download-pdf" class="btn brand">Download PDF</button>
          <button id="download-json" class="btn secondary">Download JSON</button>
          <button id="copy-link" class="btn secondary">Copy Share Link</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Download handlers
  const pdfBtn = modal.querySelector("#download-pdf");
  const jsonBtn = modal.querySelector("#download-json");
  const copyBtn = modal.querySelector("#copy-link");

  pdfBtn?.addEventListener("click", () => {
    const url = URL.createObjectURL(receipt.pdf);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${contract.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  });

  jsonBtn?.addEventListener("click", () => {
    const blob = new Blob([receipt.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${contract.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  copyBtn?.addEventListener("click", async () => {
    const shareUrl = `${window.location.origin}/contract/${contract.id}`;
    await navigator.clipboard.writeText(shareUrl);
    showNotification("Contract link copied to clipboard!");
  });

  // Close handler
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

function showNotification(message: string, type: "info" | "error" = "info"): void {
  const notification = document.createElement("div");
  notification.className = `toast ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}
