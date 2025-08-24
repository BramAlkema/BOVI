# BOVI Developer Backlog

This document outlines the development roadmap for BOVI Framework, organized around two complementary philosophical approaches to economic system design.

## Overview

The backlog is structured around two stances that can coexist within the BOVI ecosystem:

- **Friedman Stance**: Rules, stability, competition through clear standards
- **Hayek Stance**: Pluralism, exit rights, local knowledge capture

Each feature includes API definitions, UI requirements, and key performance indicators (KPIs).

---

## 🏛️ Friedman Stance Features
*Rules, stability, competition through standardization*

### 1. Rules Registry
**Priority: High** | **Effort: Medium**

Publish, version, and rarely change defaults with advance notice.

**API**
```typescript
type RuleId = string;
interface RuleVersion { 
  id: RuleId; 
  semver: string; 
  summary: string; 
  effectiveFrom: string; 
  deprecates?: string;
}
interface Ruleset { 
  id: RuleId; 
  current: RuleVersion; 
  history: RuleVersion[];
}
function getRulesets(): Promise<Ruleset[]>;
```

**UI Requirements**
- "Rules" panel with change-log & scheduled activations
- Version diff viewer
- Deprecation warnings with migration timeline

**KPIs**
- % of flows using latest rules
- Rule churn ≤ 1 change/quarter
- Zero surprise rule changes

---

### 2. Macro Anchoring
**Priority: High** | **Effort: Low**

Show official economic indicators alongside LTS calculations for transparency.

**API**
```typescript
interface MacroRefs {
  cpiYoY: number;
  wageYoY: number;
  policyRate: number;
  updated: string;
}
function getMacroRefs(): Promise<MacroRefs>;
```

**UI Requirements**
- Dual-ruler badges on price/contract screens
- "Official vs LTS" comparison cards
- Macro context tooltips

**KPIs**
- User comprehension (quiz CTR) ≥ 80%
- Fewer "what changed?" support tickets
- Macro data freshness < 24h

---

### 3. Indexation Pack
**Priority: Medium** | **Effort: High**

Simple, predictable contract rules with caps, floors, and carryover logic.

**API**
```typescript
interface IndexClause { 
  ruler: "LTS" | "CPI" | "WAGE"; 
  capBp?: number; 
  floorBp?: number; 
  carryOver?: boolean;
}
interface ContractTemplate { 
  id: string; 
  text: string; 
  index: IndexClause; 
  undoWindowSec: number;
}
```

**UI Requirements**
- Contract builder with visual clause editor
- Human-readable receipt + JSON export
- Undo countdown timer

**KPIs**
- Disputes per 1k contracts < 3
- Reversal time < 48h
- Contract comprehension score > 85%

---

### 4. Bracket Indexation Simulator
**Priority: Medium** | **Effort: Medium**

Expose bracket creep effects and suggest indexed thresholds.

**API**
```typescript
interface BracketResult {
  taxNow: number;
  taxIndexed: number;
  creep: number;
}
function simulateBrackets(income: number, cpi: number): BracketResult;
```

**UI Requirements**
- Money-veil card with "Bracket (if indexed)" line
- Bracket creep alert system
- Tax optimization suggestions

**KPIs**
- Open rate of creep alerts
- User adoption of indexation fixes
- Simulation accuracy vs actual outcomes

---

### 5. Rails Marketplace
**Priority: High** | **Effort: High**

Route payments by fee/latency with no privileged pipes.

**API**
```typescript
interface RailQuote { 
  rail: "SEPA" | "FPS" | "Card" | "StableL2"; 
  fee: number; 
  etaSec: number; 
  successP90: number;
}
function quoteRails(amount: number, dest: string): Promise<RailQuote[]>;
```

**UI Requirements**
- "Best rail" picker with explanations
- Fee comparison matrix
- Success rate indicators

**KPIs**
- Blended fee reduction over time
- Failed payments P90 < 0.5%
- Quote accuracy vs actual performance

---

### 6. Butler Competition
**Priority: Medium** | **Effort: Medium**

Allow users to choose rival default engines for AI Butler functionality.

**API**
```typescript
interface ButlerManifest {
  name: string;
  version: string;
  capabilities: string[];
}
function registerButler(id: string, manifest: ButlerManifest): Promise<void>;
```

**UI Requirements**
- Settings → "Choose your Butler"
- Butler marketplace with ratings
- Performance comparison dashboard

**KPIs**
- Switch friction (time to swap) < 10s
- ≥2 third-party butlers available
- User satisfaction by butler type

---

---

## 🌐 Hayek Stance Features
*Pluralism, exit rights, local knowledge*

### 1. Plural Indices Marketplace
**Priority: High** | **Effort: High**

Multiple competing inflation indices with user choice and local computation.

**API**
```typescript
interface IndexProvider { 
  id: string; 
  name: string; 
  method: "LTS-local" | "LTS-cohort" | "CPI" | "WAGE"; 
  url?: string;
}
function listIndexProviders(): Promise<IndexProvider[]>;
function setDefaultIndex(providerId: string): Promise<void>;
```

