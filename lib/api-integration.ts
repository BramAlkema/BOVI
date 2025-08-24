/**
 * BOVI API Integration
 * Unified interface for both Friedman and Hayek stance APIs
 */

import { Bus, emit } from './bus.js';
import * as FriedmanAPI from './friedman-apis.js';
import * as HayekAPI from './hayek-apis.js';
import { KPIMetric, BoviAPIError } from './api-types.js';

// =============================================================================
// UNIFIED API FACADE
// =============================================================================

/**
 * BOVI API provides unified access to both Friedman and Hayek stance features
 */
export class BoviAPI {
  // Friedman stance - Rules and stability
  public readonly rules = FriedmanAPI;
  public readonly macro = {
    getRefs: FriedmanAPI.getMacroRefs,
    compareToOfficial: FriedmanAPI.compareLTSToOfficial
  };
  public readonly contracts = {
    getTemplates: FriedmanAPI.getContractTemplates,
    create: FriedmanAPI.createContract
  };
  public readonly brackets = {
    simulate: FriedmanAPI.simulateBrackets
  };
  public readonly rails = {
    quote: FriedmanAPI.quoteRails,
    execute: FriedmanAPI.executePayment
  };
  public readonly butlers = {
    register: FriedmanAPI.registerButler,
    list: FriedmanAPI.getRegisteredButlers,
    switch: FriedmanAPI.switchButler
  };

  // Hayek stance - Pluralism and choice
  public readonly indices = {
    list: HayekAPI.listIndexProviders,
    setDefault: HayekAPI.setDefaultIndex,
    getCurrent: HayekAPI.getCurrentIndexProvider,
    calculate: HayekAPI.calculateWithProvider
  };
  public readonly butlerHub = {
    install: HayekAPI.installButler,
    activate: HayekAPI.activateButler,
    getInstalled: HayekAPI.getInstalledButlers,
    uninstall: HayekAPI.uninstallButler
  };
  public readonly fairness = {
    audit: HayekAPI.auditRailSelection,
    report: HayekAPI.generateFairnessReport
  };
  public readonly local = {
    compute: HayekAPI.computeLocalIndex,
    share: HayekAPI.shareWithCohort
  };
  public readonly appeals = {
    file: HayekAPI.fileAppeal,
    status: HayekAPI.getAppealStatus,
    list: HayekAPI.getUserAppeals
  };
  public readonly cohorts = {
    register: HayekAPI.registerClearinghouse,
    choose: HayekAPI.chooseClearinghouse,
    list: HayekAPI.getClearinghouses
  };
  public readonly portability = {
    export: HayekAPI.exportAll,
    import: HayekAPI.importBundle
  };

  /**
   * Initialize API with default configuration
   */
  async initialize(): Promise<void> {
    try {
      // Ensure basic configuration is set up
      await this.ensureDefaults();
      
      // Start background monitoring
      this.startKPIMonitoring();
      
      emit('ui.ai_butler.toggled', { enabled: true });
      
      console.log('🚀 BOVI API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize BOVI API:', error);
      throw error;
    }
  }

  /**
   * Ensure default settings are configured
   */
  private async ensureDefaults(): Promise<void> {
    // Set default index provider if none selected
    try {
      await this.indices.getCurrent();
    } catch {
      await this.indices.setDefault('bovi-local');
    }

    // Ensure default clearinghouses exist
    const clearinghouses = await this.cohorts.list();
    if (clearinghouses.length === 0) {
      await this.cohorts.register({
        id: 'bovi-main',
        name: 'BOVI Main Clearinghouse',
        jurisdiction: 'UK',
        rulesUrl: '/rules/main.json',
        contact: 'support@bovi.money'
      });
    }
  }

