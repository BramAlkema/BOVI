/**
 * Built-in Flow Extension Plugin
 * Demonstrates how to extend the flow system with plugins
 */

import type { Plugin, PluginContext, FlowExtensionPlugin } from '../plugin-types.js';
import type { FlowSpec } from '../../flow/types.js';

export class FlowExtensionPlugin implements FlowExtensionPlugin {
  manifest = {
    id: 'bovi-core-flow-extensions',
    name: 'BOVI Flow Extensions',
    version: '1.0.0',
    category: 'flow-extension' as const,
    description: 'Core flow system extensions and custom node types',
    provides: ['custom-nodes', 'flow-validation', 'flow-analytics'],
    requires: ['flow-runner'],
    config: {
      defaults: {
        enableCustomNodes: true,
        enableFlowValidation: true,
        enableFlowAnalytics: false
      }
    }
  };

  async initialize(context: PluginContext): Promise<void> {
    context.log('Flow extension plugin initializing');
    
    // Validate flow runner is available
    if (!context.flowRunner) {
      throw new Error('Flow extension plugin requires flow runner');
    }
  }

  async activate(context: PluginContext): Promise<void> {
    const config = context.getPluginConfig(this.manifest.id);
    
    if (config.enableCustomNodes) {
      this.registerCustomNodeTypes();
    }
    
    if (config.enableFlowValidation) {
      this.setupFlowValidation();
    }
    
    if (config.enableFlowAnalytics) {
      this.setupFlowAnalytics();
    }
    
    context.log('Flow extension plugin activated');
  }

  extendFlow(flowSpec: FlowSpec): FlowSpec {
    // Example: Add metadata or modify flow specification
    const extended = {
      ...flowSpec,
      meta: {
        ...flowSpec.meta,
        extended: true,
        extensionVersion: this.manifest.version,
        extensionTimestamp: Date.now()
      }
    };
    
    return extended;
  }

  registerNodeTypes(): Record<string, any> {
    return {
      'V.Analytics': {
        execute: async (node: any, context: any) => {
          // Custom analytics node implementation
          return {
            analyticsData: {
              nodeId: node.id,
              timestamp: Date.now(),
              flowId: context.flowId
            }
          };
        }
      },
      'B.Notification': {
        execute: async (node: any, context: any) => {
          // Custom notification node implementation
          const message = node.config?.message || 'Flow notification';
          const type = node.config?.type || 'info';
          
          // This would use the notification service
          console.log(`[Flow Notification] ${message}`);
          
          return {
            notificationSent: true,
            message,
            type
          };
        }
      }
    };
  }

  private registerCustomNodeTypes(): void {
    const nodeTypes = this.registerNodeTypes();
    console.log('Registered custom node types:', Object.keys(nodeTypes));
    
    // In a real implementation, this would register the node types
    // with the flow runner's node executor service
  }

  private setupFlowValidation(): void {
    // Set up flow validation hooks
    console.log('Flow validation enabled');
    
    // Example: Validate flow before execution
    // This would hook into the flow runner's lifecycle
  }

  private setupFlowAnalytics(): void {
    // Set up flow analytics tracking
    console.log('Flow analytics enabled');
    
    // Example: Track flow execution metrics
    // This would hook into flow events to collect analytics
  }

  getStatus() {
    return {
      state: 'active' as const,
      lastUpdated: Date.now(),
      metrics: {
        customNodeTypes: Object.keys(this.registerNodeTypes()).length,
        validationEnabled: true,
        analyticsEnabled: false
      }
    };
  }
}