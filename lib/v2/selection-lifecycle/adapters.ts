import { PPM, type DomainId, type Ppm, type Tick } from "./types.js";

export type ChallengeStatus = "unchallenged" | "challenged" | "upheld" | "rejected";

export interface ObservationEnvelope<TKind extends string, TPayload> {
  observationVersion: "selection-observation/v1";
  id: string;
  kind: TKind;
  domainId: DomainId;
  reporterId: string;
  method: string;
  provenance: string;
  sourceTimestamp: string | null;
  observedFromTick: Tick;
  observedThroughTick: Tick;
  uncertaintyPpm: Ppm;
  freshnessTicks: number;
  challengeStatus: ChallengeStatus;
  lineage: readonly string[];
  payload: Readonly<TPayload>;
}

export interface ObservationQuery {
  domainId?: DomainId;
  observedAtTick?: Tick;
  challengeStatus?: ChallengeStatus;
}

export interface EvidenceAdapter<TObservation> {
  observe(query?: ObservationQuery): readonly TObservation[];
}

type AnyEnvelope = ObservationEnvelope<string, object>;

const CHALLENGE_STATUSES = new Set<ChallengeStatus>([
  "unchallenged",
  "challenged",
  "upheld",
  "rejected",
]);

function requireText(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be non-empty text`);
  }
}

function requireSafeInteger(value: unknown, label: string, minimum = 0): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new RangeError(`${label} must be a safe integer >= ${minimum}`);
  }
}

function requirePpm(value: unknown, label: string): asserts value is number {
  requireSafeInteger(value, label);
  if ((value as number) > PPM) throw new RangeError(`${label} must be within 0..${PPM}`);
}

function validateEnvelope(envelope: AnyEnvelope, expectedKind: string): void {
  if (envelope.observationVersion !== "selection-observation/v1") {
    throw new RangeError("unsupported observation version");
  }
  if (envelope.kind !== expectedKind) {
    throw new TypeError(`adapter expected '${expectedKind}', received '${envelope.kind}'`);
  }
  requireText(envelope.id, "observation id");
  requireText(envelope.domainId, "observation domain");
  requireText(envelope.reporterId, "observation reporter");
  requireText(envelope.method, "observation method");
  requireText(envelope.provenance, "observation provenance");
  if (envelope.sourceTimestamp !== null) {
    requireText(envelope.sourceTimestamp, "observation source timestamp");
  }
  requireSafeInteger(envelope.observedFromTick, "observation start tick");
  requireSafeInteger(envelope.observedThroughTick, "observation end tick");
  requirePpm(envelope.uncertaintyPpm, "observation uncertainty");
  requireSafeInteger(envelope.freshnessTicks, "observation freshness");
  if (!CHALLENGE_STATUSES.has(envelope.challengeStatus)) {
    throw new TypeError("observation challenge status is invalid");
  }
  if (envelope.observedThroughTick < envelope.observedFromTick) {
    throw new RangeError("observation period/freshness is invalid");
  }
  if (
    !Array.isArray(envelope.lineage) ||
    envelope.lineage.length === 0 ||
    envelope.lineage.some(entry => typeof entry !== "string" || entry.trim() === "")
  ) {
    throw new TypeError("observation lineage must contain non-empty entries");
  }
  if (
    typeof envelope.payload !== "object" ||
    envelope.payload === null ||
    Array.isArray(envelope.payload)
  ) {
    throw new TypeError("observation payload must be a record");
  }
  if ("lifecycle" in envelope || "lifecycle" in envelope.payload) {
    throw new TypeError("evidence adapters cannot emit lifecycle state or transitions");
  }

  const payload = envelope.payload as Record<string, unknown>;
  switch (expectedKind) {
    case "sink-capacity":
      requireSafeInteger(payload.outstandingStock, "outstanding stock");
      requireSafeInteger(payload.decreedSink, "decreed sink");
      requireSafeInteger(payload.realisedSink, "realised sink");
      requirePpm(payload.coveragePpm, "sink coverage");
      requirePpm(payload.encounterSharePpm, "sink encounter share");
      if (payload.preregisteredFindingId !== null) {
        requireText(payload.preregisteredFindingId, "preregistered finding id");
      }
      break;
    case "ledger-trace":
      requireText(payload.debitActorId, "debit actor");
      requireText(payload.creditActorId, "credit actor");
      if (payload.debitActorId === payload.creditActorId) {
        throw new TypeError("ledger trace endpoints must be distinct");
      }
      requireSafeInteger(payload.amount, "posted amount");
      requireText(payload.writeAuthority, "write authority");
      if (payload.conservationChecked !== true || payload.completion !== "posted") {
        throw new TypeError("ledger trace must be a conservation-checked posting");
      }
      break;
    case "custom-order":
      requireText(payload.customId, "custom id");
      requireText(payload.claimantId, "custom claimant");
      if (payload.counterpartyId !== null) requireText(payload.counterpartyId, "counterparty");
      if (payload.findingId !== null) requireText(payload.findingId, "custom finding id");
      if (
        !new Set(["adopted", "rejected", "performed", "breached", "repaired", "expired"]).has(
          payload.assertion as string
        )
      ) {
        throw new TypeError("custom assertion is invalid");
      }
      break;
    case "contextual-finding-memory":
      requireText(payload.subjectId, "finding subject");
      requireText(payload.context, "finding context");
      requireText(payload.purpose, "finding purpose");
      requireSafeInteger(payload.expiresAtTick, "finding expiry tick");
      if ((payload.expiresAtTick as number) < envelope.observedThroughTick) {
        throw new RangeError("a contextual finding cannot arrive already expired");
      }
      if (!new Set(["upheld", "rejected", "repaired", "expired"]).has(payload.finding as string)) {
        throw new TypeError("contextual finding is invalid");
      }
      break;
    case "office-keeper":
      requireText(payload.assignmentId, "office assignment");
      requireText(payload.duty, "office duty");
      if (payload.officeHolderId !== null) requireText(payload.officeHolderId, "office holder");
      if (payload.performedAtTick !== null) {
        requireSafeInteger(payload.performedAtTick, "office performance tick");
      }
      if (payload.overdueObservedAtTick !== null) {
        requireSafeInteger(payload.overdueObservedAtTick, "office overdue observation tick");
      }
      if (
        !new Set(["assigned", "vacant", "self-reported-discharge", "overdue-observed"]).has(
          payload.status as string
        )
      ) {
        throw new TypeError("office status is invalid");
      }
      break;
    case "experiment-calibration":
      requireText(payload.armId, "experiment arm");
      requireSafeInteger(payload.preregisteredAtTick, "preregistration tick");
      requireSafeInteger(payload.firstObservationTick, "first observation tick");
      requireSafeInteger(payload.observations, "observation count", 1);
      requirePpm(payload.bindingFrequencyPpm, "binding frequency");
      requireSafeInteger(payload.effectEstimate, "effect estimate", Number.MIN_SAFE_INTEGER);
      if ((payload.preregisteredAtTick as number) >= (payload.firstObservationTick as number)) {
        throw new RangeError("experiment preregistration must precede observations");
      }
      break;
    default:
      throw new TypeError(`unknown evidence kind '${expectedKind}'`);
  }
}

abstract class ReadOnlyEvidenceAdapter<TObservation extends AnyEnvelope>
  implements EvidenceAdapter<TObservation>
{
  readonly #observations: readonly TObservation[];

  protected constructor(observations: readonly TObservation[], expectedKind: string) {
    observations.forEach(observation => validateEnvelope(observation, expectedKind));
    this.#observations = Object.freeze(
      observations.map(observation =>
        Object.freeze({
          ...observation,
          lineage: Object.freeze([...observation.lineage]),
          payload: Object.freeze({ ...observation.payload }),
        })
      )
    ) as readonly TObservation[];
  }

  observe(query: ObservationQuery = {}): readonly TObservation[] {
    if (query.domainId !== undefined) requireText(query.domainId, "query domain");
    if (query.observedAtTick !== undefined) {
      requireSafeInteger(query.observedAtTick, "query observation tick");
    }
    if (query.challengeStatus !== undefined && !CHALLENGE_STATUSES.has(query.challengeStatus)) {
      throw new TypeError("query challenge status is invalid");
    }
    return this.#observations.filter(observation => {
      if (query.domainId !== undefined && observation.domainId !== query.domainId) return false;
      if (
        query.challengeStatus !== undefined &&
        observation.challengeStatus !== query.challengeStatus
      ) {
        return false;
      }
      if (query.observedAtTick !== undefined) {
        const age = query.observedAtTick - observation.observedThroughTick;
        if (age < 0 || age > observation.freshnessTicks) return false;
      }
      return true;
    });
  }
}

export interface SinkCapacityPayload {
  outstandingStock: number;
  decreedSink: number;
  realisedSink: number;
  coveragePpm: Ppm;
  encounterSharePpm: Ppm;
  preregisteredFindingId: string | null;
}
export type SinkCapacityObservation = ObservationEnvelope<"sink-capacity", SinkCapacityPayload>;
export class SinkCapacityAdapter extends ReadOnlyEvidenceAdapter<SinkCapacityObservation> {
  constructor(observations: readonly SinkCapacityObservation[]) {
    super(observations, "sink-capacity");
  }
}

export interface LedgerTracePayload {
  debitActorId: string;
  creditActorId: string;
  amount: number;
  writeAuthority: string;
  conservationChecked: boolean;
  completion: "posted";
}
export type LedgerTraceObservation = ObservationEnvelope<"ledger-trace", LedgerTracePayload>;
export class LedgerTraceAdapter extends ReadOnlyEvidenceAdapter<LedgerTraceObservation> {
  constructor(observations: readonly LedgerTraceObservation[]) {
    super(observations, "ledger-trace");
  }
}

export interface CustomOrderPayload {
  customId: string;
  assertion: "adopted" | "rejected" | "performed" | "breached" | "repaired" | "expired";
  claimantId: string;
  counterpartyId: string | null;
  findingId: string | null;
}
export type CustomOrderObservation = ObservationEnvelope<"custom-order", CustomOrderPayload>;
export class CustomOrderAdapter extends ReadOnlyEvidenceAdapter<CustomOrderObservation> {
  constructor(observations: readonly CustomOrderObservation[]) {
    super(observations, "custom-order");
  }
}

export interface ContextualFindingPayload {
  subjectId: string;
  context: string;
  purpose: string;
  finding: "upheld" | "rejected" | "repaired" | "expired";
  expiresAtTick: Tick;
}
export type ContextualFindingObservation = ObservationEnvelope<
  "contextual-finding-memory",
  ContextualFindingPayload
>;
export class ContextualFindingMemoryAdapter extends ReadOnlyEvidenceAdapter<ContextualFindingObservation> {
  constructor(observations: readonly ContextualFindingObservation[]) {
    super(observations, "contextual-finding-memory");
  }
}

export interface OfficeKeeperPayload {
  assignmentId: string;
  duty: string;
  officeHolderId: string | null;
  status: "assigned" | "vacant" | "self-reported-discharge" | "overdue-observed";
  performedAtTick: Tick | null;
  overdueObservedAtTick: Tick | null;
}
export type OfficeKeeperObservation = ObservationEnvelope<"office-keeper", OfficeKeeperPayload>;
export class OfficeKeeperAdapter extends ReadOnlyEvidenceAdapter<OfficeKeeperObservation> {
  constructor(observations: readonly OfficeKeeperObservation[]) {
    super(observations, "office-keeper");
  }
}

export interface ExperimentCalibrationPayload {
  armId: string;
  preregisteredAtTick: Tick;
  firstObservationTick: Tick;
  observations: number;
  bindingFrequencyPpm: Ppm;
  effectEstimate: number;
}
export type ExperimentCalibrationObservation = ObservationEnvelope<
  "experiment-calibration",
  ExperimentCalibrationPayload
>;
export class ExperimentCalibrationAdapter extends ReadOnlyEvidenceAdapter<ExperimentCalibrationObservation> {
  constructor(observations: readonly ExperimentCalibrationObservation[]) {
    super(observations, "experiment-calibration");
  }
}

/** V1's `Settled` event is evidence of paired posting only, never discharge. */
export function mapLegacyPairedWrite(input: {
  id: string;
  domainId: DomainId;
  debitActorId: string;
  creditActorId: string;
  amount: number;
  operatorId: string;
  tick: Tick;
  provenance: string;
}): LedgerTraceObservation {
  const observation: LedgerTraceObservation = {
    observationVersion: "selection-observation/v1",
    id: input.id,
    kind: "ledger-trace",
    domainId: input.domainId,
    reporterId: input.operatorId,
    method: "legacy paired-write event",
    provenance: input.provenance,
    sourceTimestamp: null,
    observedFromTick: input.tick,
    observedThroughTick: input.tick,
    uncertaintyPpm: 0,
    freshnessTicks: 0,
    challengeStatus: "unchallenged",
    lineage: ["Kocherlakota V1 compatibility"],
    payload: {
      debitActorId: input.debitActorId,
      creditActorId: input.creditActorId,
      amount: input.amount,
      writeAuthority: input.operatorId,
      conservationChecked: true,
      completion: "posted",
    },
  };
  validateEnvelope(observation, "ledger-trace");
  return observation;
}
