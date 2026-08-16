import {
  EVENT_VERSION,
  PHASE_ORDER,
  compareLogicalTime,
  type SimulationEvent,
  type SimulationEventType,
  type SimulationPhase,
} from "./events.js";
import { evaluateAllContinuationAssumptions, realisedCircuitSurplus } from "./continuation.js";
import { decideLifecycle } from "./lifecycle.js";
import { declaredCircuitIsCredible } from "./metrics.js";
import { decideAcceptance } from "./policies.js";
import {
  activePrimingMechanisms,
  allocatePrimingSpend,
  hasExecutableExternalKeeperPath,
  hasExternalSupport,
  primingSpendForTick,
  primingStopConditionMet,
  shouldActivatePriming,
} from "./priming.js";
import { checkedAdd, mulDiv, ppmProduct } from "./math.js";
import { canonicalHash, canonicalJson } from "./canonical-json.js";
import {
  PPM,
  compareCodeUnits,
  domainInstrumentKey,
  type ActorAcceptanceState,
  type ActorId,
  type ActorRuntimeState,
  type CircuitId,
  type CircuitRuntimeState,
  type DomainInstrumentState,
  type KeeperAssignmentId,
  type KeeperRuntimeState,
  type PrimingMechanismId,
  type PrimingRuntimeState,
  type RelationshipId,
  type RuntimeRelationshipState,
  type ScenarioSpec,
  type SimulationState,
  type TickDomainActivityState,
} from "./types.js";
import { assertValidScenario } from "./validate.js";

