export const KPI_DEFINITIONS = {
    "ruler_switch_time": {
        red: { max: 1000 },
        amber: { min: 200, max: 1000 },
        green: { max: 200 },
        unit: "ms",
        description: "Time to switch between inflation rulers"
    },
    "ruler_adoption_rate": {
        red: { max: 0.3 },
        amber: { min: 0.3, max: 0.6 },
        green: { min: 0.6 },
        unit: "%",
        description: "Percentage of users trying non-default rulers within first week"
    },
    "money_veil_calculation_time": {
        red: { max: 1000 },
        amber: { min: 500, max: 1000 },
        green: { max: 500 },
        unit: "ms",
        description: "Time to calculate money-veil scenarios"
    },
    "money_veil_engagement": {
        red: { max: 0.2 },
        amber: { min: 0.2, max: 0.4 },
        green: { min: 0.4 },
        unit: "%",
        description: "Weekly active usage of money-veil card"
    },
    "hamburger_viral_coefficient": {
        red: { max: 0.1 },
        amber: { min: 0.1, max: 0.3 },
        green: { min: 0.3 },
        unit: "ratio",
        description: "Each user brings N new users via hamburger sharing"
    },
    "local_index_computation_time": {
        red: { max: 500 },
        amber: { min: 200, max: 500 },
        green: { max: 200 },
        unit: "ms",
        description: "Time to compute local inflation index (privacy requirement)"
    },
    "contract_completion_rate": {
        red: { max: 0.7 },
        amber: { min: 0.7, max: 0.9 },
        green: { min: 0.9 },
        unit: "%",
        description: "Percentage of created contracts that get signed"
    },
    "contract_disputes_per_1k": {
        red: { min: 10 },
        amber: { min: 3, max: 10 },
        green: { max: 3 },
        unit: "per 1k",
        description: "Contract disputes per 1000 contracts created"
    },
    "contract_reversal_time": {
        red: { min: 172800000 },
        amber: { min: 86400000, max: 172800000 },
        green: { max: 86400000 },
        unit: "ms",
        description: "Time to reverse problematic contracts"
    },
    "cohort_satisfaction_rate": {
        red: { max: 0.9 },
        amber: { min: 0.9, max: 0.95 },
        green: { min: 0.95 },
        unit: "%",
        description: "No-one-worse-off guarantee success rate"
    },
    "cohort_fairness_check_time": {
        red: { min: 2000 },
        amber: { min: 1000, max: 2000 },
        green: { max: 1000 },
        unit: "ms",
        description: "Time to verify fairness for 100-participant cohort"
    },
    "storm_mode_activation_time": {
        red: { min: 10000 },
        amber: { min: 5000, max: 10000 },
        green: { max: 5000 },
        unit: "ms",
        description: "End-to-end storm mode activation time"
    },
    "storm_mode_effectiveness": {
        red: { max: 0.1 },
        amber: { min: 0.1, max: 0.2 },
        green: { min: 0.2 },
        unit: "%",
        description: "Spending reduction during storm mode activation"
    },
    "system_uptime": {
        red: { max: 0.95 },
        amber: { min: 0.95, max: 0.99 },
        green: { min: 0.99 },
        unit: "%",
        description: "System availability and uptime"
    },
    "api_response_time": {
        red: { min: 1000 },
        amber: { min: 500, max: 1000 },
        green: { max: 500 },
        unit: "ms",
        description: "Average API response time"
    },
    "failed_payment_rate": {
        red: { min: 0.02 },
        amber: { min: 0.005, max: 0.02 },
        green: { max: 0.005 },
        unit: "%",
        description: "Payment failure rate P90"
    },
    "rule_compliance_rate": {
        red: { max: 0.8 },
        amber: { min: 0.8, max: 0.9 },
        green: { min: 0.9 },
        unit: "%",
        description: "Percentage of flows using latest rules"
    },
    "appeal_resolution_time": {
        red: { min: 604800000 },
        amber: { min: 259200000, max: 604800000 },
        green: { max: 259200000 },
        unit: "ms",
        description: "Time to resolve user appeals P90"
    }
};
export function determineKPIStatus(kpiName, value) {
    const definition = KPI_DEFINITIONS[kpiName];
    if (!definition)
        return "amber";
    if (definition.red.min !== undefined && value >= definition.red.min)
        return "red";
    if (definition.red.max !== undefined && value <= definition.red.max)
        return "red";
    if (definition.green.min !== undefined && value >= definition.green.min)
        return "green";
    if (definition.green.max !== undefined && value <= definition.green.max)
        return "green";
    return "amber";
}
export function createKPIMetric(name, value, trend = "stable") {
    const definition = KPI_DEFINITIONS[name];
    const status = determineKPIStatus(name, value);
    const threshold = definition?.green?.min ?? definition?.green?.max ?? value;
    return {
        name,
        value,
        threshold,
        status,
        trend
    };
}
export const KPI_CATEGORIES = {
    "Performance": [
        "ruler_switch_time",
        "money_veil_calculation_time",
        "local_index_computation_time",
        "cohort_fairness_check_time",
        "storm_mode_activation_time",
        "api_response_time"
    ],
    "User Engagement": [
        "ruler_adoption_rate",
        "money_veil_engagement",
        "hamburger_viral_coefficient",
        "contract_completion_rate",
        "cohort_satisfaction_rate"
    ],
    "System Quality": [
        "system_uptime",
        "failed_payment_rate",
        "rule_compliance_rate",
        "contract_disputes_per_1k",
        "appeal_resolution_time"
    ],
    "Feature Effectiveness": [
        "storm_mode_effectiveness",
        "contract_reversal_time"
    ]
};
//# sourceMappingURL=kpi-definitions.js.map