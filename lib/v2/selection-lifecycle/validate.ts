import {
  MODEL_VERSION,
  PPM,
  RNG_VERSION,
  SCHEMA_VERSION,
  SCHEDULE_VERSION,
  type ScenarioSpec,
} from "./types.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export class ScenarioValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(issues.map(issue => `${issue.path}: ${issue.message}`).join("\n"));
    this.name = "ScenarioValidationError";
  }
}

type UnknownRecord = Record<string, unknown>;

const MAX_SIMULATION_TICKS = 10_000;
const MAX_CONTINUATION_HORIZON_TICKS = 10_000;

const INITIAL_CONDITIONS = [
  "orphan-candidate",
  "matched-obligation",
  "inherited-installed",
] as const;

const LIFECYCLE_STATES = [
  "candidate",
  "priming",
  "propagating",
  "installed-supported",
  "installed-self-maintaining",
  "repairing",
  "fragile",
  "declining",
  "exited",
  "collapsed",
  "superseded",
] as const;

const KEEPER_TOPOLOGIES = [
  "self",
  "bilateral",
  "open",
  "provider",
  "federated",
  "quorum",
  "rotating",
  "office",
  "protocol",
  "external",
] as const;

const KEEPER_FUNCTIONS = [
  "recognise-validity",
  "authenticate",
  "observe",
  "trigger",
  "record",
  "challenge",
  "find",
  "respond",
  "repair",
  "make-change",
  "maintain-liquidity",
  "maintain-infrastructure",
  "change-rules",
] as const;

const FRACTIONATION_KINDS = ["quantity", "time", "counterparty"] as const;
const SURPLUS_KINDS = ["specialisation", "trade-fractionation", "conflict-mitigation"] as const;
const WEDGE_KINDS = [
  "subsidy",
  "coercion",
  "tax-receivability",
  "legal-privilege",
  "platform-leverage",
  "prior-use",
  "speculation",
  "familiar-form",
  "other",
] as const;
const CIRCUIT_ACTIONS = [
  "acquire",
  "tender",
  "accept",
  "post",
  "respend",
  "clear",
  "redeem",
  "renew",
] as const;
const CONTINUATION_ACTIONS = [
  ...KEEPER_FUNCTIONS,
  ...CIRCUIT_ACTIONS,
  "perform",
  "repay",
  "fund-keeper",
] as const;
const KEEPER_FUNDING = ["internal", "external", "unfunded"] as const;
const PRIMING_STOP_KINDS = ["tick", "credible-circuit", "installed", "budget-exhausted"] as const;
const POLICY_KINDS = ["threshold-learning", "legacy-kw-threshold"] as const;
const SHOCK_KINDS = [
  "deactivate-actor",
  "deactivate-relationship",
  "disable-keeper",
  "stop-priming",
  "scale-opportunities",
] as const;

const CIRCUIT_ACTION_RANK: Readonly<Record<string, number>> = {
  acquire: 0,
  tender: 1,
  accept: 2,
  post: 3,
  respend: 4,
  clear: 4,
  redeem: 4,
  renew: 5,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(record: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function validateJsonSource(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors = new WeakSet<object>()
): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      issues.push({ path, message: "all source numbers must be safe integers" });
    }
    return;
  }
  if (typeof value !== "object") {
    issues.push({ path, message: `contains non-JSON value of type '${typeof value}'` });
    return;
  }
  if (ancestors.has(value)) {
    issues.push({ path, message: "contains a circular reference" });
    return;
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateJsonSource(item, `${path}[${index}]`, issues, ancestors)
    );
    ancestors.delete(value);
    return;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    issues.push({ path, message: "must be a plain JSON object" });
  }
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.replace(/[-_\s]/g, "").toLowerCase();
    if (normalized === "continuationsurplus" || normalized === "socialcredit") {
      issues.push({
        path: `${path}.${key}`,
        message: "authoritative aggregate continuation/social-credit scalars are forbidden",
      });
    }
    validateJsonSource(child, `${path}.${key}`, issues, ancestors);
  }
  ancestors.delete(value);
}

function requireRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is UnknownRecord {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object" });
    return false;
  }
  return true;
}

function requireString(value: unknown, path: string, issues: ValidationIssue[]): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({ path, message: "must be a non-empty string" });
    return false;
  }
  return true;
}

function optionalString(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value !== undefined) requireString(value, path, issues);
}

function requireBoolean(value: unknown, path: string, issues: ValidationIssue[]): value is boolean {
  if (typeof value !== "boolean") {
    issues.push({ path, message: "must be a boolean" });
    return false;
  }
  return true;
}

function requireArray(value: unknown, path: string, issues: ValidationIssue[]): value is unknown[] {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be an array" });
    return false;
  }
  return true;
}

function requireEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[]
): value is string {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({ path, message: `must be one of: ${allowed.join(", ")}` });
    return false;
  }
  return true;
}

function safeInteger(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  min = 0
): value is number {
  if (!Number.isSafeInteger(value) || (value as number) < min) {
    issues.push({ path, message: `must be a safe integer >= ${min}` });
    return false;
  }
  return true;
}

function atMost(value: unknown, maximum: number, path: string, issues: ValidationIssue[]): void {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > maximum) {
    issues.push({ path, message: `must be <= ${maximum}` });
  }
}

function ppm(value: unknown, path: string, issues: ValidationIssue[]): value is number {
  if (!safeInteger(value, path, issues, 0)) return false;
  if ((value as number) > PPM) {
    issues.push({ path, message: `must be <= ${PPM}` });
    return false;
  }
  return true;
}

const RESERVED_MAP_KEYS = new Set(["__proto__", ...Object.getOwnPropertyNames(Object.prototype)]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function requireIdentifier(
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is string {
  if (!requireString(value, path, issues)) return false;
  if (!IDENTIFIER_PATTERN.test(value) || value.includes("::") || RESERVED_MAP_KEYS.has(value)) {
    issues.push({
      path,
      message: "must be a map-safe identifier and must not contain '::'",
    });
    return false;
  }
  return true;
}

function uniqueIds(items: unknown[], path: string, issues: ValidationIssue[]): Set<string> {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    if (!requireRecord(item, `${path}[${index}]`, issues)) return;
    if (!requireIdentifier(item.id, `${path}[${index}].id`, issues)) return;
    if (ids.has(item.id)) issues.push({ path: `${path}[${index}].id`, message: "duplicate id" });
    ids.add(item.id);
  });
  return ids;
}

function recordsById(items: unknown[]): Map<string, UnknownRecord> {
  const result = new Map<string, UnknownRecord>();
  for (const item of items) {
    if (isRecord(item) && typeof item.id === "string" && !result.has(item.id)) {
      result.set(item.id, item);
    }
  }
  return result;
}

function requireReference(
  value: unknown,
  allowed: Set<string>,
  path: string,
  issues: ValidationIssue[]
): value is string {
  if (!requireString(value, path, issues)) return false;
  if (!allowed.has(value)) {
    issues.push({ path, message: `dangling reference '${value}'` });
    return false;
  }
  return true;
}

function requireReferenceArray(
  value: unknown,
  allowed: Set<string>,
  path: string,
  issues: ValidationIssue[],
  allowEmpty = true
): string[] {
  if (!requireArray(value, path, issues)) return [];
  if (!allowEmpty && value.length === 0) issues.push({ path, message: "must not be empty" });
  const references: string[] = [];
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (!requireReference(entry, allowed, `${path}[${index}]`, issues)) return;
    if (seen.has(entry)) {
      issues.push({ path: `${path}[${index}]`, message: `duplicate reference '${entry}'` });
      return;
    }
    seen.add(entry);
    references.push(entry);
  });
  return references;
}

function requireStringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  allowEmpty = true
): string[] {
  if (!requireArray(value, path, issues)) return [];
  if (!allowEmpty && value.length === 0) issues.push({ path, message: "must not be empty" });
  const strings: string[] = [];
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (!requireString(entry, `${path}[${index}]`, issues)) return;
    if (seen.has(entry)) {
      issues.push({ path: `${path}[${index}]`, message: `duplicate value '${entry}'` });
      return;
    }
    seen.add(entry);
    strings.push(entry);
  });
  return strings;
}

function recordId(value: UnknownRecord): string | undefined {
  return typeof value.id === "string" ? value.id : undefined;
}

function rejectPresentFields(
  value: UnknownRecord,
  fields: readonly string[],
  path: string,
  issues: ValidationIssue[]
): void {
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      issues.push({
        path: `${path}.${field}`,
        message: "field is not valid for this tagged variant",
      });
    }
  }
}

