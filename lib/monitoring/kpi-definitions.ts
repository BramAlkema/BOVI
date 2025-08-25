/**
 * BOVI KPI Definitions
 * Defines all key performance indicators based on developer backlog requirements
 */

import { KPIMetric } from "../api-types.js";

/**
 * KPI threshold configuration with red/amber/green zones
 */
export interface KPIThresholds {
  red: { min?: number; max?: number };
  amber: { min?: number; max?: number };
  green: { min?: number; max?: number };
  unit: string;
  description: string;
}

/**
 * All BOVI KPI definitions from the developer backlog
 */
export const KPI_DEFINITIONS: Record<string, KPIThresholds> = {
  // Phase 1: Personal BOVI KPIs
  "ruler_switch_time": {
    red: { max: 1000 }, // >1000ms
    amber: { min: 200, max: 1000 }, // 200-1000ms  
    green: { max: 200 }, // <200ms
    unit: "ms",
    description: "Time to switch between inflation rulers"
  },

  "ruler_adoption_rate": {
    red: { max: 0.3 }, // <30%
    amber: { min: 0.3, max: 0.6 }, // 30-60%
    green: { min: 0.6 }, // >60%
    unit: "%",
    description: "Percentage of users trying non-default rulers within first week"
  },

  "money_veil_calculation_time": {
    red: { max: 1000 }, // >1000ms
    amber: { min: 500, max: 1000 }, // 500-1000ms
    green: { max: 500 }, // <500ms
    unit: "ms", 
    description: "Time to calculate money-veil scenarios"
  },

  "money_veil_engagement": {
    red: { max: 0.2 }, // <20%
    amber: { min: 0.2, max: 0.4 }, // 20-40%
    green: { min: 0.4 }, // >40%
    unit: "%",
    description: "Weekly active usage of money-veil card"
  },

  "hamburger_viral_coefficient": {
    red: { max: 0.1 }, // <0.1
    amber: { min: 0.1, max: 0.3 }, // 0.1-0.3
    green: { min: 0.3 }, // >0.3
    unit: "ratio",
    description: "Each user brings N new users via hamburger sharing"
  },

  "local_index_computation_time": {
    red: { max: 500 }, // >500ms
    amber: { min: 200, max: 500 }, // 200-500ms  
    green: { max: 200 }, // <200ms
    unit: "ms",
    description: "Time to compute local inflation index (privacy requirement)"
  },

  // Phase 2: Social BOVI KPIs
  "contract_completion_rate": {
    red: { max: 0.7 }, // <70%
    amber: { min: 0.7, max: 0.9 }, // 70-90%
    green: { min: 0.9 }, // >90%
    unit: "%",
    description: "Percentage of created contracts that get signed"
  },

  "contract_disputes_per_1k": {
    red: { min: 10 }, // >10 per 1000
    amber: { min: 3, max: 10 }, // 3-10 per 1000
    green: { max: 3 }, // <3 per 1000
    unit: "per 1k",
    description: "Contract disputes per 1000 contracts created"
  },

  "contract_reversal_time": {
    red: { min: 172800000 }, // >48h in ms
    amber: { min: 86400000, max: 172800000 }, // 24-48h
    green: { max: 86400000 }, // <24h
    unit: "ms",
    description: "Time to reverse problematic contracts"
  },

  "cohort_satisfaction_rate": {
    red: { max: 0.9 }, // <90%
    amber: { min: 0.9, max: 0.95 }, // 90-95%
    green: { min: 0.95 }, // >95%
    unit: "%", 
    description: "No-one-worse-off guarantee success rate"
  },

  "cohort_fairness_check_time": {
    red: { min: 2000 }, // >2s
    amber: { min: 1000, max: 2000 }, // 1-2s
    green: { max: 1000 }, // <1s
    unit: "ms",
    description: "Time to verify fairness for 100-participant cohort"
  },

  // Phase 3: Advanced BOVI KPIs
  "storm_mode_activation_time": {
    red: { min: 10000 }, // >10s
    amber: { min: 5000, max: 10000 }, // 5-10s
    green: { max: 5000 }, // <5s
    unit: "ms",
    description: "End-to-end storm mode activation time"
  },

  "storm_mode_effectiveness": {
    red: { max: 0.1 }, // <10%
    amber: { min: 0.1, max: 0.2 }, // 10-20%
    green: { min: 0.2 }, // >20%
    unit: "%",
    description: "Spending reduction during storm mode activation"
  },

  // System Health KPIs
  "system_uptime": {
    red: { max: 0.95 }, // <95%
    amber: { min: 0.95, max: 0.99 }, // 95-99%
    green: { min: 0.99 }, // >99%
    unit: "%",
    description: "System availability and uptime"
  },

  "api_response_time": {
    red: { min: 1000 }, // >1s
    amber: { min: 500, max: 1000 }, // 500ms-1s
    green: { max: 500 }, // <500ms
    unit: "ms",
    description: "Average API response time"
  },

  "failed_payment_rate": {
    red: { min: 0.02 }, // >2%
    amber: { min: 0.005, max: 0.02 }, // 0.5-2%
    green: { max: 0.005 }, // <0.5%
    unit: "%",
    description: "Payment failure rate P90"
  },

  "rule_compliance_rate": {
    red: { max: 0.8 }, // <80%
    amber: { min: 0.8, max: 0.9 }, // 80-90%
    green: { min: 0.9 }, // >90%
    unit: "%",
    description: "Percentage of flows using latest rules"
  },

  "appeal_resolution_time": {
    red: { min: 604800000 }, // >7 days in ms
    amber: { min: 259200000, max: 604800000 }, // 3-7 days
    green: { max: 259200000 }, // <3 days
    unit: "ms",
    description: "Time to resolve user appeals P90"
  }
};

/**
 * Determine KPI status based on value and thresholds
 */
export function determineKPIStatus(kpiName: string, value: number): "green" | "amber" | "red" {
  const definition = KPI_DEFINITIONS[kpiName];
  if (!definition) return "amber"; // Unknown KPI defaults to amber

  // Check red thresholds first
  if (definition.red.min !== undefined && value >= definition.red.min) return "red";
  if (definition.red.max !== undefined && value <= definition.red.max) return "red";

  // Check green thresholds
  if (definition.green.min !== undefined && value >= definition.green.min) return "green";  
  if (definition.green.max !== undefined && value <= definition.green.max) return "green";

  // Default to amber if not red or green
  return "amber";
}

/**
 * Create a KPI metric with automatic status determination
 */
export function createKPIMetric(
  name: string, 
  value: number, 
  trend: "up" | "down" | "stable" = "stable"
): KPIMetric {
  const definition = KPI_DEFINITIONS[name];
  const status = determineKPIStatus(name, value);
  
  // Use green threshold as default if available, otherwise use value
  const threshold = definition?.green?.min ?? definition?.green?.max ?? value;
  
  return {
    name,
    value,
    threshold,
    status,
    trend
  };
}

/**
 * Get all KPI categories for organization
 */
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
} as const;
