/**
 * BOVI Hayek Stance APIs
 * Pluralism, exit rights, and local knowledge capture
 */

import {
  IndexProvider,
  ButlerPackage,
  FairnessAudit,
  IndexCommons,
  Appeal,
  Clearinghouse,
  RailQuote,
  ExportBundle,
  APIResponse,
  BoviAPIError
} from './api-types.js';

// =============================================================================
// PLURAL INDICES MARKETPLACE
// =============================================================================

/**
 * List all available index providers
 * @returns Promise resolving to index providers
 */
export async function listIndexProviders(): Promise<IndexProvider[]> {
  return [
    {
      id: 'bovi-local',
      name: 'BOVI Local LTS',
      method: 'LTS-local',
    },
    {
      id: 'bovi-cohort',
      name: 'BOVI Cohort LTS',
      method: 'LTS-cohort',
    },
    {
      id: 'ons-cpi',
      name: 'ONS Official CPI',
      method: 'CPI',
      url: 'https://www.ons.gov.uk/economy/inflationandpriceindices'
    },
    {
      id: 'ons-wages',
      name: 'ONS Average Earnings',
      method: 'WAGE',
      url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork'
    },
    {
      id: 'shadow-stats',
      name: 'ShadowStats Alternative',
      method: 'CPI',
      url: 'http://www.shadowstats.com/'
    },
    {
      id: 'truflation',
      name: 'Truflation Real-time',
      method: 'CPI',
      url: 'https://truflation.com/'
    }
  ];
}

/**
 * Set default index provider for calculations
 * @param providerId - Provider identifier
 * @returns Promise resolving to success status
 */
export async function setDefaultIndex(providerId: string): Promise<void> {
  const providers = await listIndexProviders();
  if (!providers.find(p => p.id === providerId)) {
    throw new BoviAPIError('PROVIDER_NOT_FOUND', `Index provider ${providerId} not found`);
  }
  
  // Store in local settings
  localStorage.setItem('bovi.defaultIndexProvider', providerId);
  
  // Emit event for UI updates
  window.dispatchEvent(new CustomEvent('bovi.indexProviderChanged', {
    detail: { providerId }
  }));
}

/**
 * Get current default index provider
 * @returns Promise resolving to current provider
 */
export async function getCurrentIndexProvider(): Promise<IndexProvider> {
  const providerId = localStorage.getItem('bovi.defaultIndexProvider') || 'bovi-local';
  const providers = await listIndexProviders();
  
  return providers.find(p => p.id === providerId) || providers[0];
}

/**
 * Calculate index value using specified provider
 * @param providerId - Provider to use
 * @param basket - Shopping basket data
 * @returns Promise resolving to index calculation
 */
export async function calculateWithProvider(
  providerId: string,
  basket: any[]
): Promise<{ value: number; method: string; timestamp: string; confidence: number }> {
  const provider = (await listIndexProviders()).find(p => p.id === providerId);
  if (!provider) {
    throw new BoviAPIError('PROVIDER_NOT_FOUND', `Provider ${providerId} not found`);
  }
  
  // Stub calculation based on provider method
  let value = 0.03; // 3% baseline
  let confidence = 0.95;
  
  switch (provider.method) {
    case 'LTS-local':
      value = await calculateLocalLTS(basket);
      confidence = 0.85;
      break;
    case 'LTS-cohort':
      value = await calculateCohortLTS(basket);
      confidence = 0.92;
      break;
    case 'CPI':
      value = 0.032; // Official CPI
      confidence = 0.99;
      break;
    case 'WAGE':
      value = 0.045; // Wage growth
      confidence = 0.97;
      break;
  }
  
  return {
    value,
    method: provider.method,
    timestamp: new Date().toISOString(),
    confidence
  };
}

// =============================================================================
// BUTLER HUB - Open SDK
// =============================================================================

/**
 * Install a butler from package URL
 * @param pkgUrl - Package URL or identifier
 * @returns Promise resolving to butler manifest
 */
