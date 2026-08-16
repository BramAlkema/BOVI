import {
  MODEL_VERSION,
  PPM,
  RNG_VERSION,
  SCHEMA_VERSION,
  SCHEDULE_VERSION,
  type ScenarioSpec,
} from "../types.js";
import { ScenarioValidationError, assertValidScenario, validateScenario } from "../validate.js";

function validScenario(): ScenarioSpec {
  const circuitActions = ["acquire", "tender", "accept", "post", "respend", "renew"] as const;
  const acceptance = {
    domainId: "market",
    instrumentId: "tally",
    initiallyAccepts: false,
    initialReacceptanceBeliefPpm: 100_000,
    adoptionThresholdPpm: 600_000,
    abandonmentThresholdPpm: 200_000,
    adoptionWindowTicks: 1,
    abandonmentWindowTicks: 2,
    switchingCost: 10,
    holdingCostPerTick: 1,
    installedComplement: 0,
  } as const;

  return {
    schemaVersion: SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    scheduleVersion: SCHEDULE_VERSION,
    rngVersion: RNG_VERSION,
    id: "compact-valid",
    title: "Compact valid selection lifecycle",
    initialCondition: "orphan-candidate",
    ticks: 10,
    warmupTicks: 0,
    actors: [
      {
        id: "alice",
        policyId: "learning",
        domainIds: ["market"],
        roles: ["payer", "keeper"],
        active: true,
        discountPpm: 950_000,
        exitHazardPpm: 0,
        learningRatePpm: 500_000,
        outsideOptionByDomain: { market: 0 },
        acceptance: [{ ...acceptance }],
      },
      {
        id: "bob",
        policyId: "learning",
        domainIds: ["market"],
        roles: ["payee", "keeper"],
        active: true,
        discountPpm: 950_000,
        exitHazardPpm: 0,
        learningRatePpm: 500_000,
        outsideOptionByDomain: { market: 0 },
        acceptance: [{ ...acceptance }],
      },
    ],
    domains: [
      {
        id: "market",
        unit: "mark",
        ledger: "rope",
        rail: "hand-to-hand",
        function: "local exchange",
        relationship: "repeated bilateral trade",
        place: "round table",
        period: "ten ticks",
        population: ["alice", "bob"],
        instrumentIds: ["tally"],
        incumbentInstrumentIds: [],
        competingDomainIds: [],
        coexistingDomainIds: [],
        installation: {
          minAcceptancePpm: 500_000,
          minActualUsesPerWindow: 1,
          minConnectedAcceptors: 2,
          windowTicks: 2,
        },
        maintenance: {
          minActualUsesPerWindow: 1,
          minKeeperCoveragePpm: 500_000,
          windowTicks: 2,
          removalTestTicks: 2,
        },
        initialLifecycleByInstrument: { tally: "candidate" },
      },
    ],
    instruments: [
      {
        id: "tally",
        unit: "mark",
        ledger: "rope",
        rail: "hand-to-hand",
        issuerId: null,
        authenticationCost: 1,
        transactionCost: 1,
        supportsFractionation: ["time"],
        repairable: true,
      },
    ],
    relationships: [
      {
        id: "alice-bob",
        fromActorId: "alice",
        toActorId: "bob",
        domainId: "market",
        active: true,
        opportunityArrivalPpm: 800_000,
        instrumentIds: ["tally"],
      },
      {
        id: "bob-alice",
        fromActorId: "bob",
        toActorId: "alice",
        domainId: "market",
        active: true,
        opportunityArrivalPpm: 800_000,
        instrumentIds: ["tally"],
      },
    ],
    circuits: [
      {
        id: "tally-circuit",
        domainId: "market",
        instrumentId: "tally",
        edges: circuitActions.map((action, index) => ({
          id: `edge-${action}`,
          relationshipId: index % 2 === 0 ? "alice-bob" : "bob-alice",
          action,
          loadBearingActorIds: ["alice", "bob"],
          keeperAssignmentIds: ["keeper"],
          renewal: index === 5,
        })),
        minCompletedCycles: 1,
        minDistinctActors: 2,
        windowTicks: 2,
        maxFailurePpm: 100_000,
      },
    ],
    keeperAssignments: [
      {
        id: "keeper",
        domainId: "market",
        instrumentId: "tally",
        keeperFunction: "authenticate",
        topology: "bilateral",
        actorIds: ["alice", "bob"],
        requiredActorsPerAction: 2,
        capacityPerTick: 10,
        reliabilityPpm: 900_000,
        costPerAction: 1,
        rewardPerAction: 1,
        funding: "internal",
        fundingActorIds: ["alice", "bob"],
        externalPayerIds: [],
        externalFundingBudgetPerTick: 0,
        fundingCapacityPerActorPerTick: 100,
      },
    ],
    primingMechanisms: [
      {
        id: "prime",
        domainId: "market",
        instrumentId: "tally",
        payerIds: ["alice"],
        targetActorIds: ["alice", "bob"],
        circuitId: "tally-circuit",
        wedgeKind: "subsidy",
        startsAtTick: 0,
        costPerTick: 2,
        totalBudget: 8,
        acceptanceBoostPpm: 500_000,
        switchingCostOffset: 5,
        stopCondition: { kind: "tick", tick: 2 },
        removalTestTicks: 2,
        externalInput: true,
        keeperAssignmentIds: ["keeper"],
        bondedAssumptionIds: ["bond"],
      },
    ],
    continuationOpportunities: [
      {
        id: "future-trade",
        domainId: "market",
        relationshipId: "alice-bob",
        instrumentId: "tally",
        arrivalPpm: 800_000,
        clearProbabilityPpm: 900_000,
        accessibleSurplus: [
          {
            actorId: "alice",
            components: [
              {
                kind: "trade-fractionation",
                amount: 20,
                counterfactualId: "barter-only",
                overlapKey: "alice-future-trade",
                fractionationKind: "time",
              },
            ],
          },
          {
            actorId: "bob",
            components: [
              {
                kind: "trade-fractionation",
                amount: 20,
                counterfactualId: "barter-only",
                overlapKey: "bob-future-trade",
                fractionationKind: "time",
              },
            ],
          },
        ],
        provenance: "synthetic validation fixture",
        bondedAssumptionIds: ["bond"],
      },
    ],
    continuationAssumptions: ["alice", "bob"].flatMap(actorId =>
      (["authenticate", "fund-keeper", ...circuitActions] as const).map(action => ({
        id: `${actorId}-${action}`,
        actorId,
        domainId: "market",
        instrumentId: "tally",
        action,
        opportunityIds: ["future-trade"],
        horizonTicks: 5,
        discountPpm: 950_000,
        lossPath: { kind: "direct" as const, lossProbabilityPpm: 800_000 },
        outsideOptionAdvantage: 0,
        immediateReward: action === "authenticate" ? 1 : 0,
        oneShotDefectionGain: 2,
        participationCost: 1,
        keeperEffortCost: action === "authenticate" ? 1 : 0,
        riskCost: 1,
        bondedAssumptionIds: ["bond"],
      }))
    ),
    bondedAssumptions: [
      {
        id: "bond",
        scope: "market during the fixture",
        claim: "future trade remains accessible",
        assertedBy: "fixture author",
        stake: "discard the result",
        refutationCondition: "the opportunity disappears",
        challengerStanding: "either actor",
        provenance: "synthetic validation fixture",
      },
    ],
    policies: [
      {
        kind: "threshold-learning",
        id: "learning",
        socialWeightPpm: 500_000,
        serviceWeightPpm: 500_000,
        primingWeightPpm: 500_000,
      },
    ],
    shocks: [{ tick: 5, kind: "scale-opportunities", domainId: "market", factorPpm: 500_000 }],
    worldBoundaries: ["physical delivery and genuine assent remain world facts"],
    killConditions: ["an unnamed keeper is required"],
  };
}

