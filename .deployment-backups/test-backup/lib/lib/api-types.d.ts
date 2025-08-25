export type RuleId = string;
export interface RuleVersion {
    id: RuleId;
    semver: string;
    summary: string;
    effectiveFrom: string;
    deprecates?: string;
}
export interface Ruleset {
    id: RuleId;
    current: RuleVersion;
    history: RuleVersion[];
}
export interface MacroRefs {
    cpiYoY: number;
    wageYoY: number;
    policyRate: number;
    updated: string;
}
export interface IndexClause {
    ruler: "LTS" | "CPI" | "WAGE";
    capBp?: number;
    floorBp?: number;
    carryOver?: boolean;
}
export interface ContractTemplate {
    id: string;
    text: string;
    index: IndexClause;
    undoWindowSec: number;
}
export interface BracketResult {
    taxNow: number;
    taxIndexed: number;
    creep: number;
}
export interface RailQuote {
    rail: "SEPA" | "FPS" | "Card" | "StableL2";
    fee: number;
    etaSec: number;
    successP90: number;
}
export interface ButlerManifest {
    name: string;
    version: string;
    capabilities: string[];
}
export interface IndexProvider {
    id: string;
    name: string;
    method: "LTS-local" | "LTS-cohort" | "CPI" | "WAGE";
    url?: string;
}
export interface ButlerPackage {
    id: string;
    name: string;
    version: string;
    paramsSchema: any;
}
export interface FairnessAudit {
    selectedRail: string;
    bestQuote: RailQuote;
    fairnessScore: number;
}
export interface IndexCommons {
    sources: string[];
    median: number;
    mad: number;
    quality: number;
    lastUpdated: string;
}
export interface Appeal {
    actionId: string;
    opened: string;
    status: "open" | "resolved";
    providerId: string;
    outcome?: string;
}
export interface Clearinghouse {
    id: string;
    name: string;
    jurisdiction: string;
    rulesUrl: string;
    contact: string;
}
export interface KPIMetric {
    name: string;
    value: number;
    threshold: number;
    status: "green" | "amber" | "red";
    trend: "up" | "down" | "stable";
}
export interface ExportBundle {
    version: string;
    timestamp: string;
    data: {
        baskets: any[];
        flows: any[];
        contracts: any[];
        auditLog: any[];
        settings: any;
    };
}
export interface Trial {
    id: string;
    hypothesis: string;
    start: string;
    end: string;
    metrics: string[];
    preregUrl?: string;
}
export declare class BoviAPIError extends Error {
    code: string;
    message: string;
    details?: any | undefined;
    constructor(code: string, message: string, details?: any | undefined);
}
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
//# sourceMappingURL=api-types.d.ts.map