import { IndexProvider, ButlerPackage, FairnessAudit, IndexCommons, Appeal, Clearinghouse, RailQuote, ExportBundle } from './api-types.js';
export declare function listIndexProviders(): Promise<IndexProvider[]>;
export declare function setDefaultIndex(providerId: string): Promise<void>;
export declare function getCurrentIndexProvider(): Promise<IndexProvider>;
export declare function calculateWithProvider(providerId: string, basket: any[]): Promise<{
    value: number;
    method: string;
    timestamp: string;
    confidence: number;
}>;
export declare function installButler(pkgUrl: string): Promise<ButlerPackage>;
export declare function activateButler(id: string): Promise<void>;
export declare function getInstalledButlers(): Promise<ButlerPackage[]>;
export declare function uninstallButler(id: string): Promise<void>;
export declare function auditRailSelection(selectedRail: string, allQuotes: RailQuote[]): Promise<FairnessAudit>;
export declare function generateFairnessReport(): Promise<{
    period: string;
    averageFairness: number;
    flaggedIncidents: number;
    railPerformance: Array<{
        rail: string;
        fairnessScore: number;
        volume: number;
    }>;
}>;
export declare function computeLocalIndex(basket?: any[]): Promise<IndexCommons>;
export declare function shareWithCohort(data: IndexCommons, consent: boolean): Promise<{
    shared: boolean;
    cohortSize: number;
    anonymized: boolean;
}>;
export declare function fileAppeal(actionId: string, reason: string): Promise<Appeal>;
export declare function getAppealStatus(appealId: string): Promise<Appeal>;
export declare function getUserAppeals(): Promise<Appeal[]>;
export declare function registerClearinghouse(meta: Clearinghouse): Promise<void>;
export declare function chooseClearinghouse(id: string): Promise<void>;
export declare function getClearinghouses(): Promise<Clearinghouse[]>;
export declare function exportAll(): Promise<ExportBundle>;
export declare function importBundle(bundle: ExportBundle): Promise<{
    imported: boolean;
    conflicts: string[];
    summary: {
        [key: string]: number;
    };
}>;
//# sourceMappingURL=hayek-apis.d.ts.map