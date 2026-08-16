/** @jest-environment node */

import { canonicalHash, canonicalJson, DETERMINISTIC_HASH_VERSION } from "../canonical-json.js";
import { type AdoptionBatchAppliedEvent } from "../events.js";
import { runSelectionLifecycle } from "../engine.js";
import { createInitialState, reduceEvent, replayEvents, replayScenario } from "../reducer.js";
import { DeterministicRng } from "../rng.js";
import { createTallyRopeScenario } from "../scenarios.js";
import { RNG_VERSION, domainInstrumentKey } from "../types.js";

describe("deterministic foundation", () => {
  describe("named RNG", () => {
    test("matches the versioned golden vector", () => {
      const rng = new DeterministicRng("golden-seed").fork("tick:4", "trade:a-b");

      expect([rng.nextUint32(), rng.nextUint32(), rng.nextPpm()]).toEqual([
        261_151_833, 3_082_898_852, 671_663,
      ]);
      expect(rng.snapshot()).toEqual({
        version: RNG_VERSION,
        rootSeed: "golden-seed",
        streamPath: ["tick:4", "trade:a-b"],
        state: [3_906_656_649, 2_756_570_454, 1_167_539_360, 3_485_582_856],
        draws: 3,
      });
    });

    test("restores the exact next draw", () => {
      const rng = new DeterministicRng("snapshot-seed").fork("tick:2", "keeper");
      rng.nextUint32();
      rng.nextUint32();
      const snapshot = rng.snapshot();
      const expected = [rng.nextUint32(), rng.nextUint32(), rng.nextPpm()];

      const restored = DeterministicRng.restore(snapshot);
      expect([restored.nextUint32(), restored.nextUint32(), restored.nextPpm()]).toEqual(expected);
    });

    test("keeps named forks independent of unrelated consumption", () => {
      const root = new DeterministicRng("common-random-numbers");
      const rightBefore = root.fork("tick:7", "right").nextUint32();

      root.nextUint32();
      root.fork("tick:7", "left").nextUint32();
      root.fork("tick:7", "left").nextUint32();

      expect(root.fork("tick:7", "right").nextUint32()).toBe(rightBefore);
    });
  });

  describe("canonical JSON", () => {
    test("sorts keys recursively and normalises negative zero", () => {
      expect(canonicalJson({ z: 1, a: [{ y: -0, b: true }], middle: "x" })).toBe(
        '{"a":[{"b":true,"y":0}],"middle":"x","z":1}'
      );
    });

    test("rejects values that do not survive a JSON round trip", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      expect(() => canonicalJson({ missing: undefined })).toThrow(TypeError);
      expect(() => canonicalJson(Number.NaN)).toThrow(TypeError);
      expect(() => canonicalJson(new Date("2026-01-01T00:00:00Z"))).toThrow(TypeError);
      expect(() => canonicalJson(circular)).toThrow(/circular reference/);
    });

    test("labels the reproducibility hash as non-cryptographic FNV-1a", () => {
      expect(canonicalHash({ z: 1, a: [true, "x"] })).toBe("fnv1a-64/v1:e49cde45c5e472b3");
      expect(canonicalHash({ z: 1, a: [true, "x"] })).toMatch(
        new RegExp(`^${DETERMINISTIC_HASH_VERSION.replace("/", "\\/")}:`)
      );
    });
  });

  describe("event replay", () => {
    test("updates a fresh state without mutating input or event payload", () => {
      const scenario = createTallyRopeScenario();
      const run = runSelectionLifecycle(scenario, "foundation-adoption", { ticks: 1 });
      const tick = run.events.find(event => event.type === "tick-started");
      const sourceEvent = run.events.find(
        (event): event is AdoptionBatchAppliedEvent => event.type === "adoption-batch-applied"
      );
      if (tick === undefined || sourceEvent === undefined) {
        throw new Error("fixture lost its tick or adoption event");
      }
      const event = JSON.parse(JSON.stringify(sourceEvent)) as AdoptionBatchAppliedEvent;
      const initial = createInitialState(scenario);
      const afterTick = reduceEvent(initial, tick, scenario);
      const expectedAcceptance = { ...event.decisions[0].acceptance };
      const reduced = reduceEvent(afterTick, event, scenario);
      event.decisions[0].acceptance.abandonmentCounter = 99;

      expect(reduced).not.toBe(initial);
      const first = sourceEvent.decisions[0];
      const key = domainInstrumentKey(first.domainId, first.instrumentId);
      expect(initial.actors[first.actorId].acceptance[key].accepts).toBe(false);
      expect(reduced.actors[first.actorId].acceptance[key]).toEqual(expectedAcceptance);
    });

    test("replays strictly increasing logical time and rejects reordering", () => {
      const scenario = createTallyRopeScenario();
      scenario.shocks.push(
        { tick: 0, kind: "deactivate-relationship", relationshipId: "tally-relationship-1" },
        { tick: 0, kind: "scale-opportunities", domainId: "tally-domain", factorPpm: 500_000 }
      );
      const run = runSelectionLifecycle(scenario, "foundation-order", { ticks: 1 });
      const ordered = run.events.slice(0, 4);
      const replayed = replayEvents(createInitialState(scenario), ordered, scenario);
      expect(replayed.lastEventId).toBe(ordered[3].id);
      expect(() =>
        replayEvents(
          createInitialState(scenario),
          [ordered[0], ordered[1], ordered[3], ordered[2]],
          scenario
        )
      ).toThrow(/not strictly later/);
      expect(() =>
        replayEvents(
          createInitialState(scenario),
          [ordered[0], ordered[1], ordered[2], { ...ordered[3], id: ordered[2].id }],
          scenario
        )
      ).toThrow(/Duplicate event id/);
    });

    test("binds event kinds to phases and rejects a truncated scenario trace", () => {
      const scenario = createTallyRopeScenario();
      const run = runSelectionLifecycle(scenario, "foundation-complete", { ticks: 1 });
      const runStarted = run.events.find(event => event.type === "run-started");
      const tick = run.events.find(event => event.type === "tick-started");
      const adoption = run.events.find(event => event.type === "adoption-batch-applied");
      if (runStarted === undefined || tick === undefined || adoption === undefined) {
        throw new Error("fixture lost its run, tick or adoption batch");
      }

      expect(() =>
        reduceEvent(
          createInitialState(scenario),
          { ...tick, at: { ...tick.at, phase: "adoption" } },
          scenario
        )
      ).toThrow(/must occur in the 'shocks' phase/);
      expect(() => replayScenario(scenario, [runStarted, tick, adoption])).toThrow(
        /before every activity window was recorded/
      );
    });
  });
});
