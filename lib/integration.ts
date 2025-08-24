/**
 * BOVI Integration Layer
 * Bridges existing HTML app with new Flow DSL and event system
 */

import { FlowSpec, FlowRunner, flowRunner } from './flow.js';
import { Bus, emit, on, AuditLog } from './bus.js';
import { InlineStudio, createInlineStudio } from './studio.js';

// Load flow specifications
const flowSpecs: Record<string, FlowSpec> = {};

// Studios for each flow
const studios: Record<string, InlineStudio> = {};

/**
 * Initialize BOVI hybrid system
 */
export const initBoviSystem = async (): Promise<void> => {
  console.log('🚀 Initializing BOVI hybrid system...');
  
  try {
    // Load flow specifications
    await loadFlowSpecs();
    
    // Initialize studios
    initializeStudios();
    
    // Integrate with existing UI
    integrateWithExistingUI();
    
    // Set up AI Butler state management
    initializeAIButler();
    
    console.log('✅ BOVI hybrid system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize BOVI system:', error);
  }
};

/**
 * Load flow specifications from JSON files
 */
const loadFlowSpecs = async (): Promise<void> => {
  const flowIds = ['groceries', 'rent', 'energy'];
  
  for (const flowId of flowIds) {
    try {
      const response = await fetch(`/flows/${flowId}.json`);
      const flowSpec: FlowSpec = await response.json();
      
      flowSpecs[flowId] = flowSpec;
      await flowRunner.loadFlow(flowSpec);
      
      console.log(`📋 Loaded flow: ${flowId}`);
    } catch (error) {
      console.warn(`Failed to load flow ${flowId}:`, error);
    }
  }
};

/**
 * Initialize inline studios for flow visualization
 */
const initializeStudios = (): void => {
  Object.entries(flowSpecs).forEach(([flowId, flowSpec]) => {
    // Create studio container if it doesn't exist
    let studioContainer = document.getElementById(`${flowId}Studio`);
    if (!studioContainer) {
      // Add studio to existing panel
      const panel = document.querySelector(`#${flowId} .panel:last-child`);
      if (panel) {
        const studioDiv = document.createElement('div');
        studioDiv.innerHTML = `
          <h3>Flow Visualization</h3>
          <div id="${flowId}Studio" class="studio-container"></div>
        `;
        panel.appendChild(studioDiv);
        studioContainer = document.getElementById(`${flowId}Studio`)!;
      }
    }
    
    if (studioContainer) {
      const studio = createInlineStudio(`${flowId}Studio`);
      studio.renderFlow(flowSpec).catch(console.error);
      studios[flowId] = studio;
      
      console.log(`🎨 Studio created for ${flowId}`);
    }
  });
};

/**
 * Integrate with existing HTML UI elements
 */
const integrateWithExistingUI = (): void => {
  // Groceries integration
  integrateGroceries();
  
  // Rent integration
  integrateRent();
  
  // Energy integration
  integrateEnergy();
  
  // AI Butler toggle
  integrateAIButler();
  
  console.log('🔌 UI integration completed');
};

/**
 * Integrate groceries flow with existing UI
 */
const integrateGroceries = (): void => {
  const scanBtn = document.getElementById('scanBtn');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      emit('V.pda.started', {
        flow: 'groceries',
        node: 'scan_basket',
        items: flowSpecs.groceries?.nodes.find(n => n.id === 'scan_basket')?.config?.items || []
      });
      
      flowRunner.startFlow('groceries');
    });
  }
  
  // Integrate existing swap buttons with flow system
  const applySwapBtn = document.getElementById('applySwap');
  const cancelSwapBtn = document.getElementById('cancelSwap');
  
  if (applySwapBtn) {
    applySwapBtn.addEventListener('click', () => {
      flowRunner.overrideAction('groceries', 'suggest_swap', 'apply');
    });
  }
  
  if (cancelSwapBtn) {
    cancelSwapBtn.addEventListener('click', () => {
      flowRunner.cancelTimeout('groceries', 'suggest_swap', 'user_cancelled');
    });
  }
  
  // Listen for flow events to update UI
  on('I.default.applied', (event) => {
    if (event.detail.flow === 'groceries') {
      updateGroceriesKPIs(event.detail);
    }
  });
};