**UI Requirements**
- "Rulers" switcher with provider badges
- Transparency notes and methodology links
- No-telemetry mode toggle

**KPIs**
- Time to switch ruler < 5s
- No-telemetry mode available
- Index provider diversity (≥3 active)

---

### 2. Butler Hub
**Priority: Medium** | **Effort: High**

Open SDK for rival AI butlers with easy installation and switching.

**API**
```typescript
interface ButlerManifest { 
  id: string; 
  name: string; 
  version: string; 
  paramsSchema: any;
}
function installButler(pkgUrl: string): Promise<ButlerManifest>;
function activateButler(id: string): Promise<void>;
```

**UI Requirements**
- Butler marketplace with ratings and reviews
- Per-flow butler assignment
- Sandbox testing environment

**KPIs**
- ≥2 third-party butlers installed in sandbox
- Butler swap success rate = 100%
- Average user satisfaction by butler

---

### 3. Rail Neutrality
**Priority: High** | **Effort: Medium**

Fair routing across payment rails with no privileged access.

**API**
```typescript
// Uses same RailQuote interface as Friedman stance
interface FairnessAudit {
  selectedRail: string;
  bestQuote: RailQuote;
  fairnessScore: number;
}
function auditRailSelection(): Promise<FairnessAudit>;
```

**UI Requirements**
- "Pipe Fairness Checker" in settings
- Rail selection transparency
- Fairness score dashboard

**KPIs**
- Selection ≈ best quote ≥ 95% cases
- Zero privileged pipe incidents
- Rail diversity in recommendations

---

### 4. Local Knowledge Capture
**Priority: Medium** | **Effort: High**

On-device computation with opt-in cohort sharing for privacy-first analytics.

**API**
```typescript
interface IndexCommons {
  sources: string[];
  median: number;
  mad: number; // Median Absolute Deviation
  quality: number;
  lastUpdated: string;
}
function computeLocalIndex(): Promise<IndexCommons>;
function shareWithCohort(data: IndexCommons, consent: boolean): Promise<void>;
```

**UI Requirements**
- Index Lab with data provenance
- Privacy controls for cohort sharing
- Share link generation

**KPIs**
- Compute time < 200ms
- Zero PII in cohort aggregates
- Local index accuracy vs network

---

### 5. Appeal & Liability Hooks
**Priority: High** | **Effort: Medium**

Every automated action must have an appeal path with provider liability.

**API**
```typescript
interface Appeal { 
  actionId: string; 
  opened: string; 
  status: "open" | "resolved"; 
  providerId: string; 
  outcome?: string;
}
function fileAppeal(actionId: string, reason: string): Promise<Appeal>;
function getAppealStatus(appealId: string): Promise<Appeal>;
```

**UI Requirements**
- "Appeal" button on all automated action receipts
- SLA countdown timers
- Appeal status tracking

**KPIs**
- Appeals resolved P90 < 7 days
- Provider payout/liability tracking
- Appeal success rate by category

---

### 6. Federated Cohorts
**Priority: Low** | **Effort: High**

Polycentric clearinghouses where communities run their own price discovery.

**API**
```typescript
interface Clearinghouse { 
  id: string; 
  name: string; 
  jurisdiction: string; 
  rulesUrl: string; 
  contact: string;
}
function registerClearinghouse(meta: Clearinghouse): Promise<void>;
function chooseClearinghouse(id: string): Promise<void>;
```

**UI Requirements**
- Clearinghouse directory
- Rules preview before joining
- Community governance interface

**KPIs**
- ≥2 clearinghouses per vertical in sandbox
- "Worse-off count" = 0 (no users made worse off by choice)
- Clearinghouse uptime > 99.5%

---

## 📋 Implementation Guidelines

### Technical Standards
- **TypeScript first**: Strict mode enabled, all APIs documented with JSDoc
- **Privacy by default**: No raw spending data leaves device without explicit consent
- **Export everything**: Human-readable receipts + JSON export for all data
- **KPI dashboard**: Red/amber/green thresholds for all metrics

### Development Phases

**Phase 1 (Foundation)**
- Rules Registry
- Macro Anchoring  
- Basic Rails Marketplace
- Appeal Hooks

**Phase 2 (Competition)**
- Butler Competition
- Plural Indices Marketplace
- Rail Neutrality
- Local Knowledge Capture

**Phase 3 (Federation)**
- Indexation Pack
- Bracket Simulator
- Butler Hub SDK
- Federated Cohorts

### Quality Gates
- All APIs must have TypeScript definitions
- Unit tests with >80% coverage
- Integration tests for cross-component features
- Performance benchmarks for compute-heavy features
- Security audit for privacy-sensitive components

---

*This backlog balances the need for stable, predictable systems (Friedman) with the benefits of competition, choice, and local knowledge (Hayek). Features from both stances can be implemented in parallel, creating a robust ecosystem that serves diverse user needs while maintaining economic coherence.*