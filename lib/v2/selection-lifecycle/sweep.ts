import { canonicalHash } from "./canonical-json.js";
import { runSelectionLifecycle, type SimulationOptions } from "./engine.js";
import type { ScenarioSpec, SelectionLifecycleState } from "./types.js";
import { assertValidScenario } from "./validate.js";

export interface SweepAxis {
  /** JSON Pointer into the JSON-safe ScenarioSpec. */
  path: string;
  values: number[];
}

export interface SweepCoordinate {
  path: string;
  value: number;
}

export interface SweepRunRecord {
  coordinates: SweepCoordinate[];
  seed: string;
  scenarioHash: string;
  terminalStateHash: string;
  lifecycleByDomainInstrument: Record<string, SelectionLifecycleState>;
  survivedAfterPriming: Record<string, boolean | null>;
  weakestKeeperMargin: number | null;
}

export interface SweepResult {
  sweepVersion: "selection-lifecycle-sweep/v1";
  baseScenarioId: string;
  baseScenarioHash: string;
  axes: SweepAxis[];
  seeds: string[];
  records: SweepRunRecord[];
}

function decodePointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function cloneScenario(scenario: ScenarioSpec): ScenarioSpec {
  return JSON.parse(JSON.stringify(scenario)) as ScenarioSpec;
}

function hasOwn(record: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function setNumericPointer(scenario: ScenarioSpec, path: string, value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`sweep value at '${path}' must be a safe integer`);
  }
  if (!path.startsWith("/") || path === "/") {
    throw new RangeError(`sweep path '${path}' must be a non-root JSON Pointer`);
  }
  const segments = path.slice(1).split("/").map(decodePointerSegment);
  let cursor: unknown = scenario;
  for (const segment of segments.slice(0, -1)) {
    if (Array.isArray(cursor)) {
      const index = Number(segment);
      if (!Number.isSafeInteger(index) || index < 0 || index >= cursor.length) {
        throw new RangeError(`sweep path '${path}' contains an invalid array index`);
      }
      cursor = cursor[index];
    } else if (typeof cursor === "object" && cursor !== null && hasOwn(cursor, segment)) {
      cursor = (cursor as Record<string, unknown>)[segment];
    } else {
      throw new RangeError(`sweep path '${path}' does not exist`);
    }
  }
  const leaf = segments[segments.length - 1];
  if (Array.isArray(cursor)) {
    const index = Number(leaf);
    if (!Number.isSafeInteger(index) || index < 0 || index >= cursor.length) {
      throw new RangeError(`sweep path '${path}' contains an invalid final index`);
    }
    if (typeof cursor[index] !== "number") {
      throw new TypeError(`sweep path '${path}' must target a numeric field`);
    }
    cursor[index] = value;
  } else if (typeof cursor === "object" && cursor !== null && hasOwn(cursor, leaf)) {
    const record = cursor as Record<string, unknown>;
    if (typeof record[leaf] !== "number") {
      throw new TypeError(`sweep path '${path}' must target a numeric field`);
    }
    record[leaf] = value;
  } else {
    throw new RangeError(`sweep path '${path}' does not exist`);
  }
}

function coordinates(axes: readonly SweepAxis[], index = 0): SweepCoordinate[][] {
  if (index >= axes.length) return [[]];
  const axis = axes[index];
  return axis.values.flatMap(value =>
    coordinates(axes, index + 1).map(rest => [{ path: axis.path, value }, ...rest])
  );
}

export function runParameterSweep(
  baseScenario: ScenarioSpec,
  axes: readonly SweepAxis[],
  seeds: readonly string[],
  options: SimulationOptions = {}
): SweepResult {
  assertValidScenario(baseScenario);
  if (axes.length === 0) throw new RangeError("a sweep requires at least one axis");
  if (seeds.length === 0 || seeds.some(seed => seed.trim() === "")) {
    throw new RangeError("a sweep requires at least one non-empty seed");
  }
  if (new Set(seeds).size !== seeds.length) {
    throw new RangeError("sweep seeds must be unique");
  }
  if (new Set(axes.map(axis => axis.path)).size !== axes.length) {
    throw new RangeError("sweep axis paths must be unique");
  }
  let runCount = BigInt(seeds.length);
  for (const axis of axes) {
    if (axis.values.length === 0) throw new RangeError(`sweep axis '${axis.path}' is empty`);
    if (new Set(axis.values).size !== axis.values.length) {
      throw new RangeError(`sweep axis '${axis.path}' contains duplicate values`);
    }
    runCount *= BigInt(axis.values.length);
  }
  if (runCount > 100_000n) {
    throw new RangeError("sweep exceeds the 100000-run safety limit");
  }

  const records: SweepRunRecord[] = [];
  for (const coordinate of coordinates(axes)) {
    const scenario = cloneScenario(baseScenario);
    coordinate.forEach(item => setNumericPointer(scenario, item.path, item.value));
    assertValidScenario(scenario);
    for (const seed of seeds) {
      const run = runSelectionLifecycle(scenario, seed, options);
      records.push({
        coordinates: coordinate,
        seed,
        scenarioHash: run.summary.manifest.scenarioHash,
        terminalStateHash: run.summary.terminalStateHash,
        lifecycleByDomainInstrument: run.summary.lifecycleByDomainInstrument,
        survivedAfterPriming: run.summary.survivedAfterPriming,
        weakestKeeperMargin: run.summary.weakestKeeperMargin?.margin ?? null,
      });
    }
  }
  return {
    sweepVersion: "selection-lifecycle-sweep/v1",
    baseScenarioId: baseScenario.id,
    baseScenarioHash: canonicalHash(baseScenario),
    axes: axes.map(axis => ({ path: axis.path, values: [...axis.values] })),
    seeds: [...seeds],
    records,
  };
}
