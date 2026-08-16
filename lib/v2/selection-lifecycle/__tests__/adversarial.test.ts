/** @jest-environment node */

import {
  EVENT_VERSION,
  type AdoptionBatchAppliedEvent,
  type LifecycleTransitionedEvent,
  type SimulationEvent,
} from "../events.js";
import { runSelectionLifecycle, type SimulationRun } from "../engine.js";
import { createInitialState, reduceEvent } from "../reducer.js";
import { createCardCashCoexistenceScenario, createTallyRopeScenario } from "../scenarios.js";
import {
  compareCodeUnits,
  domainInstrumentKey,
  type ActorId,
  type ScenarioSpec,
} from "../types.js";
import { assertValidScenario, validateScenario } from "../validate.js";

function cloneScenario(scenario: ScenarioSpec): ScenarioSpec {
  return JSON.parse(JSON.stringify(scenario)) as ScenarioSpec;
}

function lifecycleEvent(
  scenario: ScenarioSpec,
  overrides: Partial<LifecycleTransitionedEvent> = {}
): LifecycleTransitionedEvent {
  const circuit = scenario.circuits[0];
  if (circuit === undefined) throw new Error("fixture lost its circuit");
  return {
    eventVersion: EVENT_VERSION,
    id: "event:adversarial-lifecycle",
    at: { tick: 0, phase: "lifecycle", sequence: 0 },
    type: "lifecycle-transitioned",
    domainId: circuit.domainId,
    instrumentId: circuit.instrumentId,
    from: "candidate",
    to: "priming",
    reason: "declared priming wedge became active",
    authority: "engine-derived",
    invokerId: scenario.modelVersion,
    keeperAssignmentIds: [
      ...new Set(circuit.edges.flatMap(edge => edge.keeperAssignmentIds)),
    ].sort(),
    evidenceRefs: ["window:0:adversarial"],
    findingRefs: [],
    ...overrides,
  };
}

function stateReadyForLifecycle(scenario: ScenarioSpec, domainId: string, instrumentId: string) {
  const initial = createInitialState(scenario);
  const tickStarted = reduceEvent(
    initial,
    {
      eventVersion: EVENT_VERSION,
      id: "event:adversarial-tick-start",
      at: { tick: 0, phase: "shocks", sequence: 0 },
      type: "tick-started",
    },
    scenario
  );
  const key = domainInstrumentKey(domainId, instrumentId);
  const activity = tickStarted.tickActivity[key];
  if (activity === undefined) throw new Error(`fixture lost tick activity '${key}'`);
  return {
    ...tickStarted,
    adoptionAppliedTick: 0,
    tickActivity: {
      ...tickStarted.tickActivity,
      [key]: { ...activity, windowRecorded: true },
    },
  };
}

function expectValidationIssue(scenario: ScenarioSpec, path: string, message: string): void {
  expect(validateScenario(scenario)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: expect.stringContaining(path),
        message: expect.stringContaining(message),
      }),
    ])
  );
}

function renameActors(
  scenario: ScenarioSpec,
  actorNames: Readonly<Record<ActorId, ActorId>>
): ScenarioSpec {
  const renamed = cloneScenario(scenario);
  const actorId = (id: string): string => actorNames[id] ?? id;

  for (const actor of renamed.actors) actor.id = actorId(actor.id);
  for (const domain of renamed.domains) {
    domain.population = domain.population.map(actorId);
  }
  for (const relationship of renamed.relationships) {
    relationship.fromActorId = actorId(relationship.fromActorId);
    relationship.toActorId = actorId(relationship.toActorId);
  }
  for (const circuit of renamed.circuits) {
    for (const edge of circuit.edges) {
      edge.loadBearingActorIds = edge.loadBearingActorIds.map(actorId);
    }
  }
  for (const keeper of renamed.keeperAssignments) {
    keeper.actorIds = keeper.actorIds.map(actorId);
    keeper.fundingActorIds = keeper.fundingActorIds.map(actorId);
  }
  for (const mechanism of renamed.primingMechanisms) {
    mechanism.payerIds = mechanism.payerIds.map(actorId);
    mechanism.targetActorIds = mechanism.targetActorIds.map(actorId);
  }
  for (const opportunity of renamed.continuationOpportunities) {
    for (const surplus of opportunity.accessibleSurplus) {
      surplus.actorId = actorId(surplus.actorId);
    }
  }
  for (const assumption of renamed.continuationAssumptions) {
    assumption.actorId = actorId(assumption.actorId);
  }
  renamed.shocks = renamed.shocks.map(shock =>
    shock.kind === "deactivate-actor" ? { ...shock, actorId: actorId(shock.actorId) } : shock
  );
  return renamed;
}

function tickZeroAcceptanceByStructuralActor(
  run: SimulationRun,
  structuralActorId: (runtimeActorId: string) => string
): Record<string, unknown> {
  return Object.fromEntries(
    run.events
      .filter(
        (event): event is AdoptionBatchAppliedEvent =>
          event.type === "adoption-batch-applied" && event.at.tick === 0
      )
      .flatMap(event =>
        event.decisions.map(
          decision => [structuralActorId(decision.actorId), decision.acceptance] as const
        )
      )
      .sort(([left], [right]) => compareCodeUnits(String(left), String(right)))
  );
}

