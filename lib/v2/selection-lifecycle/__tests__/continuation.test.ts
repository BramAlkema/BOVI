/** @jest-environment node */

import {
  evaluateAllContinuationAssumptions,
  evaluateContinuationAssumption,
  keeperAssignmentMargin,
  keeperFundingMargin,
  lossProbabilityPpm,
} from "../continuation.js";
import { createInitialState } from "../reducer.js";
import { createTallyRopeScenario } from "../scenarios.js";

describe("actor-specific continuation assumptions", () => {
  test("finding-mediated loss keeps observation, finding and response distinct", () => {
    const scenario = createTallyRopeScenario();
    const assumption = scenario.continuationAssumptions[0];
    assumption.lossPath = {
      kind: "finding-mediated",
      observationPpm: 500_000,
      upheldFindingPpm: 500_000,
      responsePpm: 500_000,
    };
    expect(lossProbabilityPpm(assumption)).toBe(125_000);
  });

  test("margins are per actor/action and may remain negative", () => {
    const scenario = createTallyRopeScenario();
    const assumption = scenario.continuationAssumptions[0];
    assumption.keeperEffortCost = 1_000_000;
    const state = createInitialState(scenario);

    const margin = evaluateContinuationAssumption(scenario, state, assumption);
    expect(margin.actorId).toBe(assumption.actorId);
    expect(margin.margin).toBeLessThan(0);
    expect(margin.holds).toBe(false);
  });

  test("disabling an opportunity relationship removes its accessible flow", () => {
    const scenario = createTallyRopeScenario();
    const state = createInitialState(scenario);
    state.relationships[scenario.continuationOpportunities[0].relationshipId].active = false;

    expect(
      evaluateAllContinuationAssumptions(scenario, state).every(m => m.accessibleFlow === 0)
    ).toBe(true);
  });

  test("same-tick keeper and funder economics are cumulative rather than reusable", () => {
    const scenario = createTallyRopeScenario();
    const state = createInitialState(scenario);
    const assignment = scenario.keeperAssignments[0];
    const margins = evaluateAllContinuationAssumptions(scenario, state);
    const keeperMargin = margins.find(
      margin =>
        margin.actorId === "knight-a" &&
        scenario.continuationAssumptions.find(item => item.id === margin.assumptionId)?.action ===
          "authenticate"
    );
    const fundingMargin = margins.find(
      margin =>
        margin.actorId === "knight-a" &&
        scenario.continuationAssumptions.find(item => item.id === margin.assumptionId)?.action ===
          "fund-keeper"
    );
    if (keeperMargin === undefined || fundingMargin === undefined) {
      throw new Error("fixture lost keeper or funding margin");
    }

    expect(
      keeperAssignmentMargin(scenario, assignment, keeperMargin, "tally-instrument", 0, 600)?.holds
    ).toBe(true);
    expect(
      keeperAssignmentMargin(scenario, assignment, keeperMargin, "tally-instrument", 0, 1_200)
        ?.holds
    ).toBe(false);
    expect(
      keeperFundingMargin(scenario, assignment, fundingMargin, "tally-instrument", 600)?.holds
    ).toBe(true);
    expect(
      keeperFundingMargin(scenario, assignment, fundingMargin, "tally-instrument", 1_200)?.holds
    ).toBe(false);
  });
});