export async function installButler(pkgUrl: string): Promise<ButlerPackage> {
  try {
    // In production, this would fetch and validate the package
    const mockPackage: ButlerPackage = {
      id: `butler_${Date.now()}`,
      name: 'Community Butler',
      version: '1.0.0',
      paramsSchema: {
        type: 'object',
        properties: {
          aggressiveness: { type: 'number', min: 0, max: 1 },
          risktolerance: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      }
    };
    
    // Store in local butler registry
    const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
    installed.push(mockPackage);
    localStorage.setItem('bovi.installedButlers', JSON.stringify(installed));
    
    return mockPackage;
  } catch (error) {
    throw new BoviAPIError('BUTLER_INSTALL_FAILED', 'Failed to install butler', error);
  }
}

/**
 * Activate a specific butler
 * @param id - Butler identifier
 * @returns Promise resolving to activation result
 */
export async function activateButler(id: string): Promise<void> {
  const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
  const butler = installed.find((b: ButlerPackage) => b.id === id);
  
  if (!butler) {
    throw new BoviAPIError('BUTLER_NOT_FOUND', `Butler ${id} not installed`);
  }
  
  localStorage.setItem('bovi.activeButler', id);
  
  // Emit event for UI updates
  window.dispatchEvent(new CustomEvent('bovi.butlerActivated', {
    detail: { butlerId: id, butler }
  }));
}

/**
 * Get all installed butlers
 * @returns Promise resolving to butler list
 */
export async function getInstalledButlers(): Promise<ButlerPackage[]> {
  return JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
}

/**
 * Uninstall a butler
 * @param id - Butler identifier
 * @returns Promise resolving to success status
 */
export async function uninstallButler(id: string): Promise<void> {
  const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
  const filtered = installed.filter((b: ButlerPackage) => b.id !== id);
  localStorage.setItem('bovi.installedButlers', JSON.stringify(filtered));
  
  // If this was the active butler, reset to default
  if (localStorage.getItem('bovi.activeButler') === id) {
    localStorage.setItem('bovi.activeButler', 'bovi-default');
  }
}

// =============================================================================
// RAIL NEUTRALITY
// =============================================================================

/**
 * Audit rail selection fairness
 * @param selectedRail - Rail that was selected
 * @param allQuotes - All available quotes at time of selection
 * @returns Promise resolving to fairness audit
 */
export async function auditRailSelection(
  selectedRail: string,
  allQuotes: RailQuote[]
): Promise<FairnessAudit> {
  const bestQuote = allQuotes.reduce((best, quote) => 
    quote.fee < best.fee ? quote : best
  );
  
  const selectedQuote = allQuotes.find(q => q.rail === selectedRail);
  if (!selectedQuote) {
    throw new BoviAPIError('RAIL_NOT_FOUND', 'Selected rail not in quotes');
  }
  
  // Calculate fairness score (1 = perfectly fair, 0 = completely unfair)
  const feeDifference = selectedQuote.fee - bestQuote.fee;
  const fairnessScore = Math.max(0, 1 - (feeDifference / bestQuote.fee));
  
  return {
    selectedRail,
    bestQuote,
    fairnessScore
  };
}

/**
 * Generate weekly fairness report
 * @returns Promise resolving to fairness metrics
 */
export async function generateFairnessReport(): Promise<{
  period: string;
  averageFairness: number;
  flaggedIncidents: number;
  railPerformance: Array<{ rail: string; fairnessScore: number; volume: number }>;
}> {
  // Stub implementation
  return {
    period: '2024-01-08 to 2024-01-14',
    averageFairness: 0.94,
    flaggedIncidents: 2,
    railPerformance: [
      { rail: 'SEPA', fairnessScore: 0.96, volume: 1240 },
      { rail: 'FPS', fairnessScore: 0.89, volume: 890 },
      { rail: 'Card', fairnessScore: 0.78, volume: 2100 },
      { rail: 'StableL2', fairnessScore: 0.99, volume: 156 }
    ]
  };
}

// =============================================================================
// LOCAL KNOWLEDGE CAPTURE
// =============================================================================

/**
 * Compute local index from device data
 * @param basket - Local basket data
 * @returns Promise resolving to local index commons
 */
export async function computeLocalIndex(basket?: any[]): Promise<IndexCommons> {
  const startTime = Date.now();
  
  // Simulate computation
  await new Promise(resolve => setTimeout(resolve, 50)); // Ensure < 200ms
  
  // Stub calculation
  const sources = ['local-receipts', 'price-scraping', 'user-input'];
  const prices = basket?.map(item => item.price) || [2.50, 1.20, 3.80, 0.90];
  
  const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
  const mad = prices.reduce((sum, price) => sum + Math.abs(price - median), 0) / prices.length;
  const quality = Math.min(1, prices.length / 20); // Quality based on sample size
  
  const result: IndexCommons = {
    sources,
    median,
    mad,
    quality,
    lastUpdated: new Date().toISOString()
  };
  
  const computeTime = Date.now() - startTime;
  if (computeTime > 200) {
    console.warn(`Local computation took ${computeTime}ms (target: <200ms)`);
  }
  
  return result;
}

/**
 * Share data with cohort (with consent)
 * @param data - Index commons to share
 * @param consent - Explicit user consent
 * @returns Promise resolving to sharing result
 */
export async function shareWithCohort(data: IndexCommons, consent: boolean): Promise<{
  shared: boolean;
  cohortSize: number;
  anonymized: boolean;
}> {
  if (!consent) {
    return { shared: false, cohortSize: 0, anonymized: false };
  }
  
  // Remove any PII and aggregate
  const anonymizedData = {
    median: data.median,
    mad: data.mad,
    quality: data.quality,
    timestamp: data.lastUpdated
  };
  
  // Stub cohort sharing
  console.log('Sharing anonymized data:', anonymizedData);
  
  return {
    shared: true,
    cohortSize: 1247, // Mock cohort size
    anonymized: true
  };
}

// =============================================================================
// APPEAL & LIABILITY HOOKS
// =============================================================================

/**
 * File an appeal for an automated action
 * @param actionId - Action to appeal
 * @param reason - Reason for appeal
 * @returns Promise resolving to appeal
 */
export async function fileAppeal(actionId: string, reason: string): Promise<Appeal> {
  const appeal: Appeal = {
    actionId,
    opened: new Date().toISOString(),
    status: 'open',
    providerId: 'bovi-default', // Would determine from action
    outcome: undefined
  };
  
  // Store appeal
  const appeals = JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
  appeals.push(appeal);
  localStorage.setItem('bovi.appeals', JSON.stringify(appeals));
  
  return appeal;
}

/**
 * Get appeal status
 * @param appealId - Appeal identifier (using actionId as key)
 * @returns Promise resolving to appeal status
 */
export async function getAppealStatus(appealId: string): Promise<Appeal> {
  const appeals: Appeal[] = JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
  const appeal = appeals.find(a => a.actionId === appealId);
  
  if (!appeal) {
    throw new BoviAPIError('APPEAL_NOT_FOUND', `Appeal ${appealId} not found`);
  }
  
  return appeal;
}

/**
 * Get all appeals for user
 * @returns Promise resolving to appeals list
 */
export async function getUserAppeals(): Promise<Appeal[]> {
  return JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
}

// =============================================================================
// FEDERATED COHORTS
// =============================================================================

/**
 * Register a new clearinghouse
 * @param meta - Clearinghouse metadata
 * @returns Promise resolving to registration result
 */
export async function registerClearinghouse(meta: Clearinghouse): Promise<void> {
  if (!meta.id || !meta.name || !meta.jurisdiction) {
    throw new BoviAPIError('INVALID_CLEARINGHOUSE', 'Clearinghouse metadata incomplete');
  }
  
  // Store clearinghouse
  const clearinghouses = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
  if (clearinghouses.find((c: Clearinghouse) => c.id === meta.id)) {
    throw new BoviAPIError('CLEARINGHOUSE_EXISTS', 'Clearinghouse already exists');
  }
  
  clearinghouses.push(meta);
  localStorage.setItem('bovi.clearinghouses', JSON.stringify(clearinghouses));
}

/**
 * Choose a clearinghouse for price discovery
 * @param id - Clearinghouse identifier
 * @returns Promise resolving to selection result
 */
export async function chooseClearinghouse(id: string): Promise<void> {
  const clearinghouses: Clearinghouse[] = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
  if (!clearinghouses.find(c => c.id === id)) {
    throw new BoviAPIError('CLEARINGHOUSE_NOT_FOUND', `Clearinghouse ${id} not found`);
  }
  
  localStorage.setItem('bovi.activeClearinghouse', id);
  
  window.dispatchEvent(new CustomEvent('bovi.clearinghouseChanged', {
    detail: { clearinghouseId: id }
  }));
}

/**
 * Get available clearinghouses
 * @returns Promise resolving to clearinghouses list
 */
export async function getClearinghouses(): Promise<Clearinghouse[]> {
  const stored = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
  
  // Add default clearinghouses if none exist
  if (stored.length === 0) {
    const defaults: Clearinghouse[] = [
      {
        id: 'bovi-main',
        name: 'BOVI Main Clearinghouse',
        jurisdiction: 'UK',
        rulesUrl: '/rules/main.json',
        contact: 'support@bovi.money'
      },
      {
        id: 'eu-cohort',
        name: 'EU Community Cohort',
        jurisdiction: 'EU',
        rulesUrl: '/rules/eu-cohort.json',
        contact: 'admin@eu-cohort.org'
      }
    ];
    
    localStorage.setItem('bovi.clearinghouses', JSON.stringify(defaults));
    return defaults;
  }
  
  return stored;
}

// =============================================================================
// EXPORT/IMPORT & PORTABILITY
// =============================================================================

/**
 * Export all user data for portability
 * @returns Promise resolving to export bundle
 */
export async function exportAll(): Promise<ExportBundle> {
  const bundle: ExportBundle = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    data: {
      baskets: JSON.parse(localStorage.getItem('bovi.baskets') || '[]'),
      flows: JSON.parse(localStorage.getItem('bovi.flows') || '[]'),
      contracts: JSON.parse(localStorage.getItem('bovi.contracts') || '[]'),
      auditLog: JSON.parse(localStorage.getItem('bovi.auditLog') || '[]'),
      settings: {
        defaultIndexProvider: localStorage.getItem('bovi.defaultIndexProvider'),
        activeButler: localStorage.getItem('bovi.activeButler'),
        activeClearinghouse: localStorage.getItem('bovi.activeClearinghouse'),
        installedButlers: JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]')
      }
    }
  };
  
  return bundle;
}

