import { createStormProfile, activateStormMode, deactivateStormMode, getStormProfiles, } from "../services/storm-mode.js";
import { BoviEvents, StorageKeys } from "../core/constants.js";
export function setupStormModeUI() {
    const container = createStormModeContainer();
    const dashboard = document.querySelector("main");
    if (dashboard && !dashboard.querySelector(".storm-mode-panel")) {
        dashboard.appendChild(container);
    }
    setupStormModeEventHandlers(container);
    loadStormProfiles();
    window.addEventListener(BoviEvents.STORM_ACTIVATED, event => {
        const { profileId } = event.detail;
        showStormActivationNotification(profileId);
        updateStormModeDisplay();
    });
    window.addEventListener(BoviEvents.STORM_DEACTIVATED, () => {
        showStormDeactivationNotification();
        updateStormModeDisplay();
    });
}
function createStormModeContainer() {
    const container = document.createElement("div");
    container.className = "storm-mode-panel panel";
    container.innerHTML = `
    <div class="storm-header">
      <h3>⛈️ Storm Mode</h3>
      <div class="storm-status" id="storm-status">
        <span class="status-indicator inactive"></span>
        <span class="status-text">Inactive</span>
      </div>
    </div>
    <p class="text-muted">Crisis management with automated profile switching</p>
    
    <div class="storm-actions">
      <button id="create-storm-profile-btn" class="btn brand">Create Storm Profile</button>
      <button id="activate-storm-btn" class="btn danger" disabled>Activate Storm Mode</button>
      <button id="deactivate-storm-btn" class="btn secondary" style="display: none;">Deactivate Storm Mode</button>
    </div>
    
    <div id="storm-profile-form" class="storm-profile-form" style="display: none;">
      <h4>Create Storm Profile</h4>
      <form id="profile-form">
        <div class="form-group">
          <label>Profile Name:</label>
          <input type="text" id="profile-name" placeholder="e.g., 'Emergency Budget'" class="form-input" required>
        </div>
        
        <div class="form-group">
          <label>Trigger Conditions:</label>
          <div class="trigger-conditions">
            <label class="checkbox-label">
              <input type="checkbox" name="trigger" value="inflation-spike" checked>
              Inflation spike (>2% monthly)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="trigger" value="income-drop">
              Income drop (>20%)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="trigger" value="emergency-expense">
              Emergency expense
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>Budget Adjustments:</label>
          <div class="budget-adjustments">
            <div class="adjustment-row">
              <span>Groceries:</span>
              <input type="number" name="groceries" placeholder="-20" class="form-input small"> %
            </div>
            <div class="adjustment-row">
              <span>Entertainment:</span>
              <input type="number" name="entertainment" placeholder="-50" class="form-input small"> %
            </div>
            <div class="adjustment-row">
              <span>Transport:</span>
              <input type="number" name="transport" placeholder="-30" class="form-input small"> %
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn brand">Save Profile</button>
          <button type="button" id="cancel-profile-btn" class="btn">Cancel</button>
        </div>
      </form>
    </div>
    
    <div id="storm-profiles-list" class="storm-profiles-list">
      <div class="loading">Loading storm profiles...</div>
    </div>
  `;
    return container;
}
function setupStormModeEventHandlers(container) {
    const createBtn = container.querySelector("#create-storm-profile-btn");
    const activateBtn = container.querySelector("#activate-storm-btn");
    const deactivateBtn = container.querySelector("#deactivate-storm-btn");
    const profileForm = container.querySelector("#storm-profile-form");
    const form = container.querySelector("#profile-form");
    const cancelBtn = container.querySelector("#cancel-profile-btn");
    createBtn?.addEventListener("click", () => {
        profileForm.style.display = "block";
    });
    cancelBtn?.addEventListener("click", () => {
        profileForm.style.display = "none";
        form.reset();
    });
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const profileName = formData.get("profile-name");
        const triggers = formData.getAll("trigger");
        const budgetAdjustments = {
            groceries: parseInt(formData.get("groceries")) || 0,
            entertainment: parseInt(formData.get("entertainment")) || 0,
            transport: parseInt(formData.get("transport")) || 0,
        };
        try {
            await createStormProfile({
                name: profileName,
                description: `Custom storm profile created for ${profileName}`,
                changes: {
                    pots: budgetAdjustments,
                    contracts: [],
                    rails: [],
                    notifications: {
                        frequency: "medium",
                        channels: ["ui"],
                    },
                },
                triggers,
            });
            profileForm.style.display = "none";
            form.reset();
            await loadStormProfiles();
            showNotification("Storm profile created successfully!");
        }
        catch (error) {
            showNotification("Failed to create storm profile", "error");
            console.error("Storm profile creation error:", error);
        }
    });
    activateBtn?.addEventListener("click", async () => {
        const selectedProfile = container.querySelector(".storm-profile.selected");
        if (selectedProfile) {
            const profileId = selectedProfile.getAttribute("data-profile-id");
            if (profileId) {
                try {
                    await activateStormMode(profileId);
                    updateStormModeDisplay();
                }
                catch (error) {
                    showNotification("Failed to activate storm mode", "error");
                    console.error("Storm activation error:", error);
                }
            }
        }
    });
    deactivateBtn?.addEventListener("click", async () => {
        try {
            await deactivateStormMode();
            updateStormModeDisplay();
        }
        catch (error) {
            showNotification("Failed to deactivate storm mode", "error");
            console.error("Storm deactivation error:", error);
        }
    });
}
async function loadStormProfiles() {
    const container = document.querySelector("#storm-profiles-list");
    if (!container)
        return;
    try {
        const profiles = getStormProfiles();
        const isStormActive = localStorage.getItem(StorageKeys.STORM_MODE_ACTIVE) === "true";
        const activeProfileId = localStorage.getItem(StorageKeys.STORM_MODE_PROFILE);
        if (profiles.length === 0) {
            container.innerHTML = "<div class=\"empty\">No storm profiles created yet</div>";
            return;
        }
        const profilesHTML = profiles
            .map(profile => {
            const isActive = isStormActive && profile.id === activeProfileId;
            return `
        <div class="storm-profile ${isActive ? "active" : ""}" data-profile-id="${profile.id}">
          <div class="profile-header">
            <h4>${profile.name}</h4>
            <div class="profile-status">
              ${isActive ? "<span class=\"status-badge active\">Active</span>" : ""}
            </div>
          </div>
          <div class="profile-triggers">
            <strong>Triggers:</strong> ${profile.triggers.join(", ")}
          </div>
          <div class="profile-adjustments">
            <strong>Budget Changes:</strong>
            ${Object.entries(profile.changes.pots)
                .filter(([_, value]) => value !== 0)
                .map(([category, value]) => `${category}: ${value > 0 ? "+" : ""}${value}%`)
                .join(", ")}
          </div>
          <div class="profile-actions">
            <button class="select-profile-btn btn secondary small" ${isActive ? "disabled" : ""}>
              ${isActive ? "Active" : "Select"}
            </button>
            <button class="delete-profile-btn btn danger small" data-profile-id="${profile.id}">Delete</button>
          </div>
        </div>
      `;
        })
            .join("");
        container.innerHTML = profilesHTML;
        container.querySelectorAll(".select-profile-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const profileEl = e.target.closest(".storm-profile");
                if (profileEl) {
                    container.querySelectorAll(".storm-profile").forEach(p => p.classList.remove("selected"));
                    profileEl.classList.add("selected");
                    const activateBtn = document.querySelector("#activate-storm-btn");
                    if (activateBtn)
                        activateBtn.disabled = false;
                }
            });
        });
        container.querySelectorAll(".delete-profile-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const profileId = e.target.getAttribute("data-profile-id");
                if (profileId && confirm("Delete this storm profile?")) {
                    try {
                        const profiles = getStormProfiles();
                        const updatedProfiles = profiles.filter(p => p.id !== profileId);
                        localStorage.setItem(StorageKeys.STORM_PROFILES, JSON.stringify(updatedProfiles));
                        await loadStormProfiles();
                        showNotification("Storm profile deleted");
                    }
                    catch (error) {
                        showNotification("Failed to delete profile", "error");
                    }
                }
            });
        });
    }
    catch (error) {
        console.error("Failed to load storm profiles:", error);
        container.innerHTML = "<div class=\"error\">Failed to load storm profiles</div>";
    }
}
function updateStormModeDisplay() {
    const statusEl = document.querySelector("#storm-status");
    const activateBtn = document.querySelector("#activate-storm-btn");
    const deactivateBtn = document.querySelector("#deactivate-storm-btn");
    const isActive = localStorage.getItem(StorageKeys.STORM_MODE_ACTIVE) === "true";
    const activeProfileId = localStorage.getItem(StorageKeys.STORM_MODE_PROFILE);
    if (statusEl) {
        const indicator = statusEl.querySelector(".status-indicator");
        const text = statusEl.querySelector(".status-text");
        if (isActive && activeProfileId) {
            indicator?.classList.remove("inactive");
            indicator?.classList.add("active");
            if (text)
                text.textContent = `Active (${getProfileName(activeProfileId)})`;
            if (activateBtn)
                activateBtn.style.display = "none";
            if (deactivateBtn)
                deactivateBtn.style.display = "inline-block";
        }
        else {
            indicator?.classList.remove("active");
            indicator?.classList.add("inactive");
            if (text)
                text.textContent = "Inactive";
            if (activateBtn)
                activateBtn.style.display = "inline-block";
            if (deactivateBtn)
                deactivateBtn.style.display = "none";
        }
    }
}
function getProfileName(profileId) {
    const profiles = getStormProfiles();
    const profile = profiles.find(p => p.id === profileId);
    return profile ? profile.name : "Unknown Profile";
}
function showStormActivationNotification(profileId) {
    const profileName = getProfileName(profileId);
    showNotification(`⛈️ Storm Mode activated: ${profileName}`, "warn");
}
function showStormDeactivationNotification() {
    showNotification("☀️ Storm Mode deactivated - returning to normal", "info");
}
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `toast ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
//# sourceMappingURL=storm-mode.js.map