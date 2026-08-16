import {
  type ActorId,
  type DomainId,
  type InstrumentId,
  type KeeperAssignmentId,
  type PrimingMechanismSpec,
  type ScenarioSpec,
  type SelectionLifecycleState,
  type SimulationState,
} from "./types.js";
import { checkedSum, clampPpm } from "./math.js";
import type { KeeperAssignmentSpec } from "./types.js";

const INSTALLED_STATES = new Set<SelectionLifecycleState>([
  "installed-supported",
  "installed-self-maintaining",
]);

function hasPersistentPositiveEntries(entries: readonly number[], requiredTicks: number): boolean {
  return (
    entries.length >= requiredTicks &&
    entries.slice(entries.length - requiredTicks).every(value => value > 0)
  );
}

export function primingStopConditionMet(
  mechanism: PrimingMechanismSpec,
  state: SimulationState
): boolean {
  const runtime = state.priming[mechanism.id];
  if (runtime === undefined) return true;
  const domainInstrument =
    state.domainInstruments[`${mechanism.domainId}::${mechanism.instrumentId}`];
  const circuit = state.circuits[mechanism.circuitId];

  switch (mechanism.stopCondition.kind) {
    case "tick":
      return state.tick >= mechanism.stopCondition.tick;
    case "budget-exhausted":
      return runtime.spent >= mechanism.totalBudget;
    case "credible-circuit":
      return (
        circuit !== undefined &&
        circuit.credible &&
        hasPersistentPositiveEntries(
          circuit.recentCompletedCycles,
          mechanism.stopCondition.persistenceTicks
        )
      );
    case "installed":
      return (
        domainInstrument !== undefined &&
        INSTALLED_STATES.has(domainInstrument.lifecycle) &&
        state.tick - domainInstrument.stateEnteredTick + 1 >=
          mechanism.stopCondition.persistenceTicks
      );
  }
}

export function shouldActivatePriming(
  mechanism: PrimingMechanismSpec,
  state: SimulationState
): boolean {
  const runtime = state.priming[mechanism.id];
  return (
    runtime !== undefined &&
    runtime.stoppedAtTick === null &&
    state.tick >= mechanism.startsAtTick &&
    runtime.spent < mechanism.totalBudget &&
    !primingStopConditionMet(mechanism, state)
  );
}

export function primingSpendForTick(
  mechanism: PrimingMechanismSpec,
  state: SimulationState
): number {
  if (!shouldActivatePriming(mechanism, state)) return 0;
  const spent = state.priming[mechanism.id]?.spent ?? 0;
  return Math.min(mechanism.costPerTick, mechanism.totalBudget - spent);
}

export function allocatePrimingSpend(
  payerIds: readonly string[],
  amount: number
): { payerId: string; amount: number }[] {
  if (payerIds.length === 0) {
    throw new RangeError("priming spend requires a named payer");
  }
  const ordered = [...payerIds].sort();
  const quotient = Math.floor(amount / ordered.length);
  const remainder = amount % ordered.length;
  return ordered.map((payerId, index) => ({
    payerId,
    amount: quotient + (index < remainder ? 1 : 0),
  }));
}

export function activePrimingMechanisms(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId?: DomainId,
  instrumentId?: InstrumentId
): PrimingMechanismSpec[] {
  return scenario.primingMechanisms.filter(
    mechanism =>
      (domainId === undefined || mechanism.domainId === domainId) &&
      (instrumentId === undefined || mechanism.instrumentId === instrumentId) &&
      shouldActivatePriming(mechanism, state)
  );
}

export function primingBoostForActor(
  scenario: ScenarioSpec,
  state: SimulationState,
  actorId: ActorId,
  domainId: DomainId,
  instrumentId: InstrumentId
): number {
  return clampPpm(
    checkedSum(
      activePrimingMechanisms(scenario, state, domainId, instrumentId)
        .filter(mechanism => mechanism.targetActorIds.includes(actorId))
        .map(mechanism => mechanism.acceptanceBoostPpm),
      `priming boost for ${actorId}`
    )
  );
}

