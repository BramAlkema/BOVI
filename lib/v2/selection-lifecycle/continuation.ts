import {
  PPM,
  compareCodeUnits,
  type ActorId,
  type ContinuationAssumptionSpec,
  type ContinuationOpportunitySpec,
  type IncentiveMargin,
  type InstrumentId,
  type KeeperAssignmentSpec,
  type MinimumCredibleCircuitSpec,
  type OpportunityId,
  type ScenarioSpec,
  type SimulationState,
} from "./types.js";
import {
  applyPpm,
  checkedAdd,
  checkedSum,
  finitePresentValue,
  mulDiv,
  ppmProduct,
} from "./math.js";

function actorAccessibleAmount(opportunity: ContinuationOpportunitySpec, actorId: ActorId): number {
  const actorShares = opportunity.accessibleSurplus.filter(entry => entry.actorId === actorId);
  return checkedSum(
    actorShares.flatMap(entry => entry.components.map(component => component.amount)),
    `accessible surplus for ${actorId}`
  );
}

function opportunityFlow(
  opportunity: ContinuationOpportunitySpec,
  actorId: ActorId,
  state: SimulationState
): number {
  const relationship = state.relationships[opportunity.relationshipId];
  if (relationship === undefined || !relationship.active) return 0;

  const accessibleAmount = actorAccessibleAmount(opportunity, actorId);
  const scaledArrivalPpm = ppmProduct(opportunity.arrivalPpm, relationship.opportunityScalePpm);
  return applyPpm(applyPpm(accessibleAmount, scaledArrivalPpm), opportunity.clearProbabilityPpm);
}

export function lossProbabilityPpm(assumption: ContinuationAssumptionSpec): number {
  if (assumption.lossPath.kind === "direct") {
    return assumption.lossPath.lossProbabilityPpm;
  }
  return ppmProduct(
    ppmProduct(assumption.lossPath.observationPpm, assumption.lossPath.upheldFindingPpm),
    assumption.lossPath.responsePpm
  );
}

/**
 * Evaluate one actor/action claim. This deliberately produces a margin, not an
 * authoritative system-wide surplus or social-credit score.
 */
export function evaluateContinuationAssumption(
  scenario: ScenarioSpec,
  state: SimulationState,
  assumption: ContinuationAssumptionSpec
): IncentiveMargin {
  const opportunityById = new Map(
    scenario.continuationOpportunities.map(opportunity => [opportunity.id, opportunity])
  );
  const accessibleFlow = checkedSum(
    assumption.opportunityIds.map(opportunityId => {
      const opportunity = opportunityById.get(opportunityId);
      if (opportunity === undefined) {
        throw new Error(`unknown continuation opportunity '${opportunityId}'`);
      }
      return opportunityFlow(opportunity, assumption.actorId, state);
    }),
    `accessible flow for ${assumption.id}`
  );
  const presentValueAtRisk = finitePresentValue(
    accessibleFlow,
    assumption.horizonTicks,
    assumption.discountPpm
  );
  const lossProbability = lossProbabilityPpm(assumption);
  const benefitAtRisk = checkedAdd(
    applyPpm(presentValueAtRisk, lossProbability),
    assumption.immediateReward,
    `benefit at risk for ${assumption.id}`
  );
  const totalCost = checkedSum(
    [
      assumption.outsideOptionAdvantage,
      assumption.oneShotDefectionGain,
      assumption.participationCost,
      assumption.keeperEffortCost,
      assumption.riskCost,
    ],
    `total cost for ${assumption.id}`
  );
  const margin = checkedAdd(benefitAtRisk, -totalCost, `margin for ${assumption.id}`);

  return {
    assumptionId: assumption.id,
    actorId: assumption.actorId,
    domainId: assumption.domainId,
    instrumentId: assumption.instrumentId,
    accessibleFlow,
    presentValueAtRisk,
    lossProbabilityPpm: lossProbability,
    benefitAtRisk,
    totalCost,
    margin,
    holds: margin > 0,
  };
}

export function evaluateAllContinuationAssumptions(
  scenario: ScenarioSpec,
  state: SimulationState
): IncentiveMargin[] {
  return scenario.continuationAssumptions.map(assumption =>
    evaluateContinuationAssumption(scenario, state, assumption)
  );
}

