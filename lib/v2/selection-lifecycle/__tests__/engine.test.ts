/** @jest-environment node */

import { canonicalJson } from "../canonical-json.js";
import { runSelectionLifecycle } from "../engine.js";
import { replayScenario } from "../reducer.js";
import {
  CANONICAL_SCENARIO_IDS,
  createCanonicalScenario,
  createCardCashCoexistenceScenario,
  createChallengerIncumbentScenario,
  createInheritedDinarScenario,
  createTallyRopeScenario,
} from "../scenarios.js";
import type { KeeperAssignmentSpec, ScenarioSpec } from "../types.js";
import { assertValidScenario } from "../validate.js";

function cloneScenario(scenario: ScenarioSpec): ScenarioSpec {
  return JSON.parse(JSON.stringify(scenario)) as ScenarioSpec;
}

describe("SelectionLifecycle deterministic ABM", () => {
  test.each(CANONICAL_SCENARIO_IDS)("canonical scenario %s validates and replays", id => {
    const scenario = createCanonicalScenario(id);
    expect(() => assertValidScenario(scenario)).not.toThrow();
    const run = runSelectionLifecycle(scenario, "canonical-seed");

    expect(run.summary.ticksCompleted).toBe(scenario.ticks);
    expect(run.events.length).toBeGreaterThan(0);
    expect(canonicalJson(replayScenario(scenario, run.events))).toBe(canonicalJson(run.state));
  });

  test("the same source and seed produce byte-identical traces and summaries", () => {
    const scenario = createTallyRopeScenario();
    const first = runSelectionLifecycle(scenario, "repeatable");
    const second = runSelectionLifecycle(scenario, "repeatable");

    expect(canonicalJson(first.events)).toBe(canonicalJson(second.events));
    expect(canonicalJson(first.summary)).toBe(canonicalJson(second.summary));
    expect(first.summary.eventLogHash).toBe(second.summary.eventLogHash);
  });

  test("large future gains do not prime an empty acceptance network", () => {
    const scenario = cloneScenario(createTallyRopeScenario({ accessibleAmount: 1_000_000 }));
    scenario.initialCondition = "matched-obligation";
    scenario.primingMechanisms = [];
    for (const actor of scenario.actors) {
      for (const acceptance of actor.acceptance) {
        acceptance.initialReacceptanceBeliefPpm = 0;
      }
    }

    const run = runSelectionLifecycle(scenario, "surplus-is-not-a-seed");
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "candidate"
    );
    expect(
      Object.values(run.state.actors).some(actor =>
        Object.values(actor.acceptance).some(position => position.accepts)
      )
    ).toBe(false);
    expect(run.finalMargins.every(margin => margin.holds)).toBe(true);
  });

  test("continuation cannot carry keeper work while the lifecycle is still a candidate", () => {
    const scenario = cloneScenario(createTallyRopeScenario({ accessibleAmount: 1_000_000 }));
    scenario.initialCondition = "matched-obligation";
    scenario.primingMechanisms = [];
    scenario.actors.forEach(actor =>
      actor.acceptance.forEach(position => {
        position.initiallyAccepts = true;
        position.initialReacceptanceBeliefPpm = 1_000_000;
      })
    );

    const run = runSelectionLifecycle(scenario, "continuation-is-not-priming");
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "candidate"
    );
    expect(
      run.events.some(event => event.type === "trade-resolved" && event.outcome === "completed")
    ).toBe(false);
    expect(
      run.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.reason === "continuation cannot carry cold-start keeper work"
      )
    ).toBe(true);
  });

  test("an installed network can reverse-cascade after its wedge and opportunities disappear", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.shocks.push(
      { tick: 3, kind: "stop-priming", primingMechanismId: "tally-priming" },
      { tick: 3, kind: "scale-opportunities", domainId: "tally-domain", factorPpm: 0 }
    );

    const run = runSelectionLifecycle(scenario, "reverse-cascade");
    const lifecycle = run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"];
    expect(["fragile", "declining", "collapsed"]).toContain(lifecycle);
    expect(lifecycle).not.toBe("installed-self-maintaining");
    expect(run.summary.survivedAfterPriming["tally-domain::tally-instrument"]).toBe(false);
  });

  test("aggregate positive gains cannot cover an indispensable keeper with a negative margin", () => {
    const scenario = cloneScenario(
      createTallyRopeScenario({ accessibleAmount: 500, keeperCost: 25 })
    );
    scenario.keeperAssignments[0].actorIds = ["knight-a"];
    scenario.keeperAssignments[0].requiredActorsPerAction = 1;
    scenario.keeperAssignments[0].topology = "rotating";
    const critical = scenario.continuationAssumptions.find(
      assumption => assumption.actorId === "knight-a"
    );
    if (critical === undefined) throw new Error("fixture lost critical keeper assumption");
    critical.oneShotDefectionGain = 12_000;

    const run = runSelectionLifecycle(scenario, "critical-keeper");
    const criticalMargin = run.finalMargins.find(margin => margin.assumptionId === critical.id);
    const otherMargins = run.finalMargins.filter(margin => margin.assumptionId !== critical.id);
    expect(criticalMargin?.margin).toBeLessThan(0);
    expect(otherMargins.every(margin => margin.margin > 0)).toBe(true);
    expect(otherMargins.reduce((sum, margin) => sum + margin.margin, 0)).toBeGreaterThan(
      Math.abs(criticalMargin?.margin ?? 0)
    );
    const primingStopped = run.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (primingStopped === undefined) throw new Error("fixture never removed priming");
    expect(
      run.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.outcome === "completed" &&
          event.at.tick >= primingStopped.at.tick
      )
    ).toHaveLength(0);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).not.toBe(
      "installed-self-maintaining"
    );
  });

  test("installed use is not sticky when actors and their keeper structure disappear", () => {
    const scenario = cloneScenario(createInheritedDinarScenario());
    scenario.actors.forEach(actor => {
      scenario.shocks.push({ tick: 2, kind: "deactivate-actor", actorId: actor.id });
    });

    const run = runSelectionLifecycle(scenario, "not-sticky");
    expect(run.summary.lifecycleByDomainInstrument["dinar-domain::dinar-instrument"]).toBe(
      "collapsed"
    );
  });

  test("an inherited issuerless currency can continue under distributed keepership", () => {
    const scenario = createInheritedDinarScenario();
    expect(scenario.instruments[0].issuerId).toBeNull();

    const run = runSelectionLifecycle(scenario, "orphan-maintenance");
    expect(run.summary.lifecycleByDomainInstrument["dinar-domain::dinar-instrument"]).toBe(
      "installed-self-maintaining"
    );
    expect(run.summary.survivedAfterPriming["dinar-domain::dinar-instrument"]).toBeNull();
  });

  test("card bill and cash tip remain two coexisting scoped selections", () => {
    const scenario = createCardCashCoexistenceScenario();
    const run = runSelectionLifecycle(scenario, "coexistence");
    expect(Object.keys(run.summary.lifecycleByDomainInstrument)).toEqual([
      "card-bill-domain::card-bill-instrument",
      "cash-tip-domain::cash-tip-instrument",
    ]);
    expect(
      Object.values(run.summary.lifecycleByDomainInstrument).every(
        lifecycle => lifecycle === "installed-self-maintaining"
      )
    ).toBe(true);
    const diner = run.state.actors.diner;
    expect(diner.acceptance["card-bill-domain::card-bill-instrument"].accepts).toBe(true);
    expect(diner.acceptance["cash-tip-domain::cash-tip-instrument"].accepts).toBe(true);
    expect(
      scenario.relationships
        .filter(relationship => relationship.domainId === "cash-tip-domain")
        .flatMap(relationship => [relationship.fromActorId, relationship.toActorId])
    ).not.toContain("processor");
  });

  test("ongoing external keeper funding remains supported, not self-maintaining", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.keeperAssignments[0].funding = "external";
    scenario.keeperAssignments[0].fundingActorIds = [];
    scenario.keeperAssignments[0].externalPayerIds = ["external-sponsor"];
    scenario.keeperAssignments[0].externalFundingBudgetPerTick = 1_000;
    scenario.keeperAssignments[0].fundingCapacityPerActorPerTick = 0;

    const run = runSelectionLifecycle(scenario, "external-support");
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "installed-supported"
    );
  });

  test("an executable external fallback remains declared support after an internal primary fails", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const primary = scenario.keeperAssignments[0];
    const fallback: KeeperAssignmentSpec = {
      ...primary,
      id: "external-fallback-keeper",
      reliabilityPpm: 1_000_000,
      funding: "external",
      fundingActorIds: [],
      externalPayerIds: ["external-fallback-sponsor"],
      externalFundingBudgetPerTick: 100_000,
      fundingCapacityPerActorPerTick: 0,
    };
    delete fallback.fallbackAssignmentId;
    scenario.keeperAssignments.push(fallback);
    primary.reliabilityPpm = 1;
    primary.fallbackAssignmentId = "external-fallback-keeper";
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "external-fallback-support");
    const primingStop = run.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (primingStop === undefined) throw new Error("fixture never removed priming");
    expect(
      run.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.at.tick >= primingStop.at.tick &&
          event.keeperAssignmentId === "external-fallback-keeper" &&
          event.fundingSource === "external" &&
          event.outcome === "acted"
      )
    ).toBe(true);
    const runtime = run.state.domainInstruments["tally-domain::tally-instrument"];
    expect(runtime.activeExternalSupport).toBe(true);
    expect(runtime.lifecycle).toBe("installed-supported");
  });

  test("a bilateral external fallback that cannot staff an edge is not support", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const primary = scenario.keeperAssignments[0];
    const fallback: KeeperAssignmentSpec = {
      ...primary,
      id: "wrong-counterparty-fallback",
      actorIds: ["knight-a", "knight-c"],
      requiredActorsPerAction: 2,
      funding: "external",
      fundingActorIds: [],
      externalPayerIds: ["unused-external-sponsor"],
      externalFundingBudgetPerTick: 100_000,
      fundingCapacityPerActorPerTick: 0,
    };
    delete fallback.fallbackAssignmentId;
    scenario.keeperAssignments.push(fallback);
    primary.fallbackAssignmentId = fallback.id;
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "unusable-external-fallback");
    expect(
      run.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.keeperAssignmentId === fallback.id &&
          event.outcome === "acted"
      )
    ).toBe(false);
    const runtime = run.state.domainInstruments["tally-domain::tally-instrument"];
    expect(runtime.activeExternalSupport).toBe(false);
    expect(runtime.lifecycle).toBe("installed-self-maintaining");
  });

  test("unassigned open boundaries remain failures rather than actorless skyhooks", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const keeper = scenario.keeperAssignments[0];
    keeper.actorIds = [];
    keeper.requiredActorsPerAction = 1;
    keeper.rewardPerAction = 0;
    keeper.funding = "unfunded";
    keeper.fundingActorIds = [];
    keeper.externalPayerIds = [];
    keeper.externalFundingBudgetPerTick = 0;
    keeper.fundingCapacityPerActorPerTick = 0;
    keeper.openBoundary = {
      description: "somebody in the world might notice",
      failureSignal: "no named actor acts",
    };

    const run = runSelectionLifecycle(scenario, "no-skyhook");
    expect(
      run.events.some(event => event.type === "keeper-action-recorded" && event.outcome === "acted")
    ).toBe(false);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).not.toBe(
      "installed-self-maintaining"
    );
  });

  test("internally funded keeper rewards have an equal participant-side debit", () => {
    const scenario = createCardCashCoexistenceScenario();
    const run = runSelectionLifecycle(scenario, "reward-conservation", { ticks: 1 });
    const actors = Object.values(run.state.actors);
    const rewards = actors.reduce((sum, actor) => sum + actor.keeperRewards, 0);
    const fundingCosts = actors.reduce((sum, actor) => sum + actor.keeperFundingCosts, 0);

    expect(rewards).toBeGreaterThan(0);
    expect(fundingCosts).toBe(rewards);
  });

  test("installed incumbent complements add to the challenger's cold-start bid", () => {
    const sufficient = createChallengerIncumbentScenario();
    const insufficient = cloneScenario(sufficient);
    insufficient.primingMechanisms[0].switchingCostOffset = 400;

    const winningRun = runSelectionLifecycle(sufficient, "incumbent-defence");
    const losingRun = runSelectionLifecycle(insufficient, "incumbent-defence");
    expect(
      winningRun.summary.lifecycleByDomainInstrument["challenger-domain::challenger-instrument"]
    ).toBe("installed-self-maintaining");
    expect(
      winningRun.state.actors["buyer-a"].acceptance["challenger-domain::challenger-instrument"]
        .installedComplement
    ).toBe(500);
    expect(
      losingRun.summary.lifecycleByDomainInstrument["challenger-domain::challenger-instrument"]
    ).not.toBe("installed-self-maintaining");
  });

  test("distributed assignment records the actual keeper actors", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, "distributed-keepers");
    const actors = new Set(
      run.events.flatMap(event =>
        event.type === "keeper-action-recorded" && event.outcome === "acted" ? [event.actorId] : []
      )
    );
    expect(actors.has(null)).toBe(false);
    expect(actors).toEqual(new Set(["knight-a", "knight-b", "knight-c", "knight-d"]));
    for (const event of run.events) {
      if (event.type !== "keeper-action-recorded" || event.outcome !== "acted") continue;
      const edge = scenario.circuits[0].edges.find(
        candidate => candidate.id === event.circuitEdgeId
      );
      expect(edge?.loadBearingActorIds).toContain(event.actorId);
    }
  });

  test("a targeted seed becomes a vulnerable cluster and then a staged cascade", () => {
    const scenario = createTallyRopeScenario();
    expect(scenario.primingMechanisms[0].targetActorIds).toEqual(["knight-a"]);
    const run = runSelectionLifecycle(scenario, "seed-cluster-cascade");
    const acceptanceByTick = new Map(
      run.events.flatMap(event =>
        event.type === "adoption-batch-applied"
          ? [
              [
                event.at.tick,
                event.decisions
                  .filter(decision => decision.acceptance.accepts)
                  .map(decision => decision.actorId)
                  .sort(),
              ] as const,
            ]
          : []
      )
    );

    expect(acceptanceByTick.get(0)).toEqual(["knight-a"]);
    expect(acceptanceByTick.get(1)).toEqual(["knight-a", "knight-b", "knight-d"]);
    expect(acceptanceByTick.get(2)).toEqual(["knight-a", "knight-b", "knight-c", "knight-d"]);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "installed-self-maintaining"
    );
    expect(
      run.state.actors["knight-c"].acceptance["tally-domain::tally-instrument"].installedComplement
    ).toBe(500);
  });

  test("a failed renewal creates neither a completed cycle nor realised surplus", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const renewal = scenario.circuits[0].edges.find(edge => edge.renewal);
    if (renewal === undefined) throw new Error("fixture lost renewal edge");
    const blocker = scenario.continuationAssumptions.find(
      assumption =>
        assumption.actorId === renewal.loadBearingActorIds[0] && assumption.action === "renew"
    );
    if (blocker === undefined) throw new Error("fixture lost renewal continuation claim");
    blocker.oneShotDefectionGain = 1_000_000;

    const run = runSelectionLifecycle(scenario, "renewal-margin-blocks", { ticks: 4 });
    expect(
      run.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.circuitAction === "renew" &&
          event.outcome === "completed"
      )
    ).toHaveLength(0);
    expect(Object.values(run.state.actors).map(actor => actor.realisedSurplus)).toEqual([
      0, 0, 0, 0,
    ]);
    expect(run.state.circuits["tally-circuit"].recentCompletedCycles).toEqual([0, 0, 0, 0]);
  });

  test("actual keeper assignment cost controls post-priming viability", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.keeperAssignments[0].costPerAction = 1_000_000;
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "actual-keeper-cost");
    const primingStopped = run.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (primingStopped === undefined) throw new Error("fixture never removed priming");

    expect(run.summary.weakestKeeperMargin?.margin).toBeLessThan(0);
    expect(
      run.events.filter(
        event =>
          event.type === "keeper-action-recorded" &&
          event.at.tick >= primingStopped.at.tick &&
          event.outcome === "acted" &&
          event.fundingSource === "internal"
      )
    ).toHaveLength(0);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).not.toBe(
      "installed-self-maintaining"
    );
  });

  test("concrete keeper economics replace stale generic estimates in the lifecycle gate", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    for (const assumption of scenario.continuationAssumptions) {
      if (assumption.action === "authenticate") assumption.keeperEffortCost = 1_000_000;
    }
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "concrete-economics-win");
    expect(run.summary.weakestKeeperMargin?.margin).toBeGreaterThan(0);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "installed-self-maintaining"
    );
  });

  test("one continuation value cannot fund repeated same-tick keeper work", () => {
    const keeperBurden = cloneScenario(createTallyRopeScenario());
    const keeper = keeperBurden.keeperAssignments[0];
    keeper.costPerAction = 600;
    keeper.rewardPerAction = 0;
    keeper.funding = "unfunded";
    keeper.fundingActorIds = [];
    keeper.fundingCapacityPerActorPerTick = 0;
    assertValidScenario(keeperBurden);

    const keeperRun = runSelectionLifecycle(keeperBurden, "cumulative-keeper-economics");
    const keeperPrimingStop = keeperRun.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (keeperPrimingStop === undefined) throw new Error("keeper fixture never removed priming");
    expect(
      keeperRun.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.at.tick >= keeperPrimingStop.at.tick &&
          event.circuitAction === "renew" &&
          event.outcome === "completed"
      )
    ).toHaveLength(0);
    expect(
      keeperRun.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]
    ).not.toBe("installed-self-maintaining");
    expect(keeperRun.summary.weakestKeeperMargin).toBeNull();

    const fundingBurden = cloneScenario(createTallyRopeScenario());
    fundingBurden.keeperAssignments[0].rewardPerAction = 600;
    fundingBurden.primingMechanisms[0].totalBudget = 100_000;
    assertValidScenario(fundingBurden);
    const fundingRun = runSelectionLifecycle(fundingBurden, "cumulative-funding-economics");
    const fundingPrimingStop = fundingRun.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (fundingPrimingStop === undefined) throw new Error("funding fixture never removed priming");
    expect(
      fundingRun.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.at.tick >= fundingPrimingStop.at.tick &&
          event.circuitAction === "renew" &&
          event.outcome === "completed"
      )
    ).toHaveLength(0);
    expect(
      fundingRun.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]
    ).not.toBe("installed-self-maintaining");
  });

  test("self-maintenance requires a full post-removal operating window", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const keeper = scenario.keeperAssignments[0];
    keeper.costPerAction = 600;
    keeper.rewardPerAction = 0;
    keeper.funding = "unfunded";
    keeper.fundingActorIds = [];
    keeper.fundingCapacityPerActorPerTick = 0;
    scenario.circuits[0].windowTicks = 4;
    scenario.domains[0].maintenance.removalTestTicks = 1;
    scenario.primingMechanisms[0].removalTestTicks = 1;
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "fresh-post-removal-evidence", { ticks: 7 });
    const primingStop = run.events.find(
      event => event.type === "priming-stopped" && event.primingMechanismId === "tally-priming"
    );
    if (primingStop === undefined) throw new Error("fixture never removed priming");
    expect(
      run.events.filter(
        event =>
          event.type === "trade-resolved" &&
          event.at.tick >= primingStop.at.tick &&
          event.circuitAction === "renew" &&
          event.outcome === "completed"
      )
    ).toHaveLength(0);
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" && event.to === "installed-self-maintaining"
      )
    ).toBe(false);
  });

  test("a self-maintaining lifecycle becomes fragile on a current keeper-path failure", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const keeper = scenario.keeperAssignments[0];
    keeper.costPerAction = 150;
    keeper.rewardPerAction = 0;
    keeper.funding = "unfunded";
    keeper.fundingActorIds = [];
    keeper.fundingCapacityPerActorPerTick = 0;
    scenario.circuits[0].windowTicks = 4;
    scenario.domains[0].maintenance.removalTestTicks = 1;
    scenario.primingMechanisms[0].removalTestTicks = 1;
    scenario.shocks.push({
      tick: 10,
      kind: "scale-opportunities",
      domainId: "tally-domain",
      factorPpm: 500_000,
    });
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "shock-44", { ticks: 11 });
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" &&
          event.at.tick < 10 &&
          event.to === "installed-self-maintaining"
      )
    ).toBe(true);
    const failedWindow = run.events.find(
      event =>
        event.type === "domain-window-recorded" &&
        event.at.tick === 10 &&
        event.domainId === "tally-domain"
    );
    if (failedWindow?.type !== "domain-window-recorded") {
      throw new Error("fixture lost its tick-10 domain window");
    }
    expect(failedWindow.completedCircuitCycles).toBe(0);
    expect(failedWindow.keeperCoveragePpm).toBe(833_333);
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" &&
          event.at.tick === 10 &&
          event.from === "installed-self-maintaining" &&
          event.to === "fragile"
      )
    ).toBe(true);
    expect(run.summary.weakestKeeperMargin).toBeNull();
  });

  test("a tolerated reliability miss remains governed by the declared windows", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.keeperAssignments[0].reliabilityPpm = 900_000;
    scenario.circuits[0].minCompletedCycles = 1;
    scenario.circuits[0].maxFailurePpm = 500_000;
    scenario.circuits[0].windowTicks = 2;
    scenario.domains[0].maintenance.minKeeperCoveragePpm = 500_000;
    scenario.domains[0].maintenance.windowTicks = 2;
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "tol-7", { ticks: 9 });
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" &&
          event.at.tick === 6 &&
          event.to === "installed-self-maintaining"
      )
    ).toBe(true);
    expect(
      run.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.at.tick === 8 &&
          event.reason === "reliability draw failed"
      )
    ).toBe(true);
    expect(
      run.events.some(
        event =>
          event.type === "lifecycle-transitioned" &&
          event.at.tick === 8 &&
          event.from === "installed-self-maintaining" &&
          event.to === "fragile"
      )
    ).toBe(false);
    const runtime = run.state.domainInstruments["tally-domain::tally-instrument"];
    expect(runtime.recentCircuitCycles.slice(-2)).toEqual([1, 0]);
    expect(runtime.recentKeeperCoveragePpm.slice(-2)).toEqual([1_000_000, 0]);
    expect(runtime.lifecycle).toBe("installed-self-maintaining");
  });

  test("a reliability miss cannot mask exhausted cumulative funder economics", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.primingMechanisms = [];
    scenario.initialCondition = "inherited-installed";
    scenario.domains[0].initialLifecycleByInstrument["tally-instrument"] =
      "installed-self-maintaining";
    for (const actor of scenario.actors) {
      const acceptance = actor.acceptance.find(
        item => item.domainId === "tally-domain" && item.instrumentId === "tally-instrument"
      );
      if (acceptance !== undefined) acceptance.initiallyAccepts = true;
    }
    const keeper = scenario.keeperAssignments[0];
    keeper.topology = "provider";
    keeper.requiredActorsPerAction = 1;
    keeper.rewardPerAction = 600;
    keeper.reliabilityPpm = 900_000;
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "fundmask-5", { ticks: 1 });
    const respendEdge = scenario.circuits[0].edges.find(edge => edge.action === "respend");
    if (respendEdge === undefined) throw new Error("fixture lost its respend edge");
    const maskedFailure = run.events.find(
      event => event.type === "keeper-action-recorded" && event.circuitEdgeId === respendEdge.id
    );
    if (maskedFailure?.type !== "keeper-action-recorded") {
      throw new Error("fixture lost its respend keeper event");
    }
    expect(maskedFailure.reason).toBe("reliability draw failed");
    expect(maskedFailure.rootEconomicsCovered).toBe(false);
    expect(run.summary.weakestKeeperMargin).toBeNull();
    expect(run.state.domainInstruments["tally-domain::tally-instrument"].lifecycle).toBe("fragile");
  });

  test("priming-carried reliability failure does not invoke internal-funder economics", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.initialCondition = "inherited-installed";
    scenario.domains[0].initialLifecycleByInstrument["tally-instrument"] = "installed-supported";
    for (const actor of scenario.actors) {
      const acceptance = actor.acceptance.find(
        item => item.domainId === "tally-domain" && item.instrumentId === "tally-instrument"
      );
      if (acceptance !== undefined) acceptance.initiallyAccepts = true;
    }
    const keeper = scenario.keeperAssignments[0];
    keeper.reliabilityPpm = 0;
    keeper.rewardPerAction = 2_000;
    scenario.primingMechanisms[0].totalBudget = 100_000;
    scenario.primingMechanisms[0].stopCondition = { kind: "tick", tick: 10 };
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "priming-reliability", { ticks: 1 });
    const failed = run.events.find(
      event => event.type === "keeper-action-recorded" && event.reason === "reliability draw failed"
    );
    if (failed?.type !== "keeper-action-recorded") {
      throw new Error("fixture lost its priming-carried reliability miss");
    }
    expect(failed.rootEconomicsCovered).toBe(true);
    expect(run.state.domainInstruments["tally-domain::tally-instrument"].lifecycle).toBe(
      "installed-supported"
    );
  });

  test("unused keeper assignments and nonselected fallback branches do not gate continuation", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const primary = scenario.keeperAssignments[0];
    scenario.keeperAssignments.push({
      ...primary,
      id: "unused-expensive-keeper",
      costPerAction: 1_000_000,
    });
    assertValidScenario(scenario);

    const run = runSelectionLifecycle(scenario, "unused-keeper-is-not-load-bearing");
    expect(
      run.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.keeperAssignmentId === "unused-expensive-keeper"
      )
    ).toBe(false);
    expect(run.summary.weakestKeeperMargin?.margin).toBeGreaterThan(0);
    expect(run.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "installed-self-maintaining"
    );

    const fallbackScenario = cloneScenario(createTallyRopeScenario());
    const failingPrimary = fallbackScenario.keeperAssignments[0];
    fallbackScenario.keeperAssignments.push({
      ...failingPrimary,
      id: "viable-fallback-keeper",
    });
    failingPrimary.costPerAction = 1_000_000;
    failingPrimary.fallbackAssignmentId = "viable-fallback-keeper";
    assertValidScenario(fallbackScenario);
    const fallbackRun = runSelectionLifecycle(fallbackScenario, "fallback-or-path");
    expect(
      fallbackRun.events.some(
        event =>
          event.type === "keeper-action-recorded" &&
          event.keeperAssignmentId === "viable-fallback-keeper" &&
          event.outcome === "acted"
      )
    ).toBe(true);
    expect(fallbackRun.summary.weakestKeeperMargin?.margin).toBeGreaterThan(0);
    expect(fallbackRun.summary.lifecycleByDomainInstrument["tally-domain::tally-instrument"]).toBe(
      "installed-self-maintaining"
    );
  });

  test("renewal realises only opportunities claimed by load-bearing circuit actions", () => {
    const baselineScenario = createTallyRopeScenario();
    const scenario = cloneScenario(baselineScenario);
    const baseOpportunity = scenario.continuationOpportunities[0];
    const diagnosticOpportunity = {
      ...baseOpportunity,
      id: "tally-diagnostic-opportunity",
      accessibleSurplus: baseOpportunity.accessibleSurplus.map(entry => ({
        ...entry,
        components: entry.components.map(component => ({
          ...component,
          amount: component.amount * 100,
          overlapKey: `diagnostic-${component.overlapKey}`,
        })),
      })),
    };
    scenario.continuationOpportunities.push(diagnosticOpportunity);
    const template = scenario.continuationAssumptions[0];
    scenario.continuationAssumptions.push({
      ...template,
      id: "tally-diagnostic-repay",
      actorId: "knight-a",
      action: "repay",
      opportunityIds: [diagnosticOpportunity.id],
    });
    assertValidScenario(scenario);

    const seed = "claimed-realisation-only";
    const baseline = runSelectionLifecycle(baselineScenario, seed);
    const augmented = runSelectionLifecycle(scenario, seed);
    const realised = (run: typeof baseline): number =>
      Object.values(run.state.actors).reduce((sum, actor) => sum + actor.realisedSurplus, 0);

    expect(realised(augmented)).toBe(realised(baseline));
  });

  test("a claimed inactive zero-probability opportunity realises no surplus", () => {
    const baselineScenario = createTallyRopeScenario();
    const scenario = cloneScenario(baselineScenario);
    const baseOpportunity = scenario.continuationOpportunities[0];
    scenario.relationships.push({
      ...scenario.relationships[0],
      id: "inactive-opportunity-relationship",
      active: false,
    });
    const inactiveOpportunity = {
      ...baseOpportunity,
      id: "inactive-zero-opportunity",
      relationshipId: "inactive-opportunity-relationship",
      arrivalPpm: 0,
      clearProbabilityPpm: 0,
      accessibleSurplus: baseOpportunity.accessibleSurplus.map(entry => ({
        ...entry,
        components: entry.components.map(component => ({
          ...component,
          amount: 1_000_000,
          overlapKey: `inactive-${component.overlapKey}`,
        })),
      })),
    };
    scenario.continuationOpportunities.push(inactiveOpportunity);
    const acquireClaim = scenario.continuationAssumptions.find(
      assumption => assumption.actorId === "knight-a" && assumption.action === "acquire"
    );
    if (acquireClaim === undefined) throw new Error("fixture lost acquire claim");
    acquireClaim.opportunityIds.push(inactiveOpportunity.id);
    assertValidScenario(scenario);

    const seed = "inactive-opportunity-is-not-realised";
    const baseline = runSelectionLifecycle(baselineScenario, seed);
    const augmented = runSelectionLifecycle(scenario, seed);
    const realised = (run: typeof baseline): number =>
      Object.values(run.state.actors).reduce((sum, actor) => sum + actor.realisedSurplus, 0);

    expect(realised(augmented)).toBe(realised(baseline));
  });

  test("priming spend is conserved across named payer debits and carried keeper work", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, "priming-conservation");
    const totalSpent = Object.values(run.state.priming).reduce(
      (sum, runtime) => sum + runtime.spent,
      0
    );
    const participantDebits = Object.values(run.state.actors).reduce(
      (sum, actor) => sum + actor.primingCosts,
      0
    );
    const externalDraw = Object.values(run.state.priming).reduce(
      (sum, runtime) => sum + runtime.externalSpent,
      0
    );
    const spendEvents = run.events.filter(event => event.type === "priming-spend-set");
    const carriedCost = spendEvents.reduce((sum, event) => sum + event.keeperCarryCost, 0);
    const carriedRewards = run.events.reduce(
      (sum, event) =>
        sum +
        (event.type === "keeper-action-recorded" && event.fundingSource === "priming"
          ? event.rewardPaid
          : 0),
      0
    );

    expect(participantDebits + externalDraw).toBe(totalSpent);
    expect(
      spendEvents.reduce((sum, event) => sum + event.baseCost + event.keeperCarryCost, 0)
    ).toBe(totalSpent);
    expect(carriedCost).toBe(carriedRewards);
    expect(run.state.actors[scenario.primingMechanisms[0].payerIds[0]].primingCosts).toBe(
      totalSpent
    );
  });

  test("declared support cannot mask a failed circuit or failed maintenance", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    const keeper = scenario.keeperAssignments[0];
    keeper.funding = "external";
    keeper.fundingActorIds = [];
    keeper.externalPayerIds = ["maintenance-sponsor"];
    keeper.externalFundingBudgetPerTick = 10_000;
    keeper.fundingCapacityPerActorPerTick = 0;
    scenario.shocks.push({
      tick: 6,
      kind: "scale-opportunities",
      domainId: "tally-domain",
      factorPpm: 0,
    });

    const run = runSelectionLifecycle(scenario, "support-is-not-maintenance");
    const runtime = run.state.domainInstruments["tally-domain::tally-instrument"];
    expect(runtime.activeExternalSupport).toBe(true);
    expect(["fragile", "declining", "collapsed"]).toContain(runtime.lifecycle);
  });

  test("a non-external priming wedge starts its removal clock on installation", () => {
    const scenario = cloneScenario(createTallyRopeScenario());
    scenario.primingMechanisms[0].externalInput = false;

    const run = runSelectionLifecycle(scenario, "internal-wedge-removal-clock");
    const runtime = run.state.domainInstruments["tally-domain::tally-instrument"];
    expect(runtime.wedgeRemovedAtTick).not.toBeNull();
    expect(runtime.lifecycle).toBe("installed-self-maintaining");
  });
});
