import {
  PPM,
  domainInstrumentKey,
  type ActorAcceptanceState,
  type ActorId,
  type DomainId,
  type InstrumentAcceptanceSpec,
  type InstrumentId,
  type PolicySpec,
  type ScenarioSpec,
  type SimulationState,
} from "./types.js";
import { checkedAdd, checkedSum, clampPpm, mulDiv } from "./math.js";
import { primingBoostForActor, switchingCostOffsetForActor } from "./priming.js";

export interface AcceptanceSignals {
  actorId: ActorId;
  domainId: DomainId;
  instrumentId: InstrumentId;
  socialAcceptancePpm: number;
  realisedServicePpm: number;
  primingBoostPpm: number;
  switchingCostOffset: number;
  incumbentDefenceCost: number;
}

export interface AcceptanceDecision {
  signals: AcceptanceSignals;
  scorePpm: number;
  effectiveAdoptionThresholdPpm: number;
  effectiveAbandonmentThresholdPpm: number;
  next: ActorAcceptanceState;
}

function actorAcceptance(
  state: SimulationState,
  actorId: ActorId,
  domainId: DomainId,
  instrumentId: InstrumentId
): ActorAcceptanceState | undefined {
  return state.actors[actorId]?.acceptance[domainInstrumentKey(domainId, instrumentId)];
}

export function socialAcceptanceSignal(
  scenario: ScenarioSpec,
  state: SimulationState,
  actorId: ActorId,
  domainId: DomainId,
  instrumentId: InstrumentId
): number {
  const neighbours = new Set<ActorId>();
  for (const relationship of scenario.relationships) {
    if (
      state.relationships[relationship.id]?.active !== true ||
      relationship.domainId !== domainId ||
      !relationship.instrumentIds.includes(instrumentId)
    ) {
      continue;
    }
    if (relationship.fromActorId === actorId) neighbours.add(relationship.toActorId);
    if (relationship.toActorId === actorId) neighbours.add(relationship.fromActorId);
  }
  const activeNeighbours = [...neighbours].filter(
    neighbourId => state.actors[neighbourId]?.active === true
  );
  if (activeNeighbours.length === 0) return 0;
  const accepting = activeNeighbours.filter(
    neighbourId => actorAcceptance(state, neighbourId, domainId, instrumentId)?.accepts
  ).length;
  return mulDiv(accepting, PPM, activeNeighbours.length, "social acceptance signal");
}

function effectiveThreshold(
  thresholdPpm: number,
  cost: number,
  installedComplement: number
): number {
  if (cost <= 0) return thresholdPpm;
  const headroom = PPM - thresholdPpm;
  const costShare = mulDiv(
    cost,
    PPM,
    checkedSum([cost, installedComplement, 1], "threshold cost denominator"),
    "cost share"
  );
  return clampPpm(
    checkedAdd(thresholdPpm, mulDiv(headroom, costShare, PPM), "effective threshold")
  );
}

function incumbentDefenceCost(
  scenario: ScenarioSpec,
  state: SimulationState,
  actorId: ActorId,
  acceptanceSpec: InstrumentAcceptanceSpec
): number {
  const domain = scenario.domains.find(item => item.id === acceptanceSpec.domainId);
  if (domain === undefined) return 0;
  const installedStates = new Set(["installed-supported", "installed-self-maintaining", "fragile"]);
  const competingPairs = new Set<string>();
  for (const instrumentId of domain.incumbentInstrumentIds) {
    if (instrumentId !== acceptanceSpec.instrumentId) {
      competingPairs.add(domainInstrumentKey(domain.id, instrumentId));
    }
  }
  for (const competingDomainId of domain.competingDomainIds) {
    const competingDomain = scenario.domains.find(item => item.id === competingDomainId);
    if (competingDomain === undefined) continue;
    for (const instrumentId of competingDomain.instrumentIds) {
      competingPairs.add(domainInstrumentKey(competingDomain.id, instrumentId));
    }
  }
  return [...competingPairs].reduce((cost, key) => {
    const position = state.actors[actorId]?.acceptance[key];
    const runtime = state.domainInstruments[key];
    return position?.accepts === true &&
      runtime !== undefined &&
      installedStates.has(runtime.lifecycle)
      ? checkedAdd(cost, position.installedComplement, "incumbent defence cost")
      : cost;
  }, 0);
}

function updateBelief(priorPpm: number, observedPpm: number, learningRatePpm: number): number {
  return clampPpm(
    checkedAdd(priorPpm, mulDiv(observedPpm - priorPpm, learningRatePpm, PPM), "updated belief")
  );
}

function thresholdLearningScore(
  policy: Extract<PolicySpec, { kind: "threshold-learning" }>,
  socialPpm: number,
  servicePpm: number,
  primingPpm: number
): number {
  return clampPpm(
    checkedSum(
      [
        mulDiv(socialPpm, policy.socialWeightPpm, PPM),
        mulDiv(servicePpm, policy.serviceWeightPpm, PPM),
        mulDiv(primingPpm, policy.primingWeightPpm, PPM),
      ],
      "threshold-learning score"
    )
  );
}

