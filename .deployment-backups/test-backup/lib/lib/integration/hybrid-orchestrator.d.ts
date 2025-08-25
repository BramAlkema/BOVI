export declare class HybridSystemOrchestrator {
    private initialized;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    restart(): Promise<void>;
    getStatus(): {
        initialized: boolean;
        flowsLoaded: number;
        studiosActive: number;
        aiButlerEnabled: boolean;
    };
    getComponents(): {
        flowSpecs: Record<string, any>;
        studios: Record<string, any>;
    };
    showAuditTrail(): void;
    exportAuditLogs(): void;
    showNotification(message: string, type?: "info" | "success" | "error"): void;
}
export declare const hybridOrchestrator: HybridSystemOrchestrator;
//# sourceMappingURL=hybrid-orchestrator.d.ts.map