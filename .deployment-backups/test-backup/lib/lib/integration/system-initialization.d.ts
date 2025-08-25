export declare class SystemInitializer {
    private kpiMonitoring;
    private initialized;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getStatus(): {
        initialized: boolean;
        apiReady: boolean;
        monitoringActive: boolean;
        healthScore: number;
    };
    restart(): Promise<void>;
}
export declare const systemInitializer: SystemInitializer;
export declare function emergencyReset(): Promise<void>;
//# sourceMappingURL=system-initialization.d.ts.map