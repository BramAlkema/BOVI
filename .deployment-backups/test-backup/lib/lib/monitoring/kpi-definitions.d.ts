import { KPIMetric } from "../api-types.js";
export interface KPIThresholds {
    red: {
        min?: number;
        max?: number;
    };
    amber: {
        min?: number;
        max?: number;
    };
    green: {
        min?: number;
        max?: number;
    };
    unit: string;
    description: string;
}
export declare const KPI_DEFINITIONS: Record<string, KPIThresholds>;
export declare function determineKPIStatus(kpiName: string, value: number): "green" | "amber" | "red";
export declare function createKPIMetric(name: string, value: number, trend?: "up" | "down" | "stable"): KPIMetric;
export declare const KPI_CATEGORIES: {
    readonly Performance: readonly ["ruler_switch_time", "money_veil_calculation_time", "local_index_computation_time", "cohort_fairness_check_time", "storm_mode_activation_time", "api_response_time"];
    readonly "User Engagement": readonly ["ruler_adoption_rate", "money_veil_engagement", "hamburger_viral_coefficient", "contract_completion_rate", "cohort_satisfaction_rate"];
    readonly "System Quality": readonly ["system_uptime", "failed_payment_rate", "rule_compliance_rate", "contract_disputes_per_1k", "appeal_resolution_time"];
    readonly "Feature Effectiveness": readonly ["storm_mode_effectiveness", "contract_reversal_time"];
};
//# sourceMappingURL=kpi-definitions.d.ts.map