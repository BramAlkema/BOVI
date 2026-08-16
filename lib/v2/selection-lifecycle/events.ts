import { deterministicHash } from "./canonical-json.js";
import type {
  ActorAcceptanceState,
  ActorId,
  CircuitAction,
  CircuitId,
  DomainId,
  InstrumentId,
  KeeperAssignmentId,
  MicroUnits,
  Ppm,
  PrimingMechanismId,
  RelationshipId,
  SelectionLifecycleState,
  Tick,
} from "./types.js";

export const EVENT_VERSION = "selection-lifecycle-event/v1" as const;

export const PHASE_ORDER = {
  shocks: 0,
  opportunities: 1,
  adoption: 2,
  matching: 3,
  performance: 4,
  settlement: 5,
  institutional: 6,
  responses: 7,
  keepers: 8,
  learning: 9,
  lifecycle: 10,
  metrics: 11,
} as const;

export type SimulationPhase = keyof typeof PHASE_ORDER;

export interface LogicalTime {
  tick: Tick;
  phase: SimulationPhase;
  sequence: number;
}

interface EventBase<TType extends string> {
  eventVersion: typeof EVENT_VERSION;
  id: string;
  at: LogicalTime;
  type: TType;
}

export interface RunStartedEvent extends EventBase<"run-started"> {
  seed: string;
  ticks: number;
  scenarioHash: string;
}

export interface TickStartedEvent extends EventBase<"tick-started"> {}

export interface ActorActivitySetEvent extends EventBase<"actor-activity-set"> {
  actorId: ActorId;
  active: boolean;
  reason: string;
}

export interface AdoptionDecisionEntry {
  actorId: ActorId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  acceptance: ActorAcceptanceState;
  reason: string;
}

export interface AdoptionBatchAppliedEvent extends EventBase<"adoption-batch-applied"> {
  decisions: AdoptionDecisionEntry[];
}

