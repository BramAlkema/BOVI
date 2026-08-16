/**
 * SelectionLifecycle V2 source and runtime types.
 *
 * The source is deliberately JSON-safe. Scenario files contain data and named
 * policy identifiers, never executable callbacks or authoritative social facts.
 */

export const PPM = 1_000_000 as const;
export const SCHEMA_VERSION = "selection-lifecycle/v1" as const;
export const MODEL_VERSION = "selection-lifecycle-engine/v1" as const;
export const SCHEDULE_VERSION = "staged-snapshot/v1" as const;
export const RNG_VERSION = "xoshiro128ss-xmur3/v1" as const;

/** Locale-independent UTF-16/code-unit ordering used by schedules and hashes. */
export function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export type Ppm = number;
export type MicroUnits = number;
export type Tick = number;

export type ActorId = string;
export type DomainId = string;
export type InstrumentId = string;
export type RelationshipId = string;
export type CircuitId = string;
export type KeeperAssignmentId = string;
export type PrimingMechanismId = string;
export type OpportunityId = string;
export type ContinuationAssumptionId = string;
export type BondedAssumptionId = string;
export type PolicyId = string;

export type InitialCondition = "orphan-candidate" | "matched-obligation" | "inherited-installed";

export type SelectionLifecycleState =
  | "candidate"
  | "priming"
  | "propagating"
  | "installed-supported"
  | "installed-self-maintaining"
  | "repairing"
  | "fragile"
  | "declining"
  | "exited"
  | "collapsed"
  | "superseded";

export type KeeperTopology =
  | "self"
  | "bilateral"
  | "open"
  | "provider"
  | "federated"
  | "quorum"
  | "rotating"
  | "office"
  | "protocol"
  | "external";

export type KeeperFunction =
  | "recognise-validity"
  | "authenticate"
  | "observe"
  | "trigger"
  | "record"
  | "challenge"
  | "find"
  | "respond"
  | "repair"
  | "make-change"
  | "maintain-liquidity"
  | "maintain-infrastructure"
  | "change-rules";

export type FractionationKind = "quantity" | "time" | "counterparty";
export type SurplusKind = "specialisation" | "trade-fractionation" | "conflict-mitigation";

export type WedgeKind =
  | "subsidy"
  | "coercion"
  | "tax-receivability"
  | "legal-privilege"
  | "platform-leverage"
  | "prior-use"
  | "speculation"
  | "familiar-form"
  | "other";

export interface InstrumentAcceptanceSpec {
  domainId: DomainId;
  instrumentId: InstrumentId;
  initiallyAccepts: boolean;
  initialReacceptanceBeliefPpm: Ppm;
  adoptionThresholdPpm: Ppm;
  abandonmentThresholdPpm: Ppm;
  adoptionWindowTicks: number;
  abandonmentWindowTicks: number;
  switchingCost: MicroUnits;
  holdingCostPerTick: MicroUnits;
  installedComplement: MicroUnits;
}

export interface ActorSpec {
  id: ActorId;
  label?: string;
  policyId: PolicyId;
  domainIds: DomainId[];
  roles: string[];
  active: boolean;
  discountPpm: Ppm;
  exitHazardPpm: Ppm;
  learningRatePpm: Ppm;
  outsideOptionByDomain: Record<DomainId, MicroUnits>;
  acceptance: InstrumentAcceptanceSpec[];
}

export interface InstrumentSpec {
  id: InstrumentId;
  label?: string;
  unit: string;
  ledger: string;
  rail: string;
  issuerId: string | null;
  authenticationCost: MicroUnits;
  transactionCost: MicroUnits;
  supportsFractionation: FractionationKind[];
  repairable: boolean;
}

export interface InstallationCriterion {
  minAcceptancePpm: Ppm;
  minActualUsesPerWindow: number;
  minConnectedAcceptors: number;
  windowTicks: number;
}

export interface MaintenanceCriterion {
  minActualUsesPerWindow: number;
  minKeeperCoveragePpm: Ppm;
  windowTicks: number;
  removalTestTicks: number;
}