describe("SelectionLifecycle adversarial boundaries", () => {
  test("a forged engine lifecycle transition is rejected by the scenario guard", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.primingMechanisms[0].startsAtTick = 1;
    const circuit = scenario.circuits[0];
    const initial = stateReadyForLifecycle(scenario, circuit.domainId, circuit.instrumentId);

    expect(() => reduceEvent(initial, lifecycleEvent(scenario), scenario)).toThrow(
      /does not follow the declared guard/
    );
  });

  test("cross-domain keeper metadata cannot authorise a lifecycle transition", () => {
    const scenario = createCardCashCoexistenceScenario();
    const cardCircuit = scenario.circuits.find(circuit => circuit.id === "card-bill-circuit");
    const cashKeeper = scenario.keeperAssignments.find(
      keeper => keeper.id === "cash-tip-keeper-authenticate"
    );
    if (cardCircuit === undefined || cashKeeper === undefined) {
      throw new Error("coexistence fixture lost a scoped circuit or keeper");
    }
    const initial = stateReadyForLifecycle(
      scenario,
      cardCircuit.domainId,
      cardCircuit.instrumentId
    );
    const event = lifecycleEvent(scenario, {
      domainId: cardCircuit.domainId,
      instrumentId: cardCircuit.instrumentId,
      from: "installed-supported",
      to: "installed-self-maintaining",
      keeperAssignmentIds: [cashKeeper.id],
    });

    expect(() => reduceEvent(initial, event, scenario)).toThrow(/keeper path outside its scope/);
  });

  test("an inherited Object prototype name is not a valid event phase", () => {
    const scenario = createTallyRopeScenario();
    const initial = createInitialState(scenario);
    const event = {
      eventVersion: EVENT_VERSION,
      id: "event:prototype-phase",
      at: { tick: 0, phase: "toString", sequence: 0 },
      type: "tick-started",
    } as unknown as SimulationEvent;

    expect(() => reduceEvent(initial, event, scenario)).toThrow(/Unknown event phase 'toString'/);
  });

  test.each([
    ["actor", "__proto__", "$.actors[0].id"],
    ["domain", "toString", "$.domains[0].id"],
    ["instrument", "cash::tip", "$.instruments[0].id"],
  ])("rejects the %s id hazard %s", (kind, hazard, path) => {
    const scenario = cloneScenario(createTallyRopeScenario());
    if (kind === "actor") scenario.actors[0].id = hazard;
    if (kind === "domain") scenario.domains[0].id = hazard;
    if (kind === "instrument") scenario.instruments[0].id = hazard;

    expectValidationIssue(scenario, path, "map-safe identifier");
  });

  test("every load-bearing actor/action pair needs its own continuation claim", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const circuit = scenario.circuits[0];
    const edge = circuit.edges[0];
    const loadBearingActorId = edge.loadBearingActorIds[0];
    scenario.continuationAssumptions = scenario.continuationAssumptions.filter(
      assumption =>
        !(
          assumption.actorId === loadBearingActorId &&
          assumption.action === edge.action &&
          assumption.domainId === circuit.domainId &&
          assumption.instrumentId === circuit.instrumentId
        )
    );

    expectValidationIssue(
      scenario,
      "$.circuits[0].edges[0].loadBearingActorIds",
      `missing load-bearing continuation claim '${loadBearingActorId}::${edge.action}`
    );
  });

  test("schema v1 rejects a second circulation circuit for one domain and instrument", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.circuits.push({
      ...cloneScenario(scenario).circuits[0],
      id: "tally-duplicate-circuit",
    });

    expectValidationIssue(
      scenario,
      "$.domains[0].instrumentIds",
      "requires exactly one circulation circuit"
    );
  });

  test("a failed renewal edge cannot produce installation", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const baseKeeper = scenario.keeperAssignments[0];
    const renewalKeeperId = "tally-renewal-failure-keeper";
    scenario.keeperAssignments.push({
      ...baseKeeper,
      id: renewalKeeperId,
      reliabilityPpm: 0,
    });
    const renewalEdge = scenario.circuits[0].edges.find(edge => edge.renewal);
    if (renewalEdge === undefined) throw new Error("fixture lost its renewal edge");
    renewalEdge.keeperAssignmentIds = [renewalKeeperId];
    scenario.primingMechanisms[0].keeperAssignmentIds.push(renewalKeeperId);
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "renewal-must-close");
    expect(
      run.events.some(
        event =>
          event.type === "trade-resolved" &&
          event.circuitAction === "post" &&
          event.outcome === "completed"
      )
    ).toBe(true);
    expect(
      run.events.some(
        event =>
          event.type === "trade-resolved" &&
          event.circuitAction === "renew" &&
          event.outcome === "keeper-failed"
      )
    ).toBe(true);
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" &&
          (event.to === "installed-supported" || event.to === "installed-self-maintaining")
      )
    ).toBe(false);
    expect(
      run.summary.lifecycleByDomainInstrument[
        domainInstrumentKey("tally-domain", "tally-instrument")
      ]
    ).not.toMatch(/^installed-/);
  });

  test("tick-zero adoption is invariant when structural actors receive reverse-sorting names", () => {
    const original = createTallyRopeScenario();
    const actorNames: Record<string, string> = {
      "knight-a": "zeta",
      "knight-b": "yankee",
      "knight-c": "xray",
      "knight-d": "whiskey",
    };
    const renamed = renameActors(original, actorNames);
    assertValidScenario(renamed);
    const inverseNames = Object.fromEntries(
      Object.entries(actorNames).map(([structural, runtime]) => [runtime, structural])
    );

    const originalRun = runSelectionLifecycle(original, "adoption-snapshot", { ticks: 1 });
    const renamedRun = runSelectionLifecycle(renamed, "adoption-snapshot", { ticks: 1 });
    expect(
      [...renamed.actors]
        .sort((left, right) => compareCodeUnits(left.id, right.id))
        .map(actor => inverseNames[actor.id])
    ).toEqual(["knight-d", "knight-c", "knight-b", "knight-a"]);
    expect(tickZeroAcceptanceByStructuralActor(originalRun, id => id)).toEqual(
      tickZeroAcceptanceByStructuralActor(renamedRun, id => inverseNames[id] ?? id)
    );
  });

  test("schedule order uses code units rather than the host locale", () => {
    const scenario = renameActors(createTallyRopeScenario(), {
      "knight-a": "I",
      "knight-b": "i",
    });
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "locale-independent-order", {
      ticks: 1,
    });
    const adoption = run.events.find(event => event.type === "adoption-batch-applied");
    if (adoption?.type !== "adoption-batch-applied") {
      throw new Error("fixture lost its adoption batch");
    }
    expect(adoption.decisions.map(decision => decision.actorId)).toEqual([
      "I",
      "i",
      "knight-c",
      "knight-d",
    ]);
  });

  test("internal keeper rewards are conserved as participant funding costs", () => {
    const run = runSelectionLifecycle(
      createCardCashCoexistenceScenario(),
      "adversarial-reward-conservation",
      { ticks: 2 }
    );
    const actors = Object.values(run.state.actors);
    const rewards = actors.reduce((sum, actor) => sum + actor.keeperRewards, 0);
    const fundingCosts = actors.reduce((sum, actor) => sum + actor.keeperFundingCosts, 0);

    expect(rewards).toBeGreaterThan(0);
    expect(fundingCosts).toBe(rewards);
  });

  test("zero opportunity margin cannot fund keepers after priming ends", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.primingMechanisms[0].stopCondition = { kind: "tick", tick: 3 };
    scenario.continuationOpportunities[0].arrivalPpm = 0;
    for (const assumption of scenario.continuationAssumptions) {
      if (assumption.action === "authenticate") assumption.immediateReward = 1_000;
    }

    const run = runSelectionLifecycle(scenario, "no-opportunity-no-funding", { ticks: 6 });
    const fundingAssumptionIds = new Set(
      scenario.continuationAssumptions
        .filter(assumption => assumption.action === "fund-keeper")
        .map(assumption => assumption.id)
    );
    expect(
      run.finalMargins
        .filter(margin => fundingAssumptionIds.has(margin.assumptionId))
        .every(margin => !margin.holds)
    ).toBe(true);
    expect(
      run.events.filter(
        event =>
          event.type === "keeper-action-recorded" &&
          event.at.tick >= 3 &&
          event.outcome === "acted" &&
          event.fundingSource === "internal"
      )
    ).toHaveLength(0);
    expect(
      run.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.at.tick >= 3 &&
          event.circuitAction === "renew" &&
          event.outcome === "completed"
      )
    ).toHaveLength(0);
  });

  test("an unrelated external keeper does not keep the removal clock suspended", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const baseKeeper = scenario.keeperAssignments[0];
    scenario.keeperAssignments.push({
      ...baseKeeper,
      id: "unrelated-external-keeper",
      funding: "external",
      fundingActorIds: [],
      externalPayerIds: ["unrelated-external-sponsor"],
      externalFundingBudgetPerTick: baseKeeper.rewardPerAction * 100,
      fundingCapacityPerActorPerTick: 0,
    });
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "unrelated-support");
    const runtime =
      run.state.domainInstruments[domainInstrumentKey("tally-domain", "tally-instrument")];
    expect(runtime.activeExternalSupport).toBe(false);
    expect(runtime.wedgeRemovedAtTick).not.toBeNull();
    expect(runtime.lifecycle).toBe("installed-self-maintaining");
  });

  test("a participant cannot relabel itself as an external keeper payer", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const keeper = scenario.keeperAssignments[0];
    keeper.funding = "external";
    keeper.fundingActorIds = [];
    keeper.externalPayerIds = ["knight-a"];
    keeper.externalFundingBudgetPerTick = keeper.rewardPerAction * 100;
    keeper.fundingCapacityPerActorPerTick = 0;

    expectValidationIssue(
      scenario,
      "$.keeperAssignments[0].externalPayerIds[0]",
      "disjoint from participant actor ids"
    );
  });
});
