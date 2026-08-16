import { canonicalHash, canonicalJson } from "./canonical-json.js";
import {
  evaluateAllContinuationAssumptions,
  evaluateKeeperViability,
  keeperAssignmentMargin,
  keeperFundingMargin,
  realisedCircuitSurplus,
  viableFundingActors,
  weakestKeeperMargin,
} from "./continuation.js";
import {
  EVENT_VERSION,
  makeEventId,
  type SimulationEvent,
  type SimulationPhase,
} from "./events.js";
import { decideLifecycle } from "./lifecycle.js";
import { checkedAdd, checkedSum, mulDiv, ppmProduct } from "./math.js";
import {
  buildDomainMetrics,
  declaredCircuitIsCredible,
  emptyTickActivity,
  type TickActivity,
} from "./metrics.js";
import { decideAcceptance } from "./policies.js";
import {
  activePrimingMechanisms,
  allocatePrimingSpend,
  hasExternalSupport,
  primingSpendForTick,
  shouldActivatePriming,
} from "./priming.js";
import { createInitialState, reduceEvent, replayScenario } from "./reducer.js";
import { DeterministicRng } from "./rng.js";
import {
  PPM,
  compareCodeUnits,
  domainInstrumentKey,
  type ActorId,
  type IncentiveMargin,
  type KeeperAssignmentSpec,
  type RunSummary,
  type ScenarioSpec,
  type SimulationState,
  type TickMetrics,
} from "./types.js";
import { assertValidScenario } from "./validate.js";

type EventPayload = SimulationEvent extends infer TEvent
  ? TEvent extends SimulationEvent
    ? Omit<TEvent, "eventVersion" | "id" | "at">
    : never
  : never;

export interface SimulationRun {
  scenario: ScenarioSpec;
  seed: string;
  state: SimulationState;
  events: SimulationEvent[];
  finalMargins: IncentiveMargin[];
  summary: RunSummary;
}

export interface SimulationOptions {
  ticks?: number;
  repositoryCommit?: string;
}

interface KeeperActionPlan {
  assignment: KeeperAssignmentSpec;
  actorId: ActorId | null;
  acted: boolean;
  reason: string;
  fundingSource: "priming" | "external" | "internal" | "none";
  primingMechanismId: string | null;
  funderId: ActorId | null;
  rewardPaid: number;
}

interface KeeperAssignmentOutcome {
  plans: KeeperActionPlan[];
  fulfilled: boolean;
  economicsCovered: boolean;
}

interface ConcreteKeeperEconomics {
  reward: number;
  effortCost: number;
}

function continuationActionKey(
  actorId: ActorId,
  action: string,
  domainId: string,
  instrumentId: string
): string {
  return `${actorId}::${action}::${domainId}::${instrumentId}`;
}

function serviceSignalPpm(state: SimulationState, domainId: string, instrumentId: string): number {
  const runtime = state.domainInstruments[domainInstrumentKey(domainId, instrumentId)];
  if (runtime === undefined || runtime.recentAttemptedTrades.length === 0) return 0;
  const attempted = runtime.recentAttemptedTrades[runtime.recentAttemptedTrades.length - 1];
  const completed = runtime.recentCompletedTrades[runtime.recentCompletedTrades.length - 1] ?? 0;
  return attempted === 0 ? 0 : mulDiv(completed, PPM, attempted, "service signal");
}

function postRemovalKeeperEconomicsCovered(
  events: readonly SimulationEvent[],
  state: SimulationState
): boolean {
  const obligations = new Map<string, boolean>();
  for (const event of events) {
    if (event.type !== "keeper-action-recorded") continue;
    const runtime =
      state.domainInstruments[domainInstrumentKey(event.domainId, event.instrumentId)];
    if (runtime?.wedgeRemovedAtTick === null || runtime?.wedgeRemovedAtTick === undefined) continue;
    if (event.at.tick < runtime.wedgeRemovedAtTick) continue;
    const obligationId =
      `${event.at.tick}::${event.circuitId}::${event.circuitEdgeId}::` +
      event.rootKeeperAssignmentId;
    obligations.set(
      obligationId,
      (obligations.get(obligationId) ?? true) && event.rootEconomicsCovered
    );
  }
  return [...obligations.values()].every(fulfilled => fulfilled);
}

function viableAssignmentActors(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  circuitInstrumentId: string,
  usedKeeperEconomics: ReadonlyMap<string, ConcreteKeeperEconomics>
): ActorId[] {
  const viableActors = new Set(
    margins
      .filter(margin => {
        const key = continuationActionKey(
          margin.actorId,
          assignment.keeperFunction,
          assignment.domainId,
          assignment.instrumentId ?? circuitInstrumentId
        );
        const used = usedKeeperEconomics.get(key) ?? { reward: 0, effortCost: 0 };
        return (
          keeperAssignmentMargin(
            scenario,
            assignment,
            margin,
            circuitInstrumentId,
            checkedAdd(used.reward, assignment.rewardPerAction),
            checkedAdd(used.effortCost, assignment.costPerAction)
          )?.holds === true
        );
      })
      .map(margin => margin.actorId)
  );
  return assignment.actorIds
    .filter(actorId => state.actors[actorId]?.active === true && viableActors.has(actorId))
    .sort();
}