export interface DomainSpec {
  id: DomainId;
  label?: string;
  unit: string;
  ledger: string;
  rail: string;
  function: string;
  relationship: string;
  place: string;
  period: string;
  population: ActorId[];
  instrumentIds: InstrumentId[];
  incumbentInstrumentIds: InstrumentId[];
  competingDomainIds: DomainId[];
  coexistingDomainIds: DomainId[];
  installation: InstallationCriterion;
  maintenance: MaintenanceCriterion;
  initialLifecycleByInstrument: Record<InstrumentId, SelectionLifecycleState>;
}

export interface ActorSurplusSpec {
  actorId: ActorId;
  components: SurplusComponentSpec[];
}

export interface SurplusComponentSpec {
  kind: SurplusKind;
  amount: MicroUnits;
  counterfactualId: string;
  overlapKey: string;
  fractionationKind?: FractionationKind;
}

export interface RelationshipSpec {
  id: RelationshipId;
  fromActorId: ActorId;
  toActorId: ActorId;
  domainId: DomainId;
  active: boolean;
  opportunityArrivalPpm: Ppm;
  instrumentIds: InstrumentId[];
}

export type CircuitAction =
  | "acquire"
  | "tender"
  | "accept"
  | "post"
  | "respend"
  | "clear"
  | "redeem"
  | "renew";

export interface CircuitEdgeSpec {
  id: string;
  relationshipId: RelationshipId;
  action: CircuitAction;
  /** Actors whose continued participation is required for this edge. */
  loadBearingActorIds: ActorId[];
  keeperAssignmentIds: KeeperAssignmentId[];
  renewal: boolean;
}

export interface MinimumCredibleCircuitSpec {
  id: CircuitId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  edges: CircuitEdgeSpec[];
  minCompletedCycles: number;
  minDistinctActors: number;
  windowTicks: number;
  maxFailurePpm: Ppm;
}

export interface OpenBoundarySpec {
  description: string;
  failureSignal: string;
}

export interface KeeperAssignmentSpec {
  id: KeeperAssignmentId;
  domainId: DomainId;
  instrumentId: InstrumentId | null;
  keeperFunction: KeeperFunction;
  topology: KeeperTopology;
  actorIds: ActorId[];
  requiredActorsPerAction: number;
  capacityPerTick: number;
  reliabilityPpm: Ppm;
  costPerAction: MicroUnits;
  rewardPerAction: MicroUnits;
  funding: "internal" | "external" | "unfunded";
  fundingActorIds: ActorId[];
  /** Named non-participant payers when funding is external. */
  externalPayerIds: string[];
  /** Bounded external reward budget available in one tick. */
  externalFundingBudgetPerTick: MicroUnits;
  /** Maximum keeper rewards this actor may fund in one tick. */
  fundingCapacityPerActorPerTick: MicroUnits;
  fallbackAssignmentId?: KeeperAssignmentId;
  openBoundary?: OpenBoundarySpec;
}

export type PrimingStopCondition =
  | { kind: "tick"; tick: Tick }
  | { kind: "credible-circuit"; persistenceTicks: number }
  | { kind: "installed"; persistenceTicks: number }
  | { kind: "budget-exhausted" };

export interface PrimingMechanismSpec {
  id: PrimingMechanismId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  payerIds: string[];
  targetActorIds: ActorId[];
  circuitId: CircuitId;
  wedgeKind: WedgeKind;
  wedgeDescription?: string;
  startsAtTick: Tick;
  costPerTick: MicroUnits;
  totalBudget: MicroUnits;
  acceptanceBoostPpm: Ppm;
  switchingCostOffset: MicroUnits;
  stopCondition: PrimingStopCondition;
  removalTestTicks: number;
  externalInput: boolean;
  keeperAssignmentIds: KeeperAssignmentId[];
  bondedAssumptionIds: BondedAssumptionId[];
}

export interface ContinuationOpportunitySpec {
  id: OpportunityId;
  domainId: DomainId;
  relationshipId: RelationshipId;
  instrumentId: InstrumentId;
  arrivalPpm: Ppm;
  clearProbabilityPpm: Ppm;
  accessibleSurplus: ActorSurplusSpec[];
  provenance: string;
  bondedAssumptionIds: BondedAssumptionId[];
}

export type ContinuationAction =
  | KeeperFunction
  | CircuitAction
  | "perform"
  | "repay"
  | "fund-keeper";

