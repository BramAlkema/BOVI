import {
  MODEL_VERSION,
  RNG_VERSION,
  SCHEMA_VERSION,
  SCHEDULE_VERSION,
  type ActorSpec,
  type BondedAssumptionSpec,
  type ContinuationAssumptionSpec,
  type ContinuationOpportunitySpec,
  type DomainSpec,
  type InstrumentAcceptanceSpec,
  type InstrumentSpec,
  type KeeperAssignmentSpec,
  type MinimumCredibleCircuitSpec,
  type PrimingMechanismSpec,
  type RelationshipSpec,
  type ScenarioSpec,
  type SelectionLifecycleState,
} from "./types.js";

const CORE_ASSUMPTION: BondedAssumptionSpec = {
  id: "bond-reacceptance",
  scope: "declared scenario relationships only",
  claim: "the listed opportunities and accessible component values remain available",
  assertedBy: "scenario author",
  stake: "scenario result is rejected",
  refutationCondition:
    "observed opportunity or accessible value falls outside the declared profile",
  challengerStanding: "any represented actor or replication author",
  provenance: "candidate V2 model assumption",
};

interface DomainModuleOptions {
  prefix: string;
  domainLabel: string;
  actorIds: string[];
  relationshipActorIds?: string[];
  unit: string;
  ledger: string;
  rail: string;
  functionName: string;
  relationshipName: string;
  place: string;
  instrumentLabel: string;
  issuerId: string | null;
  initialLifecycle: SelectionLifecycleState;
  initiallyAccepts: boolean;
  keeperTopology: KeeperAssignmentSpec["topology"];
  keeperActorIds: string[];
  keeperFunding: KeeperAssignmentSpec["funding"];
  keeperCost: number;
  keeperReward: number;
  accessibleAmount: number;
  primed: boolean;
  primingBudget?: number;
  primingCostPerTick?: number;
  primingTargetActorIds?: string[];
  acceptanceBoostPpm?: number;
  switchingCost?: number;
  switchingCostOffset?: number;
  holdingCostPerTick?: number;
}

interface DomainModule {
  domain: DomainSpec;
  instrument: InstrumentSpec;
  acceptance: InstrumentAcceptanceSpec;
  relationships: RelationshipSpec[];
  circuit: MinimumCredibleCircuitSpec;
  keeper: KeeperAssignmentSpec;
  opportunity: ContinuationOpportunitySpec;
  continuation: ContinuationAssumptionSpec[];
  priming: PrimingMechanismSpec[];
}

