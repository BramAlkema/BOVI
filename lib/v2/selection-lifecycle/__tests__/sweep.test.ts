/** @jest-environment node */

import { createTallyRopeScenario } from "../scenarios.js";
import { runParameterSweep } from "../sweep.js";

describe("parameter sweeps", () => {
  test("forms a deterministic Cartesian grid with replicated seeds", () => {
    const scenario = createTallyRopeScenario();
    const axes = [
      { path: "/keeperAssignments/0/costPerAction", values: [10, 100] },
      { path: "/primingMechanisms/0/totalBudget", values: [40, 120] },
    ];
    const first = runParameterSweep(scenario, axes, ["a", "b"], { ticks: 4 });
    const second = runParameterSweep(scenario, axes, ["a", "b"], { ticks: 4 });

    expect(first.records).toHaveLength(8);
    expect(first).toEqual(second);
    expect(scenario.keeperAssignments[0].costPerAction).toBe(25);
  });

  test("rejects a nonnumeric or nonexistent target", () => {
    const scenario = createTallyRopeScenario();
    expect(() => runParameterSweep(scenario, [{ path: "/title", values: [1] }], ["seed"])).toThrow(
      /numeric/
    );
    expect(() =>
      runParameterSweep(scenario, [{ path: "/does-not-exist", values: [1] }], ["seed"])
    ).toThrow(/does not exist/);
  });

  test("does not advertise a positive margin after observed cumulative keeper failure", () => {
    const scenario = createTallyRopeScenario();
    const keeper = scenario.keeperAssignments[0];
    keeper.rewardPerAction = 0;
    keeper.funding = "unfunded";
    keeper.fundingActorIds = [];
    keeper.fundingCapacityPerActorPerTick = 0;

    const sweep = runParameterSweep(
      scenario,
      [{ path: "/keeperAssignments/0/costPerAction", values: [600] }],
      ["cumulative-keeper-economics"]
    );

    expect(sweep.records[0].weakestKeeperMargin).toBeNull();
    expect(sweep.records[0].lifecycleByDomainInstrument["tally-domain::tally-instrument"]).not.toBe(
      "installed-self-maintaining"
    );
  });
});