export type LossPathSpec =
  | { kind: "direct"; lossProbabilityPpm: Ppm }
  | {
      kind: "finding-mediated";
      observationPpm: Ppm;
      upheldFindingPpm: Ppm;
      responsePpm: Ppm;
    };

export interface ContinuationAssumptionSpec {
  id: ContinuationAssumptionId;
  actorId: ActorId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  action: ContinuationAction;
  opportunityIds: OpportunityId[];
  horizonTicks: number;
  discountPpm: Ppm;
  lossPath: LossPathSpec;
  outsideOptionAdvantage: MicroUnits;
  immediateReward: MicroUnits;
  oneShotDefectionGain: MicroUnits;
  participationCost: MicroUnits;
  keeperEffortCost: MicroUnits;
  riskCost: MicroUnits;
  bondedAssumptionIds: BondedAssumptionId[];
}

export interface BondedAssumptionSpec {
  id: BondedAssumptionId;
  scope: string;
  claim: string;
  assertedBy: string;
  stake: string;
  refutationCondition: string;
  challengerStanding: string;
  provenance: string;
}

export type PolicySpec =
  | {
      kind: "threshold-learning";
      id: PolicyId;
      socialWeightPpm: Ppm;
      serviceWeightPpm: Ppm;
      primingWeightPpm: Ppm;
    }
  | {
      kind: "legacy-kw-threshold";
      id: PolicyId;
      adoptIncrement: Ppm;
      decayIncrement: Ppm;
    };

export type ShockSpec =
  | { tick: Tick; kind: "deactivate-actor"; actorId: ActorId }
  | { tick: Tick; kind: "deactivate-relationship"; relationshipId: RelationshipId }
  | { tick: Tick; kind: "disable-keeper"; keeperAssignmentId: KeeperAssignmentId }
  | { tick: Tick; kind: "stop-priming"; primingMechanismId: PrimingMechanismId }
  | {
      tick: Tick;
      kind: "scale-opportunities";
      domainId: DomainId;
      factorPpm: Ppm;
    };

export interface ScenarioSpec {
  schemaVersion: typeof SCHEMA_VERSION;
  modelVersion: typeof MODEL_VERSION;
  scheduleVersion: typeof SCHEDULE_VERSION;
  rngVersion: typeof RNG_VERSION;
  id: string;
  title: string;
  initialCondition: InitialCondition;
  ticks: number;
  warmupTicks: number;
  actors: ActorSpec[];
  domains: DomainSpec[];
  instruments: InstrumentSpec[];
  relationships: RelationshipSpec[];
  circuits: MinimumCredibleCircuitSpec[];
  keeperAssignments: KeeperAssignmentSpec[];
  primingMechanisms: PrimingMechanismSpec[];
  continuationOpportunities: ContinuationOpportunitySpec[];
  continuationAssumptions: ContinuationAssumptionSpec[];
  bondedAssumptions: BondedAssumptionSpec[];
  policies: PolicySpec[];
  shocks: ShockSpec[];
  worldBoundaries: string[];
  killConditions: string[];
}

export interface ActorAcceptanceState {
  accepts: boolean;
  reacceptanceBeliefPpm: Ppm;
  adoptionCounter: number;
  abandonmentCounter: number;
  installedComplement: MicroUnits;
}

export interface ActorRuntimeState {
  id: ActorId;
  active: boolean;
  acceptance: Record<string, ActorAcceptanceState>;
  realisedSurplus: MicroUnits;
  keeperCosts: MicroUnits;
  keeperRewards: MicroUnits;
  keeperFundingCosts: MicroUnits;
  primingCosts: MicroUnits;
}

export interface DomainInstrumentState {
  key: string;
  domainId: DomainId;
  instrumentId: InstrumentId;
  lifecycle: SelectionLifecycleState;
  stateEnteredTick: Tick;
  credibleCircuit: boolean;
  acceptingActors: ActorId[];
  recentAttemptedTrades: number[];
  recentAttemptedCircuitCycles: number[];
  recentCompletedTrades: number[];
  recentCircuitCycles: number[];
  recentKeeperCoveragePpm: Ppm[];
  activeExternalSupport: boolean;
  wedgeRemovedAtTick: Tick | null;
}

