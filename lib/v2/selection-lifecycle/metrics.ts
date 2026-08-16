import {
  PPM,
  domainInstrumentKey,
  type ActorId,
  type DomainInstrumentMetrics,
  type DomainInstrumentState,
  type IncentiveMargin,
  type MinimumCredibleCircuitSpec,
  type ScenarioSpec,
  type SimulationState,
} from "./types.js";
import { checkedSum, mulDiv } from "./math.js";

export interface TickActivity {
  attemptedTrades: number;
  attemptedCircuitCycles: number;
  completedTrades: number;
  completedCircuitCycles: number;
  refusedTrades: number;
  completedActorIds: ActorId[];
  requiredKeeperActions: number;
  completedKeeperActions: number;
  realisedAccessibleSurplus: number;
}

export function emptyTickActivity(): TickActivity {
  return {
    attemptedTrades: 0,
    attemptedCircuitCycles: 0,
    completedTrades: 0,
    completedCircuitCycles: 0,
    refusedTrades: 0,
    completedActorIds: [],
    requiredKeeperActions: 0,
    completedKeeperActions: 0,
    realisedAccessibleSurplus: 0,
  };
}

function activeAcceptors(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: string,
  instrumentId: string
): ActorId[] {
  const domain = scenario.domains.find(item => item.id === domainId);
  if (domain === undefined) return [];
  const key = domainInstrumentKey(domainId, instrumentId);
  return domain.population.filter(
    actorId =>
      state.actors[actorId]?.active === true &&
      state.actors[actorId]?.acceptance[key]?.accepts === true
  );
}