function cumulativeFundingEconomicsCovered(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  circuitInstrumentId: string,
  usedFunding: ReadonlyMap<string, number>
): boolean {
  if (assignment.funding !== "internal" || assignment.rewardPerAction === 0) return true;
  let availableSlots = 0;
  for (const funderId of assignment.fundingActorIds) {
    if (state.actors[funderId]?.active !== true) continue;
    const fundingKey = continuationActionKey(
      funderId,
      "fund-keeper",
      assignment.domainId,
      assignment.instrumentId ?? circuitInstrumentId
    );
    let cumulativeFunding = usedFunding.get(fundingKey) ?? 0;
    while (availableSlots < assignment.requiredActorsPerAction) {
      cumulativeFunding = checkedAdd(
        cumulativeFunding,
        assignment.rewardPerAction,
        `hypothetical cumulative keeper funding by ${funderId}`
      );
      const holds = margins.some(margin => {
        if (margin.actorId !== funderId) return false;
        return (
          keeperFundingMargin(scenario, assignment, margin, circuitInstrumentId, cumulativeFunding)
            ?.holds === true
        );
      });
      if (!holds) break;
      availableSlots += 1;
    }
    if (availableSlots >= assignment.requiredActorsPerAction) return true;
  }
  return false;
}

function chooseKeeperActors(
  candidates: readonly ActorId[],
  count: number,
  topology: KeeperAssignmentSpec["topology"],
  rng: DeterministicRng
): ActorId[] {
  const remaining = [...candidates].sort();
  const chosen: ActorId[] = [];
  const rotates = topology === "open" || topology === "rotating" || topology === "protocol";
  while (chosen.length < count && remaining.length > 0) {
    const index = rotates ? rng.integer(0, remaining.length) : 0;
    chosen.push(remaining.splice(index, 1)[0]);
  }
  return chosen;
}