function replaceMarginEconomics(
  margin: IncentiveMargin,
  replacedBenefit: number,
  actualBenefit: number,
  replacedCost: number,
  actualCost: number,
  label: string
): IncentiveMargin {
  const benefitAtRisk = checkedSum(
    [margin.benefitAtRisk, -replacedBenefit, actualBenefit],
    `${label} benefit`
  );
  const totalCost = checkedSum([margin.totalCost, -replacedCost, actualCost], `${label} cost`);
  const adjustedMargin = checkedAdd(benefitAtRisk, -totalCost, `${label} margin`);
  return {
    ...margin,
    benefitAtRisk,
    totalCost,
    margin: adjustedMargin,
    holds: adjustedMargin > 0,
  };
}

/**
 * Bind a keeper claim to the assignment that will actually execute it. The
 * assignment's reward and effort cost are authoritative; the assumption fields
 * are generic estimates used only when no concrete assignment is evaluated.
 */
export function keeperAssignmentMargin(
  scenario: ScenarioSpec,
  assignment: KeeperAssignmentSpec,
  margin: IncentiveMargin,
  circuitInstrumentId: InstrumentId,
  concreteReward = assignment.rewardPerAction,
  concreteEffortCost = assignment.costPerAction
): IncentiveMargin | null {
  const assumption = scenario.continuationAssumptions.find(
    candidate => candidate.id === margin.assumptionId
  );
  if (
    assumption === undefined ||
    assumption.actorId !== margin.actorId ||
    assumption.action !== assignment.keeperFunction ||
    assumption.domainId !== assignment.domainId ||
    assumption.instrumentId !== (assignment.instrumentId ?? circuitInstrumentId)
  ) {
    return null;
  }
  return replaceMarginEconomics(
    margin,
    assumption.immediateReward,
    concreteReward,
    assumption.keeperEffortCost,
    concreteEffortCost,
    `keeper assignment ${assignment.id} for ${margin.actorId}`
  );
}

/** Bind an internal funder's claim to the reward it must actually pay. */
export function keeperFundingMargin(
  scenario: ScenarioSpec,
  assignment: KeeperAssignmentSpec,
  margin: IncentiveMargin,
  circuitInstrumentId: InstrumentId,
  concreteFundingCost = assignment.rewardPerAction
): IncentiveMargin | null {
  const assumption = scenario.continuationAssumptions.find(
    candidate => candidate.id === margin.assumptionId
  );
  if (
    assumption === undefined ||
    assumption.actorId !== margin.actorId ||
    assumption.action !== "fund-keeper" ||
    assumption.domainId !== assignment.domainId ||
    assumption.instrumentId !== (assignment.instrumentId ?? circuitInstrumentId)
  ) {
    return null;
  }
  return replaceMarginEconomics(
    margin,
    0,
    0,
    assumption.participationCost,
    concreteFundingCost,
    `keeper funding ${assignment.id} by ${margin.actorId}`
  );
}

/**
 * Opportunities that may be realised by a circuit are exactly those referenced
 * by an actor/action claim that carries one of that circuit's ordered edges.
 */
export function circuitOpportunityIds(
  scenario: ScenarioSpec,
  circuit: MinimumCredibleCircuitSpec
): Set<OpportunityId> {
  const loadBearingClaims = new Set(
    circuit.edges.flatMap(edge =>
      edge.loadBearingActorIds.map(actorId => `${actorId}::${edge.action}`)
    )
  );
  return new Set(
    scenario.continuationAssumptions
      .filter(
        assumption =>
          assumption.domainId === circuit.domainId &&
          assumption.instrumentId === circuit.instrumentId &&
          loadBearingClaims.has(`${assumption.actorId}::${assumption.action}`)
      )
      .flatMap(assumption => assumption.opportunityIds)
  );
}

/**
 * One completed renewal realises the active, probability-scaled one-tick flow
 * from opportunities explicitly claimed by this circuit. Inactive or
 * zero-arrival/zero-clear relationships contribute nothing.
 */
export function realisedCircuitSurplus(
  scenario: ScenarioSpec,
  state: SimulationState,
  circuit: MinimumCredibleCircuitSpec
): { actorId: ActorId; amount: number }[] {
  const realisedIds = circuitOpportunityIds(scenario, circuit);
  const amounts = new Map<ActorId, number>();
  for (const opportunity of scenario.continuationOpportunities) {
    if (
      !realisedIds.has(opportunity.id) ||
      opportunity.domainId !== circuit.domainId ||
      opportunity.instrumentId !== circuit.instrumentId
    ) {
      continue;
    }
    for (const share of opportunity.accessibleSurplus) {
      const amount = opportunityFlow(opportunity, share.actorId, state);
      if (amount <= 0) continue;
      amounts.set(
        share.actorId,
        checkedAdd(amounts.get(share.actorId) ?? 0, amount, `realised amount for ${share.actorId}`)
      );
    }
  }
  return [...amounts]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([actorId, amount]) => ({ actorId, amount }));
}

