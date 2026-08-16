/** @jest-environment node */

import { canonicalJson } from "../canonical-json.js";
import { runSelectionLifecycle } from "../engine.js";
import type { SimulationEvent } from "../events.js";
import { createTallyRopeScenario } from "../scenarios.js";
import { verifyDeterministicTrace } from "../verification.js";

function copyEvents(events: readonly SimulationEvent[]): SimulationEvent[] {
  return JSON.parse(JSON.stringify(events)) as SimulationEvent[];
}

describe("strict deterministic trace verification", () => {
  const seed = "strict-trace";
  const ticks = 6;

  test("accepts the exact scenario, seed, horizon and trace", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, seed, { ticks });

    expect(
      canonicalJson(verifyDeterministicTrace({ scenario, seed, ticks, events: run.events }))
    ).toBe(canonicalJson(run.state));
  });

  test("snapshots the supplied JSON array instead of re-consuming its iterator", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, seed, { ticks: 1 });
    const events = new Proxy(run.events, {
      get(target, property, receiver) {
        if (property === Symbol.iterator) {
          return function hostileIterator() {
            throw new Error("the caller iterator was consumed after verification");
          };
        }
        return Reflect.get(target, property, receiver);
      },
    });

    expect(() => verifyDeterministicTrace({ scenario, seed, ticks: 1, events })).not.toThrow();
  });

  test.each([
    "trade-attempted",
    "trade-resolved",
    "keeper-action-recorded",
    "domain-window-recorded",
    "circuit-credibility-set",
    "lifecycle-transitioned",
  ] as const)("rejects omission of a %s event", eventType => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, seed, { ticks });
    const index = run.events.findIndex(event => event.type === eventType);
    expect(index).toBeGreaterThanOrEqual(0);
    const events = copyEvents(run.events);
    events.splice(index, 1);

    expect(() => verifyDeterministicTrace({ scenario, seed, ticks, events })).toThrow(
      /deterministic trace mismatch/
    );
  });

  test("rejects coordinated omissions and a forged zero-activity window", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, seed, { ticks: 1 });
    const events = copyEvents(run.events).filter(
      event =>
        event.type !== "trade-attempted" &&
        event.type !== "trade-resolved" &&
        event.type !== "keeper-action-recorded"
    );
    const window = events.find(event => event.type === "domain-window-recorded");
    if (window?.type !== "domain-window-recorded") {
      throw new Error("fixture lost its activity window");
    }
    window.attemptedTrades = 0;
    window.attemptedCircuitCycles = 0;
    window.completedTrades = 0;
    window.completedCircuitCycles = 0;
    window.keeperCoveragePpm = 0;
    window.circuitResults = window.circuitResults.map(result => ({
      ...result,
      attemptedCycles: 0,
      completedCycles: 0,
    }));

    expect(() => verifyDeterministicTrace({ scenario, seed, ticks: 1, events })).toThrow(
      /deterministic trace mismatch/
    );
  });

  test("rejects payload changes, an extra event, wrong seed and wrong horizon", () => {
    const scenario = createTallyRopeScenario();
    const run = runSelectionLifecycle(scenario, seed, { ticks });
    const changed = copyEvents(run.events);
    const adoption = changed.find(event => event.type === "adoption-batch-applied");
    if (adoption?.type !== "adoption-batch-applied") {
      throw new Error("fixture lost its adoption batch");
    }
    adoption.decisions[0].reason = "forged while retaining the event id";
    expect(() => verifyDeterministicTrace({ scenario, seed, ticks, events: changed })).toThrow(
      /deterministic trace mismatch/
    );

    expect(() =>
      verifyDeterministicTrace({
        scenario,
        seed,
        ticks,
        events: [...run.events, run.events[run.events.length - 1]],
      })
    ).toThrow(/deterministic trace mismatch/);
    expect(() =>
      verifyDeterministicTrace({ scenario, seed: "wrong-seed", ticks, events: run.events })
    ).toThrow(/deterministic trace mismatch/);
    expect(() =>
      verifyDeterministicTrace({ scenario, seed, ticks: 5, events: run.events })
    ).toThrow(/deterministic trace mismatch/);
  });
});