function planKeeperAssignment(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  usedCapacity: Map<string, number>,
  usedFunding: Map<string, number>,
  usedKeeperEconomics: Map<string, ConcreteKeeperEconomics>,
  usedExternalFunding: Map<string, number>,
  usedPrimingFunding: Map<string, number>,
  rng: DeterministicRng,
  circuitInstrumentId: string,
  edgeActorIds: readonly ActorId[],
  visited = new Set<string>()
): KeeperAssignmentOutcome {
  if (visited.has(assignment.id)) {
    return {
      plans: [
        {
          assignment,
          actorId: null,
          acted: false,
          reason: "fallback cycle",
          fundingSource: "none",
          primingMechanismId: null,
          funderId: null,
          rewardPaid: 0,
        },
      ],
      fulfilled: false,
      economicsCovered: true,
    };
  }
  const nextVisited = new Set(visited).add(assignment.id);
  const runtime = state.keepers[assignment.id];
  if (runtime?.enabled !== true) {
    return tryKeeperFallback(
      scenario,
      state,
      assignment,
      margins,
      usedCapacity,
      usedFunding,
      usedKeeperEconomics,
      usedExternalFunding,
      usedPrimingFunding,
      rng,
      circuitInstrumentId,
      edgeActorIds,
      nextVisited,
      true,
      [
        {
          assignment,
          actorId: null,
          acted: false,
          reason: "keeper disabled",
          fundingSource: "none",
          primingMechanismId: null,
          funderId: null,
          rewardPaid: 0,
        },
      ]
    );
  }
  const used = usedCapacity.get(assignment.id) ?? 0;
  if (used + assignment.requiredActorsPerAction > assignment.capacityPerTick) {
    return tryKeeperFallback(
      scenario,
      state,
      assignment,
      margins,
      usedCapacity,
      usedFunding,
      usedKeeperEconomics,
      usedExternalFunding,
      usedPrimingFunding,
      rng,
      circuitInstrumentId,
      edgeActorIds,
      nextVisited,
      true,
      [
        {
          assignment,
          actorId: null,
          acted: false,
          reason: "capacity exhausted",
          fundingSource: "none",
          primingMechanismId: null,
          funderId: null,
          rewardPaid: 0,
        },
      ]
    );
  }
  const viability = evaluateKeeperViability(
    scenario,
    state,
    assignment,
    margins,
    circuitInstrumentId
  );
  const externallyCarried = assignment.funding === "external";
  const effectiveInstrumentId = assignment.instrumentId ?? circuitInstrumentId;
  const domainInstrument =
    state.domainInstruments[domainInstrumentKey(assignment.domainId, effectiveInstrumentId)];
  const coldStartPhase =
    domainInstrument?.lifecycle === "candidate" || domainInstrument?.lifecycle === "priming";
  const primingMechanism = activePrimingMechanisms(
    scenario,
    state,
    assignment.domainId,
    effectiveInstrumentId
  )
    .filter(mechanism => mechanism.keeperAssignmentIds.includes(assignment.id))
    .sort((left, right) => compareCodeUnits(left.id, right.id))
    .find(mechanism => {
      const requiredReward = checkedSum(
        Array.from(
          { length: assignment.requiredActorsPerAction },
          () => assignment.rewardPerAction
        ),
        `priming keeper capacity for ${assignment.id}`
      );
      return (
        (usedPrimingFunding.get(mechanism.id) ?? 0) + requiredReward <=
        mechanism.totalBudget - (state.priming[mechanism.id]?.spent ?? 0)
      );
    });
  const primingCarried = primingMechanism !== undefined;
  let candidates = viableAssignmentActors(
    scenario,
    state,
    assignment,
    margins,
    effectiveInstrumentId,
    usedKeeperEconomics
  );
  if (primingCarried || externallyCarried) {
    candidates = assignment.actorIds
      .filter(actorId => state.actors[actorId]?.active === true)
      .sort();
  }
  if (assignment.topology === "bilateral") {
    const endpointIds = new Set(edgeActorIds);
    candidates = candidates.filter(actorId => endpointIds.has(actorId));
  }
  if (coldStartPhase && !primingCarried && !externallyCarried) candidates = [];
  const actorIds = chooseKeeperActors(
    candidates,
    assignment.requiredActorsPerAction,
    assignment.topology,
    rng.fork("actors")
  );
  if (actorIds.length < assignment.requiredActorsPerAction) {
    const edgeActors = new Set(edgeActorIds);
    const permittedActiveActors = assignment.actorIds.filter(
      actorId =>
        state.actors[actorId]?.active === true &&
        (assignment.topology !== "bilateral" || edgeActors.has(actorId))
    );
    const economicsCovered =
      primingCarried ||
      externallyCarried ||
      coldStartPhase ||
      permittedActiveActors.length < assignment.requiredActorsPerAction;
    const reason =
      assignment.actorIds.length === 0
        ? "open boundary has no acting person"
        : coldStartPhase && !primingCarried && !externallyCarried
          ? "continuation cannot carry cold-start keeper work"
          : viability.reason;
    return tryKeeperFallback(
      scenario,
      state,
      assignment,
      margins,
      usedCapacity,
      usedFunding,
      usedKeeperEconomics,
      usedExternalFunding,
      usedPrimingFunding,
      rng,
      circuitInstrumentId,
      edgeActorIds,
      nextVisited,
      economicsCovered,
      [
        {
          assignment,
          actorId: null,
          acted: false,
          reason,
          fundingSource: "none",
          primingMechanismId: null,
          funderId: null,
          rewardPaid: 0,
        },
      ]
    );
  }
  const availableFunders = viableFundingActors(
    scenario,
    state,
    assignment,
    margins,
    effectiveInstrumentId
  );
  const fundingEconomicsCovered =
    primingCarried ||
    externallyCarried ||
    cumulativeFundingEconomicsCovered(
      scenario,
      state,
      assignment,
      margins,
      effectiveInstrumentId,
      usedFunding
    );
  const plans = actorIds.map<KeeperActionPlan>(actorId => {
    const acted = rng.fork("reliability", actorId).bernoulli(assignment.reliabilityPpm);
    const plan: KeeperActionPlan = {
      assignment,
      actorId,
      acted,
      reason: acted
        ? primingCarried
          ? "priming mechanism carried keeper work"
          : externallyCarried
            ? "external funding carried keeper work"
            : "actor-specific continuation margin held"
        : "reliability draw failed",
      fundingSource: !acted
        ? "none"
        : primingCarried
          ? "priming"
          : externallyCarried
            ? "external"
            : "none",
      primingMechanismId: acted && primingCarried ? primingMechanism.id : null,
      funderId: null,
      rewardPaid: 0,
    };
    if (plan.acted && primingCarried) {
      const fundingUsed = usedPrimingFunding.get(primingMechanism.id) ?? 0;
      usedPrimingFunding.set(
        primingMechanism.id,
        checkedAdd(
          fundingUsed,
          assignment.rewardPerAction,
          `priming keeper funding used by ${primingMechanism.id}`
        )
      );
      plan.rewardPaid = assignment.rewardPerAction;
    }
    if (plan.acted && !primingCarried && externallyCarried) {
      const fundingUsed = usedExternalFunding.get(assignment.id) ?? 0;
      if (fundingUsed + assignment.rewardPerAction > assignment.externalFundingBudgetPerTick) {
        plan.acted = false;
        plan.reason = "external keeper budget exhausted";
        plan.fundingSource = "none";
      } else {
        usedExternalFunding.set(
          assignment.id,
          checkedAdd(
            fundingUsed,
            assignment.rewardPerAction,
            `external funding used by ${assignment.id}`
          )
        );
        plan.rewardPaid = assignment.rewardPerAction;
      }
    }
    if (
      plan.acted &&
      !primingCarried &&
      !externallyCarried &&
      assignment.funding === "internal" &&
      assignment.rewardPerAction > 0
    ) {
      const economicallyEligible = availableFunders.filter(funderId => {
        const fundingKey = continuationActionKey(
          funderId,
          "fund-keeper",
          assignment.domainId,
          effectiveInstrumentId
        );
        const nextFunding = checkedAdd(
          usedFunding.get(fundingKey) ?? 0,
          assignment.rewardPerAction,
          `cumulative keeper funding by ${funderId}`
        );
        return margins.some(margin => {
          if (margin.actorId !== funderId) return false;
          return (
            keeperFundingMargin(scenario, assignment, margin, effectiveInstrumentId, nextFunding)
              ?.holds === true
          );
        });
      });
      const eligible = economicallyEligible.filter(funderId => {
        const fundingKey = continuationActionKey(
          funderId,
          "fund-keeper",
          assignment.domainId,
          effectiveInstrumentId
        );
        return (
          checkedAdd(
            usedFunding.get(fundingKey) ?? 0,
            assignment.rewardPerAction,
            `cumulative keeper funding capacity by ${funderId}`
          ) <= assignment.fundingCapacityPerActorPerTick
        );
      });
      if (eligible.length === 0) {
        plan.acted = false;
        plan.reason =
          economicallyEligible.length === 0
            ? "no participant with positive cumulative funding margin"
            : "participant funding capacity exhausted";
      } else {
        const funderId = eligible[rng.fork("funding", actorId).integer(0, eligible.length)];
        const fundingKey = continuationActionKey(
          funderId,
          "fund-keeper",
          assignment.domainId,
          effectiveInstrumentId
        );
        usedFunding.set(
          fundingKey,
          checkedAdd(
            usedFunding.get(fundingKey) ?? 0,
            assignment.rewardPerAction,
            `keeper funding used by ${funderId}`
          )
        );
        plan.fundingSource = "internal";
        plan.funderId = funderId;
        plan.rewardPaid = assignment.rewardPerAction;
        plan.reason = "actor-specific keeper and funding margins held";
      }
    }
    return plan;
  });
  for (const plan of plans) {
    if (!plan.acted || plan.actorId === null) continue;
    const economicsKey = continuationActionKey(
      plan.actorId,
      assignment.keeperFunction,
      assignment.domainId,
      effectiveInstrumentId
    );
    const prior = usedKeeperEconomics.get(economicsKey) ?? { reward: 0, effortCost: 0 };
    usedKeeperEconomics.set(economicsKey, {
      reward: checkedAdd(prior.reward, plan.rewardPaid, `keeper rewards used by ${plan.actorId}`),
      effortCost: checkedAdd(
        prior.effortCost,
        assignment.costPerAction,
        `keeper effort used by ${plan.actorId}`
      ),
    });
  }
  const actedCount = plans.filter(plan => plan.acted).length;
  const economicsCovered = fundingEconomicsCovered;
  if (actedCount > 0) usedCapacity.set(assignment.id, used + actedCount);
  if (plans.every(plan => plan.acted)) {
    return { plans, fulfilled: true, economicsCovered: true };
  }
  return tryKeeperFallback(
    scenario,
    state,
    assignment,
    margins,
    usedCapacity,
    usedFunding,
    usedKeeperEconomics,
    usedExternalFunding,
    usedPrimingFunding,
    rng,
    circuitInstrumentId,
    edgeActorIds,
    nextVisited,
    economicsCovered,
    plans
  );
}

