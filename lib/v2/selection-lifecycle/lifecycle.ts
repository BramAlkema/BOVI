import {
  type DomainInstrumentState,
  type IncentiveMargin,
  type ScenarioSpec,
  type SelectionLifecycleState,
  type SimulationState,
} from "./types.js";
import {
  allLoadBearingContinuationAssumptionsHold,
  allLoadBearingKeepersViable,
} from "./continuation.js";
import { circuitIsCredible, installationCriterionMet, maintenanceCriterionMet } from "./metrics.js";
import { hasExternalSupport, removalTestTicks } from "./priming.js";

const TERMINAL = new Set<SelectionLifecycleState>(["exited", "collapsed", "superseded"]);

export interface LifecycleDecision {
  prior: SelectionLifecycleState;
  next: SelectionLifecycleState;
  reason: string;
  credibleCircuit: boolean;
  externalSupport: boolean;
  continuationCovered: boolean;
  maintenanceMet: boolean;
}

function hasRecentUse(runtime: DomainInstrumentState, windowTicks: number): boolean {
  return runtime.recentCompletedTrades.slice(-windowTicks).some(value => value > 0);
}

export function currentKeeperEconomicsCovered(
  state: SimulationState,
  runtime: DomainInstrumentState
): boolean {
  const activity = state.tickActivity[runtime.key];
  if (activity === undefined || !activity.windowRecorded) return false;
  return Object.values(activity.keeperEconomicsCoveredByObligation).every(Boolean);
}

export function decideLifecycle(
  scenario: ScenarioSpec,
  state: SimulationState,
  runtime: DomainInstrumentState,
  margins: readonly IncentiveMargin[],
  anyPrimingActive: boolean,
  newPrimingAttempt = false
): LifecycleDecision {
  const prior = runtime.lifecycle;
  const domain = scenario.domains.find(item => item.id === runtime.domainId);
  if (domain === undefined) throw new Error(`unknown domain '${runtime.domainId}'`);

  const credibleCircuit =
    prior === "priming"
      ? scenario.primingMechanisms
          .filter(
            mechanism =>
              mechanism.domainId === runtime.domainId &&
              mechanism.instrumentId === runtime.instrumentId
          )
          .some(mechanism => state.circuits[mechanism.circuitId]?.credible === true)
      : circuitIsCredible(scenario, state, runtime);
  const externalSupport = hasExternalSupport(
    scenario,
    state,
    runtime.domainId,
    runtime.instrumentId
  );
  const continuationCovered =
    allLoadBearingKeepersViable(scenario, state, runtime.domainId, runtime.instrumentId, margins) &&
    allLoadBearingContinuationAssumptionsHold(
      scenario,
      state,
      runtime.domainId,
      runtime.instrumentId,
      margins
    );
  const maintenanceMet = maintenanceCriterionMet(scenario, state, runtime);
  const keeperEconomicsCovered = currentKeeperEconomicsCovered(state, runtime);
  const recentUse = hasRecentUse(runtime, domain.maintenance.windowTicks);
  const evidenceWindowTicks = Math.max(
    domain.maintenance.windowTicks,
    ...scenario.circuits
      .filter(
        circuit =>
          circuit.domainId === runtime.domainId && circuit.instrumentId === runtime.instrumentId
      )
      .map(circuit => circuit.windowTicks)
  );
  const installedEvidenceMature =
    runtime.recentAttemptedCircuitCycles.length >= evidenceWindowTicks;
  const postRemovalEvidenceMature =
    runtime.wedgeRemovedAtTick !== null &&
    state.tick - runtime.wedgeRemovedAtTick + 1 >=
      Math.max(
        evidenceWindowTicks,
        removalTestTicks(scenario, runtime.domainId, runtime.instrumentId)
      );
  const removalElapsed =
    runtime.wedgeRemovedAtTick !== null &&
    state.tick - runtime.wedgeRemovedAtTick + 1 >=
      removalTestTicks(scenario, runtime.domainId, runtime.instrumentId);

  let next = prior;
  let reason = "state retained";
  if (TERMINAL.has(prior)) {
    reason = "terminal state";
  } else {
    switch (prior) {
      case "candidate":
        if (anyPrimingActive) {
          next = "priming";
          reason = "declared priming wedge became active";
        }
        break;
      case "priming":
        if (credibleCircuit) {
          next = "propagating";
          reason = "minimum credible circulation circuit observed";
        } else if (!anyPrimingActive && !recentUse) {
          next = "collapsed";
          reason = "priming ended without a credible circuit";
        }
        break;
      case "propagating":
        if (installationCriterionMet(scenario, state, runtime)) {
          next = "installed-supported";
          reason = "installation criterion met; removal test remains";
        } else if (!credibleCircuit && !recentUse) {
          next = "declining";
          reason = "propagation lost its credible circuit";
        }
        break;
      case "installed-supported":
        if (!keeperEconomicsCovered) {
          next = "fragile";
          reason = "no required keeper path retained positive cumulative economics this tick";
        } else if (installedEvidenceMature && (!credibleCircuit || !maintenanceMet)) {
          next = "fragile";
          reason = credibleCircuit
            ? "maintenance criterion failed"
            : "the installed circuit lost credibility";
        } else if (
          !externalSupport &&
          postRemovalEvidenceMature &&
          maintenanceMet &&
          continuationCovered
        ) {
          next = "installed-self-maintaining";
          reason = "post-removal operating window and load-bearing continuation tests passed";
        } else if (!externalSupport && removalElapsed && !continuationCovered) {
          next = "fragile";
          reason = "a load-bearing actor/action lacks a viable continuation margin";
        }
        break;
      case "installed-self-maintaining":
        if (!keeperEconomicsCovered) {
          next = "fragile";
          reason = "no required keeper path retained positive cumulative economics this tick";
        } else if (externalSupport) {
          next = "installed-supported";
          reason = "external support returned";
        } else if (
          installedEvidenceMature &&
          (!credibleCircuit || !maintenanceMet || !continuationCovered)
        ) {
          next = "fragile";
          reason = !credibleCircuit
            ? "the self-maintaining circuit lost credibility"
            : !continuationCovered
              ? "a load-bearing continuation margin failed"
              : "maintenance criterion failed";
        }
        break;
      case "fragile":
        if (
          externalSupport &&
          keeperEconomicsCovered &&
          installationCriterionMet(scenario, state, runtime)
        ) {
          next = "installed-supported";
          reason = "external support restored";
        } else if (
          !externalSupport &&
          postRemovalEvidenceMature &&
          keeperEconomicsCovered &&
          maintenanceMet &&
          continuationCovered
        ) {
          next = "installed-self-maintaining";
          reason = "post-removal operation and actor-specific continuation recovered";
        } else if (!recentUse) {
          next = "declining";
          reason = "fragile circulation fell below its use floor";
        }
        break;
      case "declining": {
        if (newPrimingAttempt) {
          next = "priming";
          reason = "a new declared priming attempt began";
          break;
        }
        const collapseWindow = domain.maintenance.windowTicks * 2;
        if (!hasRecentUse(runtime, collapseWindow) && runtime.acceptingActors.length === 0) {
          next = "collapsed";
          reason = "reverse cascade exhausted use and acceptance";
        }
        break;
      }
      case "repairing":
        reason = "repair requires an explicit finding event";
        break;
      case "exited":
      case "collapsed":
      case "superseded":
        break;
    }
  }

  return {
    prior,
    next,
    reason,
    credibleCircuit,
    externalSupport,
    continuationCovered,
    maintenanceMet,
  };
}
