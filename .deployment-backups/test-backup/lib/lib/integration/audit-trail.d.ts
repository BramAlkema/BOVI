export declare class AuditTrailService {
    showAuditTrail(): void;
    exportLogs(): void;
    getLogsSummary(): {
        totalEvents: number;
        eventTypes: Record<string, number>;
        flows: Record<string, number>;
        timeRange: {
            start: string;
            end: string;
        } | null;
    };
    clearLogs(): void;
}
export declare const auditTrail: AuditTrailService;
//# sourceMappingURL=audit-trail.d.ts.map