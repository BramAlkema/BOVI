export declare class NotificationService {
    private digestInterval?;
    private stormMonitoringInterval?;
    initialize(): void;
    private startWeeklyDigest;
    private startStormModeMonitoring;
    private checkForWeeklyDigest;
    private showDigestModal;
    private showStormModeAlert;
    showNotification(message: string, type?: "info" | "success" | "error"): void;
    stop(): void;
    restart(): void;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification-service.d.ts.map