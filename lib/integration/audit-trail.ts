/**
 * BOVI Audit Trail Integration
 * Provides audit trail visualization and management
 */

import { AuditLog } from "../bus.js";

/**
 * Audit trail service for displaying system events
 */
export class AuditTrailService {
  /**
   * Show audit trail in a new window
   */
  showAuditTrail(): void {
    const logs = AuditLog.getLogs();
    const auditWindow = window.open("", "_blank", "width=800,height=600");

    if (auditWindow) {
      auditWindow.document.write(`
        <html>
          <head>
            <title>BOVI Audit Trail</title>
            <style>
              body { 
                font-family: monospace; 
                margin: 20px; 
                background: #0b0f14; 
                color: #e7eef9; 
              }
              .log-entry { 
                margin: 10px 0; 
                padding: 8px; 
                background: rgba(255,255,255,0.03); 
                border-radius: 4px; 
              }
              .timestamp { color: #7a8798; }
              .event-type { color: #4cc9f0; font-weight: bold; }
              .flow { color: #a1ffb5; }
              .node { color: #ffd166; }
              .controls {
                margin-bottom: 20px;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
              }
              .btn {
                background: #4cc9f0;
                color: #0b0f14;
                border: none;
                padding: 8px 16px;
                margin-right: 10px;
                border-radius: 4px;
                cursor: pointer;
              }
              .btn:hover {
                background: #7dd3fc;
              }
            </style>
          </head>
          <body>
            <h1>BOVI Audit Trail</h1>
            <div class="controls">
              <button class="btn" onclick="window.print()">Print</button>
              <button class="btn" onclick="exportLogs()">Export JSON</button>
              <button class="btn" onclick="clearLogs()">Clear</button>
            </div>
            <div id="logs">
              ${logs
    .map(
      log => `
                <div class="log-entry">
                  <span class="timestamp">${new Date(log.timestamp).toISOString()}</span>
                  <span class="event-type">${log.event_type}</span>
                  <span class="flow">flow:${log.flow}</span>
                  ${log.node ? `<span class="node">node:${log.node}</span>` : ""}
                  <pre>${JSON.stringify(log.detail, null, 2)}</pre>
                </div>
              `
    )
    .join("")}
            </div>
            <script>
              function exportLogs() {
                const logs = ${JSON.stringify(logs)};
                const blob = new Blob([JSON.stringify(logs, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'bovi-audit-trail.json';
                a.click();
                URL.revokeObjectURL(url);
              }
              
              function clearLogs() {
                if (confirm('Are you sure you want to clear all logs?')) {
                  // This would need to be implemented to communicate back to parent
                  alert('Clear logs functionality needs parent window integration');
                }
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  /**
   * Export audit logs as JSON
   */
  exportLogs(): void {
    const logs = AuditLog.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bovi-audit-trail-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get summary statistics of audit logs
   */
  getLogsSummary(): {
    totalEvents: number;
    eventTypes: Record<string, number>;
    flows: Record<string, number>;
    timeRange: { start: string; end: string } | null;
    } {
    const logs = AuditLog.getLogs();

    if (logs.length === 0) {
      return {
        totalEvents: 0,
        eventTypes: {},
        flows: {},
        timeRange: null,
      };
    }

    const eventTypes: Record<string, number> = {};
    const flows: Record<string, number> = {};

    logs.forEach(log => {
      eventTypes[log.event_type] = (eventTypes[log.event_type] || 0) + 1;
      flows[log.flow] = (flows[log.flow] || 0) + 1;
    });

    const timestamps = logs.map(log => log.timestamp).sort();

    return {
      totalEvents: logs.length,
      eventTypes,
      flows,
      timeRange: {
        start: new Date(timestamps[0]).toISOString(),
        end: new Date(timestamps[timestamps.length - 1]).toISOString(),
      },
    };
  }

  /**
   * Clear audit logs
   */
  clearLogs(): void {
    AuditLog.clear();
    console.log("🗑️ Audit logs cleared");
  }
}

// Export global instance
export const auditTrail = new AuditTrailService();