function makeDomainModule(options: DomainModuleOptions): DomainModule {
  const domainId = `${options.prefix}-domain`;
  const instrumentId = `${options.prefix}-instrument`;
  const keeperId = `${options.prefix}-keeper-authenticate`;
  const relationshipActorIds = options.relationshipActorIds ?? options.actorIds;
  const relationshipIds = relationshipActorIds.map(
    (_, index) => `${options.prefix}-relationship-${index + 1}`
  );
  const relationships = relationshipActorIds.map<RelationshipSpec>((actorId, index) => ({
    id: relationshipIds[index],
    fromActorId: actorId,
    toActorId: relationshipActorIds[(index + 1) % relationshipActorIds.length],
    domainId,
    active: true,
    opportunityArrivalPpm: 1_000_000,
    instrumentIds: [instrumentId],
  }));
  const actions = ["acquire", "tender", "accept", "post", "respend", "renew"] as const;
  const circuit: MinimumCredibleCircuitSpec = {
    id: `${options.prefix}-circuit`,
    domainId,
    instrumentId,
    edges: actions.map((action, index) => ({
      id: `${options.prefix}-edge-${action}`,
      relationshipId: relationshipIds[index % relationshipIds.length],
      action,
      loadBearingActorIds: [
        relationships[index % relationships.length].fromActorId,
        relationships[index % relationships.length].toActorId,
      ],
      keeperAssignmentIds: [keeperId],
      renewal: action === "renew",
    })),
    minCompletedCycles: 2,
    minDistinctActors: 2,
    windowTicks: 2,
    maxFailurePpm: 250_000,
  };
  const opportunityId = `${options.prefix}-opportunity`;
  const opportunity: ContinuationOpportunitySpec = {
    id: opportunityId,
    domainId,
    relationshipId: relationshipIds[0],
    instrumentId,
    arrivalPpm: 900_000,
    clearProbabilityPpm: 950_000,
    accessibleSurplus: options.actorIds.map((actorId, actorIndex) => ({
      actorId,
      components: [
        {
          kind: "specialisation",
          amount: options.accessibleAmount,
          counterfactualId: `${options.prefix}-no-circuit`,
          overlapKey: `${options.prefix}-${actorIndex}-specialisation`,
        },
        {
          kind: "trade-fractionation",
          amount: Math.floor(options.accessibleAmount / 2),
          counterfactualId: `${options.prefix}-bilateral-barter-only`,
          overlapKey: `${options.prefix}-${actorIndex}-fractionation`,
          fractionationKind: "counterparty",
        },
        {
          kind: "conflict-mitigation",
          amount: Math.floor(options.accessibleAmount / 4),
          counterfactualId: `${options.prefix}-disputed-memory`,
          overlapKey: `${options.prefix}-${actorIndex}-conflict`,
        },
      ],
    })),
    provenance: "candidate profile values; sweep before interpretation",
    bondedAssumptionIds: [CORE_ASSUMPTION.id],
  };
  const continuation = options.actorIds.map<ContinuationAssumptionSpec>(actorId => ({
    id: `${options.prefix}-continue-${actorId}`,
    actorId,
    domainId,
    instrumentId,
    action: "authenticate",
    opportunityIds: [opportunityId],
    horizonTicks: 8,
    discountPpm: 950_000,
    lossPath: { kind: "direct", lossProbabilityPpm: 800_000 },
    outsideOptionAdvantage: 0,
    immediateReward: options.keeperReward,
    oneShotDefectionGain: 10,
    participationCost: 5,
    keeperEffortCost: options.keeperCost,
    riskCost: 5,
    bondedAssumptionIds: [CORE_ASSUMPTION.id],
  }));
  for (const edge of circuit.edges) {
    for (const actorId of edge.loadBearingActorIds) {
      continuation.push({
        id: `${options.prefix}-${edge.action}-${actorId}`,
        actorId,
        domainId,
        instrumentId,
        action: edge.action,
        opportunityIds: [opportunityId],
        horizonTicks: 8,
        discountPpm: 950_000,
        lossPath: { kind: "direct", lossProbabilityPpm: 800_000 },
        outsideOptionAdvantage: 0,
        immediateReward: 0,
        oneShotDefectionGain: 5,
        participationCost: 5,
        keeperEffortCost: 0,
        riskCost: 5,
        bondedAssumptionIds: [CORE_ASSUMPTION.id],
      });
    }
  }
  if (options.keeperFunding === "internal" && options.keeperReward > 0) {
    continuation.push(
      ...options.actorIds.map<ContinuationAssumptionSpec>(actorId => ({
        id: `${options.prefix}-fund-${actorId}`,
        actorId,
        domainId,
        instrumentId,
        action: "fund-keeper",
        opportunityIds: [opportunityId],
        horizonTicks: 8,
        discountPpm: 950_000,
        lossPath: { kind: "direct", lossProbabilityPpm: 800_000 },
        outsideOptionAdvantage: 0,
        immediateReward: 0,
        oneShotDefectionGain: 0,
        participationCost: options.keeperReward,
        keeperEffortCost: 0,
        riskCost: 5,
        bondedAssumptionIds: [CORE_ASSUMPTION.id],
      }))
    );
  }
  const priming: PrimingMechanismSpec[] = options.primed
    ? [
        {
          id: `${options.prefix}-priming`,
          domainId,
          instrumentId,
          payerIds: [options.actorIds[0]],
          targetActorIds: [...(options.primingTargetActorIds ?? options.actorIds)],
          circuitId: circuit.id,
          wedgeKind: "familiar-form",
          wedgeDescription: "declared, temporary cold-start support",
          startsAtTick: 0,
          costPerTick: options.primingCostPerTick ?? 20,
          totalBudget: options.primingBudget ?? 1_200,
          acceptanceBoostPpm: options.acceptanceBoostPpm ?? 950_000,
          switchingCostOffset: options.switchingCostOffset ?? options.switchingCost ?? 0,
          stopCondition: { kind: "installed", persistenceTicks: 1 },
          removalTestTicks: 2,
          externalInput: true,
          keeperAssignmentIds: [keeperId],
          bondedAssumptionIds: [CORE_ASSUMPTION.id],
        },
      ]
    : [];

  return {
    domain: {
      id: domainId,
      label: options.domainLabel,
      unit: options.unit,
      ledger: options.ledger,
      rail: options.rail,
      function: options.functionName,
      relationship: options.relationshipName,
      place: options.place,
      period: "scenario ticks",
      population: [...options.actorIds],
      instrumentIds: [instrumentId],
      incumbentInstrumentIds: options.primed ? [] : [instrumentId],
      competingDomainIds: [],
      coexistingDomainIds: [],
      installation: {
        minAcceptancePpm: 500_000,
        minActualUsesPerWindow: 2,
        minConnectedAcceptors: 2,
        windowTicks: 2,
      },
      maintenance: {
        minActualUsesPerWindow: 1,
        minKeeperCoveragePpm: 750_000,
        windowTicks: 2,
        removalTestTicks: 2,
      },
      initialLifecycleByInstrument: { [instrumentId]: options.initialLifecycle },
    },
    instrument: {
      id: instrumentId,
      label: options.instrumentLabel,
      unit: options.unit,
      ledger: options.ledger,
      rail: options.rail,
      issuerId: options.issuerId,
      authenticationCost: options.keeperCost,
      transactionCost: 2,
      supportsFractionation: ["quantity", "time", "counterparty"],
      repairable: true,
    },
    acceptance: {
      domainId,
      instrumentId,
      initiallyAccepts: options.initiallyAccepts,
      initialReacceptanceBeliefPpm: options.initiallyAccepts ? 900_000 : 100_000,
      adoptionThresholdPpm: 550_000,
      abandonmentThresholdPpm: 250_000,
      adoptionWindowTicks: 1,
      abandonmentWindowTicks: 2,
      switchingCost: options.switchingCost ?? 0,
      holdingCostPerTick: options.holdingCostPerTick ?? 0,
      installedComplement: 500,
    },
    relationships,
    circuit,
    keeper: {
      id: keeperId,
      domainId,
      instrumentId,
      keeperFunction: "authenticate",
      topology: options.keeperTopology,
      actorIds: [...options.keeperActorIds],
      requiredActorsPerAction:
        options.keeperTopology === "bilateral" ? Math.min(2, options.keeperActorIds.length) : 1,
      capacityPerTick: 100,
      reliabilityPpm: 1_000_000,
      costPerAction: options.keeperCost,
      rewardPerAction: options.keeperReward,
      funding: options.keeperFunding,
      fundingActorIds: options.keeperFunding === "internal" ? [...options.actorIds] : [],
      externalPayerIds:
        options.keeperFunding === "external" ? [`${options.prefix}-external-sponsor`] : [],
      externalFundingBudgetPerTick:
        options.keeperFunding === "external" ? options.keeperReward * 100 : 0,
      fundingCapacityPerActorPerTick:
        options.keeperFunding === "internal" ? options.keeperReward * 1_000 : 0,
    },
    opportunity,
    continuation,
    priming,
  };
}

