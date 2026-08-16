import { canonicalJson } from "./canonical-json.js";
import { runSelectionLifecycle } from "./engine.js";
import type { SimulationEvent } from "./events.js";
import { replayScenario } from "./reducer.js";
import type { ScenarioSpec, SimulationState } from "./types.js";

export interface DeterministicTraceInput {
  scenario: ScenarioSpec;
  seed: string;
  /** Trusted run length. It is deliberately not inferred from an untrusted trace. */
  ticks: number;
  events: readonly SimulationEvent[];
}

function eventLabel(event: SimulationEvent | undefined): string {
  return event === undefined ? "end-of-trace" : `${event.type} '${event.id}'`;
}

/**
 * Authenticate an imported deterministic trace against this pinned model,
 * schedule and RNG implementation. Structural replay alone cannot prove that
 * a source-scheduled or randomly selected event was not omitted.
 */
export function verifyDeterministicTrace(input: DeterministicTraceInput): SimulationState {
  if (!Number.isSafeInteger(input.ticks) || input.ticks < 1) {
    throw new RangeError("verified trace ticks must be a positive safe integer");
  }
  if (input.ticks > input.scenario.ticks) {
    throw new RangeError("verified trace ticks exceed the scenario horizon");
  }
  // Snapshot the caller's JSON-safe trace once. Comparison and replay must not
  // re-read a mutable array, accessor or iterator with different behaviour.
  const supplied = JSON.parse(canonicalJson(input.events)) as SimulationEvent[];
  const expected = runSelectionLifecycle(input.scenario, input.seed, {
    ticks: input.ticks,
  }).events;
  const length = Math.max(expected.length, supplied.length);
  for (let index = 0; index < length; index += 1) {
    const expectedEvent = expected[index];
    const actualEvent = supplied[index];
    if (
      expectedEvent === undefined ||
      actualEvent === undefined ||
      canonicalJson(expectedEvent) !== canonicalJson(actualEvent)
    ) {
      throw new RangeError(
        `deterministic trace mismatch at event ${index}: expected ${eventLabel(
          expectedEvent
        )}, received ${eventLabel(actualEvent)}`
      );
    }
  }
  return replayScenario(input.scenario, supplied);
}
