/**
 * BOVI Flow Loader
 * Handles loading and initialization of flow specifications
 */

import type { FlowSpec } from '../flow/types.js';
import { flowRunner } from '../flow/index.js';

/**
 * Flow loader service that manages flow specification loading
 */
export class FlowLoaderService {
  private flowSpecs: Map<string, FlowSpec> = new Map();

  /**
   * Load flow specifications from JSON files
   */
  async loadFlowSpecs(flowIds: string[] = ['groceries', 'rent', 'energy']): Promise<void> {
    for (const flowId of flowIds) {
      try {
        const response = await fetch(`/flows/${flowId}.json`);
        const flowSpec: FlowSpec = await response.json();
        
        this.flowSpecs.set(flowId, flowSpec);
        await flowRunner.loadFlow(flowSpec);
        
        console.log(`📋 Loaded flow: ${flowId}`);
      } catch (error) {
        console.warn(`Failed to load flow ${flowId}:`, error);
      }
    }
  }

  /**
   * Get loaded flow specification
   */
  getFlowSpec(flowId: string): FlowSpec | undefined {
    return this.flowSpecs.get(flowId);
  }

  /**
   * Get all loaded flow specifications
   */
  getAllFlowSpecs(): Record<string, FlowSpec> {
    const result: Record<string, FlowSpec> = {};
    this.flowSpecs.forEach((spec, id) => {
      result[id] = spec;
    });
    return result;
  }

  /**
   * Check if a flow is loaded
   */
  isFlowLoaded(flowId: string): boolean {
    return this.flowSpecs.has(flowId);
  }

  /**
   * Reload a specific flow
   */
  async reloadFlow(flowId: string): Promise<void> {
    try {
      const response = await fetch(`/flows/${flowId}.json`);
      const flowSpec: FlowSpec = await response.json();
      
      this.flowSpecs.set(flowId, flowSpec);
      await flowRunner.loadFlow(flowSpec);
      
      console.log(`🔄 Reloaded flow: ${flowId}`);
    } catch (error) {
      console.error(`Failed to reload flow ${flowId}:`, error);
      throw error;
    }
  }
}

// Export global instance
export const flowLoader = new FlowLoaderService();