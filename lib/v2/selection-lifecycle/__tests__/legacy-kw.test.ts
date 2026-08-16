/** @jest-environment node */

import { LEGACY_KW_SCALE, runLegacyKw, stepLegacyKw, type LegacyKwState } from "../legacy-kw.js";
import { createInitialState } from "../reducer.js";
import { createTallyRopeScenario } from "../scenarios.js";

function legacyState(overrides: Partial<LegacyKwState> = {}): LegacyKwState {
  return {
    round: 8,
    ledger: [9_000, 8_000, 0],
    marketability: [1_000, 2_001, 50],
    isMoney: [false, false, false],
    adopt: 250,
    decay: 100,
    ...overrides,
  };
}

describe("frozen V1 KiyotakiWright characterization", () => {
  test("uses strict greater-than at the holding-cost threshold", () => {
    const initial = legacyState();

    const next = stepLegacyKw(initial);

    // good 0 is exactly at 10_000 - ledger[0], so it decays;
    // good 1 is one point above its threshold, so it adopts.
    expect(next.marketability).toEqual([900, 2_251, 0]);
    expect(next.round).toBe(9);
    expect(next.isMoney).toEqual([false, false, false]);
    expect(initial.marketability).toEqual([1_000, 2_001, 50]);
    expect(initial.round).toBe(8);
  });

  test("caps an adopting score at SCALE and sets the historical flag", () => {
    const next = stepLegacyKw(
      legacyState({
        ledger: [LEGACY_KW_SCALE, 0, 0],
        marketability: [9_950, 0, 0],
        adopt: 250,
      })
    );

    expect(next.marketability[0]).toBe(LEGACY_KW_SCALE);
    expect(next.isMoney).toEqual([true, false, false]);
  });

  test("retains V1's sticky isMoney flag after marketability falls", () => {
    const next = stepLegacyKw(
      legacyState({
        ledger: [9_000, 0, 0],
        marketability: [500, 0, 0],
        isMoney: [true, false, false],
      })
    );

    expect(next.marketability[0]).toBe(400);
    expect(next.isMoney[0]).toBe(true);
  });

  test("returns the initial snapshot plus exactly one snapshot per round", () => {
    const initial = legacyState({ round: 0 });
    const trace = runLegacyKw(initial, 3);

    expect(trace).toHaveLength(4);
    expect(trace.map(state => state.round)).toEqual([0, 1, 2, 3]);
    expect(initial.round).toBe(0);
    expect(initial.marketability).toEqual([1_000, 2_001, 50]);
  });

  test("confines the sticky flag to the compatibility trace, not V2 lifecycle state", () => {
    const legacy = stepLegacyKw(
      legacyState({
        ledger: [LEGACY_KW_SCALE, 0, 0],
        marketability: [LEGACY_KW_SCALE, 0, 0],
      })
    );
    const scenario = createTallyRopeScenario();
    const v2State = createInitialState(scenario);

    expect(legacy).toHaveProperty("isMoney");
    expect(scenario.policies.every(policy => policy.kind !== "legacy-kw-threshold")).toBe(true);
    for (const runtime of Object.values(v2State.domainInstruments)) {
      expect(runtime).toHaveProperty("lifecycle");
      expect(runtime).not.toHaveProperty("isMoney");
    }
  });
});