function includesString(value: unknown, expected: string): boolean {
  return Array.isArray(value) && value.includes(expected);
}

function validateDomainInstrumentScope(
  domain: UnknownRecord | undefined,
  instrument: UnknownRecord | undefined,
  path: string,
  issues: ValidationIssue[]
): void {
  if (domain === undefined || instrument === undefined) return;
  const instrumentId = recordId(instrument);
  if (instrumentId !== undefined && !includesString(domain.instrumentIds, instrumentId)) {
    issues.push({
      path,
      message: `instrument '${instrumentId}' is not eligible in the referenced domain`,
    });
  }
  for (const field of ["unit", "ledger", "rail"] as const) {
    if (
      typeof domain[field] === "string" &&
      typeof instrument[field] === "string" &&
      domain[field] !== instrument[field]
    ) {
      issues.push({
        path,
        message: `instrument ${field} '${instrument[field]}' does not match domain ${field} '${domain[field]}'`,
      });
    }
  }
}

function validateRelationshipScope(
  relationship: UnknownRecord | undefined,
  domainId: unknown,
  instrumentId: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  if (relationship === undefined) return;
  if (typeof domainId === "string" && relationship.domainId !== domainId) {
    issues.push({ path, message: "relationship belongs to a different domain" });
  }
  if (
    typeof instrumentId === "string" &&
    !includesString(relationship.instrumentIds, instrumentId)
  ) {
    issues.push({ path, message: "relationship does not carry the referenced instrument" });
  }
}

function validateKeeperScope(
  keeper: UnknownRecord | undefined,
  domainId: unknown,
  instrumentId: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  if (keeper === undefined) return;
  if (typeof domainId === "string" && keeper.domainId !== domainId) {
    issues.push({ path, message: "keeper assignment belongs to a different domain" });
  }
  if (
    typeof instrumentId === "string" &&
    keeper.instrumentId !== null &&
    keeper.instrumentId !== instrumentId
  ) {
    issues.push({ path, message: "keeper assignment belongs to a different instrument" });
  }
  if (instrumentId === null && keeper.instrumentId !== null) {
    issues.push({
      path,
      message: "instrument-agnostic keeper assignment requires an instrument-agnostic fallback",
    });
  }
}

function validateCircuitSequence(edges: unknown[], path: string, issues: ValidationIssue[]): void {
  const actions: string[] = [];
  let previousRank = -1;
  edges.forEach((edge, index) => {
    if (
      !isRecord(edge) ||
      typeof edge.action !== "string" ||
      !hasOwn(CIRCUIT_ACTION_RANK, edge.action)
    ) {
      return;
    }
    const rank = CIRCUIT_ACTION_RANK[edge.action];
    actions.push(edge.action);
    if (rank < previousRank) {
      issues.push({
        path: `${path}[${index}].action`,
        message: "circuit actions are out of order",
      });
    }
    previousRank = Math.max(previousRank, rank);
  });

  for (const action of ["acquire", "tender", "accept", "post"] as const) {
    const count = actions.filter(candidate => candidate === action).length;
    if (count !== 1) {
      issues.push({
        path,
        message: `must contain exactly one '${action}' in the ordered circulation path`,
      });
    }
  }
  const continuationCount = actions.filter(
    action => action === "respend" || action === "clear" || action === "redeem"
  ).length;
  if (continuationCount !== 1) {
    issues.push({
      path,
      message: "must contain exactly one of 'respend', 'clear' or 'redeem'",
    });
  }

  const last = edges[edges.length - 1];
  if (!isRecord(last) || last.action !== "renew" || last.renewal !== true) {
    issues.push({ path, message: "final edge must be a 'renew' action marked renewal=true" });
  }
  edges.forEach((edge, index) => {
    if (!isRecord(edge)) return;
    const shouldBeFinalRenewal = index === edges.length - 1 && edge.action === "renew";
    if (edge.action === "renew" && index !== edges.length - 1) {
      issues.push({
        path: `${path}[${index}].action`,
        message: "renew must be the final circuit action",
      });
    }
    if (edge.renewal !== shouldBeFinalRenewal) {
      issues.push({
        path: `${path}[${index}].renewal`,
        message: "renewal must be true only on the final renew edge",
      });
    }
  });
}