function tryKeeperFallback(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  usedCapacity: Map<string, number>,
  usedFunding: Map<string, number>,
  usedKeeperEconomics: Map<string, ConcreteKeeperEconomics>,
  usedExternalFunding: Map<string, number>,
  usedPrimingFunding: Map<string, number>,
  rng: DeterministicRng,
  circuitInstrumentId: string,
  edgeActorIds: readonly ActorId[],
  visited: Set<string>,
  primaryEconomicsCovered: boolean,
  primaryPlans: KeeperActionPlan[]
): KeeperAssignmentOutcome {
  if (assignment.fallbackAssignmentId === undefined) {
    return { plans: primaryPlans, fulfilled: false, economicsCovered: primaryEconomicsCovered };
  }
  const fallback = scenario.keeperAssignments.find(
    candidate => candidate.id === assignment.fallbackAssignmentId
  );
  if (fallback === undefined) {
    return { plans: primaryPlans, fulfilled: false, economicsCovered: primaryEconomicsCovered };
  }
  const fallbackOutcome = planKeeperAssignment(
    scenario,
    state,
    fallback,
    margins,
    usedCapacity,
    usedFunding,
    usedKeeperEconomics,
    usedExternalFunding,
    usedPrimingFunding,
    rng.fork("fallback", fallback.id),
    circuitInstrumentId,
    edgeActorIds,
    visited
  );
  return {
    plans: [...primaryPlans, ...fallbackOutcome.plans],
    fulfilled: fallbackOutcome.fulfilled,
    economicsCovered: primaryEconomicsCovered || fallbackOutcome.economicsCovered,
  };
}

function cloneActivityByKey(scenario: ScenarioSpec): Record<string, TickActivity> {
  return Object.fromEntries(
    scenario.domains.flatMap(domain =>
      domain.instrumentIds.map(instrumentId => [
        domainInstrumentKey(domain.id, instrumentId),
        emptyTickActivity(),
      ])
    )
  );
}

function primingReason(
  mechanism: ScenarioSpec["primingMechanisms"][number],
  state: SimulationState
): "condition-met" | "budget-exhausted" {
  return state.priming[mechanism.id]?.spent >= mechanism.totalBudget
    ? "budget-exhausted"
    : "condition-met";
}

