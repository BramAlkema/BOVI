import type { PluginContext, ServicePlugin } from '../plugin-types.js';
export declare class NotificationPlugin implements ServicePlugin {
    manifest: {
        id: string;
        name: string;
        version: string;
        category: "notification";
        description: string;
        provides: string[];
        config: {
            defaults: {
                enableStormMonitoring: boolean;
                enableWeeklyDigest: boolean;
                digestCheckInterval: number;
                stormMonitoringInterval: number;
            };
        };
    };
    initialize(context: PluginContext): Promise<void>;
    activate(context: PluginContext): Promise<void>;
    deactivate(context: PluginContext): Promise<void>;
    configure(config: Record<string, any>): Promise<void>;
    getService(): import("../../integration/notification-service.js").NotificationService;
    getStatus(): {
        state: "active";
        lastUpdated: number;
        metrics: {};
    };
}
//# sourceMappingURL=notification-plugin.d.ts.map