export function switchingCostOffsetForActor(
  scenario: ScenarioSpec,
  state: SimulationState,
  actorId: ActorId,
  domainId: DomainId,
  instrumentId: InstrumentId
): number {
  return checkedSum(
    activePrimingMechanisms(scenario, state, domainId, instrumentId)
      .filter(mechanism => mechanism.targetActorIds.includes(actorId))
      .map(mechanism => mechanism.switchingCostOffset),
    `switching-cost offset for ${actorId}`
  );
}

export function hasExecutableExternalKeeperPath(
  scenario: ScenarioSpec,
  domainId: DomainId,
  instrumentId: InstrumentId,
  keeperEnabled: (assignmentId: KeeperAssignmentId) => boolean,
  actorActive: (actorId: ActorId) => boolean
): boolean {
  const assignmentById = new Map(
    scenario.keeperAssignments.map(assignment => [assignment.id, assignment])
  );
  const executableExternal = (
    assignment: KeeperAssignmentSpec,
    edgeActorIds: readonly ActorId[]
  ): boolean => {
    const edgeActors = new Set(edgeActorIds);
    const availableActors = assignment.actorIds.filter(
      actorId =>
        actorActive(actorId) && (assignment.topology !== "bilateral" || edgeActors.has(actorId))
    );
    return (
      assignment.funding === "external" &&
      keeperEnabled(assignment.id) &&
      assignment.reliabilityPpm > 0 &&
      assignment.capacityPerTick >= assignment.requiredActorsPerAction &&
      availableActors.length >= assignment.requiredActorsPerAction &&
      Math.floor(assignment.externalFundingBudgetPerTick / assignment.requiredActorsPerAction) >=
        assignment.rewardPerAction
    );
  };
  const chainUsesExternal = (
    assignment: KeeperAssignmentSpec,
    edgeActorIds: readonly ActorId[],
    visited = new Set<string>()
  ): boolean => {
    if (visited.has(assignment.id)) return false;
    if (executableExternal(assignment, edgeActorIds)) return true;
    const fallback =
      assignment.fallbackAssignmentId === undefined
        ? undefined
        : assignmentById.get(assignment.fallbackAssignmentId);
    return (
      fallback !== undefined &&
      chainUsesExternal(fallback, edgeActorIds, new Set(visited).add(assignment.id))
    );
  };
  return scenario.circuits
    .filter(circuit => circuit.domainId === domainId && circuit.instrumentId === instrumentId)
    .some(circuit =>
      circuit.edges.some(edge =>
        edge.keeperAssignmentIds.some(assignmentId => {
          const assignment = assignmentById.get(assignmentId);
          return (
            assignment !== undefined && chainUsesExternal(assignment, edge.loadBearingActorIds)
          );
        })
      )
    );
}

export function hasExternalSupport(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: DomainId,
  instrumentId: InstrumentId
): boolean {
  const externalPriming = activePrimingMechanisms(scenario, state, domainId, instrumentId).some(
    mechanism => mechanism.externalInput
  );
  const externalKeeper = hasExecutableExternalKeeperPath(
    scenario,
    domainId,
    instrumentId,
    assignmentId => state.keepers[assignmentId]?.enabled === true,
    actorId => state.actors[actorId]?.active === true
  );
  return externalPriming || externalKeeper;
}

export function removalTestTicks(
  scenario: ScenarioSpec,
  domainId: DomainId,
  instrumentId: InstrumentId
): number {
  const domain = scenario.domains.find(item => item.id === domainId);
  const declared = scenario.primingMechanisms
    .filter(mechanism => mechanism.domainId === domainId && mechanism.instrumentId === instrumentId)
    .map(mechanism => mechanism.removalTestTicks);
  return Math.max(domain?.maintenance.removalTestTicks ?? 1, ...declared, 1);
}