function actorsForModules(actorIds: string[], modules: DomainModule[]): ActorSpec[] {
  return actorIds.map(actorId => ({
    id: actorId,
    label: actorId,
    policyId: "threshold-learning",
    domainIds: modules.map(module => module.domain.id),
    roles: ["participant", "counterparty", "keeper-candidate"],
    active: true,
    discountPpm: 950_000,
    exitHazardPpm: 0,
    learningRatePpm: 700_000,
    outsideOptionByDomain: Object.fromEntries(modules.map(module => [module.domain.id, 0])),
    acceptance: modules.map(module => module.acceptance),
  }));
}

function assembleScenario(
  id: string,
  title: string,
  initialCondition: ScenarioSpec["initialCondition"],
  actorIds: string[],
  modules: DomainModule[],
  ticks = 12
): ScenarioSpec {
  return {
    schemaVersion: SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    scheduleVersion: SCHEDULE_VERSION,
    rngVersion: RNG_VERSION,
    id,
    title,
    initialCondition,
    ticks,
    warmupTicks: 0,
    actors: actorsForModules(actorIds, modules),
    domains: modules.map(module => module.domain),
    instruments: modules.map(module => module.instrument),
    relationships: modules.flatMap(module => module.relationships),
    circuits: modules.map(module => module.circuit),
    keeperAssignments: modules.map(module => module.keeper),
    primingMechanisms: modules.flatMap(module => module.priming),
    continuationOpportunities: modules.map(module => module.opportunity),
    continuationAssumptions: modules.flatMap(module => module.continuation),
    bondedAssumptions: [CORE_ASSUMPTION],
    policies: [
      {
        kind: "threshold-learning",
        id: "threshold-learning",
        socialWeightPpm: 650_000,
        serviceWeightPpm: 650_000,
        primingWeightPpm: 1_000_000,
      },
    ],
    shocks: [],
    worldBoundaries: [
      "physical performance, assent and authenticity are observations, not simulator-created facts",
      "future opportunities and actor-accessible component values remain contestable assumptions",
    ],
    killConditions: [
      "a required keeper has no viable assigned actor and no explicit ongoing input",
      "the circuit survives only while an undeclared priming input remains",
    ],
  };
}