export function validateScenario(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateJsonSource(input, "$", issues);
  if (!requireRecord(input, "$", issues)) return issues;

  if (input.schemaVersion !== SCHEMA_VERSION) {
    issues.push({ path: "$.schemaVersion", message: `must equal '${SCHEMA_VERSION}'` });
  }
  if (input.modelVersion !== MODEL_VERSION) {
    issues.push({ path: "$.modelVersion", message: `must equal '${MODEL_VERSION}'` });
  }
  if (input.scheduleVersion !== SCHEDULE_VERSION) {
    issues.push({ path: "$.scheduleVersion", message: `must equal '${SCHEDULE_VERSION}'` });
  }
  if (input.rngVersion !== RNG_VERSION) {
    issues.push({ path: "$.rngVersion", message: `must equal '${RNG_VERSION}'` });
  }
  requireIdentifier(input.id, "$.id", issues);
  requireString(input.title, "$.title", issues);
  requireEnum(input.initialCondition, INITIAL_CONDITIONS, "$.initialCondition", issues);
  const ticksValid = safeInteger(input.ticks, "$.ticks", issues, 1);
  atMost(input.ticks, MAX_SIMULATION_TICKS, "$.ticks", issues);
  const warmupValid = safeInteger(input.warmupTicks, "$.warmupTicks", issues, 0);
  if (ticksValid && warmupValid && (input.warmupTicks as number) >= (input.ticks as number)) {
    issues.push({ path: "$.warmupTicks", message: "must be lower than ticks" });
  }

  const collectionNames = [
    "actors",
    "domains",
    "instruments",
    "relationships",
    "circuits",
    "keeperAssignments",
    "primingMechanisms",
    "continuationOpportunities",
    "continuationAssumptions",
    "bondedAssumptions",
    "policies",
    "shocks",
    "worldBoundaries",
    "killConditions",
  ] as const;
  for (const name of collectionNames) requireArray(input[name], `$.${name}`, issues);
  if (collectionNames.some(name => !Array.isArray(input[name]))) return issues;

  const actors = input.actors as unknown[];
  const domains = input.domains as unknown[];
  const instruments = input.instruments as unknown[];
  const relationships = input.relationships as unknown[];
  const circuits = input.circuits as unknown[];
  const keepers = input.keeperAssignments as unknown[];
  const priming = input.primingMechanisms as unknown[];
  const opportunities = input.continuationOpportunities as unknown[];
  const continuations = input.continuationAssumptions as unknown[];
  const assumptions = input.bondedAssumptions as unknown[];
  const policies = input.policies as unknown[];
  const shocks = input.shocks as unknown[];

  const actorIds = uniqueIds(actors, "$.actors", issues);
  const domainIds = uniqueIds(domains, "$.domains", issues);
  const instrumentIds = uniqueIds(instruments, "$.instruments", issues);
  const relationshipIds = uniqueIds(relationships, "$.relationships", issues);
  const circuitIds = uniqueIds(circuits, "$.circuits", issues);
  const keeperIds = uniqueIds(keepers, "$.keeperAssignments", issues);
  const primingIds = uniqueIds(priming, "$.primingMechanisms", issues);
  const opportunityIds = uniqueIds(opportunities, "$.continuationOpportunities", issues);
  uniqueIds(continuations, "$.continuationAssumptions", issues);
  const assumptionIds = uniqueIds(assumptions, "$.bondedAssumptions", issues);
  const policyIds = uniqueIds(policies, "$.policies", issues);

  const actorById = recordsById(actors);
  const domainById = recordsById(domains);
  const instrumentById = recordsById(instruments);
  const relationshipById = recordsById(relationships);
  const circuitById = recordsById(circuits);
  const keeperById = recordsById(keepers);
  const opportunityById = recordsById(opportunities);

  if (actors.length === 0) issues.push({ path: "$.actors", message: "must not be empty" });
  if (domains.length === 0) issues.push({ path: "$.domains", message: "must not be empty" });
  if (instruments.length === 0)
    issues.push({ path: "$.instruments", message: "must not be empty" });
  if (policies.length === 0) issues.push({ path: "$.policies", message: "must not be empty" });
  if (input.initialCondition === "orphan-candidate" && priming.length === 0) {
    issues.push({
      path: "$.primingMechanisms",
      message: "orphan candidates require a declared priming mechanism",
    });
  }
  if ((input.worldBoundaries as unknown[]).length === 0) {
    issues.push({ path: "$.worldBoundaries", message: "must not be empty" });
  }
  if ((input.killConditions as unknown[]).length === 0) {
    issues.push({ path: "$.killConditions", message: "must not be empty" });
  }

  policies.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.policies[${index}]`;
    if (!requireEnum(value.kind, POLICY_KINDS, `${path}.kind`, issues)) return;
    if (value.kind === "threshold-learning") {
      rejectPresentFields(value, ["adoptIncrement", "decayIncrement"], path, issues);
      ppm(value.socialWeightPpm, `${path}.socialWeightPpm`, issues);
      ppm(value.serviceWeightPpm, `${path}.serviceWeightPpm`, issues);
      ppm(value.primingWeightPpm, `${path}.primingWeightPpm`, issues);
    } else {
      rejectPresentFields(
        value,
        ["socialWeightPpm", "serviceWeightPpm", "primingWeightPpm"],
        path,
        issues
      );
      ppm(value.adoptIncrement, `${path}.adoptIncrement`, issues);
      ppm(value.decayIncrement, `${path}.decayIncrement`, issues);
    }
  });

  actors.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.actors[${index}]`;
    optionalString(value.label, `${path}.label`, issues);
    requireReference(value.policyId, policyIds, `${path}.policyId`, issues);
    const actorDomainIds = requireReferenceArray(
      value.domainIds,
      domainIds,
      `${path}.domainIds`,
      issues,
      false
    );
    requireStringArray(value.roles, `${path}.roles`, issues, false);
    requireBoolean(value.active, `${path}.active`, issues);
    ppm(value.discountPpm, `${path}.discountPpm`, issues);
    ppm(value.exitHazardPpm, `${path}.exitHazardPpm`, issues);
    ppm(value.learningRatePpm, `${path}.learningRatePpm`, issues);
    const actorId = recordId(value);
    for (const domainId of actorDomainIds) {
      const domain = domainById.get(domainId);
      if (
        actorId !== undefined &&
        domain !== undefined &&
        !includesString(domain.population, actorId)
      ) {
        issues.push({
          path: `${path}.domainIds`,
          message: `actor '${actorId}' is absent from domain '${domainId}' population`,
        });
      }
    }

    if (!requireRecord(value.outsideOptionByDomain, `${path}.outsideOptionByDomain`, issues)) {
      // The field-level issue is sufficient.
    } else {
      for (const domainId of actorDomainIds) {
        if (!hasOwn(value.outsideOptionByDomain, domainId)) {
          issues.push({
            path: `${path}.outsideOptionByDomain`,
            message: `missing outside option for domain '${domainId}'`,
          });
        }
      }
      for (const [domainId, amount] of Object.entries(value.outsideOptionByDomain)) {
        requireReference(domainId, domainIds, `${path}.outsideOptionByDomain.${domainId}`, issues);
        if (!actorDomainIds.includes(domainId)) {
          issues.push({
            path: `${path}.outsideOptionByDomain.${domainId}`,
            message: "outside option belongs to a domain not assigned to this actor",
          });
        }
        safeInteger(amount, `${path}.outsideOptionByDomain.${domainId}`, issues);
      }
    }

    if (requireArray(value.acceptance, `${path}.acceptance`, issues)) {
      const seenAcceptance = new Set<string>();
      value.acceptance.forEach((entry, acceptanceIndex) => {
        if (!requireRecord(entry, `${path}.acceptance[${acceptanceIndex}]`, issues)) return;
        const acceptancePath = `${path}.acceptance[${acceptanceIndex}]`;
        const validDomain = requireReference(
          entry.domainId,
          domainIds,
          `${acceptancePath}.domainId`,
          issues
        );
        const validInstrument = requireReference(
          entry.instrumentId,
          instrumentIds,
          `${acceptancePath}.instrumentId`,
          issues
        );
        if (validDomain && validInstrument) {
          const key = `${entry.domainId}::${entry.instrumentId}`;
          if (seenAcceptance.has(key)) {
            issues.push({ path: acceptancePath, message: `duplicate acceptance profile '${key}'` });
          }
          seenAcceptance.add(key);
          if (!actorDomainIds.includes(entry.domainId as string)) {
            issues.push({
              path: acceptancePath,
              message: "acceptance domain is not assigned to this actor",
            });
          }
          const domain = domainById.get(entry.domainId as string);
          validateDomainInstrumentScope(
            domain,
            instrumentById.get(entry.instrumentId as string),
            acceptancePath,
            issues
          );
          if (domain !== undefined && !includesString(domain.population, value.id as string)) {
            issues.push({
              path: acceptancePath,
              message: "actor is not in the acceptance domain population",
            });
          }
        }
        requireBoolean(entry.initiallyAccepts, `${acceptancePath}.initiallyAccepts`, issues);
        ppm(
          entry.initialReacceptanceBeliefPpm,
          `${acceptancePath}.initialReacceptanceBeliefPpm`,
          issues
        );
        const adoptionValid = ppm(
          entry.adoptionThresholdPpm,
          `${acceptancePath}.adoptionThresholdPpm`,
          issues
        );
        const abandonmentValid = ppm(
          entry.abandonmentThresholdPpm,
          `${acceptancePath}.abandonmentThresholdPpm`,
          issues
        );
        if (
          adoptionValid &&
          abandonmentValid &&
          (entry.abandonmentThresholdPpm as number) >= (entry.adoptionThresholdPpm as number)
        ) {
          issues.push({
            path: acceptancePath,
            message: "abandonment threshold must be lower than adoption threshold",
          });
        }
        safeInteger(entry.adoptionWindowTicks, `${acceptancePath}.adoptionWindowTicks`, issues, 1);
        safeInteger(
          entry.abandonmentWindowTicks,
          `${acceptancePath}.abandonmentWindowTicks`,
          issues,
          1
        );
        safeInteger(entry.switchingCost, `${acceptancePath}.switchingCost`, issues);
        safeInteger(entry.holdingCostPerTick, `${acceptancePath}.holdingCostPerTick`, issues);
        safeInteger(entry.installedComplement, `${acceptancePath}.installedComplement`, issues);
      });
      for (const domainId of actorDomainIds) {
        const domain = domainById.get(domainId);
        if (!Array.isArray(domain?.instrumentIds)) continue;
        for (const instrumentId of domain.instrumentIds) {
          if (
            typeof instrumentId === "string" &&
            !seenAcceptance.has(`${domainId}::${instrumentId}`)
          ) {
            issues.push({
              path: `${path}.acceptance`,
              message: `missing acceptance profile for '${domainId}::${instrumentId}'`,
            });
          }
        }
      }
    }
  });

  domains.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.domains[${index}]`;
    optionalString(value.label, `${path}.label`, issues);
    const population = requireReferenceArray(
      value.population,
      actorIds,
      `${path}.population`,
      issues,
      false
    );
    const eligibleInstruments = requireReferenceArray(
      value.instrumentIds,
      instrumentIds,
      `${path}.instrumentIds`,
      issues,
      false
    );
    const incumbents = requireReferenceArray(
      value.incumbentInstrumentIds,
      instrumentIds,
      `${path}.incumbentInstrumentIds`,
      issues
    );
    const competing = requireReferenceArray(
      value.competingDomainIds,
      domainIds,
      `${path}.competingDomainIds`,
      issues
    );
    const coexisting = requireReferenceArray(
      value.coexistingDomainIds,
      domainIds,
      `${path}.coexistingDomainIds`,
      issues
    );
    for (const field of [
      "unit",
      "ledger",
      "rail",
      "function",
      "relationship",
      "place",
      "period",
    ] as const) {
      requireString(value[field], `${path}.${field}`, issues);
    }
    for (const instrumentId of incumbents) {
      if (!eligibleInstruments.includes(instrumentId)) {
        issues.push({
          path: `${path}.incumbentInstrumentIds`,
          message: `incumbent '${instrumentId}' is not an eligible domain instrument`,
        });
      }
    }
    const ownId = recordId(value);
    if (ownId !== undefined && (competing.includes(ownId) || coexisting.includes(ownId))) {
      issues.push({ path, message: "a domain cannot compete or coexist with itself" });
    }
    for (const domainId of competing) {
      if (coexisting.includes(domainId)) {
        issues.push({
          path,
          message: `domain '${domainId}' cannot be both competing and coexisting`,
        });
      }
    }
    for (const actorId of population) {
      const actor = actorById.get(actorId);
      if (actor !== undefined && !includesString(actor.domainIds, ownId ?? "")) {
        issues.push({
          path: `${path}.population`,
          message: `actor '${actorId}' does not declare this domain`,
        });
      }
    }
    for (const instrumentId of eligibleInstruments) {
      validateDomainInstrumentScope(value, instrumentById.get(instrumentId), path, issues);
    }

    if (requireRecord(value.installation, `${path}.installation`, issues)) {
      ppm(value.installation.minAcceptancePpm, `${path}.installation.minAcceptancePpm`, issues);
      safeInteger(
        value.installation.minActualUsesPerWindow,
        `${path}.installation.minActualUsesPerWindow`,
        issues,
        1
      );
      const connectedValid = safeInteger(
        value.installation.minConnectedAcceptors,
        `${path}.installation.minConnectedAcceptors`,
        issues,
        1
      );
      if (
        connectedValid &&
        (value.installation.minConnectedAcceptors as number) > population.length
      ) {
        issues.push({
          path: `${path}.installation.minConnectedAcceptors`,
          message: "cannot exceed the declared domain population",
        });
      }
      safeInteger(value.installation.windowTicks, `${path}.installation.windowTicks`, issues, 1);
    }
    if (requireRecord(value.maintenance, `${path}.maintenance`, issues)) {
      safeInteger(
        value.maintenance.minActualUsesPerWindow,
        `${path}.maintenance.minActualUsesPerWindow`,
        issues,
        1
      );
      ppm(
        value.maintenance.minKeeperCoveragePpm,
        `${path}.maintenance.minKeeperCoveragePpm`,
        issues
      );
      safeInteger(value.maintenance.windowTicks, `${path}.maintenance.windowTicks`, issues, 1);
      safeInteger(
        value.maintenance.removalTestTicks,
        `${path}.maintenance.removalTestTicks`,
        issues,
        1
      );
    }
    if (
      requireRecord(
        value.initialLifecycleByInstrument,
        `${path}.initialLifecycleByInstrument`,
        issues
      )
    ) {
      for (const instrumentId of eligibleInstruments) {
        if (!hasOwn(value.initialLifecycleByInstrument, instrumentId)) {
          issues.push({
            path: `${path}.initialLifecycleByInstrument`,
            message: `missing lifecycle state for '${instrumentId}'`,
          });
        }
      }
      for (const [instrumentId, lifecycle] of Object.entries(value.initialLifecycleByInstrument)) {
        if (!eligibleInstruments.includes(instrumentId)) {
          issues.push({
            path: `${path}.initialLifecycleByInstrument.${instrumentId}`,
            message: "lifecycle mapping is for an instrument outside this domain",
          });
        }
        requireEnum(
          lifecycle,
          LIFECYCLE_STATES,
          `${path}.initialLifecycleByInstrument.${instrumentId}`,
          issues
        );
      }
    }
  });

  domains.forEach((value, index) => {
    if (!isRecord(value) || typeof value.id !== "string") return;
    const competing = Array.isArray(value.competingDomainIds)
      ? value.competingDomainIds.filter((id): id is string => typeof id === "string")
      : [];
    const coexisting = Array.isArray(value.coexistingDomainIds)
      ? value.coexistingDomainIds.filter((id): id is string => typeof id === "string")
      : [];
    for (const otherId of competing) {
      if (coexisting.includes(otherId)) {
        issues.push({
          path: `$.domains[${index}].competingDomainIds`,
          message: `domain '${otherId}' cannot be both competing and coexisting`,
        });
      }
      const other = domainById.get(otherId);
      if (
        other !== undefined &&
        (!Array.isArray(other.competingDomainIds) || !other.competingDomainIds.includes(value.id))
      ) {
        issues.push({
          path: `$.domains[${index}].competingDomainIds`,
          message: `competition with '${otherId}' must be symmetric`,
        });
      }
    }
    for (const otherId of coexisting) {
      const other = domainById.get(otherId);
      if (
        other !== undefined &&
        (!Array.isArray(other.coexistingDomainIds) || !other.coexistingDomainIds.includes(value.id))
      ) {
        issues.push({
          path: `$.domains[${index}].coexistingDomainIds`,
          message: `coexistence with '${otherId}' must be symmetric`,
        });
      }
    }
  });

  instruments.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.instruments[${index}]`;
    optionalString(value.label, `${path}.label`, issues);
    for (const field of ["unit", "ledger", "rail"] as const) {
      requireString(value[field], `${path}.${field}`, issues);
    }
    if (value.issuerId !== null) requireString(value.issuerId, `${path}.issuerId`, issues);
    safeInteger(value.authenticationCost, `${path}.authenticationCost`, issues);
    safeInteger(value.transactionCost, `${path}.transactionCost`, issues);
    if (requireArray(value.supportsFractionation, `${path}.supportsFractionation`, issues)) {
      const seen = new Set<string>();
      value.supportsFractionation.forEach((entry, fractionationIndex) => {
        if (
          requireEnum(
            entry,
            FRACTIONATION_KINDS,
            `${path}.supportsFractionation[${fractionationIndex}]`,
            issues
          )
        ) {
          if (seen.has(entry)) {
            issues.push({
              path: `${path}.supportsFractionation[${fractionationIndex}]`,
              message: `duplicate fractionation kind '${entry}'`,
            });
          }
          seen.add(entry);
        }
      });
    }
    requireBoolean(value.repairable, `${path}.repairable`, issues);
  });

  relationships.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.relationships[${index}]`;
    const fromValid = requireReference(value.fromActorId, actorIds, `${path}.fromActorId`, issues);
    const toValid = requireReference(value.toActorId, actorIds, `${path}.toActorId`, issues);
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    const relationshipInstruments = requireReferenceArray(
      value.instrumentIds,
      instrumentIds,
      `${path}.instrumentIds`,
      issues,
      false
    );
    requireBoolean(value.active, `${path}.active`, issues);
    ppm(value.opportunityArrivalPpm, `${path}.opportunityArrivalPpm`, issues);
    if (fromValid && toValid && value.fromActorId === value.toActorId) {
      issues.push({ path, message: "relationship endpoints must be distinct actors" });
    }
    if (domainValid) {
      const domain = domainById.get(value.domainId as string);
      if (domain !== undefined) {
        for (const [field, valid] of [
          ["fromActorId", fromValid],
          ["toActorId", toValid],
        ] as const) {
          if (valid && !includesString(domain.population, value[field] as string)) {
            issues.push({
              path: `${path}.${field}`,
              message: "actor is outside the relationship domain",
            });
          }
        }
        for (const instrumentId of relationshipInstruments) {
          validateDomainInstrumentScope(domain, instrumentById.get(instrumentId), path, issues);
        }
      }
    }
  });

  keepers.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.keeperAssignments[${index}]`;
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    let instrumentValid = value.instrumentId === null;
    if (value.instrumentId !== null) {
      instrumentValid = requireReference(
        value.instrumentId,
        instrumentIds,
        `${path}.instrumentId`,
        issues
      );
    }
    requireEnum(value.keeperFunction, KEEPER_FUNCTIONS, `${path}.keeperFunction`, issues);
    requireEnum(value.topology, KEEPER_TOPOLOGIES, `${path}.topology`, issues);
    const keeperActors = requireReferenceArray(
      value.actorIds,
      actorIds,
      `${path}.actorIds`,
      issues
    );
    const requiredActorsValid = safeInteger(
      value.requiredActorsPerAction,
      `${path}.requiredActorsPerAction`,
      issues,
      1
    );
    safeInteger(value.capacityPerTick, `${path}.capacityPerTick`, issues, 1);
    ppm(value.reliabilityPpm, `${path}.reliabilityPpm`, issues);
    safeInteger(value.costPerAction, `${path}.costPerAction`, issues);
    safeInteger(value.rewardPerAction, `${path}.rewardPerAction`, issues);
    requireEnum(value.funding, KEEPER_FUNDING, `${path}.funding`, issues);
    const fundingActors = requireReferenceArray(
      value.fundingActorIds,
      actorIds,
      `${path}.fundingActorIds`,
      issues
    );
    const externalPayers = requireStringArray(
      value.externalPayerIds,
      `${path}.externalPayerIds`,
      issues
    );
    externalPayers.forEach((payerId, payerIndex) =>
      requireIdentifier(payerId, `${path}.externalPayerIds[${payerIndex}]`, issues)
    );
    externalPayers.forEach((payerId, payerIndex) => {
      if (actorIds.has(payerId)) {
        issues.push({
          path: `${path}.externalPayerIds[${payerIndex}]`,
          message: "external payer ids must be disjoint from participant actor ids",
        });
      }
    });
    const externalBudgetValid = safeInteger(
      value.externalFundingBudgetPerTick,
      `${path}.externalFundingBudgetPerTick`,
      issues
    );
    safeInteger(
      value.fundingCapacityPerActorPerTick,
      `${path}.fundingCapacityPerActorPerTick`,
      issues
    );
    if (
      requiredActorsValid &&
      (value.requiredActorsPerAction as number) > keeperActors.length &&
      !isRecord(value.openBoundary)
    ) {
      issues.push({
        path: `${path}.requiredActorsPerAction`,
        message: "cannot exceed the number of assigned keeper actors",
      });
    }
    if (value.funding === "internal" && fundingActors.length === 0) {
      issues.push({
        path: `${path}.fundingActorIds`,
        message: "internal keeper rewards must name at least one funding actor",
      });
    }
    if (value.funding !== "internal" && fundingActors.length > 0) {
      issues.push({
        path: `${path}.fundingActorIds`,
        message: "funding actors are only valid for internally funded keeper work",
      });
    }
    if (value.funding === "external" && externalPayers.length === 0) {
      issues.push({
        path: `${path}.externalPayerIds`,
        message: "external keeper funding must name at least one payer",
      });
    }
    if (value.funding !== "external" && externalPayers.length > 0) {
      issues.push({
        path: `${path}.externalPayerIds`,
        message: "external payer ids are only valid for externally funded keeper work",
      });
    }
    if (value.funding !== "external" && value.externalFundingBudgetPerTick !== 0) {
      issues.push({
        path: `${path}.externalFundingBudgetPerTick`,
        message: "only externally funded keeper work may declare an external budget",
      });
    }
    if (
      value.funding === "external" &&
      externalBudgetValid &&
      requiredActorsValid &&
      typeof value.rewardPerAction === "number" &&
      value.rewardPerAction > 0 &&
      (value.externalFundingBudgetPerTick as number) / value.rewardPerAction <
        (value.requiredActorsPerAction as number)
    ) {
      issues.push({
        path: `${path}.externalFundingBudgetPerTick`,
        message: "external budget cannot fund one required keeper action",
      });
    }
    if (value.funding !== "internal" && value.fundingCapacityPerActorPerTick !== 0) {
      issues.push({
        path: `${path}.fundingCapacityPerActorPerTick`,
        message: "only internally funded keeper work may declare participant funding capacity",
      });
    }
    if (value.funding === "unfunded" && value.rewardPerAction !== 0) {
      issues.push({
        path: `${path}.rewardPerAction`,
        message: "an unfunded keeper assignment cannot promise a reward",
      });
    }
    if (keeperActors.length === 0 && !isRecord(value.openBoundary)) {
      issues.push({ path, message: "keeper needs an actor assignment or explicit open boundary" });
    }
    if (value.openBoundary !== undefined) {
      if (requireRecord(value.openBoundary, `${path}.openBoundary`, issues)) {
        requireString(value.openBoundary.description, `${path}.openBoundary.description`, issues);
        requireString(
          value.openBoundary.failureSignal,
          `${path}.openBoundary.failureSignal`,
          issues
        );
      }
    }
    if (typeof value.fallbackAssignmentId === "string") {
      requireReference(
        value.fallbackAssignmentId,
        keeperIds,
        `${path}.fallbackAssignmentId`,
        issues
      );
      if (value.fallbackAssignmentId === value.id) {
        issues.push({
          path: `${path}.fallbackAssignmentId`,
          message: "keeper cannot be its own fallback",
        });
      }
    } else if (value.fallbackAssignmentId !== undefined) {
      requireString(value.fallbackAssignmentId, `${path}.fallbackAssignmentId`, issues);
    }
    if (domainValid) {
      const domain = domainById.get(value.domainId as string);
      for (const actorId of keeperActors) {
        if (domain !== undefined && !includesString(domain.population, actorId)) {
          issues.push({
            path: `${path}.actorIds`,
            message: `keeper actor '${actorId}' is outside the domain`,
          });
        }
      }
      for (const actorId of fundingActors) {
        if (domain !== undefined && !includesString(domain.population, actorId)) {
          issues.push({
            path: `${path}.fundingActorIds`,
            message: `funding actor '${actorId}' is outside the domain`,
          });
        }
      }
      if (instrumentValid && value.instrumentId !== null) {
        validateDomainInstrumentScope(
          domain,
          instrumentById.get(value.instrumentId as string),
          path,
          issues
        );
      }
    }
  });

  keepers.forEach((value, index) => {
    if (!isRecord(value) || typeof value.fallbackAssignmentId !== "string") return;
    const fallback = keeperById.get(value.fallbackAssignmentId);
    validateKeeperScope(
      fallback,
      value.domainId,
      value.instrumentId,
      `$.keeperAssignments[${index}].fallbackAssignmentId`,
      issues
    );
    if (
      fallback !== undefined &&
      typeof value.keeperFunction === "string" &&
      fallback.keeperFunction !== value.keeperFunction
    ) {
      issues.push({
        path: `$.keeperAssignments[${index}].fallbackAssignmentId`,
        message: "fallback must serve the same keeper function as its primary assignment",
      });
    }
  });

  circuits.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.circuits[${index}]`;
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    const instrumentValid = requireReference(
      value.instrumentId,
      instrumentIds,
      `${path}.instrumentId`,
      issues
    );
    safeInteger(value.minCompletedCycles, `${path}.minCompletedCycles`, issues, 1);
    const distinctValid = safeInteger(
      value.minDistinctActors,
      `${path}.minDistinctActors`,
      issues,
      2
    );
    safeInteger(value.windowTicks, `${path}.windowTicks`, issues, 1);
    ppm(value.maxFailurePpm, `${path}.maxFailurePpm`, issues);
    if (domainValid && instrumentValid) {
      validateDomainInstrumentScope(
        domainById.get(value.domainId as string),
        instrumentById.get(value.instrumentId as string),
        path,
        issues
      );
    }
    if (distinctValid && domainValid) {
      const population = domainById.get(value.domainId as string)?.population;
      if (Array.isArray(population) && (value.minDistinctActors as number) > population.length) {
        issues.push({
          path: `${path}.minDistinctActors`,
          message: "cannot exceed the domain population",
        });
      }
    }
    if (requireArray(value.edges, `${path}.edges`, issues)) {
      if (value.edges.length === 0)
        issues.push({ path: `${path}.edges`, message: "must not be empty" });
      const edgeIds = new Set<string>();
      const circuitParticipants = new Set<string>();
      let previousToActorId: unknown;
      value.edges.forEach((edge, edgeIndex) => {
        const edgePath = `${path}.edges[${edgeIndex}]`;
        if (!requireRecord(edge, edgePath, issues)) return;
        if (requireIdentifier(edge.id, `${edgePath}.id`, issues)) {
          if (edgeIds.has(edge.id))
            issues.push({ path: `${edgePath}.id`, message: "duplicate edge id" });
          edgeIds.add(edge.id);
        }
        const relationshipValid = requireReference(
          edge.relationshipId,
          relationshipIds,
          `${edgePath}.relationshipId`,
          issues
        );
        requireEnum(edge.action, CIRCUIT_ACTIONS, `${edgePath}.action`, issues);
        requireBoolean(edge.renewal, `${edgePath}.renewal`, issues);
        const loadBearingActors = requireReferenceArray(
          edge.loadBearingActorIds,
          actorIds,
          `${edgePath}.loadBearingActorIds`,
          issues,
          false
        );
        loadBearingActors.forEach(actorId => circuitParticipants.add(actorId));
        const edgeKeepers = requireReferenceArray(
          edge.keeperAssignmentIds,
          keeperIds,
          `${edgePath}.keeperAssignmentIds`,
          issues,
          false
        );
        if (relationshipValid) {
          const relationship = relationshipById.get(edge.relationshipId as string);
          validateRelationshipScope(
            relationship,
            value.domainId,
            value.instrumentId,
            `${edgePath}.relationshipId`,
            issues
          );
          if (relationship !== undefined) {
            const endpoints = new Set([relationship.fromActorId, relationship.toActorId]);
            for (const actorId of loadBearingActors) {
              if (!endpoints.has(actorId)) {
                issues.push({
                  path: `${edgePath}.loadBearingActorIds`,
                  message: `load-bearing actor '${actorId}' is not an endpoint of this edge`,
                });
              }
            }
            if (
              loadBearingActors.length !== endpoints.size ||
              [...endpoints].some(endpoint => !loadBearingActors.includes(endpoint as string))
            ) {
              issues.push({
                path: `${edgePath}.loadBearingActorIds`,
                message: "must name both relationship endpoints exactly once",
              });
            }
            if (
              edgeIndex > 0 &&
              typeof previousToActorId === "string" &&
              relationship.fromActorId !== previousToActorId
            ) {
              issues.push({
                path: `${edgePath}.relationshipId`,
                message: "circuit edge does not continue from the preceding relationship",
              });
            }
            previousToActorId = relationship.toActorId;
          }
        }
        for (const keeperId of edgeKeepers) {
          validateKeeperScope(
            keeperById.get(keeperId),
            value.domainId,
            value.instrumentId,
            `${edgePath}.keeperAssignmentIds`,
            issues
          );
        }
      });
      if (distinctValid && (value.minDistinctActors as number) > circuitParticipants.size) {
        issues.push({
          path: `${path}.minDistinctActors`,
          message: "cannot exceed the actors declared load-bearing on this circuit",
        });
      }
      validateCircuitSequence(value.edges, `${path}.edges`, issues);
    }
  });

  domains.forEach((domain, domainIndex) => {
    if (!isRecord(domain) || !Array.isArray(domain.instrumentIds)) return;
    for (const instrumentId of domain.instrumentIds) {
      if (typeof domain.id === "string" && typeof instrumentId === "string") {
        const matchingCircuits = circuits.filter(
          circuit =>
            isRecord(circuit) &&
            circuit.domainId === domain.id &&
            circuit.instrumentId === instrumentId
        );
        if (matchingCircuits.length !== 1) {
          issues.push({
            path: `$.domains[${domainIndex}].instrumentIds`,
            message:
              matchingCircuits.length === 0
                ? `missing circulation circuit for '${domain.id}::${instrumentId}'`
                : `schema v1 requires exactly one circulation circuit for '${domain.id}::${instrumentId}'`,
          });
        }
      }
    }
  });

  priming.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.primingMechanisms[${index}]`;
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    const instrumentValid = requireReference(
      value.instrumentId,
      instrumentIds,
      `${path}.instrumentId`,
      issues
    );
    const circuitValid = requireReference(value.circuitId, circuitIds, `${path}.circuitId`, issues);
    const payerIds = requireStringArray(value.payerIds, `${path}.payerIds`, issues, false);
    payerIds.forEach((payerId, payerIndex) =>
      requireIdentifier(payerId, `${path}.payerIds[${payerIndex}]`, issues)
    );
    const targets = requireReferenceArray(
      value.targetActorIds,
      actorIds,
      `${path}.targetActorIds`,
      issues,
      false
    );
    const primingKeepers = requireReferenceArray(
      value.keeperAssignmentIds,
      keeperIds,
      `${path}.keeperAssignmentIds`,
      issues
    );
    requireReferenceArray(
      value.bondedAssumptionIds,
      assumptionIds,
      `${path}.bondedAssumptionIds`,
      issues
    );
    requireEnum(value.wedgeKind, WEDGE_KINDS, `${path}.wedgeKind`, issues);
    optionalString(value.wedgeDescription, `${path}.wedgeDescription`, issues);
    if (value.wedgeKind === "other") {
      requireString(value.wedgeDescription, `${path}.wedgeDescription`, issues);
    }
    const startsValid = safeInteger(value.startsAtTick, `${path}.startsAtTick`, issues);
    safeInteger(value.costPerTick, `${path}.costPerTick`, issues);
    safeInteger(value.totalBudget, `${path}.totalBudget`, issues);
    ppm(value.acceptanceBoostPpm, `${path}.acceptanceBoostPpm`, issues);
    safeInteger(value.switchingCostOffset, `${path}.switchingCostOffset`, issues);
    safeInteger(value.removalTestTicks, `${path}.removalTestTicks`, issues, 1);
    requireBoolean(value.externalInput, `${path}.externalInput`, issues);
    if (startsValid && ticksValid && (value.startsAtTick as number) >= (input.ticks as number)) {
      issues.push({ path: `${path}.startsAtTick`, message: "must occur before the scenario ends" });
    }
    if (domainValid && instrumentValid) {
      const domain = domainById.get(value.domainId as string);
      validateDomainInstrumentScope(
        domain,
        instrumentById.get(value.instrumentId as string),
        path,
        issues
      );
      for (const actorId of targets) {
        if (domain !== undefined && !includesString(domain.population, actorId)) {
          issues.push({
            path: `${path}.targetActorIds`,
            message: `target '${actorId}' is outside the domain`,
          });
        }
      }
    }
    if (circuitValid) {
      const circuit = circuitById.get(value.circuitId as string);
      if (
        circuit !== undefined &&
        (circuit.domainId !== value.domainId || circuit.instrumentId !== value.instrumentId)
      ) {
        issues.push({
          path: `${path}.circuitId`,
          message: "circuit scope does not match priming scope",
        });
      }
      if (circuit !== undefined && Array.isArray(circuit.edges)) {
        const requiredKeeperIds = [
          ...new Set(
            circuit.edges.flatMap(edge =>
              isRecord(edge) && Array.isArray(edge.keeperAssignmentIds)
                ? edge.keeperAssignmentIds.filter(
                    (keeperId): keeperId is string => typeof keeperId === "string"
                  )
                : []
            )
          ),
        ];
        if (
          new Set(primingKeepers).size !== new Set(requiredKeeperIds).size ||
          requiredKeeperIds.some(keeperId => !primingKeepers.includes(keeperId))
        ) {
          issues.push({
            path: `${path}.keeperAssignmentIds`,
            message: "priming must name the circuit's complete keeper path",
          });
        }
      }
    }
    for (const keeperId of primingKeepers) {
      validateKeeperScope(
        keeperById.get(keeperId),
        value.domainId,
        value.instrumentId,
        `${path}.keeperAssignmentIds`,
        issues
      );
    }

    if (!requireRecord(value.stopCondition, `${path}.stopCondition`, issues)) return;
    if (
      !requireEnum(
        value.stopCondition.kind,
        PRIMING_STOP_KINDS,
        `${path}.stopCondition.kind`,
        issues
      )
    ) {
      return;
    }
    switch (value.stopCondition.kind) {
      case "tick": {
        rejectPresentFields(
          value.stopCondition,
          ["persistenceTicks"],
          `${path}.stopCondition`,
          issues
        );
        const stopTickValid = safeInteger(
          value.stopCondition.tick,
          `${path}.stopCondition.tick`,
          issues
        );
        if (
          stopTickValid &&
          startsValid &&
          (value.stopCondition.tick as number) < (value.startsAtTick as number)
        ) {
          issues.push({
            path: `${path}.stopCondition.tick`,
            message: "cannot precede startsAtTick",
          });
        }
        if (
          stopTickValid &&
          ticksValid &&
          (value.stopCondition.tick as number) >= (input.ticks as number)
        ) {
          issues.push({
            path: `${path}.stopCondition.tick`,
            message: "must occur before the scenario ends",
          });
        }
        break;
      }
      case "credible-circuit":
      case "installed":
        rejectPresentFields(value.stopCondition, ["tick"], `${path}.stopCondition`, issues);
        safeInteger(
          value.stopCondition.persistenceTicks,
          `${path}.stopCondition.persistenceTicks`,
          issues,
          1
        );
        break;
      case "budget-exhausted":
        rejectPresentFields(
          value.stopCondition,
          ["tick", "persistenceTicks"],
          `${path}.stopCondition`,
          issues
        );
        break;
    }
  });

  opportunities.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.continuationOpportunities[${index}]`;
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    const relationshipValid = requireReference(
      value.relationshipId,
      relationshipIds,
      `${path}.relationshipId`,
      issues
    );
    const instrumentValid = requireReference(
      value.instrumentId,
      instrumentIds,
      `${path}.instrumentId`,
      issues
    );
    ppm(value.arrivalPpm, `${path}.arrivalPpm`, issues);
    ppm(value.clearProbabilityPpm, `${path}.clearProbabilityPpm`, issues);
    requireString(value.provenance, `${path}.provenance`, issues);
    requireReferenceArray(
      value.bondedAssumptionIds,
      assumptionIds,
      `${path}.bondedAssumptionIds`,
      issues
    );
    if (domainValid && instrumentValid) {
      validateDomainInstrumentScope(
        domainById.get(value.domainId as string),
        instrumentById.get(value.instrumentId as string),
        path,
        issues
      );
    }
    if (relationshipValid) {
      validateRelationshipScope(
        relationshipById.get(value.relationshipId as string),
        value.domainId,
        value.instrumentId,
        `${path}.relationshipId`,
        issues
      );
    }
    if (requireArray(value.accessibleSurplus, `${path}.accessibleSurplus`, issues)) {
      if (value.accessibleSurplus.length === 0) {
        issues.push({
          path: `${path}.accessibleSurplus`,
          message: "must name at least one actor payoff",
        });
      }
      const accessibleActors = new Set<string>();
      value.accessibleSurplus.forEach((entry, actorIndex) => {
        const actorPath = `${path}.accessibleSurplus[${actorIndex}]`;
        if (!requireRecord(entry, actorPath, issues)) return;
        const actorValid = requireReference(
          entry.actorId,
          actorIds,
          `${actorPath}.actorId`,
          issues
        );
        if (actorValid) {
          if (accessibleActors.has(entry.actorId as string)) {
            issues.push({
              path: `${actorPath}.actorId`,
              message: "duplicate accessible-surplus actor",
            });
          }
          accessibleActors.add(entry.actorId as string);
          const domain = domainValid ? domainById.get(value.domainId as string) : undefined;
          if (domain !== undefined && !includesString(domain.population, entry.actorId as string)) {
            issues.push({
              path: `${actorPath}.actorId`,
              message: "actor is outside the opportunity domain",
            });
          }
        }
        if (requireArray(entry.components, `${actorPath}.components`, issues)) {
          if (entry.components.length === 0) {
            issues.push({ path: `${actorPath}.components`, message: "must not be empty" });
          }
          const overlapKeys = new Set<string>();
          entry.components.forEach((component, componentIndex) => {
            const componentPath = `${actorPath}.components[${componentIndex}]`;
            if (!requireRecord(component, componentPath, issues)) return;
            const kindValid = requireEnum(
              component.kind,
              SURPLUS_KINDS,
              `${componentPath}.kind`,
              issues
            );
            safeInteger(component.amount, `${componentPath}.amount`, issues);
            requireString(component.counterfactualId, `${componentPath}.counterfactualId`, issues);
            if (requireString(component.overlapKey, `${componentPath}.overlapKey`, issues)) {
              if (overlapKeys.has(component.overlapKey)) {
                issues.push({
                  path: `${componentPath}.overlapKey`,
                  message: "duplicates another component and would double count surplus",
                });
              }
              overlapKeys.add(component.overlapKey);
            }
            if (component.fractionationKind !== undefined) {
              requireEnum(
                component.fractionationKind,
                FRACTIONATION_KINDS,
                `${componentPath}.fractionationKind`,
                issues
              );
            }
            if (
              kindValid &&
              component.kind === "trade-fractionation" &&
              component.fractionationKind === undefined
            ) {
              issues.push({
                path: `${componentPath}.fractionationKind`,
                message: "trade-fractionation requires a fractionation kind",
              });
            }
          });
        }
      });
    }
  });

  const continuationKeys = new Set<string>();
  const referencedOpportunityIds = new Set<string>();
  continuations.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.continuationAssumptions[${index}]`;
    const actorValid = requireReference(value.actorId, actorIds, `${path}.actorId`, issues);
    const domainValid = requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
    const instrumentValid = requireReference(
      value.instrumentId,
      instrumentIds,
      `${path}.instrumentId`,
      issues
    );
    const actionValid = requireEnum(value.action, CONTINUATION_ACTIONS, `${path}.action`, issues);
    const referencedOpportunities = requireReferenceArray(
      value.opportunityIds,
      opportunityIds,
      `${path}.opportunityIds`,
      issues,
      false
    );
    referencedOpportunities.forEach(opportunityId => referencedOpportunityIds.add(opportunityId));
    requireReferenceArray(
      value.bondedAssumptionIds,
      assumptionIds,
      `${path}.bondedAssumptionIds`,
      issues
    );
    if (actorValid && domainValid && instrumentValid && actionValid) {
      const key = `${value.actorId}::${value.action}::${value.domainId}::${value.instrumentId}`;
      if (continuationKeys.has(key)) {
        issues.push({ path, message: `duplicate continuation claim '${key}'` });
      }
      continuationKeys.add(key);
      const domain = domainById.get(value.domainId as string);
      validateDomainInstrumentScope(
        domain,
        instrumentById.get(value.instrumentId as string),
        path,
        issues
      );
      if (domain !== undefined && !includesString(domain.population, value.actorId as string)) {
        issues.push({
          path: `${path}.actorId`,
          message: "actor is outside the continuation domain",
        });
      }
    }
    safeInteger(value.horizonTicks, `${path}.horizonTicks`, issues, 1);
    atMost(value.horizonTicks, MAX_CONTINUATION_HORIZON_TICKS, `${path}.horizonTicks`, issues);
    ppm(value.discountPpm, `${path}.discountPpm`, issues);
    for (const field of [
      "outsideOptionAdvantage",
      "immediateReward",
      "oneShotDefectionGain",
      "participationCost",
      "keeperEffortCost",
      "riskCost",
    ] as const) {
      safeInteger(value[field], `${path}.${field}`, issues);
    }
    if (!requireRecord(value.lossPath, `${path}.lossPath`, issues)) {
      // The field-level issue is sufficient.
    } else if (value.lossPath.kind === "direct") {
      rejectPresentFields(
        value.lossPath,
        ["observationPpm", "upheldFindingPpm", "responsePpm"],
        `${path}.lossPath`,
        issues
      );
      ppm(value.lossPath.lossProbabilityPpm, `${path}.lossPath.lossProbabilityPpm`, issues);
    } else if (value.lossPath.kind === "finding-mediated") {
      rejectPresentFields(value.lossPath, ["lossProbabilityPpm"], `${path}.lossPath`, issues);
      ppm(value.lossPath.observationPpm, `${path}.lossPath.observationPpm`, issues);
      ppm(value.lossPath.upheldFindingPpm, `${path}.lossPath.upheldFindingPpm`, issues);
      ppm(value.lossPath.responsePpm, `${path}.lossPath.responsePpm`, issues);
    } else {
      issues.push({ path: `${path}.lossPath.kind`, message: "invalid loss path" });
    }

    const overlapKeys = new Map<string, string>();
    for (const opportunityId of referencedOpportunities) {
      const opportunity = opportunityById.get(opportunityId);
      if (opportunity === undefined) continue;
      if (
        opportunity.domainId !== value.domainId ||
        opportunity.instrumentId !== value.instrumentId
      ) {
        issues.push({
          path: `${path}.opportunityIds`,
          message: `opportunity '${opportunityId}' has a different domain or instrument`,
        });
      }
      const actorEntry = Array.isArray(opportunity.accessibleSurplus)
        ? opportunity.accessibleSurplus.find(
            entry => isRecord(entry) && entry.actorId === value.actorId
          )
        : undefined;
      if (!isRecord(actorEntry)) {
        issues.push({
          path: `${path}.opportunityIds`,
          message: `opportunity '${opportunityId}' has no accessible surplus for actor '${String(value.actorId)}'`,
        });
        continue;
      }
      if (!Array.isArray(actorEntry.components)) continue;
      for (const component of actorEntry.components) {
        if (!isRecord(component) || typeof component.overlapKey !== "string") continue;
        const firstOpportunity = overlapKeys.get(component.overlapKey);
        if (firstOpportunity !== undefined) {
          issues.push({
            path: `${path}.opportunityIds`,
            message:
              `overlap key '${component.overlapKey}' appears in both '${firstOpportunity}' and ` +
              `'${opportunityId}' for this actor`,
          });
        } else {
          overlapKeys.set(component.overlapKey, opportunityId);
        }
      }
    }
  });

  opportunities.forEach((value, index) => {
    if (
      isRecord(value) &&
      typeof value.id === "string" &&
      !referencedOpportunityIds.has(value.id)
    ) {
      issues.push({
        path: `$.continuationOpportunities[${index}]`,
        message: "must be referenced by at least one continuation assumption",
      });
    }
  });

  circuits.forEach((circuit, circuitIndex) => {
    if (
      !isRecord(circuit) ||
      typeof circuit.domainId !== "string" ||
      typeof circuit.instrumentId !== "string" ||
      !Array.isArray(circuit.edges)
    ) {
      return;
    }
    const loadBearingClaims = new Set<string>();
    circuit.edges.forEach(edge => {
      if (!isRecord(edge) || typeof edge.action !== "string") return;
      if (!Array.isArray(edge.loadBearingActorIds)) return;
      edge.loadBearingActorIds.forEach(actorId => {
        if (typeof actorId === "string") {
          loadBearingClaims.add(`${actorId}::${edge.action}`);
        }
      });
    });
    const realisedIds = new Set<string>();
    continuations.forEach(continuation => {
      if (
        !isRecord(continuation) ||
        continuation.domainId !== circuit.domainId ||
        continuation.instrumentId !== circuit.instrumentId ||
        typeof continuation.actorId !== "string" ||
        typeof continuation.action !== "string" ||
        !loadBearingClaims.has(`${continuation.actorId}::${continuation.action}`) ||
        !Array.isArray(continuation.opportunityIds)
      ) {
        return;
      }
      continuation.opportunityIds.forEach(opportunityId => {
        if (typeof opportunityId === "string") realisedIds.add(opportunityId);
      });
    });

    const actorOverlapKeys = new Map<string, Map<string, string>>();
    for (const opportunityId of realisedIds) {
      const opportunity = opportunityById.get(opportunityId);
      if (
        !isRecord(opportunity) ||
        opportunity.domainId !== circuit.domainId ||
        opportunity.instrumentId !== circuit.instrumentId ||
        !Array.isArray(opportunity.accessibleSurplus)
      ) {
        continue;
      }
      opportunity.accessibleSurplus.forEach(entry => {
        if (
          !isRecord(entry) ||
          typeof entry.actorId !== "string" ||
          !Array.isArray(entry.components)
        ) {
          return;
        }
        const overlapKeys = actorOverlapKeys.get(entry.actorId) ?? new Map<string, string>();
        actorOverlapKeys.set(entry.actorId, overlapKeys);
        entry.components.forEach(component => {
          if (!isRecord(component) || typeof component.overlapKey !== "string") return;
          const firstOpportunity = overlapKeys.get(component.overlapKey);
          if (firstOpportunity !== undefined && firstOpportunity !== opportunityId) {
            issues.push({
              path: `$.circuits[${circuitIndex}]`,
              message:
                `realised surplus overlap key '${component.overlapKey}' for actor ` +
                `'${entry.actorId}' appears in both '${firstOpportunity}' and '${opportunityId}'`,
            });
          } else {
            overlapKeys.set(component.overlapKey, opportunityId);
          }
        });
      });
    }
  });

  const requireContinuationClaim = (
    actorId: unknown,
    action: unknown,
    domainId: unknown,
    instrumentId: unknown,
    path: string
  ): void => {
    if (
      typeof actorId !== "string" ||
      typeof action !== "string" ||
      typeof domainId !== "string" ||
      typeof instrumentId !== "string"
    ) {
      return;
    }
    const key = `${actorId}::${action}::${domainId}::${instrumentId}`;
    if (!continuationKeys.has(key)) {
      issues.push({
        path,
        message: `missing load-bearing continuation claim '${key}'`,
      });
    }
  };

  circuits.forEach((circuit, circuitIndex) => {
    if (!isRecord(circuit) || !Array.isArray(circuit.edges)) return;
    circuit.edges.forEach((edge, edgeIndex) => {
      if (!isRecord(edge) || !Array.isArray(edge.loadBearingActorIds)) return;
      edge.loadBearingActorIds.forEach(actorId =>
        requireContinuationClaim(
          actorId,
          edge.action,
          circuit.domainId,
          circuit.instrumentId,
          `$.circuits[${circuitIndex}].edges[${edgeIndex}].loadBearingActorIds`
        )
      );
    });
  });

  keepers.forEach((keeper, keeperIndex) => {
    if (!isRecord(keeper) || !Array.isArray(keeper.actorIds)) return;
    const instruments =
      typeof keeper.instrumentId === "string"
        ? [keeper.instrumentId]
        : circuits.flatMap(circuit => {
            if (
              !isRecord(circuit) ||
              circuit.domainId !== keeper.domainId ||
              typeof circuit.instrumentId !== "string" ||
              !Array.isArray(circuit.edges) ||
              !circuit.edges.some(
                edge =>
                  isRecord(edge) &&
                  Array.isArray(edge.keeperAssignmentIds) &&
                  edge.keeperAssignmentIds.includes(keeper.id)
              )
            ) {
              return [];
            }
            return [circuit.instrumentId];
          });
    for (const instrumentId of new Set(instruments)) {
      keeper.actorIds.forEach(actorId =>
        requireContinuationClaim(
          actorId,
          keeper.keeperFunction,
          keeper.domainId,
          instrumentId,
          `$.keeperAssignments[${keeperIndex}].actorIds`
        )
      );
      if (
        keeper.funding === "internal" &&
        typeof keeper.rewardPerAction === "number" &&
        keeper.rewardPerAction > 0 &&
        Array.isArray(keeper.fundingActorIds)
      ) {
        keeper.fundingActorIds.forEach(actorId =>
          requireContinuationClaim(
            actorId,
            "fund-keeper",
            keeper.domainId,
            instrumentId,
            `$.keeperAssignments[${keeperIndex}].fundingActorIds`
          )
        );
      }
    }
  });

  assumptions.forEach((value, index) => {
    if (!isRecord(value)) return;
    const path = `$.bondedAssumptions[${index}]`;
    for (const field of [
      "scope",
      "claim",
      "assertedBy",
      "stake",
      "refutationCondition",
      "challengerStanding",
      "provenance",
    ] as const) {
      requireString(value[field], `${path}.${field}`, issues);
    }
  });

  shocks.forEach((value, index) => {
    const path = `$.shocks[${index}]`;
    if (!requireRecord(value, path, issues)) return;
    const tickValid = safeInteger(value.tick, `${path}.tick`, issues);
    if (tickValid && ticksValid && (value.tick as number) >= (input.ticks as number)) {
      issues.push({ path: `${path}.tick`, message: "must occur before the scenario ends" });
    }
    if (!requireEnum(value.kind, SHOCK_KINDS, `${path}.kind`, issues)) return;
    switch (value.kind) {
      case "deactivate-actor":
        rejectPresentFields(
          value,
          ["relationshipId", "keeperAssignmentId", "primingMechanismId", "domainId", "factorPpm"],
          path,
          issues
        );
        requireReference(value.actorId, actorIds, `${path}.actorId`, issues);
        break;
      case "deactivate-relationship":
        rejectPresentFields(
          value,
          ["actorId", "keeperAssignmentId", "primingMechanismId", "domainId", "factorPpm"],
          path,
          issues
        );
        requireReference(value.relationshipId, relationshipIds, `${path}.relationshipId`, issues);
        break;
      case "disable-keeper":
        rejectPresentFields(
          value,
          ["actorId", "relationshipId", "primingMechanismId", "domainId", "factorPpm"],
          path,
          issues
        );
        requireReference(value.keeperAssignmentId, keeperIds, `${path}.keeperAssignmentId`, issues);
        break;
      case "stop-priming":
        rejectPresentFields(
          value,
          ["actorId", "relationshipId", "keeperAssignmentId", "domainId", "factorPpm"],
          path,
          issues
        );
        requireReference(
          value.primingMechanismId,
          primingIds,
          `${path}.primingMechanismId`,
          issues
        );
        break;
      case "scale-opportunities":
        rejectPresentFields(
          value,
          ["actorId", "relationshipId", "keeperAssignmentId", "primingMechanismId"],
          path,
          issues
        );
        requireReference(value.domainId, domainIds, `${path}.domainId`, issues);
        ppm(value.factorPpm, `${path}.factorPpm`, issues);
        break;
    }
  });

  (input.worldBoundaries as unknown[]).forEach((value, index) =>
    requireString(value, `$.worldBoundaries[${index}]`, issues)
  );
  (input.killConditions as unknown[]).forEach((value, index) =>
    requireString(value, `$.killConditions[${index}]`, issues)
  );

  return issues;
}

export function assertValidScenario(input: unknown): asserts input is ScenarioSpec {
  const issues = validateScenario(input);
  if (issues.length > 0) throw new ScenarioValidationError(issues);
}