export interface KeeperViability {
  assignmentId: string;
  viable: boolean;
  openBoundary: boolean;
  eligibleMargins: IncentiveMargin[];
  reason:
    | "positive-actor-margin"
    | "no-positive-actor-margin"
    | "insufficient-funding-margin"
    | "insufficient-capacity"
    | "zero-reliability"
    | "unassigned-open-boundary"
    | "disabled";
}

export function viableFundingActors(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  circuitInstrumentId: InstrumentId
): ActorId[] {
  if (assignment.funding !== "internal" || assignment.rewardPerAction === 0) return [];
  return assignment.fundingActorIds
    .filter(actorId => state.actors[actorId]?.active === true)
    .filter(() => assignment.fundingCapacityPerActorPerTick >= assignment.rewardPerAction)
    .filter(actorId =>
      margins.some(margin => {
        if (margin.actorId !== actorId) return false;
        return (
          keeperFundingMargin(scenario, assignment, margin, circuitInstrumentId)?.holds === true
        );
      })
    )
    .sort();
}

/** A keeper is economically covered only if at least one assigned active actor's
 * matching action has a strictly positive margin. Open boundaries remain open. */
export function evaluateKeeperViability(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  circuitInstrumentId: InstrumentId = assignment.instrumentId ?? ""
): KeeperViability {
  if (state.keepers[assignment.id]?.enabled !== true) {
    return {
      assignmentId: assignment.id,
      viable: false,
      openBoundary: false,
      eligibleMargins: [],
      reason: "disabled",
    };
  }
  if (assignment.actorIds.length === 0) {
    return {
      assignmentId: assignment.id,
      viable: false,
      openBoundary: true,
      eligibleMargins: [],
      reason: "unassigned-open-boundary",
    };
  }
  if (assignment.reliabilityPpm === 0) {
    return {
      assignmentId: assignment.id,
      viable: false,
      openBoundary: false,
      eligibleMargins: [],
      reason: "zero-reliability",
    };
  }
  if (assignment.capacityPerTick < assignment.requiredActorsPerAction) {
    return {
      assignmentId: assignment.id,
      viable: false,
      openBoundary: false,
      eligibleMargins: [],
      reason: "insufficient-capacity",
    };
  }

  const actorIds = new Set(
    assignment.actorIds.filter(actorId => state.actors[actorId]?.active === true)
  );
  const eligibleMargins = margins.flatMap(margin => {
    if (!actorIds.has(margin.actorId)) return [];
    const adjusted = keeperAssignmentMargin(
      scenario,
      assignment,
      margin,
      assignment.instrumentId ?? circuitInstrumentId
    );
    return adjusted === null ? [] : [adjusted];
  });
  const viableActors = new Set(
    eligibleMargins.filter(margin => margin.holds).map(margin => margin.actorId)
  );
  const actorMarginCovered = viableActors.size >= assignment.requiredActorsPerAction;
  const fundingCovered =
    assignment.funding !== "internal" ||
    assignment.rewardPerAction === 0 ||
    checkedSum(
      viableFundingActors(
        scenario,
        state,
        assignment,
        margins,
        assignment.instrumentId ?? circuitInstrumentId ?? ""
      ).map(() => assignment.fundingCapacityPerActorPerTick),
      `funding capacity for ${assignment.id}`
    ) >=
      mulDiv(
        assignment.requiredActorsPerAction,
        assignment.rewardPerAction,
        1,
        `required funding for ${assignment.id}`
      );
  const viable = actorMarginCovered && fundingCovered;
  return {
    assignmentId: assignment.id,
    viable,
    openBoundary: false,
    eligibleMargins,
    reason: viable
      ? "positive-actor-margin"
      : actorMarginCovered
        ? "insufficient-funding-margin"
        : "no-positive-actor-margin",
  };
}

export function allLoadBearingKeepersViable(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: string,
  instrumentId: string,
  margins: readonly IncentiveMargin[]
): boolean {
  const requiredIds = new Set(
    scenario.circuits
      .filter(circuit => circuit.domainId === domainId && circuit.instrumentId === instrumentId)
      .flatMap(circuit => circuit.edges.flatMap(edge => edge.keeperAssignmentIds))
  );
  if (requiredIds.size === 0) return false;
  const assignmentById = new Map(
    scenario.keeperAssignments.map(assignment => [assignment.id, assignment])
  );
  const chainViable = (assignment: KeeperAssignmentSpec, visited = new Set<string>()): boolean => {
    if (visited.has(assignment.id)) return false;
    if (evaluateKeeperViability(scenario, state, assignment, margins, instrumentId).viable) {
      return true;
    }
    if (assignment.fallbackAssignmentId === undefined) return false;
    const fallback = assignmentById.get(assignment.fallbackAssignmentId);
    return fallback !== undefined && chainViable(fallback, new Set(visited).add(assignment.id));
  };
  return [...requiredIds].every(assignmentId => {
    const assignment = assignmentById.get(assignmentId);
    return assignment !== undefined && chainViable(assignment);
  });
}