export interface TallyScenarioOptions {
  keeperCost?: number;
  accessibleAmount?: number;
  primingBudget?: number;
  acceptanceBoostPpm?: number;
}

export function createTallyRopeScenario(options: TallyScenarioOptions = {}): ScenarioSpec {
  const actorIds = ["knight-a", "knight-b", "knight-c", "knight-d"];
  const module = makeDomainModule({
    prefix: "tally",
    domainLabel: "Knights' reciprocal exchange",
    actorIds,
    unit: "rope mark",
    ledger: "bilateral tally rope",
    rail: "physical possession and witnessed marking",
    functionName: "fractionated reciprocal exchange",
    relationshipName: "bounded repeated dealings",
    place: "round table",
    instrumentLabel: "Knights' Tally Rope",
    issuerId: null,
    initialLifecycle: "candidate",
    initiallyAccepts: false,
    keeperTopology: "bilateral",
    keeperActorIds: actorIds,
    keeperFunding: "internal",
    keeperCost: options.keeperCost ?? 25,
    keeperReward: options.keeperCost ?? 25,
    accessibleAmount: options.accessibleAmount ?? 150,
    primed: true,
    primingBudget: options.primingBudget ?? 1_200,
    primingTargetActorIds: [actorIds[0]],
    acceptanceBoostPpm: options.acceptanceBoostPpm ?? 950_000,
  });
  return assembleScenario(
    "knights-tally-rope",
    "Distributed keepership after a declared tally-rope cold start",
    "orphan-candidate",
    actorIds,
    [module]
  );
}

export function createInheritedDinarScenario(): ScenarioSpec {
  const actorIds = ["merchant-a", "merchant-b", "household", "changer"];
  const module = makeDomainModule({
    prefix: "dinar",
    domainLabel: "Orphaned Swiss Iraqi dinar circulation",
    actorIds,
    unit: "Swiss Iraqi dinar",
    ledger: "physical bearer notes",
    rail: "hand-to-hand transfer",
    functionName: "local payment, pricing and change",
    relationshipName: "installed local trade",
    place: "Kurdistan profile",
    instrumentLabel: "orphaned Swiss Iraqi dinar",
    issuerId: null,
    initialLifecycle: "installed-supported",
    initiallyAccepts: true,
    keeperTopology: "open",
    keeperActorIds: actorIds,
    keeperFunding: "unfunded",
    keeperCost: 10,
    keeperReward: 0,
    accessibleAmount: 120,
    primed: false,
  });
  return assembleScenario(
    "inherited-orphaned-dinar",
    "Inherited installed use without a continuing issuer or regulator",
    "inherited-installed",
    actorIds,
    [module]
  );
}