function legacyScore(
  policy: Extract<PolicySpec, { kind: "legacy-kw-threshold" }>,
  priorBeliefPpm: number,
  socialPpm: number,
  servicePpm: number,
  primingPpm: number
): number {
  const positiveSignal = Math.max(socialPpm, servicePpm, primingPpm) > 0;
  return clampPpm(
    checkedAdd(
      priorBeliefPpm,
      positiveSignal ? policy.adoptIncrement : -policy.decayIncrement,
      "legacy score"
    )
  );
}

export function decideAcceptance(
  scenario: ScenarioSpec,
  state: SimulationState,
  actorId: ActorId,
  acceptanceSpec: InstrumentAcceptanceSpec,
  policy: PolicySpec,
  realisedServicePpm: number
): AcceptanceDecision {
  const current = actorAcceptance(
    state,
    actorId,
    acceptanceSpec.domainId,
    acceptanceSpec.instrumentId
  );
  if (current === undefined) {
    throw new Error(
      `missing acceptance state for ${actorId}/${acceptanceSpec.domainId}/${acceptanceSpec.instrumentId}`
    );
  }
  const socialAcceptancePpm = socialAcceptanceSignal(
    scenario,
    state,
    actorId,
    acceptanceSpec.domainId,
    acceptanceSpec.instrumentId
  );
  const primingBoostPpm = primingBoostForActor(
    scenario,
    state,
    actorId,
    acceptanceSpec.domainId,
    acceptanceSpec.instrumentId
  );
  const switchingCostOffset = switchingCostOffsetForActor(
    scenario,
    state,
    actorId,
    acceptanceSpec.domainId,
    acceptanceSpec.instrumentId
  );
  const installedDefenceCost = incumbentDefenceCost(scenario, state, actorId, acceptanceSpec);
  const reacceptanceBeliefPpm = updateBelief(
    current.reacceptanceBeliefPpm,
    Math.max(socialAcceptancePpm, realisedServicePpm),
    scenario.actors.find(actor => actor.id === actorId)?.learningRatePpm ?? 0
  );
  const scorePpm =
    policy.kind === "threshold-learning"
      ? thresholdLearningScore(policy, socialAcceptancePpm, reacceptanceBeliefPpm, primingBoostPpm)
      : legacyScore(
          policy,
          reacceptanceBeliefPpm,
          socialAcceptancePpm,
          realisedServicePpm,
          primingBoostPpm
        );
  const remainingSwitchingCost = Math.max(
    0,
    checkedSum(
      [acceptanceSpec.switchingCost, installedDefenceCost, -switchingCostOffset],
      "remaining switching cost"
    )
  );
  const effectiveAdoptionThresholdPpm = effectiveThreshold(
    acceptanceSpec.adoptionThresholdPpm,
    remainingSwitchingCost,
    current.installedComplement
  );
  const effectiveAbandonmentThresholdPpm = effectiveThreshold(
    acceptanceSpec.abandonmentThresholdPpm,
    acceptanceSpec.holdingCostPerTick,
    current.installedComplement
  );

  let accepts = current.accepts;
  let adoptionCounter = current.adoptionCounter;
  let abandonmentCounter = current.abandonmentCounter;
  if (accepts) {
    adoptionCounter = 0;
    abandonmentCounter =
      scorePpm < effectiveAbandonmentThresholdPpm
        ? checkedAdd(abandonmentCounter, 1, "abandonment counter")
        : 0;
    if (abandonmentCounter >= acceptanceSpec.abandonmentWindowTicks) {
      accepts = false;
      abandonmentCounter = 0;
    }
  } else {
    abandonmentCounter = 0;
    adoptionCounter =
      scorePpm >= effectiveAdoptionThresholdPpm
        ? checkedAdd(adoptionCounter, 1, "adoption counter")
        : 0;
    if (adoptionCounter >= acceptanceSpec.adoptionWindowTicks) {
      accepts = true;
      adoptionCounter = 0;
    }
  }

  return {
    signals: {
      actorId,
      domainId: acceptanceSpec.domainId,
      instrumentId: acceptanceSpec.instrumentId,
      socialAcceptancePpm,
      realisedServicePpm,
      primingBoostPpm,
      switchingCostOffset,
      incumbentDefenceCost: installedDefenceCost,
    },
    scorePpm,
    effectiveAdoptionThresholdPpm,
    effectiveAbandonmentThresholdPpm,
    next: {
      accepts,
      reacceptanceBeliefPpm,
      adoptionCounter,
      abandonmentCounter,
      installedComplement:
        !current.accepts && accepts
          ? acceptanceSpec.installedComplement
          : current.installedComplement,
    },
  };
}
