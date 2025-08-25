import type { FlowSpec } from "../flow/types.js";
import type { KPIMetric } from "../api-types.js";
export type PluginCategory = "ui-component" | "service" | "integration" | "flow-extension" | "monitoring" | "notification";
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    category: PluginCategory;
    description?: string;
    author?: string;
    homepage?: string;
    dependencies?: {
        bovi?: string;
        plugins?: string[];
    };
    provides?: string[];
    requires?: string[];
    config?: {
        schema?: Record<string, any>;
        defaults?: Record<string, any>;
    };
}
export interface PluginContext {
    bus: any;
    timers: any;
    storage: Storage;
    flowRunner?: any;
    api?: any;
    monitoring?: any;
    root?: HTMLElement;
    navigate?: (route: string) => void;
    getPlugin: (id: string) => Plugin | null;
    getPluginConfig: (id: string) => Record<string, any>;
    setPluginConfig: (id: string, config: Record<string, any>) => void;
    showNotification: (message: string, type?: "info" | "success" | "error") => void;
    log: (message: string, level?: "info" | "warn" | "error") => void;
}
export interface Plugin {
    manifest: PluginManifest;
    initialize?(context: PluginContext): Promise<void> | void;
    activate?(context: PluginContext): Promise<void> | void;
    deactivate?(context: PluginContext): Promise<void> | void;
    destroy?(): Promise<void> | void;
    configure?(config: Record<string, any>): Promise<void> | void;
    onEvent?(eventType: string, data: any): void;
    getStatus?(): PluginStatus;
}
export interface PluginStatus {
    state: "uninitialized" | "initialized" | "active" | "inactive" | "error";
    error?: string;
    lastUpdated: number;
    metrics?: Record<string, any>;
}
export interface ServicePlugin extends Plugin {
    getService(): any;
}
export interface UIPlugin extends Plugin {
    render(container: HTMLElement, context: PluginContext): Promise<void> | void;
    unmount?(): void;
}
export interface FlowExtensionPlugin extends Plugin {
    extendFlow?(flowSpec: FlowSpec): FlowSpec;
    registerNodeTypes?(): Record<string, any>;
}
export interface IntegrationPlugin extends Plugin {
    integrateWithSystem(context: PluginContext): Promise<void> | void;
}
export interface MonitoringPlugin extends Plugin {
    getMetrics(): KPIMetric[] | Promise<KPIMetric[]>;
    onMetricUpdate?(metric: KPIMetric): void;
}
export interface PluginEvents {
    "plugin:registered": {
        plugin: Plugin;
    };
    "plugin:initialized": {
        plugin: Plugin;
    };
    "plugin:activated": {
        plugin: Plugin;
    };
    "plugin:deactivated": {
        plugin: Plugin;
    };
    "plugin:error": {
        plugin: Plugin;
        error: Error;
    };
    "plugin:config-changed": {
        plugin: Plugin;
        config: Record<string, any>;
    };
}
//# sourceMappingURL=plugin-types.d.ts.map