function safeInteger(value: number, label: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${label} must be a safe integer >= ${minimum}`);
  }
}

function ppm(value: number, label: string): void {
  safeInteger(value, label);
  if (value > PPM) throw new RangeError(`${label} must be <= ${PPM}`);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function hasOwn(record: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function emptyRecord<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function serviceSignalPpm(state: SimulationState, domainId: string, instrumentId: string): number {
  const runtime = state.domainInstruments[domainInstrumentKey(domainId, instrumentId)];
  if (runtime === undefined || runtime.recentAttemptedTrades.length === 0) return 0;
  const attempted = runtime.recentAttemptedTrades[runtime.recentAttemptedTrades.length - 1];
  const completed = runtime.recentCompletedTrades[runtime.recentCompletedTrades.length - 1] ?? 0;
  return attempted === 0 ? 0 : mulDiv(completed, PPM, attempted, "service signal");
}

function acceptanceEquals(left: ActorAcceptanceState, right: ActorAcceptanceState): boolean {
  return (
    left.accepts === right.accepts &&
    left.reacceptanceBeliefPpm === right.reacceptanceBeliefPpm &&
    left.adoptionCounter === right.adoptionCounter &&
    left.abandonmentCounter === right.abandonmentCounter &&
    left.installedComplement === right.installedComplement
  );
}

function createTickActivity(scenario: ScenarioSpec): Record<string, TickDomainActivityState> {
  const activity: Record<string, TickDomainActivityState> = emptyRecord();
  for (const domain of scenario.domains) {
    for (const instrumentId of domain.instrumentIds) {
      const key = domainInstrumentKey(domain.id, instrumentId);
      activity[key] = {
        domainId: domain.id,
        instrumentId,
        attemptedTenderTradeIds: [],
        attemptedCircuitIds: [],
        completedPostTradeIds: [],
        completedCircuitIds: [],
        requiredKeeperObligationIds: [],
        completedKeeperObligationIds: [],
        keeperEconomicsCoveredByObligation: emptyRecord(),
        windowRecorded: false,
      };
    }
  }
  return activity;
}

function requireActor(state: SimulationState, actorId: ActorId): ActorRuntimeState {
  const actor = state.actors[actorId];
  if (!hasOwn(state.actors, actorId) || actor === undefined) {
    throw new RangeError(`Unknown actor '${actorId}'`);
  }
  return actor;
}

function requireDomainInstrument(
  state: SimulationState,
  domainId: string,
  instrumentId: string
): DomainInstrumentState {
  const key = domainInstrumentKey(domainId, instrumentId);
  const domainInstrument = state.domainInstruments[key];
  if (!hasOwn(state.domainInstruments, key) || domainInstrument === undefined) {
    throw new RangeError(`Unknown domain/instrument '${key}'`);
  }
  return domainInstrument;
}

function requirePriming(state: SimulationState, id: PrimingMechanismId): PrimingRuntimeState {
  const priming = state.priming[id];
  if (!hasOwn(state.priming, id) || priming === undefined) {
    throw new RangeError(`Unknown priming mechanism '${id}'`);
  }
  return priming;
}

function requireKeeper(state: SimulationState, id: KeeperAssignmentId): KeeperRuntimeState {
  const keeper = state.keepers[id];
  if (!hasOwn(state.keepers, id) || keeper === undefined) {
    throw new RangeError(`Unknown keeper assignment '${id}'`);
  }
  return keeper;
}

function requireRelationship(state: SimulationState, id: RelationshipId): RuntimeRelationshipState {
  const relationship = state.relationships[id];
  if (!hasOwn(state.relationships, id) || relationship === undefined) {
    throw new RangeError(`Unknown relationship '${id}'`);
  }
  return relationship;
}

function requireCircuit(state: SimulationState, id: CircuitId): CircuitRuntimeState {
  const circuit = state.circuits[id];
  if (!hasOwn(state.circuits, id) || circuit === undefined) {
    throw new RangeError(`Unknown circuit '${id}'`);
  }
  return circuit;
}

function validateAcceptance(acceptance: ActorAcceptanceState): void {
  if (typeof acceptance.accepts !== "boolean") {
    throw new TypeError("acceptance.accepts must be boolean");
  }
  ppm(acceptance.reacceptanceBeliefPpm, "acceptance.reacceptanceBeliefPpm");
  safeInteger(acceptance.adoptionCounter, "acceptance.adoptionCounter");
  safeInteger(acceptance.abandonmentCounter, "acceptance.abandonmentCounter");
  safeInteger(acceptance.installedComplement, "acceptance.installedComplement");
}

function withEventId(state: SimulationState, eventId: string): SimulationState {
  return { ...state, lastEventId: eventId };
}

const EVENT_PHASE: Readonly<Record<SimulationEventType, SimulationPhase>> = {
  "run-started": "shocks",
  "tick-started": "shocks",
  "actor-activity-set": "shocks",
  "relationship-activity-set": "shocks",
  "relationship-opportunity-scale-set": "shocks",
  "priming-started": "shocks",
  "priming-stopped": "shocks",
  "domain-external-support-set": "shocks",
  "keeper-availability-set": "shocks",
  "adoption-batch-applied": "adoption",
  "trade-attempted": "performance",
  "trade-resolved": "performance",
  "priming-spend-set": "institutional",
  "keeper-action-recorded": "keepers",
  "domain-window-recorded": "learning",
  "circuit-credibility-set": "lifecycle",
  "lifecycle-transitioned": "lifecycle",
};

function validateEventPosition(
  state: SimulationState,
  event: SimulationEvent,
  scenario?: ScenarioSpec
): void {
  if (event.eventVersion !== EVENT_VERSION) {
    throw new RangeError(`Unsupported event version '${event.eventVersion}'`);
  }
  if (typeof event.id !== "string" || event.id.length === 0) {
    throw new TypeError("Event id must be a non-empty string");
  }
  safeInteger(event.at.tick, "event.at.tick");
  safeInteger(event.at.sequence, "event.at.sequence");
  if (!hasOwn(PHASE_ORDER, event.at.phase)) {
    throw new RangeError(`Unknown event phase '${event.at.phase}'`);
  }
  if (event.at.phase !== EVENT_PHASE[event.type]) {
    throw new RangeError(
      `Event '${event.type}' must occur in the '${EVENT_PHASE[event.type]}' phase`
    );
  }
  if (state.lastEventId === event.id) {
    throw new RangeError(`Immediate duplicate event id '${event.id}'`);
  }

  if (event.type === "run-started") {
    if (state.runSeed !== null || state.tickStartedTick !== null || event.at.tick !== 0) {
      throw new RangeError("run-started must be the first event at tick zero");
    }
  } else if (event.type === "tick-started") {
    const expectedTick = state.tickStartedTick === null ? state.tick : state.tick + 1;
    if (event.at.tick !== expectedTick) {
      throw new RangeError(`tick-started must target tick ${expectedTick}`);
    }
    if (scenario !== undefined && event.at.tick >= scenario.ticks) {
      throw new RangeError("tick-started exceeds the validated scenario horizon");
    }
  } else if (event.at.tick !== state.tick) {
    throw new RangeError(
      `Event '${event.id}' targets tick ${event.at.tick}, current tick is ${state.tick}`
    );
  } else if (state.tickStartedTick !== state.tick) {
    throw new RangeError("non-start events require an active tick");
  } else if (
    event.type !== "adoption-batch-applied" &&
    PHASE_ORDER[event.at.phase] > PHASE_ORDER.adoption &&
    state.adoptionAppliedTick !== state.tick
  ) {
    throw new RangeError("post-adoption events require the staged adoption batch");
  }
}

function assertNever(value: never): never {
  throw new TypeError(`Unhandled event type ${(value as { type?: unknown }).type as string}`);
}

const ALLOWED_LIFECYCLE_TRANSITIONS: Readonly<Record<string, ReadonlySet<string>>> = {
  candidate: new Set(["priming", "exited"]),
  priming: new Set(["propagating", "collapsed", "exited"]),
  propagating: new Set(["installed-supported", "declining", "collapsed", "exited"]),
  "installed-supported": new Set([
    "installed-self-maintaining",
    "fragile",
    "repairing",
    "exited",
    "collapsed",
    "superseded",
  ]),
  "installed-self-maintaining": new Set([
    "installed-supported",
    "fragile",
    "repairing",
    "exited",
    "collapsed",
    "superseded",
  ]),
  repairing: new Set([
    "installed-supported",
    "installed-self-maintaining",
    "fragile",
    "declining",
    "exited",
    "collapsed",
    "superseded",
  ]),
  fragile: new Set([
    "installed-supported",
    "installed-self-maintaining",
    "repairing",
    "declining",
    "exited",
    "collapsed",
    "superseded",
  ]),
  declining: new Set(["priming", "repairing", "exited", "collapsed", "superseded"]),
  exited: new Set(),
  collapsed: new Set(),
  superseded: new Set(),
};

function requireNonEmptyStrings(values: readonly string[], label: string): void {
  if (values.length === 0 || values.some(value => value.trim() === "")) {
    throw new RangeError(`${label} must contain non-empty references`);
  }
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return (
    leftSet.size === left.length &&
    rightSet.size === right.length &&
    leftSet.size === rightSet.size &&
    [...leftSet].every(value => rightSet.has(value))
  );
}

function scopedKeeperIds(scenario: ScenarioSpec, domainId: string, instrumentId: string): string[] {
  return [
    ...new Set(
      scenario.circuits
        .filter(circuit => circuit.domainId === domainId && circuit.instrumentId === instrumentId)
        .flatMap(circuit => circuit.edges.flatMap(edge => edge.keeperAssignmentIds))
    ),
  ].sort();
}

function requireDerivedScenario(
  scenario: ScenarioSpec | undefined,
  eventType: string
): ScenarioSpec {
  if (scenario === undefined) {
    throw new RangeError(`${eventType} requires its validated ScenarioSpec`);
  }
  return scenario;
}

export function createInitialState(input: ScenarioSpec): SimulationState {
  assertValidScenario(input);

  const actors: Record<ActorId, ActorRuntimeState> = emptyRecord();
  for (const actorSpec of [...input.actors].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    const acceptance: Record<string, ActorAcceptanceState> = emptyRecord();
    for (const spec of [...actorSpec.acceptance].sort((left, right) =>
      compareCodeUnits(
        domainInstrumentKey(left.domainId, left.instrumentId),
        domainInstrumentKey(right.domainId, right.instrumentId)
      )
    )) {
      const key = domainInstrumentKey(spec.domainId, spec.instrumentId);
      if (acceptance[key] !== undefined) {
        throw new RangeError(`Actor '${actorSpec.id}' has duplicate acceptance state '${key}'`);
      }
      acceptance[key] = {
        accepts: spec.initiallyAccepts,
        reacceptanceBeliefPpm: spec.initialReacceptanceBeliefPpm,
        adoptionCounter: 0,
        abandonmentCounter: 0,
        installedComplement: spec.initiallyAccepts ? spec.installedComplement : 0,
      };
    }

    actors[actorSpec.id] = {
      id: actorSpec.id,
      active: actorSpec.active,
      acceptance,
      realisedSurplus: 0,
      keeperCosts: 0,
      keeperRewards: 0,
      keeperFundingCosts: 0,
      primingCosts: 0,
    };
  }

  const priming: Record<PrimingMechanismId, PrimingRuntimeState> = emptyRecord();
  for (const spec of [...input.primingMechanisms].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    priming[spec.id] = {
      id: spec.id,
      active: spec.startsAtTick === 0 && spec.totalBudget > 0,
      spent: 0,
      externalSpent: 0,
      spentAtTick: null,
      stoppedAtTick: null,
    };
  }

  const domainInstruments: Record<string, DomainInstrumentState> = emptyRecord();
  for (const domain of [...input.domains].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    for (const instrumentId of [...domain.instrumentIds].sort()) {
      const key = domainInstrumentKey(domain.id, instrumentId);
      const lifecycle = domain.initialLifecycleByInstrument[instrumentId];
      if (lifecycle === undefined) {
        throw new RangeError(
          `Domain '${domain.id}' has no initial lifecycle for '${instrumentId}'`
        );
      }

      const acceptingActors = Object.values(actors)
        .filter(actor => actor.active && actor.acceptance[key]?.accepts === true)
        .map(actor => actor.id)
        .sort();
      const activeExternalSupport =
        input.primingMechanisms.some(
          mechanism =>
            mechanism.domainId === domain.id &&
            mechanism.instrumentId === instrumentId &&
            mechanism.externalInput &&
            priming[mechanism.id]?.active === true
        ) ||
        hasExecutableExternalKeeperPath(
          input,
          domain.id,
          instrumentId,
          () => true,
          actorId => actors[actorId]?.active === true
        );

      domainInstruments[key] = {
        key,
        domainId: domain.id,
        instrumentId,
        lifecycle,
        stateEnteredTick: 0,
        credibleCircuit: false,
        acceptingActors,
        recentAttemptedTrades: [],
        recentAttemptedCircuitCycles: [],
        recentCompletedTrades: [],
        recentCircuitCycles: [],
        recentKeeperCoveragePpm: [],
        activeExternalSupport,
        wedgeRemovedAtTick:
          !activeExternalSupport &&
          (lifecycle === "installed-supported" || lifecycle === "installed-self-maintaining")
            ? 0
            : null,
      };
    }
  }

  const keepers: Record<KeeperAssignmentId, KeeperRuntimeState> = emptyRecord();
  for (const spec of [...input.keeperAssignments].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    keepers[spec.id] = {
      id: spec.id,
      enabled: true,
      actedThisTick: 0,
      skippedThisTick: 0,
    };
  }

  const relationships: Record<RelationshipId, RuntimeRelationshipState> = emptyRecord();
  for (const spec of [...input.relationships].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    relationships[spec.id] = {
      id: spec.id,
      active: spec.active,
      opportunityScalePpm: PPM,
    };
  }

  const circuits: Record<CircuitId, CircuitRuntimeState> = emptyRecord();
  for (const spec of [...input.circuits].sort((left, right) =>
    compareCodeUnits(left.id, right.id)
  )) {
    circuits[spec.id] = {
      id: spec.id,
      domainId: spec.domainId,
      instrumentId: spec.instrumentId,
      credible: false,
      recentAttemptedCycles: [],
      recentCompletedCycles: [],
    };
  }

  return {
    tick: 0,
    runSeed: null,
    runTicks: null,
    runScenarioHash: null,
    actors,
    domainInstruments,
    priming,
    keepers,
    relationships,
    circuits,
    pendingTrades: emptyRecord(),
    tickActivity: createTickActivity(input),
    tickStartedTick: null,
    adoptionAppliedTick: null,
    lastEventId: null,
  };
}

/** Apply one logical event without mutating the input state. */
export function reduceEvent(
  state: SimulationState,
  event: SimulationEvent,
  scenario?: ScenarioSpec
): SimulationState {
  validateEventPosition(state, event, scenario);

  switch (event.type) {
    case "run-started": {
      const source = requireDerivedScenario(scenario, event.type);
      if (event.seed.trim() === "") {
        throw new RangeError("run seed must be non-empty");
      }
      if (!Number.isSafeInteger(event.ticks) || event.ticks < 1 || event.ticks > source.ticks) {
        throw new RangeError("run ticks must be within the scenario horizon");
      }
      const expectedHash = canonicalHash(source);
      if (event.scenarioHash !== expectedHash) {
        throw new RangeError("run scenario hash does not match its source");
      }
      return {
        ...state,
        runSeed: event.seed,
        runTicks: event.ticks,
        runScenarioHash: event.scenarioHash,
        lastEventId: event.id,
      };
    }

    case "tick-started": {
      if (Object.keys(state.pendingTrades).length > 0) {
        throw new RangeError("cannot start a tick with unresolved trades");
      }
      if (state.tickStartedTick === event.at.tick) {
        throw new RangeError("a tick can only be started once");
      }
      if (
        state.tickStartedTick !== null &&
        event.at.tick > state.tick &&
        Object.values(state.tickActivity).some(activity => !activity.windowRecorded)
      ) {
        throw new RangeError("cannot advance before every domain activity window is recorded");
      }
      if (
        state.tickStartedTick !== null &&
        event.at.tick > state.tick &&
        state.adoptionAppliedTick !== state.tick
      ) {
        throw new RangeError("cannot advance before the staged adoption batch is applied");
      }
      const keepers: Record<KeeperAssignmentId, KeeperRuntimeState> = emptyRecord();
      for (const [id, keeper] of Object.entries(state.keepers)) {
        keepers[id] = { ...keeper, actedThisTick: 0, skippedThisTick: 0 };
      }
      const source = requireDerivedScenario(scenario, event.type);
      return {
        ...state,
        tick: event.at.tick,
        keepers,
        tickActivity: createTickActivity(source),
        tickStartedTick: event.at.tick,
        adoptionAppliedTick: null,
        lastEventId: event.id,
      };
    }

    case "actor-activity-set": {
      const source = requireDerivedScenario(scenario, event.type);
      if (
        event.active ||
        event.reason !== "declared shock" ||
        !source.shocks.some(
          shock =>
            shock.tick === event.at.tick &&
            shock.kind === "deactivate-actor" &&
            shock.actorId === event.actorId
        )
      ) {
        throw new RangeError("actor activity event is not a declared shock");
      }
      const current = requireActor(state, event.actorId);
      const actor = { ...current, active: event.active };
      const domainInstruments = { ...state.domainInstruments };
      for (const [key, acceptance] of Object.entries(actor.acceptance)) {
        const currentDomainInstrument = domainInstruments[key];
        if (currentDomainInstrument === undefined) continue;
        const withoutActor = currentDomainInstrument.acceptingActors.filter(
          actorId => actorId !== event.actorId
        );
        const acceptingActors =
          event.active && acceptance.accepts
            ? sortedUnique([...withoutActor, event.actorId])
            : withoutActor;
        domainInstruments[key] = { ...currentDomainInstrument, acceptingActors };
      }
      return {
        ...state,
        actors: { ...state.actors, [event.actorId]: actor },
        domainInstruments,
        lastEventId: event.id,
      };
    }

    case "adoption-batch-applied": {
      if (event.at.phase !== "adoption" || state.adoptionAppliedTick === state.tick) {
        throw new RangeError("adoption batch must occur exactly once in the adoption phase");
      }
      const source = requireDerivedScenario(scenario, event.type);
      const expected = source.actors
        .filter(actor => state.actors[actor.id]?.active === true)
        .sort((left, right) => compareCodeUnits(left.id, right.id))
        .flatMap(actor => {
          const policy = source.policies.find(item => item.id === actor.policyId);
          if (policy === undefined) throw new RangeError(`Unknown policy '${actor.policyId}'`);
          return [...actor.acceptance]
            .sort((left, right) =>
              compareCodeUnits(
                domainInstrumentKey(left.domainId, left.instrumentId),
                domainInstrumentKey(right.domainId, right.instrumentId)
              )
            )
            .map(acceptanceSpec => {
              const decision = decideAcceptance(
                source,
                state,
                actor.id,
                acceptanceSpec,
                policy,
                serviceSignalPpm(state, acceptanceSpec.domainId, acceptanceSpec.instrumentId)
              );
              return {
                actorId: actor.id,
                domainId: acceptanceSpec.domainId,
                instrumentId: acceptanceSpec.instrumentId,
                acceptance: decision.next,
                reason: `score ${decision.scorePpm}; adoption threshold ${decision.effectiveAdoptionThresholdPpm}; abandonment threshold ${decision.effectiveAbandonmentThresholdPpm}`,
              };
            });
        });
      if (event.decisions.length !== expected.length) {
        throw new RangeError("adoption batch is incomplete");
      }
      event.decisions.forEach((decision, index) => {
        validateAcceptance(decision.acceptance);
        const expectedDecision = expected[index];
        if (
          expectedDecision === undefined ||
          decision.actorId !== expectedDecision.actorId ||
          decision.domainId !== expectedDecision.domainId ||
          decision.instrumentId !== expectedDecision.instrumentId ||
          decision.reason !== expectedDecision.reason ||
          !acceptanceEquals(decision.acceptance, expectedDecision.acceptance)
        ) {
          throw new RangeError("adoption batch does not follow the staged snapshot policy");
        }
      });

      const actors = { ...state.actors };
      const domainInstruments = { ...state.domainInstruments };
      for (const decision of event.decisions) {
        const current = actors[decision.actorId];
        if (current === undefined) throw new RangeError(`Unknown actor '${decision.actorId}'`);
        const key = domainInstrumentKey(decision.domainId, decision.instrumentId);
        if (current.acceptance[key] === undefined) {
          throw new RangeError(`Actor '${decision.actorId}' has no acceptance position '${key}'`);
        }
        const domainInstrument = domainInstruments[key];
        if (domainInstrument === undefined) {
          throw new RangeError(`Unknown domain/instrument '${key}'`);
        }
        const withoutActor = domainInstrument.acceptingActors.filter(
          actorId => actorId !== decision.actorId
        );
        actors[decision.actorId] = {
          ...current,
          acceptance: {
            ...current.acceptance,
            [key]: { ...decision.acceptance },
          },
        };
        domainInstruments[key] = {
          ...domainInstrument,
          acceptingActors: decision.acceptance.accepts
            ? sortedUnique([...withoutActor, decision.actorId])
            : withoutActor,
        };
      }
      return {
        ...state,
        actors,
        domainInstruments,
        adoptionAppliedTick: state.tick,
        lastEventId: event.id,
      };
    }

    case "trade-attempted": {
      if (event.tradeId.length === 0) throw new TypeError("tradeId must be non-empty");
      if (hasOwn(state.pendingTrades, event.tradeId)) {
        throw new RangeError(`Trade '${event.tradeId}' is already pending`);
      }
      requireRelationship(state, event.relationshipId);
      requireDomainInstrument(state, event.domainId, event.instrumentId);
      requireActor(state, event.fromActorId);
      requireActor(state, event.toActorId);
      {
        const source = requireDerivedScenario(scenario, event.type);
        const circuit = source.circuits.find(item => item.id === event.circuitId);
        const edge = circuit?.edges.find(item => item.id === event.circuitEdgeId);
        const relationship = source.relationships.find(item => item.id === event.relationshipId);
        if (
          circuit === undefined ||
          edge === undefined ||
          relationship === undefined ||
          edge.action !== event.circuitAction ||
          edge.relationshipId !== event.relationshipId ||
          circuit.domainId !== event.domainId ||
          circuit.instrumentId !== event.instrumentId ||
          relationship.domainId !== event.domainId ||
          relationship.fromActorId !== event.fromActorId ||
          relationship.toActorId !== event.toActorId
        ) {
          throw new RangeError("trade attempt does not match its declared circuit edge");
        }
      }
      if (event.at.phase !== "performance") {
        throw new RangeError("trade attempts must occur in the performance phase");
      }
      const activityKey = domainInstrumentKey(event.domainId, event.instrumentId);
      const currentActivity = state.tickActivity[activityKey];
      if (currentActivity === undefined || currentActivity.windowRecorded) {
        throw new RangeError("trade attempt is outside its open tick activity window");
      }
      const tickActivity = {
        ...state.tickActivity,
        [activityKey]: {
          ...currentActivity,
          attemptedTenderTradeIds:
            event.circuitAction === "tender"
              ? [...currentActivity.attemptedTenderTradeIds, event.tradeId]
              : currentActivity.attemptedTenderTradeIds,
          attemptedCircuitIds: currentActivity.attemptedCircuitIds.includes(event.circuitId)
            ? currentActivity.attemptedCircuitIds
            : [...currentActivity.attemptedCircuitIds, event.circuitId],
        },
      };
      return withEventId(
        {
          ...state,
          pendingTrades: {
            ...state.pendingTrades,
            [event.tradeId]: {
              tradeId: event.tradeId,
              circuitId: event.circuitId,
              circuitEdgeId: event.circuitEdgeId,
              circuitAction: event.circuitAction,
              relationshipId: event.relationshipId,
              domainId: event.domainId,
              instrumentId: event.instrumentId,
              fromActorId: event.fromActorId,
              toActorId: event.toActorId,
            },
          },
          tickActivity,
        },
        event.id
      );
    }

    case "trade-resolved": {
      if (event.tradeId.length === 0) throw new TypeError("tradeId must be non-empty");
      requireRelationship(state, event.relationshipId);
      requireDomainInstrument(state, event.domainId, event.instrumentId);
      requireActor(state, event.fromActorId);
      requireActor(state, event.toActorId);
      const pending = state.pendingTrades[event.tradeId];
      if (!hasOwn(state.pendingTrades, event.tradeId) || pending === undefined) {
        throw new RangeError(`Trade '${event.tradeId}' was not attempted`);
      }
      for (const [field, value] of Object.entries(pending)) {
        if (event[field as keyof typeof event] !== value) {
          throw new RangeError(`trade resolution changed '${field}' from its attempt`);
        }
      }
      const accountedActors = new Set<string>();
      for (const entry of event.realisedSurplus) {
        requireActor(state, entry.actorId);
        safeInteger(entry.amount, `event.realisedSurplus[${entry.actorId}].amount`);
        if (accountedActors.has(entry.actorId)) {
          throw new RangeError(`Duplicate realised surplus actor '${entry.actorId}'`);
        }
        accountedActors.add(entry.actorId);
      }
      const source = requireDerivedScenario(scenario, event.type);
      const expectedAmounts = new Map<ActorId, number>();
      if (event.outcome === "completed" && event.circuitAction === "renew") {
        const circuit = source.circuits.find(item => item.id === event.circuitId);
        if (circuit === undefined) {
          throw new RangeError(`Unknown source circuit '${event.circuitId}'`);
        }
        for (const entry of realisedCircuitSurplus(source, state, circuit)) {
          expectedAmounts.set(entry.actorId, entry.amount);
        }
      }
      if (
        expectedAmounts.size !== event.realisedSurplus.length ||
        event.realisedSurplus.some(entry => expectedAmounts.get(entry.actorId) !== entry.amount)
      ) {
        throw new RangeError("realised trade surplus does not match the source opportunity");
      }
      const pendingTrades = { ...state.pendingTrades };
      delete pendingTrades[event.tradeId];
      const actors = { ...state.actors };
      for (const entry of event.realisedSurplus) {
        const actor = requireActor(state, entry.actorId);
        actors[entry.actorId] = {
          ...actor,
          realisedSurplus: checkedAdd(
            actor.realisedSurplus,
            entry.amount,
            `realised surplus for ${entry.actorId}`
          ),
        };
      }
      if (event.at.phase !== "performance") {
        throw new RangeError("trade resolutions must occur in the performance phase");
      }
      const activityKey = domainInstrumentKey(event.domainId, event.instrumentId);
      const currentActivity = state.tickActivity[activityKey];
      if (currentActivity === undefined || currentActivity.windowRecorded) {
        throw new RangeError("trade resolution is outside its open tick activity window");
      }
      const completed = event.outcome === "completed";
      const tickActivity = {
        ...state.tickActivity,
        [activityKey]: {
          ...currentActivity,
          completedPostTradeIds:
            completed && event.circuitAction === "post"
              ? [...currentActivity.completedPostTradeIds, event.tradeId]
              : currentActivity.completedPostTradeIds,
          completedCircuitIds:
            completed && event.circuitAction === "renew"
              ? [...currentActivity.completedCircuitIds, event.circuitId]
              : currentActivity.completedCircuitIds,
        },
      };
      return withEventId({ ...state, actors, pendingTrades, tickActivity }, event.id);
    }

    case "relationship-activity-set": {
      const source = requireDerivedScenario(scenario, event.type);
      if (
        event.active ||
        event.reason !== "declared shock" ||
        !source.shocks.some(
          shock =>
            shock.tick === event.at.tick &&
            shock.kind === "deactivate-relationship" &&
            shock.relationshipId === event.relationshipId
        )
      ) {
        throw new RangeError("relationship activity event is not a declared shock");
      }
      const current = requireRelationship(state, event.relationshipId);
      const relationship = { ...current, active: event.active };
      return withEventId(
        {
          ...state,
          relationships: { ...state.relationships, [event.relationshipId]: relationship },
        },
        event.id
      );
    }

    case "relationship-opportunity-scale-set": {
      ppm(event.opportunityScalePpm, "event.opportunityScalePpm");
      const current = requireRelationship(state, event.relationshipId);
      const source = requireDerivedScenario(scenario, event.type);
      const relationshipSpec = source.relationships.find(
        candidate => candidate.id === event.relationshipId
      );
      const matchingShock = source.shocks.some(
        shock =>
          shock.tick === event.at.tick &&
          shock.kind === "scale-opportunities" &&
          relationshipSpec?.domainId === shock.domainId &&
          ppmProduct(current.opportunityScalePpm, shock.factorPpm) === event.opportunityScalePpm
      );
      if (event.reason !== "declared shock" || !matchingShock) {
        throw new RangeError("opportunity scale event is not a declared shock");
      }
      const relationship = {
        ...current,
        opportunityScalePpm: event.opportunityScalePpm,
      };
      return withEventId(
        {
          ...state,
          relationships: { ...state.relationships, [event.relationshipId]: relationship },
        },
        event.id
      );
    }

    case "priming-started": {
      const current = requirePriming(state, event.primingMechanismId);
      const source = requireDerivedScenario(scenario, event.type);
      const mechanism = source.primingMechanisms.find(
        candidate => candidate.id === event.primingMechanismId
      );
      if (mechanism === undefined || current.active || !shouldActivatePriming(mechanism, state)) {
        throw new RangeError("priming start does not follow its declared activation guard");
      }
      const priming = { ...current, active: true, stoppedAtTick: null };
      return withEventId(
        { ...state, priming: { ...state.priming, [event.primingMechanismId]: priming } },
        event.id
      );
    }

    case "priming-spend-set": {
      safeInteger(event.spent, "event.spent");
      safeInteger(event.baseCost, "event.baseCost");
      safeInteger(event.keeperCarryCost, "event.keeperCarryCost");
      const current = requirePriming(state, event.primingMechanismId);
      const source = requireDerivedScenario(scenario, event.type);
      const mechanism = source.primingMechanisms.find(
        candidate => candidate.id === event.primingMechanismId
      );
      const expectedBaseCost = mechanism === undefined ? 0 : primingSpendForTick(mechanism, state);
      const tickSpend = checkedAdd(
        event.baseCost,
        event.keeperCarryCost,
        `tick priming spend for ${event.primingMechanismId}`
      );
      const expectedSpend = checkedAdd(
        current.spent,
        tickSpend,
        `priming spend for ${event.primingMechanismId}`
      );
      const expectedDebits =
        mechanism === undefined ? [] : allocatePrimingSpend(mechanism.payerIds, tickSpend);
      if (
        mechanism === undefined ||
        current.spentAtTick === event.at.tick ||
        event.baseCost !== expectedBaseCost ||
        tickSpend <= 0 ||
        expectedSpend > mechanism.totalBudget ||
        canonicalJson(event.payerDebits) !== canonicalJson(expectedDebits) ||
        event.spent !== expectedSpend
      ) {
        throw new RangeError("priming spend does not follow its declared budget and schedule");
      }
      const actors = { ...state.actors };
      let externalSpent = current.externalSpent;
      for (const debit of event.payerDebits) {
        safeInteger(debit.amount, `priming payer debit '${debit.payerId}'`);
        const actor = actors[debit.payerId];
        if (hasOwn(actors, debit.payerId) && actor !== undefined) {
          actors[debit.payerId] = {
            ...actor,
            primingCosts: checkedAdd(
              actor.primingCosts,
              debit.amount,
              `priming costs for ${debit.payerId}`
            ),
          };
        } else {
          externalSpent = checkedAdd(
            externalSpent,
            debit.amount,
            `external priming spend for ${event.primingMechanismId}`
          );
        }
      }
      const priming = {
        ...current,
        spent: event.spent,
        externalSpent,
        spentAtTick: event.at.tick,
      };
      return withEventId(
        {
          ...state,
          actors,
          priming: { ...state.priming, [event.primingMechanismId]: priming },
        },
        event.id
      );
    }

    case "priming-stopped": {
      const current = requirePriming(state, event.primingMechanismId);
      const source = requireDerivedScenario(scenario, event.type);
      const mechanism = source.primingMechanisms.find(
        candidate => candidate.id === event.primingMechanismId
      );
      const declaredShock = source.shocks.some(
        shock =>
          shock.tick === event.at.tick &&
          shock.kind === "stop-priming" &&
          shock.primingMechanismId === event.primingMechanismId
      );
      const budgetExhausted = mechanism !== undefined && current.spent >= mechanism.totalBudget;
      const conditionMet = mechanism !== undefined && primingStopConditionMet(mechanism, state);
      const expectedReason = budgetExhausted ? "budget-exhausted" : "condition-met";
      if (
        mechanism === undefined ||
        !current.active ||
        (event.reason === "shock"
          ? !declaredShock
          : event.reason === "manual" ||
            (!budgetExhausted && !conditionMet) ||
            event.reason !== expectedReason)
      ) {
        throw new RangeError("priming stop does not follow a declared stop guard");
      }
      const priming = {
        ...current,
        active: false,
        stoppedAtTick: event.at.tick,
      };
      return withEventId(
        { ...state, priming: { ...state.priming, [event.primingMechanismId]: priming } },
        event.id
      );
    }

    case "domain-external-support-set": {
      if (event.active && event.wedgeRemovedAtTick !== null) {
        throw new RangeError("An active external wedge cannot already be marked removed");
      }
      if (event.wedgeRemovedAtTick !== null) {
        safeInteger(event.wedgeRemovedAtTick, "event.wedgeRemovedAtTick");
      }
      const current = requireDomainInstrument(state, event.domainId, event.instrumentId);
      const source = requireDerivedScenario(scenario, event.type);
      const expectedActive = hasExternalSupport(source, state, event.domainId, event.instrumentId);
      if (event.active !== expectedActive) {
        throw new RangeError("external support event does not match the declared support path");
      }
      if (event.active === current.activeExternalSupport) {
        throw new RangeError("external support events must record a state change");
      }
      if (!event.active && event.wedgeRemovedAtTick !== event.at.tick) {
        throw new RangeError("external support removal clock must start at the removal tick");
      }
      const key = current.key;
      const domainInstrument = {
        ...current,
        activeExternalSupport: event.active,
        wedgeRemovedAtTick: event.wedgeRemovedAtTick,
      };
      return withEventId(
        {
          ...state,
          domainInstruments: { ...state.domainInstruments, [key]: domainInstrument },
        },
        event.id
      );
    }

    case "keeper-availability-set": {
      const source = requireDerivedScenario(scenario, event.type);
      if (
        event.enabled ||
        event.reason !== "declared shock" ||
        !source.shocks.some(
          shock =>
            shock.tick === event.at.tick &&
            shock.kind === "disable-keeper" &&
            shock.keeperAssignmentId === event.keeperAssignmentId
        )
      ) {
        throw new RangeError("keeper availability event is not a declared shock");
      }
      const current = requireKeeper(state, event.keeperAssignmentId);
      const keeper = { ...current, enabled: event.enabled };
      return withEventId(
        { ...state, keepers: { ...state.keepers, [event.keeperAssignmentId]: keeper } },
        event.id
      );
    }

    case "keeper-action-recorded": {
      const current = requireKeeper(state, event.keeperAssignmentId);
      if (event.actorId !== null && !requireActor(state, event.actorId).active) {
        throw new RangeError("an inactive actor cannot perform keeper work");
      }
      safeInteger(event.rewardPaid, "event.rewardPaid");
      if (typeof event.rootObligationFulfilled !== "boolean") {
        throw new TypeError("event.rootObligationFulfilled must be boolean");
      }
      if (typeof event.rootEconomicsCovered !== "boolean") {
        throw new TypeError("event.rootEconomicsCovered must be boolean");
      }
      if (event.outcome === "acted" && !current.enabled) {
        throw new RangeError(`Disabled keeper '${event.keeperAssignmentId}' cannot act`);
      }
      if (event.outcome === "acted" && event.actorId === null) {
        throw new RangeError("an acted keeper event must name the acting person");
      }
      const source = requireDerivedScenario(scenario, event.type);
      const assignment = source.keeperAssignments.find(
        candidate => candidate.id === event.keeperAssignmentId
      );
      if (assignment === undefined) {
        throw new RangeError(`Unknown source keeper '${event.keeperAssignmentId}'`);
      }
      const circuit = source.circuits.find(candidate => candidate.id === event.circuitId);
      const edge = circuit?.edges.find(candidate => candidate.id === event.circuitEdgeId);
      const assignmentById = new Map(
        source.keeperAssignments.map(candidate => [candidate.id, candidate])
      );
      const reachesAssignment = (rootId: string): boolean => {
        const visited = new Set<string>();
        let next = assignmentById.get(rootId);
        while (next !== undefined && !visited.has(next.id)) {
          if (next.id === assignment.id) return true;
          visited.add(next.id);
          next =
            next.fallbackAssignmentId === undefined
              ? undefined
              : assignmentById.get(next.fallbackAssignmentId);
        }
        return false;
      };
      if (
        event.at.phase !== "keepers" ||
        circuit === undefined ||
        edge === undefined ||
        circuit.domainId !== event.domainId ||
        circuit.instrumentId !== event.instrumentId ||
        !edge.keeperAssignmentIds.includes(event.rootKeeperAssignmentId) ||
        !reachesAssignment(event.rootKeeperAssignmentId)
      ) {
        throw new RangeError("keeper action is outside its declared circuit edge");
      }
      if (event.actorId !== null && !assignment.actorIds.includes(event.actorId)) {
        throw new RangeError("keeper action names an actor outside its assignment");
      }
      if (event.rootObligationFulfilled && event.outcome !== "acted") {
        throw new RangeError("a skipped keeper event cannot fulfil its root obligation");
      }
      if (event.outcome === "skipped") {
        if (
          event.fundingSource !== "none" ||
          event.primingMechanismId !== null ||
          event.funderId !== null ||
          event.rewardPaid !== 0 ||
          event.externalPayerIds.length !== 0
        ) {
          throw new RangeError("a skipped keeper action cannot consume funding");
        }
      } else {
        switch (event.fundingSource) {
          case "internal":
            if (
              event.primingMechanismId !== null ||
              assignment.funding !== "internal" ||
              event.funderId === null ||
              !assignment.fundingActorIds.includes(event.funderId) ||
              event.rewardPaid !== assignment.rewardPerAction ||
              event.externalPayerIds.length !== 0
            ) {
              throw new RangeError("internal keeper funding does not match its assignment");
            }
            if (!requireActor(state, event.funderId).active) {
              throw new RangeError("an inactive actor cannot fund keeper work");
            }
            break;
          case "external":
            if (
              event.primingMechanismId !== null ||
              assignment.funding !== "external" ||
              event.funderId !== null ||
              event.rewardPaid !== assignment.rewardPerAction ||
              !sameStringSet(event.externalPayerIds, assignment.externalPayerIds)
            ) {
              throw new RangeError("external keeper funding does not match its assignment");
            }
            break;
          case "priming":
            if (
              event.primingMechanismId === null ||
              event.funderId !== null ||
              event.rewardPaid !== assignment.rewardPerAction ||
              event.externalPayerIds.length !== 0 ||
              !source.primingMechanisms.some(
                mechanism =>
                  mechanism.id === event.primingMechanismId &&
                  mechanism.keeperAssignmentIds.includes(assignment.id) &&
                  state.priming[mechanism.id]?.active === true
              )
            ) {
              throw new RangeError("priming did not carry this keeper action");
            }
            break;
          case "none":
            if (
              event.primingMechanismId !== null ||
              event.funderId !== null ||
              event.rewardPaid !== 0 ||
              event.externalPayerIds.length !== 0
            ) {
              throw new RangeError("unfunded keeper work cannot pay a reward");
            }
            break;
          default:
            throw new RangeError("unknown keeper funding source");
        }
      }
      const keeper = {
        ...current,
        actedThisTick: checkedAdd(
          current.actedThisTick,
          event.outcome === "acted" ? 1 : 0,
          "keeper actedThisTick"
        ),
        skippedThisTick: checkedAdd(
          current.skippedThisTick,
          event.outcome === "skipped" ? 1 : 0,
          "keeper skippedThisTick"
        ),
      };
      safeInteger(keeper.actedThisTick, "keeper.actedThisTick");
      safeInteger(keeper.skippedThisTick, "keeper.skippedThisTick");
      const actors = { ...state.actors };
      if (event.outcome === "acted" && event.actorId !== null) {
        const actor = requireActor(state, event.actorId);
        actors[event.actorId] = {
          ...actor,
          keeperCosts: checkedAdd(
            actor.keeperCosts,
            assignment.costPerAction,
            `keeper costs for ${event.actorId}`
          ),
          keeperRewards: checkedAdd(
            actor.keeperRewards,
            event.rewardPaid,
            `keeper rewards for ${event.actorId}`
          ),
        };
        if (event.funderId !== null) {
          const funder = actors[event.funderId] ?? requireActor(state, event.funderId);
          actors[event.funderId] = {
            ...funder,
            keeperFundingCosts: checkedAdd(
              funder.keeperFundingCosts,
              event.rewardPaid,
              `keeper funding costs for ${event.funderId}`
            ),
          };
        }
      }
      const activityKey = domainInstrumentKey(event.domainId, event.instrumentId);
      const currentActivity = state.tickActivity[activityKey];
      if (currentActivity === undefined || currentActivity.windowRecorded) {
        throw new RangeError("keeper action is outside its open tick activity window");
      }
      const obligationId =
        `${event.at.tick}::${event.circuitId}::${event.circuitEdgeId}::` +
        event.rootKeeperAssignmentId;
      const requiredKeeperObligationIds = currentActivity.requiredKeeperObligationIds.includes(
        obligationId
      )
        ? currentActivity.requiredKeeperObligationIds
        : [...currentActivity.requiredKeeperObligationIds, obligationId];
      if (
        event.rootObligationFulfilled &&
        currentActivity.completedKeeperObligationIds.includes(obligationId)
      ) {
        throw new RangeError("a keeper root obligation cannot be fulfilled twice");
      }
      const completedKeeperObligationIds = event.rootObligationFulfilled
        ? [...currentActivity.completedKeeperObligationIds, obligationId]
        : currentActivity.completedKeeperObligationIds;
      const priorEconomicsCoverage =
        currentActivity.keeperEconomicsCoveredByObligation[obligationId];
      if (
        priorEconomicsCoverage !== undefined &&
        priorEconomicsCoverage !== event.rootEconomicsCovered
      ) {
        throw new RangeError("keeper plans disagree on root economic coverage");
      }
      const tickActivity = {
        ...state.tickActivity,
        [activityKey]: {
          ...currentActivity,
          requiredKeeperObligationIds,
          completedKeeperObligationIds,
          keeperEconomicsCoveredByObligation: {
            ...currentActivity.keeperEconomicsCoveredByObligation,
            [obligationId]: event.rootEconomicsCovered,
          },
        },
      };
      return withEventId(
        {
          ...state,
          actors,
          tickActivity,
          keepers: { ...state.keepers, [event.keeperAssignmentId]: keeper },
        },
        event.id
      );
    }

    case "domain-window-recorded": {
      safeInteger(event.attemptedTrades, "event.attemptedTrades");
      safeInteger(event.attemptedCircuitCycles, "event.attemptedCircuitCycles");
      safeInteger(event.completedTrades, "event.completedTrades");
      safeInteger(event.completedCircuitCycles, "event.completedCircuitCycles");
      ppm(event.keeperCoveragePpm, "event.keeperCoveragePpm");
      if (event.completedTrades > event.attemptedTrades) {
        throw new RangeError("Completed trades cannot exceed attempted trades");
      }
      if (event.at.phase !== "learning") {
        throw new RangeError("domain windows must be recorded in the learning phase");
      }
      const source = requireDerivedScenario(scenario, event.type);
      const activityKey = domainInstrumentKey(event.domainId, event.instrumentId);
      const activity = state.tickActivity[activityKey];
      if (activity === undefined || activity.windowRecorded) {
        throw new RangeError("domain activity window is missing or already recorded");
      }
      const expectedKeeperCoveragePpm =
        activity.requiredKeeperObligationIds.length === 0
          ? 0
          : mulDiv(
              activity.completedKeeperObligationIds.length,
              PPM,
              activity.requiredKeeperObligationIds.length,
              "recorded keeper coverage"
            );
      if (
        event.attemptedTrades !== activity.attemptedTenderTradeIds.length ||
        event.attemptedCircuitCycles !== activity.attemptedCircuitIds.length ||
        event.completedTrades !== activity.completedPostTradeIds.length ||
        event.completedCircuitCycles !== activity.completedCircuitIds.length ||
        event.keeperCoveragePpm !== expectedKeeperCoveragePpm
      ) {
        throw new RangeError("domain window does not match its replayed tick activity");
      }
      const expectedCircuitIds = source.circuits
        .filter(
          circuit =>
            circuit.domainId === event.domainId && circuit.instrumentId === event.instrumentId
        )
        .map(circuit => circuit.id)
        .sort();
      if (
        !sameStringSet(
          event.circuitResults.map(result => result.circuitId),
          expectedCircuitIds
        )
      ) {
        throw new RangeError("domain window does not contain its complete circuit set");
      }
      const resultAttempted = event.circuitResults.reduce(
        (total, result) => total + result.attemptedCycles,
        0
      );
      const resultCompleted = event.circuitResults.reduce(
        (total, result) => total + result.completedCycles,
        0
      );
      if (
        resultAttempted !== event.attemptedCircuitCycles ||
        resultCompleted !== event.completedCircuitCycles
      ) {
        throw new RangeError("domain circuit totals disagree with their per-circuit results");
      }
      for (const result of event.circuitResults) {
        const expectedAttempted = activity.attemptedCircuitIds.includes(result.circuitId) ? 1 : 0;
        const expectedCompleted = activity.completedCircuitIds.includes(result.circuitId) ? 1 : 0;
        if (
          result.attemptedCycles !== expectedAttempted ||
          result.completedCycles !== expectedCompleted
        ) {
          throw new RangeError("per-circuit result does not match its replayed edges");
        }
      }
      const current = requireDomainInstrument(state, event.domainId, event.instrumentId);
      const circuits = { ...state.circuits };
      const seenCircuits = new Set<string>();
      for (const result of event.circuitResults) {
        if (seenCircuits.has(result.circuitId)) {
          throw new RangeError(`Duplicate circuit result '${result.circuitId}'`);
        }
        seenCircuits.add(result.circuitId);
        safeInteger(result.attemptedCycles, `circuit '${result.circuitId}' attemptedCycles`);
        safeInteger(result.completedCycles, `circuit '${result.circuitId}' completedCycles`);
        if (result.completedCycles > result.attemptedCycles) {
          throw new RangeError("Completed circuit cycles cannot exceed attempted circuit cycles");
        }
        const circuit = requireCircuit(state, result.circuitId);
        if (circuit.domainId !== event.domainId || circuit.instrumentId !== event.instrumentId) {
          throw new RangeError(`Circuit '${result.circuitId}' is outside the recorded domain`);
        }
        circuits[result.circuitId] = {
          ...circuit,
          recentAttemptedCycles: [...circuit.recentAttemptedCycles, result.attemptedCycles],
          recentCompletedCycles: [...circuit.recentCompletedCycles, result.completedCycles],
        };
      }
      const domainInstrument = {
        ...current,
        recentAttemptedTrades: [...current.recentAttemptedTrades, event.attemptedTrades],
        recentAttemptedCircuitCycles: [
          ...current.recentAttemptedCircuitCycles,
          event.attemptedCircuitCycles,
        ],
        recentCompletedTrades: [...current.recentCompletedTrades, event.completedTrades],
        recentCircuitCycles: [...current.recentCircuitCycles, event.completedCircuitCycles],
        recentKeeperCoveragePpm: [...current.recentKeeperCoveragePpm, event.keeperCoveragePpm],
      };
      const tickActivity = {
        ...state.tickActivity,
        [activityKey]: { ...activity, windowRecorded: true },
      };
      return withEventId(
        {
          ...state,
          domainInstruments: {
            ...state.domainInstruments,
            [current.key]: domainInstrument,
          },
          circuits,
          tickActivity,
        },
        event.id
      );
    }

    case "circuit-credibility-set": {
      if (event.at.phase !== "lifecycle") {
        throw new RangeError("circuit credibility must be decided in the lifecycle phase");
      }
      if (event.invokerId.trim() === "") throw new RangeError("circuit invoker must be named");
      requireNonEmptyStrings(event.keeperAssignmentIds, "circuit keeperAssignmentIds");
      requireNonEmptyStrings(event.evidenceRefs, "circuit evidenceRefs");
      event.keeperAssignmentIds.forEach(id => requireKeeper(state, id));
      const source = requireDerivedScenario(scenario, event.type);
      if (event.invokerId !== source.modelVersion) {
        throw new RangeError("engine-derived circuit credibility has the wrong invoker");
      }
      const circuitSpec = source.circuits.find(candidate => candidate.id === event.circuitId);
      if (circuitSpec === undefined) {
        throw new RangeError(`Unknown source circuit '${event.circuitId}'`);
      }
      const expectedKeeperIds = [
        ...new Set(circuitSpec.edges.flatMap(edge => edge.keeperAssignmentIds)),
      ].sort();
      if (!sameStringSet(event.keeperAssignmentIds, expectedKeeperIds)) {
        throw new RangeError("circuit credibility cited the wrong keeper path");
      }
      const expectedCredibility = declaredCircuitIsCredible(source, state, circuitSpec);
      if (event.credible !== expectedCredibility) {
        throw new RangeError("circuit credibility does not follow the declared guard");
      }
      const current = requireDomainInstrument(state, event.domainId, event.instrumentId);
      if (state.tickActivity[current.key]?.windowRecorded !== true) {
        throw new RangeError("circuit credibility requires a completed activity window");
      }
      const circuit = requireCircuit(state, event.circuitId);
      if (circuit.domainId !== event.domainId || circuit.instrumentId !== event.instrumentId) {
        throw new RangeError(`Circuit '${event.circuitId}' is outside the credibility domain`);
      }
      const circuits = {
        ...state.circuits,
        [event.circuitId]: { ...circuit, credible: event.credible },
      };
      const credibleCircuit = Object.values(circuits).some(
        candidate =>
          candidate.domainId === event.domainId &&
          candidate.instrumentId === event.instrumentId &&
          candidate.credible
      );
      const domainInstrument = { ...current, credibleCircuit };
      return withEventId(
        {
          ...state,
          domainInstruments: {
            ...state.domainInstruments,
            [current.key]: domainInstrument,
          },
          circuits,
        },
        event.id
      );
    }

    case "lifecycle-transitioned": {
      if (event.at.phase !== "lifecycle") {
        throw new RangeError("lifecycle transitions must occur in the lifecycle phase");
      }
      const current = requireDomainInstrument(state, event.domainId, event.instrumentId);
      if (state.tickActivity[current.key]?.windowRecorded !== true) {
        throw new RangeError("lifecycle transition requires a completed activity window");
      }
      if (current.lifecycle !== event.from) {
        throw new RangeError(
          `Lifecycle mismatch for '${current.key}': expected '${current.lifecycle}', event says '${event.from}'`
        );
      }
      if (event.from === event.to) {
        throw new RangeError("Lifecycle transitions must change state");
      }
      if (event.invokerId.trim() === "") throw new RangeError("lifecycle invoker must be named");
      requireNonEmptyStrings(event.keeperAssignmentIds, "lifecycle keeperAssignmentIds");
      requireNonEmptyStrings(event.evidenceRefs, "lifecycle evidenceRefs");
      event.keeperAssignmentIds.forEach(id => requireKeeper(state, id));
      const source = requireDerivedScenario(scenario, event.type);
      const expectedKeeperIds = scopedKeeperIds(source, event.domainId, event.instrumentId);
      if (!sameStringSet(event.keeperAssignmentIds, expectedKeeperIds)) {
        throw new RangeError("lifecycle transition cited a keeper path outside its scope");
      }
      if (event.authority === "accepted-finding") {
        requireNonEmptyStrings(event.findingRefs, "accepted-finding lifecycle findingRefs");
      } else if (event.authority !== "engine-derived") {
        throw new RangeError(`unknown lifecycle authority '${event.authority as string}'`);
      }
      if (
        !hasOwn(ALLOWED_LIFECYCLE_TRANSITIONS, event.from) ||
        !ALLOWED_LIFECYCLE_TRANSITIONS[event.from]?.has(event.to)
      ) {
        throw new RangeError(
          `Lifecycle transition '${event.from}' -> '${event.to}' is not allowed`
        );
      }
      const findingOnlyTransition =
        event.to === "repairing" ||
        event.to === "exited" ||
        event.to === "collapsed" ||
        event.to === "superseded" ||
        event.from === "repairing";
      if (event.authority === "engine-derived" || !findingOnlyTransition) {
        if (event.authority === "engine-derived") {
          if (event.invokerId !== source.modelVersion) {
            throw new RangeError("engine-derived lifecycle transition has the wrong invoker");
          }
          if (event.findingRefs.length !== 0) {
            throw new RangeError("engine-derived lifecycle transition cannot cite findings");
          }
        }
        const margins = evaluateAllContinuationAssumptions(source, state);
        const priming = activePrimingMechanisms(source, state, event.domainId, event.instrumentId);
        const expected = decideLifecycle(
          source,
          state,
          current,
          margins,
          priming.length > 0,
          priming.some(mechanism => mechanism.startsAtTick === state.tick)
        );
        if (expected.prior !== event.from || expected.next !== event.to) {
          throw new RangeError(
            `Lifecycle transition '${event.from}' -> '${event.to}' does not follow the declared guard`
          );
        }
        if (event.authority === "engine-derived" && expected.reason !== event.reason) {
          throw new RangeError("engine-derived lifecycle reason does not match its guard");
        }
      }
      const domainInstrument = {
        ...current,
        lifecycle: event.to,
        stateEnteredTick: event.at.tick,
        wedgeRemovedAtTick:
          event.to === "installed-supported" &&
          !current.activeExternalSupport &&
          current.wedgeRemovedAtTick === null
            ? event.at.tick
            : current.wedgeRemovedAtTick,
      };
      return withEventId(
        {
          ...state,
          domainInstruments: {
            ...state.domainInstruments,
            [current.key]: domainInstrument,
          },
        },
        event.id
      );
    }

    default:
      return assertNever(event);
  }
}

export function replayEvents(
  initialState: SimulationState,
  events: readonly SimulationEvent[],
  scenario?: ScenarioSpec
): SimulationState {
  let state = initialState;
  let previous: SimulationEvent | undefined;
  const ids = new Set<string>();

  for (const event of events) {
    if (ids.has(event.id)) throw new RangeError(`Duplicate event id '${event.id}'`);
    if (previous !== undefined && compareLogicalTime(previous.at, event.at) >= 0) {
      throw new RangeError(
        `Event '${event.id}' is not strictly later than '${previous.id}' in logical time`
      );
    }
    state = reduceEvent(state, event, scenario);
    ids.add(event.id);
    previous = event;
  }

  return state;
}

export function replayScenario(
  scenario: ScenarioSpec,
  events: readonly SimulationEvent[]
): SimulationState {
  // This establishes structural legality and declared-horizon completeness for
  // events that are present. It cannot prove that a source-scheduled or random
  // event was omitted; imported deterministic traces must additionally pass
  // verifyDeterministicTrace with trusted scenario, seed and tick count.
  const state = replayEvents(createInitialState(scenario), events, scenario);
  if (
    events.length === 0 ||
    state.runSeed === null ||
    state.runTicks === null ||
    state.runScenarioHash === null ||
    state.tickStartedTick === null
  ) {
    throw new RangeError("scenario replay must contain a started tick");
  }
  if (Object.keys(state.pendingTrades).length > 0) {
    throw new RangeError("scenario replay ended with unresolved trades");
  }
  if (state.adoptionAppliedTick !== state.tick) {
    throw new RangeError("scenario replay ended before staged adoption was applied");
  }
  if (state.tick !== state.runTicks - 1) {
    throw new RangeError("scenario replay ended before its declared run horizon");
  }
  if (Object.values(state.tickActivity).some(activity => !activity.windowRecorded)) {
    throw new RangeError("scenario replay ended before every activity window was recorded");
  }
  return state;
}
