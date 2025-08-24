/**
 * BOVI API Types
 * TypeScript definitions for developer backlog features
 */

// =============================================================================
// FRIEDMAN STANCE APIs - Rules, Stability, Competition
// =============================================================================

/**
 * Rules Registry - Versioned rule management
 */
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

/**
 * Macro Economic References
 */
export interface MacroRefs {
  cpiYoY: number;
  wageYoY: number;
  policyRate: number;
  updated: string;
}

/**
 * Contract Indexation
 */
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

/**
 * Bracket Indexation Simulation
 */
export interface BracketResult {
  taxNow: number;
  taxIndexed: number;
  creep: number;
}

/**
 * Payment Rails Marketplace
 */
export interface RailQuote {
  rail: "SEPA" | "FPS" | "Card" | "StableL2";
  fee: number;
  etaSec: number;
  successP90: number;
}

/**
 * Butler Competition
 */
export interface ButlerManifest {
  name: string;
  version: string;
  capabilities: string[];
}

// =============================================================================
// HAYEK STANCE APIs - Pluralism, Exit, Local Knowledge
// =============================================================================

/**
 * Plural Indices Marketplace
 */
export interface IndexProvider {
  id: string;
  name: string;
  method: "LTS-local" | "LTS-cohort" | "CPI" | "WAGE";
  url?: string;
}

/**
 * Butler Hub - Open SDK
 */
export interface ButlerPackage {
  id: string;
  name: string;
  version: string;
  paramsSchema: any; // JSON Schema
}

/**
 * Rail Neutrality Auditing
 */
export interface FairnessAudit {
  selectedRail: string;
  bestQuote: RailQuote;
  fairnessScore: number; // 0-1 where 1 is perfectly fair
}

/**
 * Local Knowledge Capture
 */
export interface IndexCommons {
  sources: string[];
  median: number;
  mad: number; // Median Absolute Deviation
  quality: number; // Quality score 0-1
  lastUpdated: string;
}

/**
 * Appeal & Liability System
 */
export interface Appeal {
  actionId: string;
  opened: string;
  status: "open" | "resolved";
  providerId: string;
  outcome?: string;
}

/**
 * Federated Cohorts
 */
export interface Clearinghouse {
  id: string;
  name: string;
  jurisdiction: string;
  rulesUrl: string;
  contact: string;
}

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * KPI Dashboard
 */
export interface KPIMetric {
  name: string;
  value: number;
  threshold: number;
  status: "green" | "amber" | "red";
  trend: "up" | "down" | "stable";
}

/**
 * Export/Import
 */
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

/**
 * Trial/Experiment Registry
 */
export interface Trial {
  id: string;
  hypothesis: string;
  start: string;
  end: string;
  metrics: string[];
  preregUrl?: string;
}

/**
 * Common Error Types
 */
export class BoviAPIError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BoviAPIError';
  }
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