export function largestAcceptingConnectedComponent(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: string,
  instrumentId: string
): number {
  const acceptors = new Set(activeAcceptors(scenario, state, domainId, instrumentId));
  const adjacency = new Map<ActorId, Set<ActorId>>();
  for (const actorId of acceptors) adjacency.set(actorId, new Set());
  for (const relationship of scenario.relationships) {
    if (
      relationship.domainId !== domainId ||
      !relationship.instrumentIds.includes(instrumentId) ||
      state.relationships[relationship.id]?.active !== true ||
      !acceptors.has(relationship.fromActorId) ||
      !acceptors.has(relationship.toActorId)
    ) {
      continue;
    }
    adjacency.get(relationship.fromActorId)?.add(relationship.toActorId);
    adjacency.get(relationship.toActorId)?.add(relationship.fromActorId);
  }

  let largest = 0;
  const visited = new Set<ActorId>();
  for (const start of acceptors) {
    if (visited.has(start)) continue;
    let size = 0;
    const pending = [start];
    visited.add(start);
    while (pending.length > 0) {
      const actorId = pending.pop();
      if (actorId === undefined) break;
      size += 1;
      for (const neighbour of adjacency.get(actorId) ?? []) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          pending.push(neighbour);
        }
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}

export function acceptancePpm(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: string,
  instrumentId: string
): number {
  const domain = scenario.domains.find(item => item.id === domainId);
  if (domain === undefined) return 0;
  const activePopulation = domain.population.filter(
    actorId => state.actors[actorId]?.active === true
  );
  if (activePopulation.length === 0) return 0;
  return mulDiv(
    activeAcceptors(scenario, state, domainId, instrumentId).length,
    PPM,
    activePopulation.length,
    "acceptance PPM"
  );
}

export function appendBounded(
  entries: readonly number[],
  value: number,
  maxEntries: number
): number[] {
  return [...entries, value].slice(-Math.max(1, maxEntries));
}

function maximumWindow(scenario: ScenarioSpec, domainId: string, instrumentId: string): number {
  const domain = scenario.domains.find(item => item.id === domainId);
  const circuitWindows = scenario.circuits
    .filter(circuit => circuit.domainId === domainId && circuit.instrumentId === instrumentId)
    .map(circuit => circuit.windowTicks);
  return Math.max(
    domain?.installation.windowTicks ?? 1,
    domain?.maintenance.windowTicks ?? 1,
    ...circuitWindows,
    1
  );
}

export function appendActivityHistory(
  scenario: ScenarioSpec,
  runtime: DomainInstrumentState,
  activity: TickActivity
): DomainInstrumentState {
  const maxWindow = maximumWindow(scenario, runtime.domainId, runtime.instrumentId) * 2;
  const keeperCoveragePpm =
    activity.requiredKeeperActions === 0
      ? 0
      : mulDiv(
          activity.completedKeeperActions,
          PPM,
          activity.requiredKeeperActions,
          "keeper coverage"
        );
  return {
    ...runtime,
    recentAttemptedTrades: appendBounded(
      runtime.recentAttemptedTrades,
      activity.attemptedTrades,
      maxWindow
    ),
    recentAttemptedCircuitCycles: appendBounded(
      runtime.recentAttemptedCircuitCycles,
      activity.attemptedCircuitCycles,
      maxWindow
    ),
    recentCompletedTrades: appendBounded(
      runtime.recentCompletedTrades,
      activity.completedTrades,
      maxWindow
    ),
    recentCircuitCycles: appendBounded(
      runtime.recentCircuitCycles,
      activity.completedCircuitCycles,
      maxWindow
    ),
    recentKeeperCoveragePpm: appendBounded(
      runtime.recentKeeperCoveragePpm,
      keeperCoveragePpm,
      maxWindow
    ),
  };
}

function sumWindow(entries: readonly number[], windowTicks: number): number {
  return checkedSum(entries.slice(-windowTicks), "window total");
}

function meanWindow(entries: readonly number[], windowTicks: number): number {
  const window = entries.slice(-windowTicks);
  return window.length === 0 ? 0 : Math.floor(checkedSum(window) / window.length);
}

export function circuitIsCredible(
  scenario: ScenarioSpec,
  state: SimulationState,
  runtime: DomainInstrumentState
): boolean {
  const circuits = scenario.circuits.filter(
    circuit =>
      circuit.domainId === runtime.domainId && circuit.instrumentId === runtime.instrumentId
  );
  return circuits.some(circuit => declaredCircuitIsCredible(scenario, state, circuit));
}

export function declaredCircuitIsCredible(
  scenario: ScenarioSpec,
  state: SimulationState,
  circuit: MinimumCredibleCircuitSpec
): boolean {
  const runtime = state.circuits[circuit.id];
  if (runtime === undefined) return false;
  const attempted = sumWindow(runtime.recentAttemptedCycles, circuit.windowTicks);
  const completed = sumWindow(runtime.recentCompletedCycles, circuit.windowTicks);
  if (attempted === 0 || completed < circuit.minCompletedCycles) return false;
  const failures = Math.max(0, attempted - completed);
  const failurePpm = mulDiv(failures, PPM, attempted, "circuit failure PPM");
  const key = domainInstrumentKey(circuit.domainId, circuit.instrumentId);
  const participatingAcceptors = new Set(
    circuit.edges
      .flatMap(edge => edge.loadBearingActorIds)
      .filter(
        actorId =>
          state.actors[actorId]?.active === true &&
          state.actors[actorId]?.acceptance[key]?.accepts === true
      )
  ).size;
  return failurePpm <= circuit.maxFailurePpm && participatingAcceptors >= circuit.minDistinctActors;
}

export function installationCriterionMet(
  scenario: ScenarioSpec,
  state: SimulationState,
  runtime: DomainInstrumentState
): boolean {
  const domain = scenario.domains.find(item => item.id === runtime.domainId);
  if (domain === undefined) return false;
  return (
    circuitIsCredible(scenario, state, runtime) &&
    acceptancePpm(scenario, state, runtime.domainId, runtime.instrumentId) >=
      domain.installation.minAcceptancePpm &&
    sumWindow(runtime.recentCompletedTrades, domain.installation.windowTicks) >=
      domain.installation.minActualUsesPerWindow &&
    sumWindow(runtime.recentCircuitCycles, domain.installation.windowTicks) >=
      domain.installation.minActualUsesPerWindow &&
    largestAcceptingConnectedComponent(scenario, state, runtime.domainId, runtime.instrumentId) >=
      domain.installation.minConnectedAcceptors
  );
}

export function maintenanceCriterionMet(
  scenario: ScenarioSpec,
  state: SimulationState,
  runtime: DomainInstrumentState
): boolean {
  const domain = scenario.domains.find(item => item.id === runtime.domainId);
  if (domain === undefined) return false;
  return (
    circuitIsCredible(scenario, state, runtime) &&
    sumWindow(runtime.recentCompletedTrades, domain.maintenance.windowTicks) >=
      domain.maintenance.minActualUsesPerWindow &&
    sumWindow(runtime.recentCircuitCycles, domain.maintenance.windowTicks) >= 1 &&
    meanWindow(runtime.recentKeeperCoveragePpm, domain.maintenance.windowTicks) >=
      domain.maintenance.minKeeperCoveragePpm
  );
}

export function buildDomainMetrics(
  scenario: ScenarioSpec,
  state: SimulationState,
  runtime: DomainInstrumentState,
  activity: TickActivity,
  margins: readonly IncentiveMargin[]
): DomainInstrumentMetrics {
  const relevantMargins = margins.filter(
    margin => margin.domainId === runtime.domainId && margin.instrumentId === runtime.instrumentId
  );
  const weakestMargin = relevantMargins.reduce<number | null>(
    (weakest, margin) => (weakest === null || margin.margin < weakest ? margin.margin : weakest),
    null
  );
  const keeperCoveragePpm =
    activity.requiredKeeperActions === 0
      ? 0
      : mulDiv(
          activity.completedKeeperActions,
          PPM,
          activity.requiredKeeperActions,
          "keeper coverage"
        );
  const primingSpent = checkedSum(
    scenario.primingMechanisms
      .filter(
        mechanism =>
          mechanism.domainId === runtime.domainId && mechanism.instrumentId === runtime.instrumentId
      )
      .map(mechanism => state.priming[mechanism.id]?.spent ?? 0),
    "priming spent"
  );
  return {
    domainId: runtime.domainId,
    instrumentId: runtime.instrumentId,
    lifecycle: runtime.lifecycle,
    acceptancePpm: acceptancePpm(scenario, state, runtime.domainId, runtime.instrumentId),
    acceptingConnectedComponent: largestAcceptingConnectedComponent(
      scenario,
      state,
      runtime.domainId,
      runtime.instrumentId
    ),
    attemptedTrades: activity.attemptedTrades,
    completedTrades: activity.completedTrades,
    refusedTrades: activity.refusedTrades,
    primingSpent,
    keeperCoveragePpm,
    realisedAccessibleSurplus: activity.realisedAccessibleSurplus,
    weakestIncentiveMargin: weakestMargin,
  };
}