/**
 * Integrate rent flow with existing UI
 */
const integrateRent = (): void => {
  // Monitor input changes to trigger flow calculations
  const rentInputs = ['rentCurrent', 'rentProposed', 'rentIndex'];
  
  rentInputs.forEach(inputId => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        const context = {
          current_rent: +(document.getElementById('rentCurrent') as HTMLInputElement).value,
          proposed_increase: +(document.getElementById('rentProposed') as HTMLInputElement).value,
          personal_index: +(document.getElementById('rentIndex') as HTMLInputElement).value
        };
        
        // Update flow context and trigger calculation
        emit('B.calculate.started', {
          flow: 'rent',
          node: 'calculate_fair_counter',
          context
        });
      });
    }
  });
  
  // Integrate existing rent buttons
  const submitBtn = document.getElementById('rentSubmit');
  const cancelBtn = document.getElementById('rentCancel');
  
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      flowRunner.overrideAction('rent', 'submit_counter', 'apply');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      flowRunner.cancelTimeout('rent', 'submit_counter', 'user_cancelled');
    });
  }
};

/**
 * Integrate energy flow with existing UI
 */
const integrateEnergy = (): void => {
  // Monitor tariff changes
  const tariffInputs = ['tariff', 'baseline'];
  
  tariffInputs.forEach(inputId => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        const context = {
          current_tariff: +(document.getElementById('tariff') as HTMLInputElement).value,
          cohort_baseline: +(document.getElementById('baseline') as HTMLInputElement).value,
          enrollment_deadline: (document.getElementById('deadline') as HTMLInputElement).value
        };
        
        emit('V.calculate.started', {
          flow: 'energy',
          node: 'calculate_excess',
          context
        });
      });
    }
  });
  
  // Integrate existing energy buttons
  const enrollBtn = document.getElementById('energyEnrol');
  const cancelBtn = document.getElementById('energyCancel');
  
  if (enrollBtn) {
    enrollBtn.addEventListener('click', () => {
      flowRunner.overrideAction('energy', 'enroll_in_cohort', 'apply');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      flowRunner.cancelTimeout('energy', 'enroll_in_cohort', 'user_cancelled');
    });
  }
};

/**
 * AI Butler integration
 */
let aiButlerEnabled = true;

const initializeAIButler = (): void => {
  // Get existing AI toggle
  const toggleBtn = document.getElementById('toggleAI');
  const aiStateSpan = document.getElementById('aiState');
  
  if (toggleBtn && aiStateSpan) {
    toggleBtn.addEventListener('click', () => {
      aiButlerEnabled = !aiButlerEnabled;
      aiStateSpan.textContent = aiButlerEnabled ? 'ON' : 'OFF';
      
      emit('ui.ai_butler.toggled', { enabled: aiButlerEnabled });
      
      // Update all flow runners
      Object.keys(flowSpecs).forEach(flowId => {
        const service = (flowRunner as any).flows.get(flowId);
        if (service) {
          service.send({ type: 'AI_BUTLER_TOGGLE', enabled: aiButlerEnabled });
        }
      });
    });
  }
};

const integrateAIButler = (): void => {
  // Update countdown displays for each flow
  on('ui.countdown.tick', (event) => {
    updateCountdownDisplays(event.detail.flow, event.detail.node, event.detail.remaining);
  });
  
  // Handle timer completion events
  on('I.default.applied', (event) => {
    clearCountdownDisplay(event.detail.flow, event.detail.node);
  });
  
  on('B.default.applied', (event) => {
    clearCountdownDisplay(event.detail.flow, event.detail.node);
  });
  
  on('O.default.applied', (event) => {
    clearCountdownDisplay(event.detail.flow, event.detail.node);
  });
};

/**
 * Update countdown displays in the UI
 */
