/**
 * Built-in Notification Plugin
 * Wraps the notification service as a plugin
 */

import type { Plugin, PluginContext, ServicePlugin } from '../plugin-types.js';
import { notificationService } from '../../integration/notification-service.js';

export class NotificationPlugin implements ServicePlugin {
  manifest = {
    id: 'bovi-core-notifications',
    name: 'BOVI Notification Service',
    version: '1.0.0',
    category: 'notification' as const,
    description: 'Provides system notifications and background monitoring',
    provides: ['notifications', 'alerts', 'monitoring'],
    config: {
      defaults: {
        enableStormMonitoring: true,
        enableWeeklyDigest: true,
        digestCheckInterval: 86400000, // 24 hours
        stormMonitoringInterval: 300000 // 5 minutes
      }
    }
  };

  async initialize(context: PluginContext): Promise<void> {
    context.log('Notification service plugin initializing');
  }

  async activate(context: PluginContext): Promise<void> {
    notificationService.initialize();
    context.log('Notification service plugin activated');
  }

  async deactivate(context: PluginContext): Promise<void> {
    notificationService.stop();
    context.log('Notification service plugin deactivated');
  }

  async configure(config: Record<string, any>): Promise<void> {
    // Apply configuration to notification service
    // This would be implemented based on the service's configuration options
    console.log('Configuring notification service with:', config);
  }

  getService() {
    return notificationService;
  }

  getStatus() {
    return {
      state: 'active' as const,
      lastUpdated: Date.now(),
      metrics: {
        // Could include metrics like notifications sent, alerts triggered, etc.
      }
    };
  }
}