export interface TradeAttemptedEvent extends EventBase<"trade-attempted"> {
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

export interface RealisedSurplusEntry {
  actorId: ActorId;
  amount: MicroUnits;
}

export interface TradeResolvedEvent extends EventBase<"trade-resolved"> {
  tradeId: string;
  circuitId: CircuitId;
  circuitEdgeId: string;
  circuitAction: CircuitAction;
  relationshipId: RelationshipId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  fromActorId: ActorId;
  toActorId: ActorId;
  outcome: "completed" | "refused" | "keeper-failed";
  /** Actor-local realised amounts; never an authoritative group scalar. */
  realisedSurplus: RealisedSurplusEntry[];
}

export interface RelationshipActivitySetEvent extends EventBase<"relationship-activity-set"> {
  relationshipId: RelationshipId;
  active: boolean;
  reason: string;
}

export interface RelationshipOpportunityScaleSetEvent
  extends EventBase<"relationship-opportunity-scale-set"> {
  relationshipId: RelationshipId;
  opportunityScalePpm: Ppm;
  reason: string;
}

export interface PrimingStartedEvent extends EventBase<"priming-started"> {
  primingMechanismId: PrimingMechanismId;
}

export interface PrimingSpendSetEvent extends EventBase<"priming-spend-set"> {
  primingMechanismId: PrimingMechanismId;
  spent: MicroUnits;
  baseCost: MicroUnits;
  keeperCarryCost: MicroUnits;
  payerDebits: { payerId: string; amount: MicroUnits }[];
}

export interface PrimingStoppedEvent extends EventBase<"priming-stopped"> {
  primingMechanismId: PrimingMechanismId;
  reason: "condition-met" | "budget-exhausted" | "shock" | "manual";
}

export interface DomainExternalSupportSetEvent extends EventBase<"domain-external-support-set"> {
  domainId: DomainId;
  instrumentId: InstrumentId;
  active: boolean;
  wedgeRemovedAtTick: Tick | null;
}

export interface KeeperAvailabilitySetEvent extends EventBase<"keeper-availability-set"> {
  keeperAssignmentId: KeeperAssignmentId;
  enabled: boolean;
  reason: string;
}

export interface KeeperActionRecordedEvent extends EventBase<"keeper-action-recorded"> {
  keeperAssignmentId: KeeperAssignmentId;
  /** Direct circuit-edge assignment whose obligation this primary/fallback event serves. */
  rootKeeperAssignmentId: KeeperAssignmentId;
  circuitId: CircuitId;
  circuitEdgeId: string;
  domainId: DomainId;
  instrumentId: InstrumentId;
  actorId: ActorId | null;
  outcome: "acted" | "skipped";
  /** True on exactly one acted plan when this root obligation was fulfilled. */
  rootObligationFulfilled: boolean;
  /** Root-level result: some primary/fallback path had positive cumulative actor/funder economics. */
  rootEconomicsCovered: boolean;
  fundingSource: "priming" | "external" | "internal" | "none";
  primingMechanismId: PrimingMechanismId | null;
  funderId: ActorId | null;
  rewardPaid: MicroUnits;
  externalPayerIds: string[];
  reason?: string;
}

export interface DomainWindowRecordedEvent extends EventBase<"domain-window-recorded"> {
  domainId: DomainId;
  instrumentId: InstrumentId;
  attemptedTrades: number;
  attemptedCircuitCycles: number;
  completedTrades: number;
  completedCircuitCycles: number;
  keeperCoveragePpm: Ppm;
  circuitResults: {
    circuitId: CircuitId;
    attemptedCycles: number;
    completedCycles: number;
  }[];
}

export interface CircuitCredibilitySetEvent extends EventBase<"circuit-credibility-set"> {
  circuitId: CircuitId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  credible: boolean;
  reason: string;
  invokerId: string;
  keeperAssignmentIds: KeeperAssignmentId[];
  evidenceRefs: string[];
}

export interface LifecycleTransitionedEvent extends EventBase<"lifecycle-transitioned"> {
  domainId: DomainId;
  instrumentId: InstrumentId;
  from: SelectionLifecycleState;
  to: SelectionLifecycleState;
  reason: string;
  authority: "engine-derived" | "accepted-finding";
  invokerId: string;
  keeperAssignmentIds: KeeperAssignmentId[];
  evidenceRefs: string[];
  findingRefs: string[];
}

export type SimulationEvent =
  | RunStartedEvent
  | TickStartedEvent
  | ActorActivitySetEvent
  | AdoptionBatchAppliedEvent
  | TradeAttemptedEvent
  | TradeResolvedEvent
  | RelationshipActivitySetEvent
  | RelationshipOpportunityScaleSetEvent
  | PrimingStartedEvent
  | PrimingSpendSetEvent
  | PrimingStoppedEvent
  | DomainExternalSupportSetEvent
  | KeeperAvailabilitySetEvent
  | KeeperActionRecordedEvent
  | DomainWindowRecordedEvent
  | CircuitCredibilitySetEvent
  | LifecycleTransitionedEvent;

export type SimulationEventType = SimulationEvent["type"];

export function compareLogicalTime(left: LogicalTime, right: LogicalTime): number {
  if (left.tick !== right.tick) return left.tick - right.tick;
  if (
    !Object.prototype.hasOwnProperty.call(PHASE_ORDER, left.phase) ||
    !Object.prototype.hasOwnProperty.call(PHASE_ORDER, right.phase)
  ) {
    throw new RangeError("Cannot compare an unknown simulation phase");
  }
  const phaseDifference = PHASE_ORDER[left.phase] - PHASE_ORDER[right.phase];
  if (!Number.isFinite(phaseDifference)) {
    throw new RangeError("Simulation phase comparison must be finite");
  }
  if (phaseDifference !== 0) return phaseDifference;
  return left.sequence - right.sequence;
}

/**
 * Make a reproducible, non-security event identifier. The logical sequence is
 * the uniqueness source; the hash is only a compact trace label.
 */
export function makeEventId(at: LogicalTime, type: SimulationEventType, subjectId = ""): string {
  return `event:${deterministicHash({ at, subjectId, type })}`;
}