const updateCountdownDisplays = (flowId: string, nodeId: string, remaining: number): void => {
  // Update flow-specific countdowns
  const flowCountdowns = [
    `${flowId}Countdown`,
    `${flowId}-countdown`,
    `${nodeId}-countdown`,
    'countdown' // Generic countdown element
  ];
  
  flowCountdowns.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (aiButlerEnabled && remaining > 0) {
        element.textContent = `Auto-apply in ${remaining}s`;
        element.style.display = 'block';
      } else if (!aiButlerEnabled) {
        element.textContent = 'AI Butler is OFF';
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    }
  });
  
  // Update specific UI elements based on flow
  if (flowId === 'groceries' && nodeId === 'suggest_swap') {
    const swapCountdown = document.querySelector('.countdown');
    if (swapCountdown) {
      swapCountdown.textContent = aiButlerEnabled ? `${remaining}s` : 'OFF';
    }
  }
};

/**
 * Clear countdown display when timer completes or is cancelled
 */
const clearCountdownDisplay = (flowId: string, nodeId: string): void => {
  const countdownElements = [
    `${flowId}Countdown`,
    `${flowId}-countdown`, 
    `${nodeId}-countdown`,
    'countdown'
  ];
  
  countdownElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
      element.textContent = '';
    }
  });
  
  // Clear specific countdown elements
  const genericCountdowns = document.querySelectorAll('.countdown');
  genericCountdowns.forEach(element => {
    (element as HTMLElement).textContent = '';
    (element as HTMLElement).style.display = 'none';
  });
};

/**
 * Update KPIs from flow events
 */
const updateGroceriesKPIs = (eventDetail: any): void => {
  // Update defaults applied counter
  const defaultsKPI = document.getElementById('defaultsKPI');
  if (defaultsKPI) {
    const current = parseInt(defaultsKPI.textContent || '0');
    defaultsKPI.textContent = (current + 1).toString();
  }
  
  // Update deal quality if available
  if (eventDetail.result?.quality) {
    const dqKPI = document.getElementById('dqKPI');
    const dqChip = document.getElementById('dqChip');
    
    if (dqKPI) dqKPI.textContent = eventDetail.result.quality;
    if (dqChip) dqChip.textContent = 'Groceries';
  }
};

/**
 * Toast notifications for flow events
 */
const setupToastNotifications = (): void => {
  const toastElement = document.getElementById('toast');
  if (!toastElement) return;
  
  const showToast = (message: string): void => {
    toastElement.textContent = message;
    toastElement.classList.add('show');
    setTimeout(() => {
      toastElement.classList.remove('show');
    }, 2400);
  };
  
  // Toast for significant events
  on('I.default.applied', (event) => {
    showToast(`✅ ${event.detail.action} applied automatically`);
  });
  
  on('B.default.applied', (event) => {
    showToast(`⚖️ Fair counter-offer submitted`);
  });
  
  on('O.default.applied', (event) => {
    showToast(`👥 Enrolled in collective action`);
  });
  
  on('flow.error', (event) => {
    showToast(`❌ Error in ${event.detail.flow} flow`);
  });
};

/**
 * Audit trail UI
 */
export const showAuditTrail = (): void => {
  const logs = AuditLog.getLogs();
  const auditWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (auditWindow) {
    auditWindow.document.write(`
      <html>
        <head>
          <title>BOVI Audit Trail</title>
          <style>
            body { font-family: monospace; margin: 20px; background: #0b0f14; color: #e7eef9; }
            .log-entry { margin: 10px 0; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; }
            .timestamp { color: #7a8798; }
            .event-type { color: #4cc9f0; font-weight: bold; }
            .flow { color: #a1ffb5; }
            .node { color: #ffd166; }
          </style>
        </head>
        <body>
          <h1>BOVI Audit Trail</h1>
          <div id="logs">
            ${logs.map(log => `
              <div class="log-entry">
                <span class="timestamp">${new Date(log.timestamp).toISOString()}</span>
                <span class="event-type">${log.event_type}</span>
                <span class="flow">flow:${log.flow}</span>
                ${log.node ? `<span class="node">node:${log.node}</span>` : ''}
                <pre>${JSON.stringify(log.detail, null, 2)}</pre>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoviSystem);
} else {
  initBoviSystem();
}

// Setup toast notifications
setupToastNotifications();

// Export for manual control
export { flowRunner, studios, flowSpecs, aiButlerEnabled };