export function createCardCashCoexistenceScenario(): ScenarioSpec {
  const actorIds = ["diner", "server", "processor"];
  const card = makeDomainModule({
    prefix: "card-bill",
    domainLabel: "restaurant bill payment",
    actorIds,
    unit: "euro",
    ledger: "bank deposit ledger",
    rail: "card network",
    functionName: "bill settlement",
    relationshipName: "diner to restaurant",
    place: "restaurant",
    instrumentLabel: "payment card",
    issuerId: "card-bank",
    initialLifecycle: "installed-supported",
    initiallyAccepts: true,
    keeperTopology: "provider",
    keeperActorIds: ["processor"],
    keeperFunding: "internal",
    keeperCost: 35,
    keeperReward: 45,
    accessibleAmount: 130,
    primed: false,
  });
  const cash = makeDomainModule({
    prefix: "cash-tip",
    domainLabel: "cash tipping",
    actorIds,
    relationshipActorIds: ["diner", "server"],
    unit: "euro",
    ledger: "physical bearer possession",
    rail: "cash",
    functionName: "voluntary explicit tip",
    relationshipName: "diner to server",
    place: "restaurant",
    instrumentLabel: "cash",
    issuerId: "Eurosystem profile",
    initialLifecycle: "installed-supported",
    initiallyAccepts: true,
    keeperTopology: "bilateral",
    keeperActorIds: ["diner", "server"],
    keeperFunding: "unfunded",
    keeperCost: 5,
    keeperReward: 0,
    accessibleAmount: 80,
    primed: false,
  });
  card.domain.coexistingDomainIds = [cash.domain.id];
  cash.domain.coexistingDomainIds = [card.domain.id];
  return assembleScenario(
    "card-bill-cash-tip",
    "Card bill and cash tip coexist in one episode without becoming one selection",
    "inherited-installed",
    actorIds,
    [card, cash]
  );
}

export function createChallengerIncumbentScenario(): ScenarioSpec {
  const actorIds = ["buyer-a", "buyer-b", "seller-a", "seller-b"];
  const challenger = makeDomainModule({
    prefix: "challenger",
    domainLabel: "retail payment",
    actorIds,
    unit: "candidate unit",
    ledger: "candidate distributed ledger",
    rail: "candidate rail",
    functionName: "retail exchange",
    relationshipName: "buyers and sellers",
    place: "bounded market",
    instrumentLabel: "challenger instrument",
    issuerId: null,
    initialLifecycle: "candidate",
    initiallyAccepts: false,
    keeperTopology: "protocol",
    keeperActorIds: actorIds,
    keeperFunding: "internal",
    keeperCost: 30,
    keeperReward: 30,
    accessibleAmount: 140,
    primed: true,
    primingBudget: 800,
    primingTargetActorIds: actorIds.slice(0, 3),
    switchingCost: 400,
    switchingCostOffset: 1_000,
    acceptanceBoostPpm: 900_000,
  });
  const incumbent = makeDomainModule({
    prefix: "incumbent",
    domainLabel: "incumbent retail payment",
    actorIds,
    unit: "incumbent unit",
    ledger: "incumbent ledger",
    rail: "incumbent rail",
    functionName: "retail exchange",
    relationshipName: "buyers and sellers",
    place: "bounded market",
    instrumentLabel: "installed incumbent",
    issuerId: "incumbent provider",
    initialLifecycle: "installed-self-maintaining",
    initiallyAccepts: true,
    keeperTopology: "provider",
    keeperActorIds: ["seller-a", "seller-b"],
    keeperFunding: "internal",
    keeperCost: 15,
    keeperReward: 20,
    accessibleAmount: 100,
    primed: false,
  });
  challenger.domain.competingDomainIds = [incumbent.domain.id];
  incumbent.domain.competingDomainIds = [challenger.domain.id];
  return assembleScenario(
    "challenger-against-incumbent",
    "A challenger must pay switching costs before acceptance feedback can help it",
    "orphan-candidate",
    actorIds,
    [challenger, incumbent]
  );
}

export const CANONICAL_SCENARIO_IDS = [
  "knights-tally-rope",
  "inherited-orphaned-dinar",
  "card-bill-cash-tip",
  "challenger-against-incumbent",
] as const;

export type CanonicalScenarioId = (typeof CANONICAL_SCENARIO_IDS)[number];

export function createCanonicalScenario(id: CanonicalScenarioId): ScenarioSpec {
  switch (id) {
    case "knights-tally-rope":
      return createTallyRopeScenario();
    case "inherited-orphaned-dinar":
      return createInheritedDinarScenario();
    case "card-bill-cash-tip":
      return createCardCashCoexistenceScenario();
    case "challenger-against-incumbent":
      return createChallengerIncumbentScenario();
  }
}
