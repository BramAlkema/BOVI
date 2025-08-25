import { notificationService } from '../../integration/notification-service.js';
export class NotificationPlugin {
    constructor() {
        this.manifest = {
            id: 'bovi-core-notifications',
            name: 'BOVI Notification Service',
            version: '1.0.0',
            category: 'notification',
            description: 'Provides system notifications and background monitoring',
            provides: ['notifications', 'alerts', 'monitoring'],
            config: {
                defaults: {
                    enableStormMonitoring: true,
                    enableWeeklyDigest: true,
                    digestCheckInterval: 86400000,
                    stormMonitoringInterval: 300000
                }
            }
        };
    }
    async initialize(context) {
        context.log('Notification service plugin initializing');
    }
    async activate(context) {
        notificationService.initialize();
        context.log('Notification service plugin activated');
    }
    async deactivate(context) {
        notificationService.stop();
        context.log('Notification service plugin deactivated');
    }
    async configure(config) {
        console.log('Configuring notification service with:', config);
    }
    getService() {
        return notificationService;
    }
    getStatus() {
        return {
            state: 'active',
            lastUpdated: Date.now(),
            metrics: {}
        };
    }
}
//# sourceMappingURL=notification-plugin.js.map