export function runSelectionLifecycle(
  scenario: ScenarioSpec,
  seed: string,
  options: SimulationOptions = {}
): SimulationRun {
  assertValidScenario(scenario);
  if (seed.trim() === "") throw new RangeError("simulation seed must be non-empty");
  const ticks = options.ticks ?? scenario.ticks;
  if (!Number.isSafeInteger(ticks) || ticks < 1) {
    throw new RangeError("simulation ticks must be a positive safe integer");
  }
  if (ticks > scenario.ticks) {
    throw new RangeError("simulation ticks cannot exceed the validated scenario horizon");
  }

  let state = createInitialState(scenario);
  const events: SimulationEvent[] = [];
  const metrics: TickMetrics[] = [];
  const rootRng = new DeterministicRng(seed);
  let phaseSequences = new Map<SimulationPhase, number>();

  const emit = (
    phase: SimulationPhase,
    subjectId: string,
    payload: EventPayload,
    eventTick = state.tick
  ): void => {
    const sequence = phaseSequences.get(phase) ?? 0;
    phaseSequences.set(phase, sequence + 1);
    const at = { tick: eventTick, phase, sequence };
    const event = {
      ...payload,
      eventVersion: EVENT_VERSION,
      id: makeEventId(at, payload.type, subjectId),
      at,
    } as SimulationEvent;
    state = reduceEvent(state, event, scenario);
    events.push(event);
  };

  for (let tick = 0; tick < ticks; tick += 1) {
    phaseSequences = new Map();
    if (tick === 0) {
      emit(
        "shocks",
        scenario.id,
        {
          type: "run-started",
          seed,
          ticks,
          scenarioHash: canonicalHash(scenario),
        },
        tick
      );
    }
    emit("shocks", `tick:${tick}`, { type: "tick-started" }, tick);

    for (const shock of scenario.shocks.filter(item => item.tick === tick)) {
      switch (shock.kind) {
        case "deactivate-actor":
          emit("shocks", shock.actorId, {
            type: "actor-activity-set",
            actorId: shock.actorId,
            active: false,
            reason: "declared shock",
          });
          break;
        case "deactivate-relationship":
          emit("shocks", shock.relationshipId, {
            type: "relationship-activity-set",
            relationshipId: shock.relationshipId,
            active: false,
            reason: "declared shock",
          });
          break;
        case "disable-keeper":
          emit("shocks", shock.keeperAssignmentId, {
            type: "keeper-availability-set",
            keeperAssignmentId: shock.keeperAssignmentId,
            enabled: false,
            reason: "declared shock",
          });
          break;
        case "stop-priming":
          if (state.priming[shock.primingMechanismId]?.active === true) {
            emit("shocks", shock.primingMechanismId, {
              type: "priming-stopped",
              primingMechanismId: shock.primingMechanismId,
              reason: "shock",
            });
          }
          break;
        case "scale-opportunities":
          for (const relationship of scenario.relationships.filter(
            item => item.domainId === shock.domainId
          )) {
            const priorScale = state.relationships[relationship.id]?.opportunityScalePpm ?? PPM;
            emit("shocks", relationship.id, {
              type: "relationship-opportunity-scale-set",
              relationshipId: relationship.id,
              opportunityScalePpm: ppmProduct(priorScale, shock.factorPpm),
              reason: "declared shock",
            });
          }
          break;
      }
    }

    for (const mechanism of [...scenario.primingMechanisms].sort((a, b) =>
      compareCodeUnits(a.id, b.id)
    )) {
      const runtime = state.priming[mechanism.id];
      if (runtime === undefined || runtime.stoppedAtTick !== null) continue;
      const shouldBeActive = shouldActivatePriming(mechanism, state);
      if (shouldBeActive && !runtime.active) {
        emit("shocks", mechanism.id, {
          type: "priming-started",
          primingMechanismId: mechanism.id,
        });
      } else if (!shouldBeActive && runtime.active) {
        emit("shocks", mechanism.id, {
          type: "priming-stopped",
          primingMechanismId: mechanism.id,
          reason: primingReason(mechanism, state),
        });
      }
    }

    for (const runtime of Object.values(state.domainInstruments).sort((a, b) =>
      compareCodeUnits(a.key, b.key)
    )) {
      const activeExternalSupport = hasExternalSupport(
        scenario,
        state,
        runtime.domainId,
        runtime.instrumentId
      );
      if (activeExternalSupport !== runtime.activeExternalSupport) {
        emit("shocks", runtime.key, {
          type: "domain-external-support-set",
          domainId: runtime.domainId,
          instrumentId: runtime.instrumentId,
          active: activeExternalSupport,
          wedgeRemovedAtTick: activeExternalSupport ? null : tick,
        });
      }
    }

    const adoptionSnapshot = state;
    const adoptionDecisions: Extract<
      EventPayload,
      { type: "adoption-batch-applied" }
    >["decisions"] = [];
    for (const actorSpec of [...scenario.actors].sort((a, b) => compareCodeUnits(a.id, b.id))) {
      if (adoptionSnapshot.actors[actorSpec.id]?.active !== true) continue;
      const policy = scenario.policies.find(item => item.id === actorSpec.policyId);
      if (policy === undefined) throw new Error(`unknown policy '${actorSpec.policyId}'`);
      for (const acceptanceSpec of [...actorSpec.acceptance].sort((a, b) =>
        compareCodeUnits(
          domainInstrumentKey(a.domainId, a.instrumentId),
          domainInstrumentKey(b.domainId, b.instrumentId)
        )
      )) {
        const decision = decideAcceptance(
          scenario,
          adoptionSnapshot,
          actorSpec.id,
          acceptanceSpec,
          policy,
          serviceSignalPpm(adoptionSnapshot, acceptanceSpec.domainId, acceptanceSpec.instrumentId)
        );
        adoptionDecisions.push({
          actorId: actorSpec.id,
          domainId: acceptanceSpec.domainId,
          instrumentId: acceptanceSpec.instrumentId,
          acceptance: decision.next,
          reason: `score ${decision.scorePpm}; adoption threshold ${decision.effectiveAdoptionThresholdPpm}; abandonment threshold ${decision.effectiveAbandonmentThresholdPpm}`,
        });
      }
    }
    emit("adoption", `adoption:${tick}`, {
      type: "adoption-batch-applied",
      decisions: adoptionDecisions,
    });

    const margins = evaluateAllContinuationAssumptions(scenario, state);
    const activityByKey = cloneActivityByKey(scenario);
    const usedCapacity = new Map<string, number>();
    const usedFunding = new Map<string, number>();
    const usedKeeperEconomics = new Map<string, ConcreteKeeperEconomics>();
    const usedExternalFunding = new Map<string, number>();
    const usedPrimingFunding = new Map<string, number>();
    for (const mechanism of scenario.primingMechanisms) {
      const baseCost = primingSpendForTick(mechanism, state);
      if (baseCost > 0) usedPrimingFunding.set(mechanism.id, baseCost);
    }
    const keeperPlans: (KeeperActionPlan & {
      rootKeeperAssignmentId: string;
      rootObligationFulfilled: boolean;
      rootEconomicsCovered: boolean;
      circuitId: string;
      circuitEdgeId: string;
      domainId: string;
      instrumentId: string;
    })[] = [];
    const circuitResults = Object.fromEntries(
      scenario.circuits.map(circuit => [
        circuit.id,
        { circuitId: circuit.id, attemptedCycles: 0, completedCycles: 0 },
      ])
    );
    const relationshipById = new Map(
      scenario.relationships.map(relationship => [relationship.id, relationship])
    );
    for (const circuit of [...scenario.circuits].sort((a, b) => compareCodeUnits(a.id, b.id))) {
      const key = domainInstrumentKey(circuit.domainId, circuit.instrumentId);
      const activity = activityByKey[key];
      if (activity === undefined) continue;
      const lifecycle = state.domainInstruments[key]?.lifecycle;
      if (lifecycle === "collapsed" || lifecycle === "exited" || lifecycle === "superseded") {
        continue;
      }
      const circuitRng = rootRng.fork(`tick:${tick}`, `circuit:${circuit.id}`);
      let circuitAttempted = false;
      let circuitCompleted = true;

      for (const [edgeIndex, edge] of circuit.edges.entries()) {
        const relationship = relationshipById.get(edge.relationshipId);
        if (relationship === undefined)
          throw new Error(`unknown relationship '${edge.relationshipId}'`);
        const relationshipRuntime = state.relationships[relationship.id];
        if (relationshipRuntime?.active !== true) {
          circuitCompleted = false;
          break;
        }
        const tradeRng = circuitRng.fork(`edge:${edgeIndex}:${edge.id}`);
        const arrivalPpm = ppmProduct(
          relationship.opportunityArrivalPpm,
          relationshipRuntime.opportunityScalePpm
        );
        if (!tradeRng.fork("arrival").bernoulli(arrivalPpm)) {
          circuitCompleted = false;
          break;
        }
        if (!circuitAttempted) {
          circuitAttempted = true;
          activity.attemptedCircuitCycles += 1;
          circuitResults[circuit.id].attemptedCycles += 1;
        }
        if (edge.action === "tender") activity.attemptedTrades += 1;
        const tradeId = `trade:${tick}:${circuit.id}:${edgeIndex}:${edge.id}`;
        emit("performance", tradeId, {
          type: "trade-attempted",
          tradeId,
          circuitId: circuit.id,
          circuitEdgeId: edge.id,
          circuitAction: edge.action,
          relationshipId: relationship.id,
          domainId: relationship.domainId,
          instrumentId: circuit.instrumentId,
          fromActorId: relationship.fromActorId,
          toActorId: relationship.toActorId,
        });

        const from = state.actors[relationship.fromActorId];
        const to = state.actors[relationship.toActorId];
        const actionMarginsHold = edge.loadBearingActorIds.every(actorId => {
          const explicitlyCarried = activePrimingMechanisms(
            scenario,
            state,
            circuit.domainId,
            circuit.instrumentId
          ).some(mechanism => mechanism.targetActorIds.includes(actorId));
          return (
            explicitlyCarried ||
            margins.some(margin => {
              const assumption = scenario.continuationAssumptions.find(
                candidate => candidate.id === margin.assumptionId
              );
              return (
                margin.holds &&
                margin.actorId === actorId &&
                assumption?.action === edge.action &&
                assumption.domainId === circuit.domainId &&
                assumption.instrumentId === circuit.instrumentId
              );
            })
          );
        });
        const accepted =
          from?.active === true &&
          to?.active === true &&
          from.acceptance[key]?.accepts === true &&
          to.acceptance[key]?.accepts === true &&
          actionMarginsHold;
        if (!accepted) {
          activity.refusedTrades += 1;
          emit("performance", tradeId, {
            type: "trade-resolved",
            tradeId,
            circuitId: circuit.id,
            circuitEdgeId: edge.id,
            circuitAction: edge.action,
            relationshipId: relationship.id,
            domainId: relationship.domainId,
            instrumentId: circuit.instrumentId,
            fromActorId: relationship.fromActorId,
            toActorId: relationship.toActorId,
            outcome: "refused",
            realisedSurplus: [],
          });
          circuitCompleted = false;
          break;
        }

        const outcomes: KeeperAssignmentOutcome[] = [];
        for (const assignmentId of edge.keeperAssignmentIds) {
          const assignment = scenario.keeperAssignments.find(item => item.id === assignmentId);
          if (assignment === undefined) throw new Error(`unknown keeper '${assignmentId}'`);
          const outcome = planKeeperAssignment(
            scenario,
            state,
            assignment,
            margins,
            usedCapacity,
            usedFunding,
            usedKeeperEconomics,
            usedExternalFunding,
            usedPrimingFunding,
            tradeRng.fork("keeper", assignment.id),
            circuit.instrumentId,
            edge.loadBearingActorIds
          );
          outcomes.push(outcome);
          activity.requiredKeeperActions += 1;
          if (outcome.fulfilled) activity.completedKeeperActions += 1;
          let fulfillmentPlanIndex = -1;
          if (outcome.fulfilled) {
            outcome.plans.forEach((plan, planIndex) => {
              if (plan.acted) fulfillmentPlanIndex = planIndex;
            });
          }
          for (const [planIndex, plan] of outcome.plans.entries()) {
            keeperPlans.push({
              ...plan,
              rootKeeperAssignmentId: assignment.id,
              rootObligationFulfilled: planIndex === fulfillmentPlanIndex,
              rootEconomicsCovered: outcome.economicsCovered,
              circuitId: circuit.id,
              circuitEdgeId: edge.id,
              domainId: circuit.domainId,
              instrumentId: circuit.instrumentId,
            });
          }
        }
        const completed = outcomes.every(outcome => outcome.fulfilled);
        if (!completed) {
          emit("performance", tradeId, {
            type: "trade-resolved",
            tradeId,
            circuitId: circuit.id,
            circuitEdgeId: edge.id,
            circuitAction: edge.action,
            relationshipId: relationship.id,
            domainId: relationship.domainId,
            instrumentId: circuit.instrumentId,
            fromActorId: relationship.fromActorId,
            toActorId: relationship.toActorId,
            outcome: "keeper-failed",
            realisedSurplus: [],
          });
          circuitCompleted = false;
          break;
        }

        const realisedSurplus =
          edge.action === "renew" ? realisedCircuitSurplus(scenario, state, circuit) : [];
        if (edge.action === "post") {
          activity.completedTrades += 1;
          activity.completedActorIds.push(relationship.fromActorId, relationship.toActorId);
        }
        if (edge.action === "renew") {
          activity.realisedAccessibleSurplus = checkedAdd(
            activity.realisedAccessibleSurplus,
            checkedSum(realisedSurplus.map(entry => entry.amount))
          );
        }
        emit("performance", tradeId, {
          type: "trade-resolved",
          tradeId,
          circuitId: circuit.id,
          circuitEdgeId: edge.id,
          circuitAction: edge.action,
          relationshipId: relationship.id,
          domainId: relationship.domainId,
          instrumentId: circuit.instrumentId,
          fromActorId: relationship.fromActorId,
          toActorId: relationship.toActorId,
          outcome: "completed",
          realisedSurplus,
        });
      }
      if (circuitAttempted && circuitCompleted) {
        activity.completedCircuitCycles += 1;
        circuitResults[circuit.id].completedCycles += 1;
      }
    }

    for (const mechanism of [...scenario.primingMechanisms].sort((a, b) =>
      compareCodeUnits(a.id, b.id)
    )) {
      const baseCost = primingSpendForTick(mechanism, state);
      const spend = usedPrimingFunding.get(mechanism.id) ?? 0;
      if (spend <= 0) continue;
      emit("institutional", mechanism.id, {
        type: "priming-spend-set",
        primingMechanismId: mechanism.id,
        spent: checkedAdd(state.priming[mechanism.id]?.spent ?? 0, spend),
        baseCost,
        keeperCarryCost: spend - baseCost,
        payerDebits: allocatePrimingSpend(mechanism.payerIds, spend),
      });
    }

    for (const [index, plan] of keeperPlans.entries()) {
      emit("keepers", `${plan.assignment.id}:${index}`, {
        type: "keeper-action-recorded",
        keeperAssignmentId: plan.assignment.id,
        rootKeeperAssignmentId: plan.rootKeeperAssignmentId,
        circuitId: plan.circuitId,
        circuitEdgeId: plan.circuitEdgeId,
        domainId: plan.domainId,
        instrumentId: plan.instrumentId,
        actorId: plan.actorId,
        outcome: plan.acted ? "acted" : "skipped",
        rootObligationFulfilled: plan.rootObligationFulfilled,
        rootEconomicsCovered: plan.rootEconomicsCovered,
        fundingSource: plan.fundingSource,
        primingMechanismId: plan.primingMechanismId,
        funderId: plan.funderId,
        rewardPaid: plan.rewardPaid,
        externalPayerIds:
          plan.fundingSource === "external" ? [...plan.assignment.externalPayerIds] : [],
        reason: plan.reason,
      });
    }

    for (const [key, activity] of Object.entries(activityByKey).sort(([a], [b]) =>
      compareCodeUnits(a, b)
    )) {
      const runtime = state.domainInstruments[key];
      if (runtime === undefined) continue;
      const keeperCoveragePpm =
        activity.requiredKeeperActions === 0
          ? 0
          : mulDiv(
              activity.completedKeeperActions,
              PPM,
              activity.requiredKeeperActions,
              "keeper coverage"
            );
      emit("learning", key, {
        type: "domain-window-recorded",
        domainId: runtime.domainId,
        instrumentId: runtime.instrumentId,
        attemptedTrades: activity.attemptedTrades,
        attemptedCircuitCycles: activity.attemptedCircuitCycles,
        completedTrades: activity.completedTrades,
        completedCircuitCycles: activity.completedCircuitCycles,
        keeperCoveragePpm,
        circuitResults: Object.values(circuitResults)
          .filter(result => {
            const circuit = scenario.circuits.find(item => item.id === result.circuitId);
            return (
              circuit?.domainId === runtime.domainId &&
              circuit.instrumentId === runtime.instrumentId
            );
          })
          .sort((left, right) => compareCodeUnits(left.circuitId, right.circuitId)),
      });
    }

    const postActivityMargins = evaluateAllContinuationAssumptions(scenario, state);
    for (const key of Object.keys(state.domainInstruments).sort()) {
      let runtime = state.domainInstruments[key];
      if (runtime === undefined) continue;
      const transitionKeeperIds = [
        ...new Set(
          scenario.circuits
            .filter(
              circuit =>
                circuit.domainId === runtime.domainId &&
                circuit.instrumentId === runtime.instrumentId
            )
            .flatMap(circuit => circuit.edges.flatMap(edge => edge.keeperAssignmentIds))
        ),
      ].sort();
      for (const circuit of scenario.circuits
        .filter(
          item => item.domainId === runtime.domainId && item.instrumentId === runtime.instrumentId
        )
        .sort((left, right) => compareCodeUnits(left.id, right.id))) {
        const credible = declaredCircuitIsCredible(scenario, state, circuit);
        if (credible === state.circuits[circuit.id]?.credible) continue;
        const circuitKeeperIds = [
          ...new Set(circuit.edges.flatMap(edge => edge.keeperAssignmentIds)),
        ].sort();
        emit("lifecycle", `${key}:circuit`, {
          type: "circuit-credibility-set",
          circuitId: circuit.id,
          domainId: runtime.domainId,
          instrumentId: runtime.instrumentId,
          credible,
          reason: "declared window, failure and connected-actor criteria",
          invokerId: scenario.modelVersion,
          keeperAssignmentIds: circuitKeeperIds,
          evidenceRefs: [`window:${tick}:${circuit.id}`],
        });
      }
      runtime = state.domainInstruments[key];
      if (runtime === undefined) continue;
      const anyPrimingActive =
        activePrimingMechanisms(scenario, state, runtime.domainId, runtime.instrumentId).length > 0;
      const newPrimingAttempt = activePrimingMechanisms(
        scenario,
        state,
        runtime.domainId,
        runtime.instrumentId
      ).some(mechanism => mechanism.startsAtTick === tick);
      const decision = decideLifecycle(
        scenario,
        state,
        runtime,
        postActivityMargins,
        anyPrimingActive,
        newPrimingAttempt
      );
      if (decision.next !== decision.prior) {
        emit("lifecycle", `${key}:state`, {
          type: "lifecycle-transitioned",
          domainId: runtime.domainId,
          instrumentId: runtime.instrumentId,
          from: decision.prior,
          to: decision.next,
          reason: decision.reason,
          authority: "engine-derived",
          invokerId: scenario.modelVersion,
          keeperAssignmentIds: transitionKeeperIds,
          evidenceRefs: [`window:${tick}:${key}`],
          findingRefs: [],
        });
      }
    }

    const tickDomains = Object.keys(state.domainInstruments)
      .sort()
      .map(key => {
        const runtime = state.domainInstruments[key];
        if (runtime === undefined) throw new Error(`missing runtime '${key}'`);
        return buildDomainMetrics(
          scenario,
          state,
          runtime,
          activityByKey[key] ?? emptyTickActivity(),
          postActivityMargins
        );
      });
    metrics.push({ tick, domains: tickDomains });
  }

  const replayed = replayScenario(scenario, events);
  if (canonicalJson(replayed) !== canonicalJson(state)) {
    throw new Error("event replay diverged from the live deterministic run");
  }
  const finalMargins = evaluateAllContinuationAssumptions(scenario, state);
  const survivedAfterPriming = Object.fromEntries(
    Object.values(state.domainInstruments).map(runtime => {
      const hasPriming = scenario.primingMechanisms.some(
        mechanism =>
          mechanism.domainId === runtime.domainId && mechanism.instrumentId === runtime.instrumentId
      );
      const survived =
        !hasPriming || runtime.wedgeRemovedAtTick === null
          ? null
          : runtime.lifecycle !== "collapsed" &&
            runtime.lifecycle !== "declining" &&
            runtime.recentCompletedTrades.slice(-2).some(value => value > 0);
      return [runtime.key, survived];
    })
  );
  const manifest = {
    scenarioId: scenario.id,
    scenarioHash: canonicalHash(scenario),
    assumptionHash: canonicalHash({
      bondedAssumptions: scenario.bondedAssumptions,
      continuationAssumptions: scenario.continuationAssumptions,
      continuationOpportunities: scenario.continuationOpportunities,
    }),
    seed,
    schemaVersion: scenario.schemaVersion,
    modelVersion: scenario.modelVersion,
    scheduleVersion: scenario.scheduleVersion,
    rngVersion: scenario.rngVersion,
    ...(options.repositoryCommit === undefined
      ? {}
      : { repositoryCommit: options.repositoryCommit }),
  };
  const nominalWeakestKeeperMargin = weakestKeeperMargin(scenario, state, finalMargins);
  const observedKeeperEconomicsCovered = postRemovalKeeperEconomicsCovered(events, state);
  const summary: RunSummary = {
    manifest,
    terminalStateHash: canonicalHash(state),
    eventLogHash: canonicalHash(events),
    ticksCompleted: ticks,
    lifecycleByDomainInstrument: Object.fromEntries(
      Object.values(state.domainInstruments).map(runtime => [runtime.key, runtime.lifecycle])
    ),
    survivedAfterPriming,
    weakestKeeperMargin:
      observedKeeperEconomicsCovered || nominalWeakestKeeperMargin?.holds === false
        ? nominalWeakestKeeperMargin
        : null,
    metrics,
  };

  return { scenario, seed, state, events, finalMargins, summary };
}
