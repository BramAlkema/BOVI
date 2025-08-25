/**
 * BOVI Smart Contracts UI
 * Interface for creating and managing off-chain contracts
 */

import {
  createSmartContract,
  downloadPDFReceipt,
  getStoredContracts,
  signContract,
  canUndoContract,
  undoContract,
  type ContractClause,
  type SmartContract,
} from "../services/smart-contracts.js";

export function setupSmartContractUI(): void {
  // Add contract creation to relevant contexts
  addContractButtons();
  
  // Add contract management interface
  addContractManagementPanel();

  // Listen for contract creation requests
  window.addEventListener("bovi.createContract", async event => {
    const { templateId, parties, terms } = (event as CustomEvent).detail;

    try {
      const result = await createSmartContract(templateId, parties, terms);

      // Show contract and receipts
      showContractModal(result.contract, result.receipt);

      showNotification("Smart contract created successfully!");
      
      // Refresh contract list if visible
      refreshContractList();
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
    downloadPDFReceipt(receipt.pdf, contract.id);
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

function addContractManagementPanel(): void {
  // Find a suitable container (bundle or scenarios section)
  const targetContainer = document.querySelector("#bundle") || document.querySelector("#scenarios");
  
  if (targetContainer && !targetContainer.querySelector(".contract-management")) {
    const panel = document.createElement("div");
    panel.className = "panel contract-management";
    panel.innerHTML = `
      <h3>📄 Smart Contract Management</h3>
      <div class="contract-list-container">
        <button id="show-contracts" class="btn secondary">View My Contracts</button>
        <div id="contract-list" class="contract-list" style="display:none;">
          <!-- Contract list will be populated here -->
        </div>
      </div>
    `;
    
    targetContainer.appendChild(panel);
    
    // Set up event listeners
    const showBtn = panel.querySelector("#show-contracts");
    showBtn?.addEventListener("click", () => {
      const listContainer = panel.querySelector("#contract-list") as HTMLElement;
      if (listContainer) {
        const isVisible = listContainer.style.display !== "none";
        if (isVisible) {
          listContainer.style.display = "none";
          (showBtn as HTMLButtonElement).textContent = "View My Contracts";
        } else {
          listContainer.style.display = "block";
          (showBtn as HTMLButtonElement).textContent = "Hide Contracts";
          refreshContractList();
        }
      }
    });
  }
}

function refreshContractList(): void {
  const listContainer = document.querySelector("#contract-list");
  if (!listContainer) return;
  
  const contracts = getStoredContracts();
  
  if (contracts.length === 0) {
    listContainer.innerHTML = '<p class="text-muted">No contracts found. Create your first contract above!</p>';
    return;
  }
  
  const contractHTML = contracts.map(contract => `
    <div class="contract-item card">
      <div class="contract-header">
        <h4>${contract.templateId.toUpperCase()} Contract</h4>
        <span class="contract-status ${contract.signed ? 'signed' : 'unsigned'}">${contract.signed ? '✓ Signed' : '⏳ Pending'}</span>
      </div>
      <div class="contract-details">
        <p><strong>ID:</strong> ${contract.id}</p>
        <p><strong>Parties:</strong> ${contract.parties.join(", ")}</p>
        <p><strong>Created:</strong> ${new Date(contract.created).toLocaleDateString()}</p>
        <p><strong>Effective:</strong> ${new Date(contract.effectiveFrom).toLocaleDateString()}</p>
        ${canUndoContract(contract.id) ? `<p class="undo-warning"><strong>⏰ Can undo until:</strong> ${new Date(contract.undoDeadline).toLocaleDateString()}</p>` : ''}
      </div>
      <div class="contract-actions">
        ${!contract.signed ? `<button class="btn brand sign-contract" data-contract-id="${contract.id}">✓ Sign Contract</button>` : ''}
        <button class="btn secondary download-pdf" data-contract-id="${contract.id}">📄 Download PDF</button>
        ${canUndoContract(contract.id) ? `<button class="btn danger undo-contract" data-contract-id="${contract.id}">❌ Undo Contract</button>` : ''}
      </div>
    </div>
  `).join('');
  
  listContainer.innerHTML = contractHTML;
  
  // Add event listeners for actions
  listContainer.querySelectorAll('.sign-contract').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const contractId = (e.target as HTMLElement).dataset.contractId;
      if (contractId && signContract(contractId)) {
        showNotification('Contract signed successfully!');
        refreshContractList();
      }
    });
  });
  
  listContainer.querySelectorAll('.download-pdf').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const contractId = (e.target as HTMLElement).dataset.contractId;
      if (contractId) {
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
          // Re-generate PDF for download
          const result = await createSmartContract(
            contract.templateId as "rent" | "salary" | "loan",
            contract.parties,
            contract.clause
          );
          downloadPDFReceipt(result.receipt.pdf, contractId);
        }
      }
    });
  });
  
  listContainer.querySelectorAll('.undo-contract').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const contractId = (e.target as HTMLElement).dataset.contractId;
      if (contractId && confirm('Are you sure you want to undo this contract? This action cannot be reversed.')) {
        if (undoContract(contractId)) {
          showNotification('Contract undone successfully');
          refreshContractList();
        } else {
          showNotification('Failed to undo contract - undo window may have expired', 'error');
        }
      }
    });
  });
}