  /**
   * Start KPI monitoring for dashboard
   */
  private startKPIMonitoring(): void {
    // Monitor rule compliance
    setInterval(async () => {
      try {
        const compliance = await this.rules.checkRuleCompliance();
        this.updateKPI('rule_compliance', compliance.compliance, 0.9);
      } catch (error) {
        console.warn('KPI monitoring failed:', error);
      }
    }, 60000); // Every minute

    // Monitor rail fairness
    setInterval(async () => {
      try {
        const report = await this.fairness.report();
        this.updateKPI('rail_fairness', report.averageFairness, 0.95);
      } catch (error) {
        console.warn('Rail fairness monitoring failed:', error);
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Update KPI metric and emit event
   */
  private updateKPI(name: string, value: number, threshold: number): void {
    const status = value >= threshold ? 'green' : 
                  value >= threshold * 0.8 ? 'amber' : 'red';
    
    const kpi: KPIMetric = {
      name,
      value,
      threshold,
      status,
      trend: 'stable' // Would calculate from historical data
    };

    emit('ui.kpi.updated', { 
      flow: 'system',
      kpi: name, 
      value: kpi 
    });
  }
}

// =============================================================================
// GLOBAL API INSTANCE
// =============================================================================

export const api = new BoviAPI();

// =============================================================================
// KPI DASHBOARD
// =============================================================================

/**
 * KPI Dashboard for monitoring system health
 */
export class KPIDashboard {
  private metrics: Map<string, KPIMetric> = new Map();

  constructor() {
    // Listen for KPI updates
    Bus.on('ui.kpi.updated', (event) => {
      if (typeof event.detail.value === 'object' && 'name' in event.detail.value) {
        this.metrics.set(event.detail.kpi, event.detail.value as KPIMetric);
      }
    });
  }

  /**
   * Get all current KPI metrics
   */
  getMetrics(): KPIMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific KPI metric
   */
  getMetric(name: string): KPIMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get metrics by status
   */
  getMetricsByStatus(status: 'green' | 'amber' | 'red'): KPIMetric[] {
    return this.getMetrics().filter(m => m.status === status);
  }

  /**
   * Get overall system health score (0-1)
   */
  getHealthScore(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 1;

    const weights = { green: 1, amber: 0.5, red: 0 };
    const totalWeight = metrics.reduce((sum, m) => sum + weights[m.status], 0);
    
    return totalWeight / metrics.length;
  }
}

export const dashboard = new KPIDashboard();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick health check of the system
 */
export async function systemHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
}> {
  const score = dashboard.getHealthScore();
  const redMetrics = dashboard.getMetricsByStatus('red');
  const amberMetrics = dashboard.getMetricsByStatus('amber');
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (score >= 0.9) status = 'healthy';
  else if (score >= 0.7) status = 'degraded';
  else status = 'unhealthy';

  const issues = [
    ...redMetrics.map(m => `Critical: ${m.name} (${m.value})`),
    ...amberMetrics.map(m => `Warning: ${m.name} (${m.value})`)
  ];

  return { status, score, issues };
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats(): Promise<{
  ruleCompliance: number;
  activeFlows: number;
  railFairness: number;
  appealsPending: number;
  clearinghousesActive: number;
}> {
  try {
    const [compliance, appeals, clearinghouses, railReport] = await Promise.all([
      api.rules.checkRuleCompliance(),
      api.appeals.list(),
      api.cohorts.list(),
      api.fairness.report()
    ]);

    return {
      ruleCompliance: compliance.compliance,
      activeFlows: compliance.outdatedFlows.length, // Inverse metric
      railFairness: railReport.averageFairness,
      appealsPending: appeals.filter(a => a.status === 'open').length,
      clearinghousesActive: clearinghouses.length
    };
  } catch (error) {
    throw new BoviAPIError('STATS_FETCH_FAILED', 'Failed to fetch system statistics', error);
  }
}

/**
 * Emergency system reset (clears all local data)
 */
export async function emergencyReset(): Promise<void> {
  if (!confirm('This will clear ALL local BOVI data. Are you sure?')) {
    return;
  }

  // Clear all localStorage
  const keys = Object.keys(localStorage).filter(key => key.startsWith('bovi.'));
  keys.forEach(key => localStorage.removeItem(key));

  // Reinitialize with defaults
  await api.initialize();

  emit('ui.ai_butler.toggled', { enabled: true });
  
  console.log('🔄 Emergency reset completed');
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Auto-initialize API when module is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await api.initialize();
    } catch (error) {
      console.error('Failed to auto-initialize BOVI API:', error);
    }
  });
}

// Export everything for external use
export * from './api-types.js';
export { FriedmanAPI, HayekAPI };