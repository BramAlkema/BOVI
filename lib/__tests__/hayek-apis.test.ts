/**
 * Unit Tests for Hayek Stance APIs
 */

import {
  listIndexProviders,
  setDefaultIndex,
  getCurrentIndexProvider,
  calculateWithProvider,
  installButler,
  activateButler,
  getInstalledButlers,
  uninstallButler,
  auditRailSelection,
  generateFairnessReport,
  computeLocalIndex,
  shareWithCohort,
  fileAppeal,
  getAppealStatus,
  getUserAppeals,
  registerClearinghouse,
  chooseClearinghouse,
  getClearinghouses,
  exportAll,
  importBundle
} from '../hayek-apis.js';
import { BoviAPIError, RailQuote } from '../api-types.js';

// Mock localStorage
const mockLocalStorage = {
  store: {} as { [key: string]: string },
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage.store[key] = value; },
  clear: () => { mockLocalStorage.store = {}; }
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window.dispatchEvent
Object.defineProperty(global, 'window', {
  value: { 
    dispatchEvent: jest.fn()
  },
  writable: true
});

describe('Plural Indices Marketplace', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('listIndexProviders returns available providers', async () => {
    const providers = await listIndexProviders();
    
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBeGreaterThan(0);
    
    providers.forEach(provider => {
      expect(provider).toHaveProperty('id');
      expect(provider).toHaveProperty('name');
      expect(provider).toHaveProperty('method');
    });
  });

  test('setDefaultIndex stores selection', async () => {
    await setDefaultIndex('bovi-cohort');
    
    expect(mockLocalStorage.getItem('bovi.defaultIndexProvider')).toBe('bovi-cohort');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test('setDefaultIndex throws error for invalid provider', async () => {
    await expect(setDefaultIndex('non-existent'))
      .rejects.toThrow(BoviAPIError);
  });

  test('getCurrentIndexProvider returns default or selected', async () => {
    // Test default
    let current = await getCurrentIndexProvider();
    expect(current.id).toBe('bovi-local');
    
    // Test after setting
    await setDefaultIndex('ons-cpi');
    current = await getCurrentIndexProvider();
    expect(current.id).toBe('ons-cpi');
  });

  test('calculateWithProvider returns calculation result', async () => {
    const result = await calculateWithProvider('bovi-local', [
      { price: 2.50 }, { price: 1.20 }
    ]);
    
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('confidence');
    
    expect(typeof result.value).toBe('number');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('Butler Hub', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('installButler creates butler package', async () => {
    const butler = await installButler('https://example.com/butler.pkg');
    
    expect(butler).toHaveProperty('id');
    expect(butler).toHaveProperty('name');
    expect(butler).toHaveProperty('version');
    expect(butler).toHaveProperty('paramsSchema');
  });

  test('getInstalledButlers returns installed list', async () => {
    await installButler('test-url');
    const butlers = await getInstalledButlers();
    
    expect(Array.isArray(butlers)).toBe(true);
    expect(butlers.length).toBe(1);
  });

  test('activateButler sets active butler', async () => {
    const butler = await installButler('test-url');
    await activateButler(butler.id);
    
    expect(mockLocalStorage.getItem('bovi.activeButler')).toBe(butler.id);
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test('activateButler throws error for non-existent butler', async () => {
    await expect(activateButler('non-existent'))
      .rejects.toThrow(BoviAPIError);
  });

  test('uninstallButler removes butler', async () => {
    const butler = await installButler('test-url');
    await uninstallButler(butler.id);
    
    const butlers = await getInstalledButlers();
    expect(butlers.find(b => b.id === butler.id)).toBeUndefined();
  });
});

describe('Rail Neutrality', () => {
  const mockQuotes: RailQuote[] = [
    { rail: 'SEPA', fee: 0.50, etaSec: 3600, successP90: 0.998 },
    { rail: 'FPS', fee: 0.60, etaSec: 10, successP90: 0.995 },
    { rail: 'Card', fee: 2.90, etaSec: 5, successP90: 0.992 }
  ];

  test('auditRailSelection calculates fairness score', async () => {
    const audit = await auditRailSelection('SEPA', mockQuotes);
    
    expect(audit).toHaveProperty('selectedRail');
    expect(audit).toHaveProperty('bestQuote');
    expect(audit).toHaveProperty('fairnessScore');
    
    expect(audit.selectedRail).toBe('SEPA');
    expect(audit.fairnessScore).toBe(1); // SEPA is cheapest, so perfectly fair
  });

  test('auditRailSelection penalizes expensive selection', async () => {
    const audit = await auditRailSelection('Card', mockQuotes);
    
    expect(audit.fairnessScore).toBeLessThan(1);
    expect(audit.fairnessScore).toBeGreaterThan(0);
  });

  test('auditRailSelection throws error for invalid rail', async () => {
    await expect(auditRailSelection('NonExistent', mockQuotes))
      .rejects.toThrow(BoviAPIError);
  });

  test('generateFairnessReport returns metrics', async () => {
    const report = await generateFairnessReport();
    
    expect(report).toHaveProperty('period');
    expect(report).toHaveProperty('averageFairness');
    expect(report).toHaveProperty('flaggedIncidents');
    expect(report).toHaveProperty('railPerformance');
    
    expect(Array.isArray(report.railPerformance)).toBe(true);
  });
});

describe('Local Knowledge Capture', () => {
  test('computeLocalIndex performs fast calculation', async () => {
    const startTime = Date.now();
    const result = await computeLocalIndex([
      { price: 2.50 }, { price: 1.20 }, { price: 3.80 }
    ]);
    const computeTime = Date.now() - startTime;
    
    expect(computeTime).toBeLessThan(200); // Performance requirement
    
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('median');
    expect(result).toHaveProperty('mad');
    expect(result).toHaveProperty('quality');
    expect(result).toHaveProperty('lastUpdated');
    
    expect(Array.isArray(result.sources)).toBe(true);
    expect(typeof result.median).toBe('number');
  });

  test('shareWithCohort respects consent', async () => {
    const data = await computeLocalIndex();
    
    // Without consent
    const noConsent = await shareWithCohort(data, false);
    expect(noConsent.shared).toBe(false);
    
    // With consent
    const withConsent = await shareWithCohort(data, true);
    expect(withConsent.shared).toBe(true);
    expect(withConsent.anonymized).toBe(true);
  });
});

describe('Appeal & Liability Hooks', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('fileAppeal creates appeal record', async () => {
    const appeal = await fileAppeal('action123', 'Incorrect calculation');
    
    expect(appeal).toHaveProperty('actionId');
    expect(appeal).toHaveProperty('opened');
    expect(appeal).toHaveProperty('status');
    expect(appeal).toHaveProperty('providerId');
    
    expect(appeal.actionId).toBe('action123');
    expect(appeal.status).toBe('open');
  });

  test('getAppealStatus retrieves appeal', async () => {
    await fileAppeal('action456', 'Test reason');
    const appeal = await getAppealStatus('action456');
    
    expect(appeal.actionId).toBe('action456');
    expect(appeal.status).toBe('open');
  });

  test('getAppealStatus throws error for non-existent appeal', async () => {
    await expect(getAppealStatus('non-existent'))
      .rejects.toThrow(BoviAPIError);
  });

  test('getUserAppeals returns all appeals', async () => {
    await fileAppeal('action1', 'Reason 1');
    await fileAppeal('action2', 'Reason 2');
    
    const appeals = await getUserAppeals();
    expect(appeals.length).toBe(2);
  });
});

describe('Federated Cohorts', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('registerClearinghouse validates metadata', async () => {
    await expect(registerClearinghouse({
      id: '',
      name: '',
      jurisdiction: '',
      rulesUrl: '',
      contact: ''
    })).rejects.toThrow(BoviAPIError);
  });

  test('registerClearinghouse stores clearinghouse', async () => {
    const meta = {
      id: 'test-house',
      name: 'Test Clearinghouse',
      jurisdiction: 'TEST',
      rulesUrl: '/test-rules',
      contact: 'test@example.com'
    };
    
    await registerClearinghouse(meta);
    const houses = await getClearinghouses();
    
    expect(houses.find(h => h.id === 'test-house')).toBeDefined();
  });

  test('chooseClearinghouse sets active house', async () => {
    const meta = {
      id: 'chosen-house',
      name: 'Chosen House',
      jurisdiction: 'TEST',
      rulesUrl: '/rules',
      contact: 'test@example.com'
    };
    
    await registerClearinghouse(meta);
    await chooseClearinghouse('chosen-house');
    
    expect(mockLocalStorage.getItem('bovi.activeClearinghouse')).toBe('chosen-house');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test('getClearinghouses returns defaults when none exist', async () => {
    const houses = await getClearinghouses();
    
    expect(Array.isArray(houses)).toBe(true);
    expect(houses.length).toBeGreaterThan(0);
    expect(houses[0]).toHaveProperty('id');
    expect(houses[0]).toHaveProperty('name');
  });
});

describe('Export/Import & Portability', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test('exportAll creates complete bundle', async () => {
    // Set up some data
    mockLocalStorage.setItem('bovi.baskets', JSON.stringify([{ id: 1 }]));
    mockLocalStorage.setItem('bovi.flows', JSON.stringify([{ id: 'flow1' }]));
    
    const bundle = await exportAll();
    
    expect(bundle).toHaveProperty('version');
    expect(bundle).toHaveProperty('timestamp');
    expect(bundle).toHaveProperty('data');
    
    expect(bundle.data).toHaveProperty('baskets');
    expect(bundle.data).toHaveProperty('flows');
    expect(bundle.data).toHaveProperty('contracts');
    expect(bundle.data).toHaveProperty('settings');
    
    expect(bundle.data.baskets.length).toBe(1);
    expect(bundle.data.flows.length).toBe(1);
  });

  test('importBundle restores data', async () => {
    const bundle = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        baskets: [{ id: 'basket1' }],
        flows: [{ id: 'flow1' }],
        contracts: [{ id: 'contract1' }],
        auditLog: [{ id: 'log1' }],
        settings: {
          defaultIndexProvider: 'test-provider',
          activeButler: 'test-butler'
        }
      }
    };
    
    const result = await importBundle(bundle);
    
    expect(result.imported).toBe(true);
    expect(result.summary.baskets).toBe(1);
    expect(result.summary.flows).toBe(1);
    
    // Verify data was stored
    expect(mockLocalStorage.getItem('bovi.defaultIndexProvider')).toBe('test-provider');
    expect(JSON.parse(mockLocalStorage.getItem('bovi.baskets') || '[]')).toHaveLength(1);
  });
});