function expectIssue(scenario: unknown, path: string, message: string): void {
  expect(validateScenario(scenario)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: expect.stringContaining(path),
        message: expect.stringContaining(message),
      }),
    ])
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("test mutation target is not a record");
  }
  return value as Record<string, unknown>;
}

describe("SelectionLifecycle source validation", () => {
  test("accepts a compact, fully scoped JSON source", () => {
    const scenario = validScenario();

    expect(validateScenario(scenario)).toEqual([]);
    expect(() => assertValidScenario(scenario)).not.toThrow();
  });

  test("rejects non-JSON values and authoritative global scalars", () => {
    const withCallback = validScenario();
    record(withCallback).callback = () => undefined;
    expectIssue(withCallback, "$.callback", "non-JSON");

    const withGlobalScalar = validScenario();
    record(withGlobalScalar).continuation_surplus = 10;
    expectIssue(withGlobalScalar, "$.continuation_surplus", "aggregate continuation");
  });

  test.each([
    [
      "out-of-order actions",
      (scenario: ScenarioSpec) => {
        [scenario.circuits[0].edges[1], scenario.circuits[0].edges[2]] = [
          scenario.circuits[0].edges[2],
          scenario.circuits[0].edges[1],
        ];
      },
      "out of order",
    ],
    [
      "missing posting",
      (scenario: ScenarioSpec) => {
        scenario.circuits[0].edges = scenario.circuits[0].edges.filter(
          edge => edge.action !== "post"
        );
      },
      "exactly one 'post'",
    ],
    [
      "missing continuation",
      (scenario: ScenarioSpec) => {
        scenario.circuits[0].edges = scenario.circuits[0].edges.filter(
          edge => edge.action !== "respend"
        );
      },
      "exactly one",
    ],
    [
      "non-final renewal",
      (scenario: ScenarioSpec) => {
        scenario.circuits[0].edges.push({
          id: "after-renew",
          relationshipId: "alice-bob",
          action: "renew",
          loadBearingActorIds: ["alice", "bob"],
          keeperAssignmentIds: ["keeper"],
          renewal: false,
        });
      },
      "renewal must be true only",
    ],
    [
      "unnamed edge keeper",
      (scenario: ScenarioSpec) => {
        scenario.circuits[0].edges[3].keeperAssignmentIds = [];
      },
      "must not be empty",
    ],
  ])("rejects a circuit with %s", (_name, mutate, message) => {
    const scenario = validScenario();
    mutate(scenario);
    expectIssue(scenario, "$.circuits[0].edges", message);
  });

  test("validates tagged enums and booleans", () => {
    const badBoolean = validScenario();
    record(badBoolean.actors[0]).active = "yes";
    expectIssue(badBoolean, "$.actors[0].active", "boolean");

    const badTopology = validScenario();
    record(badTopology.keeperAssignments[0]).topology = "community";
    expectIssue(badTopology, "$.keeperAssignments[0].topology", "must be one of");

    const badAction = validScenario();
    record(badAction.circuits[0].edges[0]).action = "circulate";
    expectIssue(badAction, "$.circuits[0].edges[0].action", "must be one of");

    const badSurplusKind = validScenario();
    record(badSurplusKind.continuationOpportunities[0].accessibleSurplus[0].components[0]).kind =
      "aggregate";
    expectIssue(
      badSurplusKind,
      "$.continuationOpportunities[0].accessibleSurplus[0].components[0].kind",
      "must be one of"
    );
  });

  test("requires exact, valid per-domain lifecycle mappings", () => {
    const missing = validScenario();
    delete missing.domains[0].initialLifecycleByInstrument.tally;
    expectIssue(missing, "$.domains[0].initialLifecycleByInstrument", "missing lifecycle");

    const invalid = validScenario();
    record(invalid.domains[0].initialLifecycleByInstrument).tally = "money";
    expectIssue(invalid, "$.domains[0].initialLifecycleByInstrument.tally", "must be one of");

    const extra = validScenario();
    record(extra.domains[0].initialLifecycleByInstrument).ghost = "candidate";
    expectIssue(extra, "$.domains[0].initialLifecycleByInstrument.ghost", "outside this domain");
  });

  test("requires an assigned, correctly configured policy", () => {
    const dangling = validScenario();
    dangling.actors[0].policyId = "missing";
    expectIssue(dangling, "$.actors[0].policyId", "dangling reference");

    const badConfig = validScenario();
    record(badConfig.policies[0]).socialWeightPpm = PPM + 1;
    expectIssue(badConfig, "$.policies[0].socialWeightPpm", `<= ${PPM}`);

    const wrongKind = validScenario();
    record(wrongKind.policies[0]).kind = "unversioned";
    expectIssue(wrongKind, "$.policies[0].kind", "must be one of");
  });

  test("validates every shock variant, reference, probability and tick", () => {
    const allVariants = validScenario();
    allVariants.shocks = [
      { tick: 1, kind: "deactivate-actor", actorId: "alice" },
      { tick: 2, kind: "deactivate-relationship", relationshipId: "alice-bob" },
      { tick: 3, kind: "disable-keeper", keeperAssignmentId: "keeper" },
      { tick: 4, kind: "stop-priming", primingMechanismId: "prime" },
      { tick: 5, kind: "scale-opportunities", domainId: "market", factorPpm: PPM },
    ];
    expect(validateScenario(allVariants)).toEqual([]);

    const dangling = validScenario();
    dangling.shocks = [{ tick: 1, kind: "deactivate-actor", actorId: "ghost" }];
    expectIssue(dangling, "$.shocks[0].actorId", "dangling reference");

    const badPpm = validScenario();
    badPpm.shocks = [
      { tick: 1, kind: "scale-opportunities", domainId: "market", factorPpm: PPM + 1 },
    ];
    expectIssue(badPpm, "$.shocks[0].factorPpm", `<= ${PPM}`);

    const late = validScenario();
    late.shocks = [{ tick: late.ticks, kind: "disable-keeper", keeperAssignmentId: "keeper" }];
    expectIssue(late, "$.shocks[0].tick", "before the scenario ends");
  });

  test("validates all priming stop-condition variants and their payloads", () => {
    for (const stopCondition of [
      { kind: "tick", tick: 2 },
      { kind: "credible-circuit", persistenceTicks: 1 },
      { kind: "installed", persistenceTicks: 1 },
      { kind: "budget-exhausted" },
    ] as const) {
      const scenario = validScenario();
      scenario.primingMechanisms[0].stopCondition = stopCondition;
      expect(validateScenario(scenario)).toEqual([]);
    }

    const beforeStart = validScenario();
    beforeStart.primingMechanisms[0].startsAtTick = 3;
    beforeStart.primingMechanisms[0].stopCondition = { kind: "tick", tick: 2 };
    expectIssue(beforeStart, "$.primingMechanisms[0].stopCondition.tick", "cannot precede");

    const noPersistence = validScenario();
    noPersistence.primingMechanisms[0].stopCondition = {
      kind: "credible-circuit",
      persistenceTicks: 0,
    };
    expectIssue(noPersistence, "$.primingMechanisms[0].stopCondition.persistenceTicks", ">= 1");

    const incompatiblePayload = validScenario();
    record(incompatiblePayload.primingMechanisms[0].stopCondition).persistenceTicks = 1;
    expectIssue(
      incompatiblePayload,
      "$.primingMechanisms[0].stopCondition.persistenceTicks",
      "not valid for this tagged variant"
    );
  });

  test("rejects overlap across every opportunity referenced by one actor assumption", () => {
    const scenario = validScenario();
    const first = scenario.continuationOpportunities[0];
    scenario.continuationOpportunities.push({
      ...first,
      id: "future-credit",
      accessibleSurplus: [
        {
          actorId: "alice",
          components: [
            {
              ...first.accessibleSurplus[0].components[0],
              counterfactualId: "no-credit",
            },
          ],
        },
      ],
    });
    scenario.continuationAssumptions[0].opportunityIds.push("future-credit");

    expectIssue(scenario, "$.continuationAssumptions[0].opportunityIds", "overlap key");
  });

  test("rejects orphan continuation opportunities", () => {
    const scenario = validScenario();
    scenario.continuationOpportunities.push({
      ...scenario.continuationOpportunities[0],
      id: "unclaimed-future-trade",
    });

    expectIssue(
      scenario,
      "$.continuationOpportunities[1]",
      "referenced by at least one continuation assumption"
    );
  });

  test("rejects circuit-realised overlap split across separate actor claims", () => {
    const scenario = validScenario();
    const first = scenario.continuationOpportunities[0];
    scenario.continuationOpportunities.push({
      ...first,
      id: "future-credit",
      accessibleSurplus: [
        {
          actorId: "alice",
          components: [
            {
              ...first.accessibleSurplus[0].components[0],
              counterfactualId: "no-credit",
            },
          ],
        },
      ],
    });
    const separateClaim = scenario.continuationAssumptions.find(
      assumption => assumption.actorId === "alice" && assumption.action === "tender"
    );
    if (separateClaim === undefined) throw new Error("fixture lost separate circuit claim");
    separateClaim.opportunityIds = ["future-credit"];

    expectIssue(scenario, "$.circuits[0]", "realised surplus overlap key");
  });

  test("rejects unsafe numeric fields", () => {
    const unsafe = validScenario();
    record(unsafe.instruments[0]).transactionCost = Number.MAX_SAFE_INTEGER + 1;
    expectIssue(unsafe, "$.instruments[0].transactionCost", "safe integer");

    const fractional = validScenario();
    record(fractional.actors[0].acceptance[0]).switchingCost = 0.5;
    expectIssue(fractional, "$.actors[0].acceptance[0].switchingCost", "safe integer");
  });

  test("rejects a fallback that substitutes a different keeper function", () => {
    const scenario = validScenario();
    const primary = scenario.keeperAssignments[0];
    scenario.keeperAssignments.push({
      ...primary,
      id: "wrong-function-fallback",
      keeperFunction: "record",
    });
    primary.fallbackAssignmentId = "wrong-function-fallback";

    expectIssue(scenario, "$.keeperAssignments[0].fallbackAssignmentId", "same keeper function");
  });

  test("rejects an instrument-specific fallback for an instrument-agnostic primary", () => {
    const scenario = validScenario();
    const primary = scenario.keeperAssignments[0];
    scenario.keeperAssignments.push({
      ...primary,
      id: "instrument-specific-fallback",
    });
    primary.instrumentId = null;
    primary.fallbackAssignmentId = "instrument-specific-fallback";

    expectIssue(
      scenario,
      "$.keeperAssignments[0].fallbackAssignmentId",
      "instrument-agnostic fallback"
    );
  });

  test("rejects domain, instrument and relationship scope upgrades", () => {
    const mismatchedRail = validScenario();
    mismatchedRail.instruments[0].rail = "different rail";
    expectIssue(mismatchedRail, "$.domains[0]", "does not match domain rail");

    const relationshipCannotCarryInstrument = validScenario();
    relationshipCannotCarryInstrument.relationships[0].instrumentIds = [];
    expectIssue(
      relationshipCannotCarryInstrument,
      "$.continuationOpportunities[0].relationshipId",
      "does not carry"
    );

    const actorOutsideDomain = validScenario();
    actorOutsideDomain.domains[0].population = ["bob"];
    expectIssue(actorOutsideDomain, "$.actors[0].acceptance[0]", "not in the acceptance domain");

    const missingAcceptanceProfile = validScenario();
    missingAcceptanceProfile.actors[0].acceptance = [];
    expectIssue(missingAcceptanceProfile, "$.actors[0].acceptance", "missing acceptance profile");
  });

  test("assertValidScenario reports all source issues", () => {
    const scenario = validScenario();
    scenario.circuits[0].edges[0].keeperAssignmentIds = [];

    expect(() => assertValidScenario(scenario)).toThrow(ScenarioValidationError);
    expect(() => assertValidScenario(scenario)).toThrow("keeperAssignmentIds: must not be empty");
  });
});
