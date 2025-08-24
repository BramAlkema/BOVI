/**
 * BOVI Hamburger Sentinel UI
 * Fixed basket creation and tracking interface
 */

import { createHamburgerBasket, calculateHamburgerInflation, getStoredBaskets } from '../services/hamburger.js';

export function setupHamburgerSentinel(): void {
  // Create hamburger sentinel container
  const container = createHamburgerContainer();
  
  // Add to dashboard
  const dashboard = document.querySelector('main');
  if (dashboard && !dashboard.querySelector('.hamburger-sentinel')) {
    dashboard.appendChild(container);
  }
  
  // Set up event handlers
  setupHamburgerEventHandlers(container);
  
  // Load existing baskets
  loadHamburgerBaskets();
  
  // Listen for basket updates
  window.addEventListener('bovi.basketCreated', loadHamburgerBaskets);
  window.addEventListener('bovi.basketUpdated', loadHamburgerBaskets);
}

function createHamburgerContainer(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'hamburger-sentinel panel';
  container.innerHTML = `
    <h3>🍔 Hamburger Sentinel</h3>
    <p class="text-muted">Create fixed baskets for viral inflation tracking</p>
    
    <div class="hamburger-actions">
      <button id="create-basket-btn" class="btn brand">Create New Basket</button>
      <button id="import-basket-btn" class="btn secondary">Import Basket</button>
    </div>
    
    <div id="basket-form" class="basket-form" style="display: none;">
      <h4>Create Hamburger Basket</h4>
      <input type="text" id="basket-name" placeholder="Basket name (e.g., 'Weekly Groceries')" class="form-input">
      
      <div class="items-section">
        <h5>Items</h5>
        <div id="basket-items"></div>
        <button type="button" id="add-item-btn" class="btn secondary small">Add Item</button>
      </div>
      
      <div class="form-actions">
        <button id="save-basket-btn" class="btn brand">Save Basket</button>
        <button id="cancel-basket-btn" class="btn">Cancel</button>
      </div>
    </div>
    
    <div id="baskets-list" class="baskets-list">
      <div class="loading">Loading baskets...</div>
    </div>
  `;
  
  return container;
}

function setupHamburgerEventHandlers(container: HTMLElement): void {
  const createBtn = container.querySelector('#create-basket-btn');
  const basketForm = container.querySelector('#basket-form') as HTMLElement;
  const saveBtn = container.querySelector('#save-basket-btn');
  const cancelBtn = container.querySelector('#cancel-basket-btn');
  const addItemBtn = container.querySelector('#add-item-btn');
  const nameInput = container.querySelector('#basket-name') as HTMLInputElement;
  
  createBtn?.addEventListener('click', () => {
    basketForm.style.display = 'block';
    addBasketItem(); // Add first item
  });
  
  cancelBtn?.addEventListener('click', () => {
    basketForm.style.display = 'none';
    nameInput.value = '';
    const itemsContainer = container.querySelector('#basket-items');
    if (itemsContainer) itemsContainer.innerHTML = '';
  });
  
  addItemBtn?.addEventListener('click', addBasketItem);
  
  saveBtn?.addEventListener('click', async () => {
    const itemInputs = container.querySelectorAll('.basket-item');
    const items = Array.from(itemInputs).map(itemEl => {
      const nameInput = itemEl.querySelector('[name="item-name"]') as HTMLInputElement;
      const brandInput = itemEl.querySelector('[name="item-brand"]') as HTMLInputElement;
      const sizeInput = itemEl.querySelector('[name="item-size"]') as HTMLInputElement;
      const priceInput = itemEl.querySelector('[name="item-price"]') as HTMLInputElement;
      const usualInput = itemEl.querySelector('[name="item-usual"]') as HTMLInputElement;
      
      return {
        name: nameInput?.value || '',
        brand: brandInput?.value || '',
        size: sizeInput?.value || '',
        price: parseFloat(priceInput?.value || '0'),
        usual: parseFloat(usualInput?.value || '0'),
        location: 'Local Store', // Could be made configurable
        date: new Date().toISOString().split('T')[0]
      };
    }).filter(item => item.name && item.price > 0);
    
    if (nameInput.value && items.length > 0) {
      try {
        await createHamburgerBasket(nameInput.value, items);
        basketForm.style.display = 'none';
        nameInput.value = '';
        container.querySelector('#basket-items')!.innerHTML = '';
        await loadHamburgerBaskets(); // Refresh display
        showNotification('Hamburger basket created successfully!');
      } catch (error) {
        showNotification('Failed to create basket', 'error');
        console.error('Basket creation error:', error);
      }
    } else {
      showNotification('Please provide a name and at least one item', 'warn');
    }
  });
}

function addBasketItem(): void {
  const itemsContainer = document.querySelector('#basket-items');
  if (!itemsContainer) return;
  
  const itemEl = document.createElement('div');
  itemEl.className = 'basket-item';
  itemEl.innerHTML = `
    <div class="item-inputs">
      <input type="text" name="item-name" placeholder="Item name" class="form-input">
      <input type="text" name="item-brand" placeholder="Brand" class="form-input">
      <input type="text" name="item-size" placeholder="Size" class="form-input">
      <input type="number" name="item-price" placeholder="Current price" step="0.01" class="form-input">
      <input type="number" name="item-usual" placeholder="Usual price" step="0.01" class="form-input">
      <button type="button" class="remove-item-btn btn danger small">Remove</button>
    </div>
  `;
  
  itemsContainer.appendChild(itemEl);
  
  // Add remove handler
  const removeBtn = itemEl.querySelector('.remove-item-btn');
  removeBtn?.addEventListener('click', () => itemEl.remove());
}

async function loadHamburgerBaskets(): Promise<void> {
  const container = document.querySelector('#baskets-list');
  if (!container) return;
  
  try {
    const baskets = getStoredBaskets();
    
    if (baskets.length === 0) {
      container.innerHTML = '<div class="empty">No baskets created yet</div>';
      return;
    }
    
    const basketsHTML = await Promise.all(
      baskets.map(async basket => {
        const inflation = await calculateHamburgerInflation(basket.id);
        const changeClass = inflation.changePercent > 0 ? 'negative' : 'positive';
        
        return `
          <div class="basket-card" data-basket-id="${basket.id}">
            <div class="basket-header">
              <h4>${basket.name}</h4>
              <div class="basket-actions">
                ${basket.public ? 
                  `<span class="status public">Public</span>` : 
                  `<button class="publish-btn btn secondary small">Publish</button>`
                }
                <button class="share-btn btn secondary small">Share</button>
              </div>
            </div>
            <div class="basket-metrics">
              <div class="metric">
                <span class="label">Current Total:</span>
                <span class="value">£${inflation.current.toFixed(2)}</span>
              </div>
              <div class="metric">
                <span class="label">Previous Total:</span>
                <span class="value">£${inflation.previous.toFixed(2)}</span>
              </div>
              <div class="metric">
                <span class="label">Change:</span>
                <span class="value ${changeClass}">
                  ${inflation.changePercent > 0 ? '+' : ''}${(inflation.changePercent * 100).toFixed(2)}%
                </span>
              </div>
            </div>
            <div class="basket-items">
              ${basket.items.length} items • Updated ${new Date(basket.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        `;
      })
    );
    
    container.innerHTML = basketsHTML.join('');
    
  } catch (error) {
    console.error('Failed to load baskets:', error);
    container.innerHTML = '<div class="error">Failed to load baskets</div>';
  }
}

function showNotification(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `toast ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}