export function allLoadBearingContinuationAssumptionsHold(
  scenario: ScenarioSpec,
  state: SimulationState,
  domainId: string,
  instrumentId: string,
  margins: readonly IncentiveMargin[]
): boolean {
  const requiredClaims = scenario.circuits
    .filter(circuit => circuit.domainId === domainId && circuit.instrumentId === instrumentId)
    .flatMap(circuit =>
      circuit.edges.flatMap(edge =>
        edge.loadBearingActorIds.map(actorId => ({ actorId, action: edge.action }))
      )
    );
  if (requiredClaims.length === 0) return false;
  const marginById = new Map(margins.map(margin => [margin.assumptionId, margin]));
  return requiredClaims.every(claim => {
    if (state.actors[claim.actorId]?.active !== true) return false;
    const assumption = scenario.continuationAssumptions.find(
      candidate =>
        candidate.actorId === claim.actorId &&
        candidate.action === claim.action &&
        candidate.domainId === domainId &&
        candidate.instrumentId === instrumentId
    );
    return assumption !== undefined && marginById.get(assumption.id)?.holds === true;
  });
}

interface KeeperPathMargins {
  viable: boolean;
  margins: IncentiveMargin[];
}

function assignmentFundingMargins(
  scenario: ScenarioSpec,
  state: SimulationState,
  assignment: KeeperAssignmentSpec,
  margins: readonly IncentiveMargin[],
  instrumentId: InstrumentId
): IncentiveMargin[] {
  if (assignment.funding !== "internal" || assignment.rewardPerAction === 0) return [];
  const fundingActors = new Set(
    assignment.fundingActorIds.filter(actorId => state.actors[actorId]?.active === true)
  );
  return margins.flatMap(margin => {
    if (!fundingActors.has(margin.actorId)) return [];
    const adjusted = keeperFundingMargin(scenario, assignment, margin, instrumentId);
    return adjusted === null ? [] : [adjusted];
  });
}

export function weakestKeeperMargin(
  scenario: ScenarioSpec,
  state: SimulationState,
  margins: readonly IncentiveMargin[]
): IncentiveMargin | null {
  const assignmentById = new Map(
    scenario.keeperAssignments.map(assignment => [assignment.id, assignment])
  );
  const evaluatePath = (
    assignmentId: string,
    instrumentId: InstrumentId,
    visited = new Set<string>()
  ): KeeperPathMargins => {
    if (visited.has(assignmentId)) return { viable: false, margins: [] };
    const assignment = assignmentById.get(assignmentId);
    if (assignment === undefined) return { viable: false, margins: [] };
    const viability = evaluateKeeperViability(scenario, state, assignment, margins, instrumentId);
    const actorMargins = viability.eligibleMargins;
    const fundingMargins = assignmentFundingMargins(
      scenario,
      state,
      assignment,
      margins,
      instrumentId
    );
    const ownMargins = [...actorMargins, ...fundingMargins];
    if (viability.viable) {
      return { viable: true, margins: ownMargins.filter(margin => margin.holds) };
    }
    if (assignment.fallbackAssignmentId === undefined) {
      return { viable: false, margins: ownMargins };
    }
    const fallback = evaluatePath(
      assignment.fallbackAssignmentId,
      instrumentId,
      new Set(visited).add(assignmentId)
    );
    return fallback.viable
      ? fallback
      : { viable: false, margins: [...ownMargins, ...fallback.margins] };
  };
  const keeperMargins = scenario.circuits.flatMap(circuit =>
    [...new Set(circuit.edges.flatMap(edge => edge.keeperAssignmentIds))].flatMap(
      assignmentId => evaluatePath(assignmentId, circuit.instrumentId).margins
    )
  );
  return keeperMargins.reduce<IncentiveMargin | null>(
    (weakest, margin) => (weakest === null || margin.margin < weakest.margin ? margin : weakest),
    null
  );
}

export function probabilityComplement(probabilityPpm: number): number {
  return PPM - probabilityPpm;
}
