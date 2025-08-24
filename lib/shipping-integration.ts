/**
 * BOVI Shipping Integration
 * Connects shipping APIs to existing UI and flow system
 */

import { Bus, emit, on } from './bus.js';
import { flowRunner } from './flow.js';
import * as ShippingAPI from './shipping-apis.js';

// =============================================================================
// UI INTEGRATION LAYER
// =============================================================================

/**
 * Initialize shipping features with existing BOVI system
 */
export async function initializeShippingFeatures(): Promise<void> {
  console.log('🚀 Initializing BOVI shipping features...');
  
  try {
    // Initialize Index Commons store
    await ShippingAPI.indexCommons.init();
    
    // Set up UI event handlers
    setupRulerRenderer();
    setupMoneyVeilCard();
    setupHamburgerSentinel();
    setupSmartContractUI();
    setupCohortEngine();
    setupStormModeUI();
    
    // Start background tasks
    startWeeklyDigest();
    startStormModeMonitoring();
    
    console.log('✅ Shipping features initialized');
  } catch (error) {
    console.error('❌ Failed to initialize shipping features:', error);
    throw error;
  }
}

// =============================================================================
// RULER RENDERER
// =============================================================================

function setupRulerRenderer(): void {
  // Add ruler switcher to all relevant views
  const addRulerSwitcher = async (container: HTMLElement) => {
    const rulers = await ShippingAPI.getRulers();
    const activeRuler = localStorage.getItem('bovi.activeRuler') || 'bovi-local';
    
    const switcherHTML = `
      <div class="ruler-switcher">
        <label for="ruler-select">Inflation Ruler:</label>
        <select id="ruler-select" class="ruler-select">
          ${rulers.map(ruler => `
            <option value="${ruler.id}" ${ruler.id === activeRuler ? 'selected' : ''}>
              ${ruler.name} (${ruler.bpDrift > 0 ? '+' : ''}${ruler.bpDrift}bp)
            </option>
          `).join('')}
        </select>
        <div class="ruler-info">
          <small id="ruler-method">${rulers.find(r => r.id === activeRuler)?.method || ''}</small>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', switcherHTML);
    
    // Add event handler
    const select = container.querySelector('#ruler-select') as HTMLSelectElement;
    const methodInfo = container.querySelector('#ruler-method') as HTMLElement;
    
    select?.addEventListener('change', async (e) => {
      const rulerId = (e.target as HTMLSelectElement).value;
      await ShippingAPI.switchRuler(rulerId);
      
      const ruler = rulers.find(r => r.id === rulerId);
      if (ruler && methodInfo) {
        methodInfo.textContent = ruler.method;
      }
      
      // Refresh all calculations with new ruler
      window.dispatchEvent(new CustomEvent('bovi.recalculateAll'));
    });
  };
  
  // Add to existing panels
  document.querySelectorAll('.panel').forEach(panel => {
    if (!panel.querySelector('.ruler-switcher')) {
      addRulerSwitcher(panel as HTMLElement);
    }
  });
  
  // Listen for ruler changes
  window.addEventListener('bovi.rulerChanged', (event) => {
    const { ruler } = (event as CustomEvent).detail;
    
    // Update all ruler selects
    document.querySelectorAll('.ruler-select').forEach(select => {
      (select as HTMLSelectElement).value = ruler.id;
    });
    
    // Update method info
    document.querySelectorAll('#ruler-method').forEach(info => {
      info.textContent = ruler.method;
    });
    
    // Show drift notification
    if (Math.abs(ruler.bpDrift) > 50) { // >0.5%
      showNotification(`Ruler switched: ${ruler.name} shows ${ruler.bpDrift > 0 ? 'higher' : 'lower'} inflation (${Math.abs(ruler.bpDrift)}bp difference)`);
    }
  });
}

// =============================================================================
// MONEY-VEIL CARD
// =============================================================================

function setupMoneyVeilCard(): void {
  // Create money-veil card container
  const createMoneyVeilCard = (): HTMLElement => {
    const card = document.createElement('div');
    card.className = 'card money-veil-card';
    card.innerHTML = `
      <h4>💰 Your Money Veil</h4>
      <div class="money-veil-content">
        <div class="veil-metric">
          <span class="metric-label">Inflation Drift:</span>
          <span class="metric-value" id="inflation-drift">Calculating...</span>
        </div>
        <div class="veil-metric">
          <span class="metric-label">Bracket Creep:</span>
          <span class="metric-value" id="bracket-creep">£0.00</span>
        </div>
        <div class="veil-metric">
          <span class="metric-label">Real Rate Impact:</span>
          <span class="metric-value" id="real-rate">£0.00</span>
        </div>
        <div class="veil-summary">
          <strong>Net Weekly Impact: <span id="net-impact">£0.00</span></strong>
        </div>
        <button id="weekly-digest-btn" class="btn">📧 Get Weekly Digest</button>
      </div>
    `;
    
    return card;
  };
  
  // Add to main dashboard if it exists
  const dashboard = document.querySelector('main');
  if (dashboard && !dashboard.querySelector('.money-veil-card')) {
    const card = createMoneyVeilCard();
    dashboard.appendChild(card);
    
    // Set up event handlers
    const digestBtn = card.querySelector('#weekly-digest-btn');
    digestBtn?.addEventListener('click', async () => {
      const digest = await ShippingAPI.generateWeeklyDigest();
      showDigestModal(digest);
    });
  }
  
  // Update money veil data
  const updateMoneyVeil = async () => {
    try {
      // Get user financial data (mock for now)
      const income = parseFloat(localStorage.getItem('bovi.userIncome') || '50000');
      const savings = parseFloat(localStorage.getItem('bovi.userSavings') || '10000');
      const interestRate = 0.04; // 4%
      
      const veilData = await ShippingAPI.calculateMoneyVeil(income, savings, interestRate);
      
      // Update display
      const inflationDrift = document.querySelector('#inflation-drift');
      const bracketCreep = document.querySelector('#bracket-creep');
      const realRate = document.querySelector('#real-rate');
      const netImpact = document.querySelector('#net-impact');
      
      if (inflationDrift) {
        const drift = (veilData.inflationDrift * 100).toFixed(2);
        inflationDrift.textContent = `${drift > 0 ? '+' : ''}${drift}%`;
        inflationDrift.className = `metric-value ${drift > 0 ? 'negative' : 'positive'}`;
      }
      
      if (bracketCreep) bracketCreep.textContent = `£${Math.abs(veilData.bracketCreep).toFixed(2)}`;
      if (realRate) realRate.textContent = `£${veilData.realRate.toFixed(2)}`;
      if (netImpact) {
        const weeklyImpact = veilData.netImpact / 52; // Annual to weekly
        netImpact.textContent = `£${weeklyImpact.toFixed(2)}`;
        netImpact.className = weeklyImpact < 0 ? 'negative' : 'positive';
      }
      
    } catch (error) {
      console.error('Failed to update money veil:', error);
    }
  };
  
  // Update on ruler changes and periodically
  window.addEventListener('bovi.rulerChanged', updateMoneyVeil);
  updateMoneyVeil(); // Initial calculation
  setInterval(updateMoneyVeil, 60000); // Update every minute
}

// =============================================================================
// HAMBURGER SENTINEL
// =============================================================================

function setupHamburgerSentinel(): void {
  // Create hamburger basket tracker
  const createHamburgerTracker = (): HTMLElement => {
    const tracker = document.createElement('div');
    tracker.className = 'panel hamburger-sentinel';
    tracker.innerHTML = `
      <h3>🍔 Hamburger Sentinel</h3>
      <p class="small">Track fixed baskets for personal inflation monitoring</p>
      
      <div id="hamburger-baskets">
        <div class="loading">Loading baskets...</div>
      </div>
      
      <button id="create-basket-btn" class="btn brand">Create New Basket</button>
      
      <div id="basket-form" class="basket-form" style="display: none;">
        <h4>Create Hamburger Basket</h4>
        <input type="text" id="basket-name" placeholder="Basket name (e.g., Weekly Shop)" />
        <div id="basket-items">
          <div class="item-input">
            <input type="text" placeholder="Item name" class="item-name" />
            <input type="text" placeholder="Brand" class="item-brand" />
            <input type="text" placeholder="Size" class="item-size" />
            <input type="number" step="0.01" placeholder="Current price" class="item-price" />
            <input type="number" step="0.01" placeholder="Usual price" class="item-usual" />
            <button type="button" class="add-item-btn">+ Add Item</button>
          </div>
        </div>
        <div class="form-actions">
          <button id="save-basket-btn" class="btn brand">Save Basket</button>
          <button id="cancel-basket-btn" class="btn">Cancel</button>
        </div>
      </div>
    `;
    
    return tracker;
  };
  
  // Add to page if not exists
  const main = document.querySelector('main');
  if (main && !main.querySelector('.hamburger-sentinel')) {
    const tracker = createHamburgerTracker();
    main.appendChild(tracker);
    
    setupHamburgerEventHandlers(tracker);
  }
  
  // Load and display existing baskets
  loadHamburgerBaskets();
}

function setupHamburgerEventHandlers(container: HTMLElement): void {
  const createBtn = container.querySelector('#create-basket-btn');
  const basketForm = container.querySelector('#basket-form') as HTMLElement;
  const saveBtn = container.querySelector('#save-basket-btn');
  const cancelBtn = container.querySelector('#cancel-basket-btn');
  const addItemBtn = container.querySelector('.add-item-btn');
  
  createBtn?.addEventListener('click', () => {
    basketForm.style.display = 'block';
  });
  
  cancelBtn?.addEventListener('click', () => {
    basketForm.style.display = 'none';
    (container.querySelector('#basket-name') as HTMLInputElement).value = '';
  });
  
  addItemBtn?.addEventListener('click', () => {
    const itemsContainer = container.querySelector('#basket-items');
    const newItem = document.createElement('div');
    newItem.className = 'item-input';
    newItem.innerHTML = `
      <input type="text" placeholder="Item name" class="item-name" />
      <input type="text" placeholder="Brand" class="item-brand" />
      <input type="text" placeholder="Size" class="item-size" />
      <input type="number" step="0.01" placeholder="Current price" class="item-price" />
      <input type="number" step="0.01" placeholder="Usual price" class="item-usual" />
      <button type="button" class="remove-item-btn">Remove</button>
    `;
    itemsContainer?.appendChild(newItem);
    
    newItem.querySelector('.remove-item-btn')?.addEventListener('click', () => {
      newItem.remove();
    });
  });
  
  saveBtn?.addEventListener('click', async () => {
    const nameInput = container.querySelector('#basket-name') as HTMLInputElement;
    const itemInputs = container.querySelectorAll('.item-input');
    
    const items: any[] = [];
    itemInputs.forEach(itemInput => {
      const name = (itemInput.querySelector('.item-name') as HTMLInputElement)?.value;
      const brand = (itemInput.querySelector('.item-brand') as HTMLInputElement)?.value;
      const size = (itemInput.querySelector('.item-size') as HTMLInputElement)?.value;
      const price = parseFloat((itemInput.querySelector('.item-price') as HTMLInputElement)?.value || '0');
      const usual = parseFloat((itemInput.querySelector('.item-usual') as HTMLInputElement)?.value || '0');
      
      if (name && brand && price > 0) {
        items.push({
          name, brand, size, price, usual,
          location: 'Local Store', // Could be made configurable
          date: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    if (nameInput.value && items.length > 0) {
      try {
        await ShippingAPI.createHamburgerBasket(nameInput.value, items);
        basketForm.style.display = 'none';
        nameInput.value = '';
        await loadHamburgerBaskets(); // Refresh display
        showNotification('Hamburger basket created successfully!');
      } catch (error) {
        showNotification('Failed to create basket', 'error');
        console.error('Basket creation error:', error);
      }
    }
  });
}

async function loadHamburgerBaskets(): Promise<void> {
  const container = document.querySelector('#hamburger-baskets');
  if (!container) return;
  
  try {
    const baskets: ShippingAPI.HamburgerBasket[] = JSON.parse(
      localStorage.getItem('bovi.hamburgerBaskets') || '[]'
    );
    
    if (baskets.length === 0) {
      container.innerHTML = '<div class="empty">No baskets created yet</div>';
      return;
    }
    
    const basketsHTML = await Promise.all(
      baskets.map(async basket => {
        const inflation = await ShippingAPI.calculateHamburgerInflation(basket.id);
        const changeClass = inflation.changePercent > 0 ? 'negative' : 'positive';
        
        return `
          <div class="basket-card" data-basket-id="${basket.id}">
            <div class="basket-header">
              <h4>${basket.name}</h4>
              <div class="basket-actions">
                ${basket.public ? 
                  `<a href="${basket.shareUrl}" target="_blank" class="btn small">🔗 Share</a>` :
                  `<button class="btn small publish-btn" data-basket-id="${basket.id}">📤 Publish</button>`
                }
              </div>
            </div>
            <div class="basket-metrics">
              <div class="metric">
                <span class="label">Current Total:</span>
                <span class="value">£${inflation.current.toFixed(2)}</span>
              </div>
              <div class="metric">
                <span class="label">Change:</span>
                <span class="value ${changeClass}">
                  ${inflation.changePercent >= 0 ? '+' : ''}${(inflation.changePercent * 100).toFixed(1)}%
                </span>
              </div>
              <div class="metric">
                <span class="label">Items:</span>
                <span class="value">${basket.items.length}</span>
              </div>
            </div>
            <div class="basket-updated">
              Last updated: ${new Date(basket.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        `;
      })
    );
    
    container.innerHTML = basketsHTML.join('');
    
    // Add publish event handlers
    container.querySelectorAll('.publish-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const basketId = (e.target as HTMLElement).dataset.basketId;
        if (basketId) {
          try {
            const shareUrl = await ShippingAPI.publishBasket(basketId);
            showNotification(`Basket published! Share URL: ${shareUrl}`);
            await loadHamburgerBaskets(); // Refresh to show share link
          } catch (error) {
            showNotification('Failed to publish basket', 'error');
            console.error('Publish error:', error);
          }
        }
      });
    });
    
  } catch (error) {
    container.innerHTML = '<div class="error">Failed to load baskets</div>';
    console.error('Load baskets error:', error);
  }
}

// =============================================================================
// SMART CONTRACT UI
// =============================================================================

function setupSmartContractUI(): void {
  // Add contract creation interface to relevant flows
  on('B.default.started', async (event) => {
    if (event.detail.flow === 'rent') {
      showSmartContractOption('rent', ['Tenant', 'Landlord']);
    }
  });
  
  // Listen for contract creation requests
  window.addEventListener('bovi.createContract', async (event) => {
    const { templateId, parties, terms } = (event as CustomEvent).detail;
    
    try {
      const result = await ShippingAPI.createSmartContract(templateId, parties, terms);
      
      // Show contract and receipts
      showContractModal(result.contract, result.receipt);
      
      showNotification('Smart contract created successfully!');
    } catch (error) {
      showNotification('Failed to create contract', 'error');
      console.error('Contract creation error:', error);
    }
  });
}

// =============================================================================
// COHORT ENGINE UI
// =============================================================================

function setupCohortEngine(): void {
  // Listen for cohort opportunities
  on('V.pda.completed', async (event) => {
    if (event.detail.quality === 'Poor') {
      showCohortOpportunity(event.detail.flow);
    }
  });
  
  // Add cohort status display
  const addCohortStatus = () => {
    const statusHTML = `
      <div class="cohort-status">
        <h4>🤝 Active Cohorts</h4>
        <div id="cohort-list">Loading...</div>
        <button id="create-cohort-btn" class="btn">Create Cohort</button>
      </div>
    `;
    
    const dashboard = document.querySelector('main');
    if (dashboard && !dashboard.querySelector('.cohort-status')) {
      dashboard.insertAdjacentHTML('beforeend', statusHTML);
      
      loadCohortStatus();
      
      document.querySelector('#create-cohort-btn')?.addEventListener('click', () => {
        showCohortCreationModal();
      });
    }
  };
  
  addCohortStatus();
}

// =============================================================================
// STORM MODE UI
// =============================================================================

function setupStormModeUI(): void {
  // Add Storm Mode toggle to header
  const header = document.querySelector('header');
  if (header && !header.querySelector('.storm-mode-toggle')) {
    const toggleHTML = `
      <div class="storm-mode-toggle">
        <button id="storm-mode-btn" class="btn storm-btn" title="Storm Mode">
          ⛈️ <span id="storm-status">Normal</span>
        </button>
      </div>
    `;
    
    header.insertAdjacentHTML('beforeend', toggleHTML);
    
    const stormBtn = header.querySelector('#storm-mode-btn');
    stormBtn?.addEventListener('click', () => {
      showStormModeModal();
    });
  }
  
  // Check for active storm mode
  const activeProfile = localStorage.getItem('bovi.stormMode.active');
  if (activeProfile) {
    updateStormModeStatus(true, 'Active');
  }
}

function startStormModeMonitoring(): void {
  // Monitor for storm mode triggers
  setInterval(async () => {
    try {
      const rulers = await ShippingAPI.getRulers();
      const localInflation = rulers.find(r => r.id === 'bovi-local')?.bpDrift || 0;
      
      // Check if inflation exceeds 5% (500bp)
      if (localInflation > 500) {
        const hasStormProfile = JSON.parse(localStorage.getItem('bovi.stormProfiles') || '[]').length > 0;
        if (hasStormProfile && !localStorage.getItem('bovi.stormMode.active')) {
          showStormModeAlert();
        }
      }
    } catch (error) {
      console.warn('Storm mode monitoring error:', error);
    }
  }, 300000); // Check every 5 minutes
}

// =============================================================================
// WEEKLY DIGEST
// =============================================================================

function startWeeklyDigest(): void {
  // Check if it's time for weekly digest
  const lastDigest = localStorage.getItem('bovi.lastWeeklyDigest');
  const weeksSince = lastDigest ? 
    (Date.now() - parseInt(lastDigest)) / (1000 * 60 * 60 * 24 * 7) : 999;
  
  if (weeksSince >= 1) {
    // Generate and show digest
    setTimeout(async () => {
      try {
        const digest = await ShippingAPI.generateWeeklyDigest();
        showDigestModal(digest);
        localStorage.setItem('bovi.lastWeeklyDigest', Date.now().toString());
      } catch (error) {
        console.error('Weekly digest error:', error);
      }
    }, 5000); // 5 second delay after page load
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR UI
// =============================================================================

function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function showDigestModal(digest: any): void {
  // Implementation would create modal with digest content
  console.log('Weekly Digest:', digest);
}

function showSmartContractOption(templateId: string, parties: string[]): void {
  // Implementation would show contract creation UI
  console.log('Smart contract opportunity:', templateId, parties);
}

function showContractModal(contract: any, receipt: any): void {
  // Implementation would display contract and receipt
  console.log('Contract created:', contract, receipt);
}

function showCohortOpportunity(category: string): void {
  // Implementation would show cohort joining UI
  console.log('Cohort opportunity for:', category);
}

function showCohortCreationModal(): void {
  // Implementation would show cohort creation UI
  console.log('Create cohort modal');
}

function loadCohortStatus(): void {
  // Implementation would load and display cohort status
  const cohortList = document.querySelector('#cohort-list');
  if (cohortList) {
    cohortList.textContent = 'No active cohorts';
  }
}

function showStormModeModal(): void {
  // Implementation would show storm mode management UI
  console.log('Storm mode modal');
}

function showStormModeAlert(): void {
  // Implementation would alert user about storm mode triggers
  showNotification('⛈️ High inflation detected! Consider activating Storm Mode.', 'error');
}

function updateStormModeStatus(active: boolean, status: string): void {
  const statusEl = document.querySelector('#storm-status');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.parentElement?.classList.toggle('active', active);
  }
}

// =============================================================================
// EXPORT FOR INTEGRATION
// =============================================================================

// Auto-initialize shipping features when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeShippingFeatures);
  } else {
    initializeShippingFeatures();
  }
}