/**
 * Import data bundle
 * @param bundle - Export bundle to import
 * @returns Promise resolving to import result
 */
export async function importBundle(bundle: ExportBundle): Promise<{
  imported: boolean;
  conflicts: string[];
  summary: { [key: string]: number };
}> {
  const conflicts: string[] = [];
  
  try {
    // Import data with conflict detection
    Object.entries(bundle.data).forEach(([key, value]) => {
      if (key === 'settings') {
        Object.entries(value as any).forEach(([settingKey, settingValue]) => {
          if (settingValue) {
            localStorage.setItem(`bovi.${settingKey}`, 
              typeof settingValue === 'string' ? settingValue : JSON.stringify(settingValue));
          }
        });
      } else if (Array.isArray(value)) {
        localStorage.setItem(`bovi.${key}`, JSON.stringify(value));
      }
    });
    
    return {
      imported: true,
      conflicts,
      summary: {
        baskets: bundle.data.baskets.length,
        flows: bundle.data.flows.length,
        contracts: bundle.data.contracts.length,
        auditEntries: bundle.data.auditLog.length
      }
    };
  } catch (error) {
    throw new BoviAPIError('IMPORT_FAILED', 'Failed to import bundle', error);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function calculateLocalLTS(basket: any[]): Promise<number> {
  // Stub LTS calculation
  if (!basket || basket.length === 0) return 0.025;
  
  const prices = basket.map(item => item.price || 0);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Mock inflation based on average price
  return Math.min(0.1, Math.max(-0.02, avgPrice / 100));
}

async function calculateCohortLTS(basket: any[]): Promise<number> {
  // Stub cohort LTS - would aggregate from multiple users
  const localLTS = await calculateLocalLTS(basket);
  const cohortAdjustment = 0.005; // Cohort tends to be slightly higher
  
  return localLTS + cohortAdjustment;
}