/**
 * BOVI Notification Service
 * Handles system notifications and background monitoring
 */

import { generateWeeklyDigest } from '../services/weekly-digest.js';
import { getRulers } from '../services/rulers.js';

/**
 * Notification service for background monitoring and alerts
 */
export class NotificationService {
  private digestInterval?: number;
  private stormMonitoringInterval?: number;

  /**
   * Initialize notification service
   */
  initialize(): void {
    this.startWeeklyDigest();
    this.startStormModeMonitoring();
    
    console.log('📢 Notification service initialized');
  }

  /**
   * Start weekly digest monitoring
   */
  private startWeeklyDigest(): void {
    // Check if it's time for weekly digest
    const lastDigest = localStorage.getItem('bovi.lastWeeklyDigest');
    const weeksSince = lastDigest ? 
      (Date.now() - parseInt(lastDigest)) / (1000 * 60 * 60 * 24 * 7) : 999;
    
    if (weeksSince >= 1) {
      // Generate and show digest with delay after page load
      setTimeout(async () => {
        try {
          const digest = await generateWeeklyDigest();
          this.showDigestModal(digest);
          localStorage.setItem('bovi.lastWeeklyDigest', Date.now().toString());
        } catch (error) {
          console.error('Weekly digest error:', error);
        }
      }, 5000); // 5 second delay after page load
    }

    // Set up periodic check (once per day)
    this.digestInterval = window.setInterval(() => {
      this.checkForWeeklyDigest();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Start storm mode monitoring
   */
  private startStormModeMonitoring(): void {
    // Monitor for storm mode triggers every 5 minutes
    this.stormMonitoringInterval = window.setInterval(async () => {
      try {
        const rulers = await getRulers();
        const localInflation = rulers.find(r => r.id === 'bovi-local')?.bpDrift || 0;
        
        // Check if inflation exceeds 5% (500bp)
        if (localInflation > 500) {
          const hasStormProfile = JSON.parse(localStorage.getItem('bovi.stormProfiles') || '[]').length > 0;
          if (hasStormProfile && !localStorage.getItem('bovi.stormMode.active')) {
            this.showStormModeAlert();
          }
        }
      } catch (error) {
        console.warn('Storm mode monitoring error:', error);
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Check for weekly digest
   */
  private async checkForWeeklyDigest(): Promise<void> {
    const lastDigest = localStorage.getItem('bovi.lastWeeklyDigest');
    const weeksSince = lastDigest ? 
      (Date.now() - parseInt(lastDigest)) / (1000 * 60 * 60 * 24 * 7) : 999;
    
    if (weeksSince >= 1) {
      try {
        const digest = await generateWeeklyDigest();
        this.showDigestModal(digest);
        localStorage.setItem('bovi.lastWeeklyDigest', Date.now().toString());
      } catch (error) {
        console.error('Weekly digest error:', error);
      }
    }
  }

  /**
   * Show digest modal
   */
  private showDigestModal(digest: any): void {
    // Try to use existing digest modal from UI modules
    const event = new CustomEvent('bovi.showDigest', { detail: digest });
    window.dispatchEvent(event);
    
    // Fallback: simple alert if no UI module handles it
    setTimeout(() => {
      if (!event.defaultPrevented) {
        console.log('Weekly Digest:', digest);
        this.showNotification('📊 Weekly digest available - check console for details');
      }
    }, 100);
  }

  /**
   * Show storm mode alert
   */
  private showStormModeAlert(): void {
    this.showNotification('⛈️ High inflation detected! Consider activating Storm Mode.', 'error');
  }

  /**
   * Show notification
   */
  showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      backgroundColor: type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#2563eb',
      color: 'white',
      borderRadius: '6px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: '9999',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Stop all monitoring
   */
  stop(): void {
    if (this.digestInterval) {
      clearInterval(this.digestInterval);
      this.digestInterval = undefined;
    }
    
    if (this.stormMonitoringInterval) {
      clearInterval(this.stormMonitoringInterval);
      this.stormMonitoringInterval = undefined;
    }
    
    console.log('📢 Notification service stopped');
  }

  /**
   * Restart monitoring
   */
  restart(): void {
    this.stop();
    this.initialize();
  }
}

// Export global instance
export const notificationService = new NotificationService();