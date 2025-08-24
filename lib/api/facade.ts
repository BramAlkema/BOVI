/**
 * BOVI API Façade
 * Unified interface for both Friedman and Hayek stance APIs
 */

import * as FriedmanAPI from '../friedman-apis.js';
import * as HayekAPI from '../hayek-apis.js';
import { BoviAPIError } from '../api-types.js';

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
      
      console.log('🚀 BOVI API façade initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize BOVI API façade:', error);
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
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<{
    ruleCompliance: number;
    activeFlows: number;
    railFairness: number;
    appealsPending: number;
    clearinghousesActive: number;
  }> {
    try {
      const [compliance, appeals, clearinghouses, railReport] = await Promise.all([
        this.rules.checkRuleCompliance(),
        this.appeals.list(),
        this.cohorts.list(),
        this.fairness.report()
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
  async emergencyReset(): Promise<void> {
    if (!confirm('This will clear ALL local BOVI data. Are you sure?')) {
      return;
    }

    // Clear all localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('bovi.'));
    keys.forEach(key => localStorage.removeItem(key));

    // Reinitialize with defaults
    await this.initialize();
    
    console.log('🔄 Emergency reset completed');
  }
}

/**
 * Quick system health check function
 */
export async function systemHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
}> {
  const { dashboard } = await import('../monitoring/kpi-dashboard.js');
  const summary = dashboard.getHealthSummary();
  return {
    status: summary.status,
    score: summary.score,
    issues: summary.issues
  };
}

// Export global API instance
export const api = new BoviAPI();