export interface PrimingRuntimeState {
  id: PrimingMechanismId;
  active: boolean;
  spent: MicroUnits;
  externalSpent: MicroUnits;
  spentAtTick: Tick | null;
  stoppedAtTick: Tick | null;
}

export interface KeeperRuntimeState {
  id: KeeperAssignmentId;
  enabled: boolean;
  actedThisTick: number;
  skippedThisTick: number;
}

export interface RuntimeRelationshipState {
  id: RelationshipId;
  active: boolean;
  opportunityScalePpm: Ppm;
}

export interface CircuitRuntimeState {
  id: CircuitId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  credible: boolean;
  recentAttemptedCycles: number[];
  recentCompletedCycles: number[];
}

export interface PendingTradeState {
  tradeId: string;
  circuitId: CircuitId;
  circuitEdgeId: string;
  circuitAction: CircuitAction;
  relationshipId: RelationshipId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  fromActorId: ActorId;
  toActorId: ActorId;
}

export interface TickDomainActivityState {
  domainId: DomainId;
  instrumentId: InstrumentId;
  attemptedTenderTradeIds: string[];
  attemptedCircuitIds: CircuitId[];
  completedPostTradeIds: string[];
  completedCircuitIds: CircuitId[];
  requiredKeeperObligationIds: string[];
  completedKeeperObligationIds: string[];
  keeperEconomicsCoveredByObligation: Record<string, boolean>;
  windowRecorded: boolean;
}

export interface SimulationState {
  tick: Tick;
  runSeed: string | null;
  runTicks: number | null;
  runScenarioHash: string | null;
  actors: Record<ActorId, ActorRuntimeState>;
  domainInstruments: Record<string, DomainInstrumentState>;
  priming: Record<PrimingMechanismId, PrimingRuntimeState>;
  keepers: Record<KeeperAssignmentId, KeeperRuntimeState>;
  relationships: Record<RelationshipId, RuntimeRelationshipState>;
  circuits: Record<CircuitId, CircuitRuntimeState>;
  pendingTrades: Record<string, PendingTradeState>;
  tickActivity: Record<string, TickDomainActivityState>;
  tickStartedTick: Tick | null;
  adoptionAppliedTick: Tick | null;
  lastEventId: string | null;
}

export interface IncentiveMargin {
  assumptionId: ContinuationAssumptionId;
  actorId: ActorId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  accessibleFlow: MicroUnits;
  presentValueAtRisk: MicroUnits;
  lossProbabilityPpm: Ppm;
  benefitAtRisk: MicroUnits;
  totalCost: MicroUnits;
  margin: MicroUnits;
  holds: boolean;
}

export interface DomainInstrumentMetrics {
  domainId: DomainId;
  instrumentId: InstrumentId;
  lifecycle: SelectionLifecycleState;
  acceptancePpm: Ppm;
  acceptingConnectedComponent: number;
  attemptedTrades: number;
  completedTrades: number;
  refusedTrades: number;
  primingSpent: MicroUnits;
  keeperCoveragePpm: Ppm;
  realisedAccessibleSurplus: MicroUnits;
  weakestIncentiveMargin: MicroUnits | null;
}

export interface TickMetrics {
  tick: Tick;
  domains: DomainInstrumentMetrics[];
}

export interface RunManifest {
  scenarioId: string;
  scenarioHash: string;
  assumptionHash: string;
  seed: string;
  schemaVersion: string;
  modelVersion: string;
  scheduleVersion: string;
  rngVersion: string;
  repositoryCommit?: string;
}

export interface RunSummary {
  manifest: RunManifest;
  terminalStateHash: string;
  eventLogHash: string;
  ticksCompleted: number;
  lifecycleByDomainInstrument: Record<string, SelectionLifecycleState>;
  survivedAfterPriming: Record<string, boolean | null>;
  /** Null when a nominally positive path had an observed post-removal cumulative economic opening. */
  weakestKeeperMargin: IncentiveMargin | null;
  metrics: TickMetrics[];
}

export function domainInstrumentKey(domainId: DomainId, instrumentId: InstrumentId): string {
  return `${domainId}::${instrumentId}`;
}
