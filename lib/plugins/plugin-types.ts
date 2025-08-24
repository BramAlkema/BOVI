/**
 * BOVI Plugin System Types
 * Enhanced plugin system that integrates with modular architecture
 */

import type { FlowSpec } from "../flow/types.js";
import type { KPIMetric } from "../api-types.js";

// Plugin categories
export type PluginCategory =
  | "ui-component" // UI components (existing system)
  | "service" // Service plugins
  | "integration" // Integration plugins
  | "flow-extension" // Flow system extensions
  | "monitoring" // Monitoring and KPI plugins
  | "notification"; // Notification plugins

// Enhanced plugin manifest
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  description?: string;
  author?: string;
  homepage?: string;

  // Dependencies
  dependencies?: {
    bovi?: string; // Min BOVI version
    plugins?: string[]; // Required plugin IDs
  };

  // Capabilities
  provides?: string[]; // What services/features this plugin provides
  requires?: string[]; // What services this plugin needs

  // Configuration
  config?: {
    schema?: Record<string, any>;
    defaults?: Record<string, any>;
  };
}

// Plugin context - what plugins have access to
export interface PluginContext {
  // Core systems
  bus: any; // Event bus
  timers: any; // Timer management
  storage: Storage; // Local storage

  // BOVI systems
  flowRunner?: any; // Flow execution
  api?: any; // BOVI API façade
  monitoring?: any; // KPI monitoring

  // UI context (for UI plugins)
  root?: HTMLElement;
  navigate?: (route: string) => void;

  // Plugin management
  getPlugin: (id: string) => Plugin | null;
  getPluginConfig: (id: string) => Record<string, any>;
  setPluginConfig: (id: string, config: Record<string, any>) => void;

  // Utility functions
  showNotification: (message: string, type?: "info" | "success" | "error") => void;
  log: (message: string, level?: "info" | "warn" | "error") => void;
}

// Plugin lifecycle interface
export interface Plugin {
  manifest: PluginManifest;

  // Lifecycle methods
  initialize?(context: PluginContext): Promise<void> | void;
  activate?(context: PluginContext): Promise<void> | void;
  deactivate?(context: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;

  // Configuration
  configure?(config: Record<string, any>): Promise<void> | void;

  // Plugin-specific interfaces
  onEvent?(eventType: string, data: any): void;
  getStatus?(): PluginStatus;
}

// Plugin status
export interface PluginStatus {
  state: "uninitialized" | "initialized" | "active" | "inactive" | "error";
  error?: string;
  lastUpdated: number;
  metrics?: Record<string, any>;
}

// Service plugin interface
export interface ServicePlugin extends Plugin {
  getService(): any;
}

// UI component plugin interface
export interface UIPlugin extends Plugin {
  render(container: HTMLElement, context: PluginContext): Promise<void> | void;
  unmount?(): void;
}

// Flow extension plugin interface
export interface FlowExtensionPlugin extends Plugin {
  extendFlow?(flowSpec: FlowSpec): FlowSpec;
  registerNodeTypes?(): Record<string, any>;
}

// Integration plugin interface
export interface IntegrationPlugin extends Plugin {
  integrateWithSystem(context: PluginContext): Promise<void> | void;
}

// Monitoring plugin interface
export interface MonitoringPlugin extends Plugin {
  getMetrics(): KPIMetric[] | Promise<KPIMetric[]>;
  onMetricUpdate?(metric: KPIMetric): void;
}

// Plugin events
export interface PluginEvents {
  "plugin:registered": { plugin: Plugin };
  "plugin:initialized": { plugin: Plugin };
  "plugin:activated": { plugin: Plugin };
  "plugin:deactivated": { plugin: Plugin };
  "plugin:error": { plugin: Plugin; error: Error };
  "plugin:config-changed": { plugin: Plugin; config: Record<string, any> };
}
