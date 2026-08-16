/** @jest-environment node */

import {
  ExperimentCalibrationAdapter,
  LedgerTraceAdapter,
  mapLegacyPairedWrite,
  type ExperimentCalibrationObservation,
  type LedgerTraceObservation,
} from "../adapters.js";

function ledgerObservation(): LedgerTraceObservation {
  return {
    observationVersion: "selection-observation/v1",
    id: "ledger-observation-1",
    kind: "ledger-trace",
    domainId: "tally-domain",
    reporterId: "operator",
    method: "paired write",
    provenance: "test fixture",
    sourceTimestamp: null,
    observedFromTick: 8,
    observedThroughTick: 10,
    uncertaintyPpm: 0,
    freshnessTicks: 2,
    challengeStatus: "unchallenged",
    lineage: ["fixture"],
    payload: {
      debitActorId: "alice",
      creditActorId: "bob",
      amount: 25,
      writeAuthority: "operator",
      conservationChecked: true,
      completion: "posted",
    },
  };
}

function experimentObservation(
  preregisteredAtTick: number,
  firstObservationTick: number
): ExperimentCalibrationObservation {
  return {
    observationVersion: "selection-observation/v1",
    id: "experiment-observation-1",
    kind: "experiment-calibration",
    domainId: "experiment-domain",
    reporterId: "experimenter",
    method: "preregistered treatment comparison",
    provenance: "test fixture",
    sourceTimestamp: null,
    observedFromTick: firstObservationTick,
    observedThroughTick: firstObservationTick + 5,
    uncertaintyPpm: 100_000,
    freshnessTicks: 20,
    challengeStatus: "unchallenged",
    lineage: ["fixture"],
    payload: {
      armId: "treatment-a",
      preregisteredAtTick,
      firstObservationTick,
      observations: 20,
      bindingFrequencyPpm: 500_000,
      effectEstimate: 12,
    },
  };
}

describe("evidence adapters", () => {
  test("rejects lifecycle state at either envelope or payload level", () => {
    const payloadLifecycle = {
      ...ledgerObservation(),
      payload: {
        ...ledgerObservation().payload,
        lifecycle: "installed-self-maintaining",
      },
    } as unknown as LedgerTraceObservation;
    const envelopeLifecycle = {
      ...ledgerObservation(),
      lifecycle: "installed-self-maintaining",
    } as unknown as LedgerTraceObservation;

    expect(() => new LedgerTraceAdapter([payloadLifecycle])).toThrow(/cannot emit lifecycle/);
    expect(() => new LedgerTraceAdapter([envelopeLifecycle])).toThrow(/cannot emit lifecycle/);
  });

  test("copies and freezes observations instead of exposing writable evidence", () => {
    const source = ledgerObservation();
    const adapter = new LedgerTraceAdapter([source]);
    (source.payload as { amount: number }).amount = 999;
    (source.lineage as string[]).push("later mutation");

    const [observed] = adapter.observe();
    expect(observed.payload.amount).toBe(25);
    expect(observed.lineage).toEqual(["fixture"]);
    expect(Object.isFrozen(observed)).toBe(true);
    expect(Object.isFrozen(observed.payload)).toBe(true);
    expect(Object.isFrozen(observed.lineage)).toBe(true);
    expect(() => {
      (observed.payload as { amount: number }).amount = 100;
    }).toThrow(TypeError);
  });

  test("applies both observation interval and declared freshness", () => {
    const adapter = new LedgerTraceAdapter([ledgerObservation()]);

    expect(adapter.observe({ observedAtTick: 9 })).toEqual([]);
    expect(adapter.observe({ observedAtTick: 10 })).toHaveLength(1);
    expect(adapter.observe({ observedAtTick: 12 })).toHaveLength(1);
    expect(adapter.observe({ observedAtTick: 13 })).toEqual([]);
    expect(adapter.observe({ domainId: "another-domain" })).toEqual([]);
    expect(adapter.observe({ challengeStatus: "challenged" })).toEqual([]);
  });

  test("maps V1 Settled only to a posted paired-write trace", () => {
    const mapped = mapLegacyPairedWrite({
      id: "legacy-settled-7",
      domainId: "tally-domain",
      debitActorId: "debtor",
      creditActorId: "creditor",
      amount: 80,
      operatorId: "legacy-operator",
      tick: 7,
      provenance: "Kocherlakota V1 Settled event",
    });

    expect(mapped.method).toBe("legacy paired-write event");
    expect(mapped.lineage).toEqual(["Kocherlakota V1 compatibility"]);
    expect(mapped.payload).toEqual({
      debitActorId: "debtor",
      creditActorId: "creditor",
      amount: 80,
      writeAuthority: "legacy-operator",
      conservationChecked: true,
      completion: "posted",
    });
    expect(mapped.payload).not.toHaveProperty("discharged");
    expect(mapped.payload).not.toHaveProperty("settled");
  });

  test("requires experiment preregistration to strictly precede observations", () => {
    expect(() => new ExperimentCalibrationAdapter([experimentObservation(4, 5)])).not.toThrow();
    expect(() => new ExperimentCalibrationAdapter([experimentObservation(5, 5)])).toThrow(
      /preregistration must precede observations/
    );
    expect(() => new ExperimentCalibrationAdapter([experimentObservation(6, 5)])).toThrow(
      /preregistration must precede observations/
    );
  });

  test("validates versions, kinds, periods and typed payload quantities", () => {
    const wrongVersion = {
      ...ledgerObservation(),
      observationVersion: "selection-observation/v0",
    } as unknown as LedgerTraceObservation;
    const wrongKind = {
      ...ledgerObservation(),
      kind: "sink-capacity",
    } as unknown as LedgerTraceObservation;
    const reversedPeriod = {
      ...ledgerObservation(),
      observedFromTick: 11,
      observedThroughTick: 10,
    };
    const unsafeAmount = {
      ...ledgerObservation(),
      payload: { ...ledgerObservation().payload, amount: Number.MAX_SAFE_INTEGER + 1 },
    };
    const badFrequency = {
      ...experimentObservation(4, 5),
      payload: {
        ...experimentObservation(4, 5).payload,
        bindingFrequencyPpm: 1_000_001,
      },
    };

    expect(() => new LedgerTraceAdapter([wrongVersion])).toThrow(/unsupported observation version/);
    expect(() => new LedgerTraceAdapter([wrongKind])).toThrow(/adapter expected/);
    expect(() => new LedgerTraceAdapter([reversedPeriod])).toThrow(/period\/freshness/);
    expect(() => new LedgerTraceAdapter([unsafeAmount])).toThrow(/posted amount/);
    expect(() => new ExperimentCalibrationAdapter([badFrequency])).toThrow(/binding frequency/);
  });
});
