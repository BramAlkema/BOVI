import { canonicalJson } from "./canonical-json.js";
import { PPM, RNG_VERSION, type Ppm } from "./types.js";

const UINT32_SIZE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;

export type RngState = readonly [number, number, number, number];

export interface RngSnapshot {
  version: typeof RNG_VERSION;
  rootSeed: string;
  streamPath: string[];
  state: RngState;
  draws: number;
}

function rotateLeft(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function xmur3(seed: string): () => number {
  let hash = (1779033703 ^ seed.length) >>> 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = rotateLeft(hash, 13);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash = (hash ^ (hash >>> 16)) >>> 0;
    return hash;
  };
}

function deriveState(
  rootSeed: string,
  streamPath: readonly string[]
): [number, number, number, number] {
  const material = canonicalJson({
    rootSeed,
    streamPath,
    version: RNG_VERSION,
  });
  const seed = xmur3(material);
  const state: [number, number, number, number] = [seed(), seed(), seed(), seed()];

  // xoshiro128** has one forbidden state. Keep the exceptional mapping
  // explicit and versioned instead of relying on an astronomically unlikely
  // seed never occurring.
  if (state.every(word => word === 0)) state[0] = 0x9e3779b9;
  return state;
}

function requireStreamSegment(segment: string): void {
  if (typeof segment !== "string" || segment.length === 0) {
    throw new RangeError("RNG stream path segments must be non-empty strings");
  }
}

function requireUint32(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError(`${label} must be an unsigned 32-bit integer`);
  }
}

/**
 * xoshiro128** with xmur3 string seeding and consumption-independent forks.
 *
 * A fork is derived from the root seed and its complete named path, not from
 * the parent's mutable state. Adding draws to one named stream therefore does
 * not perturb unrelated streams.
 */
export class DeterministicRng {
  private state: [number, number, number, number];
  private drawCount = 0;
  private readonly path: string[];

  constructor(
    private readonly rootSeed: string,
    streamPath: readonly string[] = []
  ) {
    if (typeof rootSeed !== "string" || rootSeed.length === 0) {
      throw new RangeError("RNG root seed must be a non-empty string");
    }
    streamPath.forEach(requireStreamSegment);
    this.path = [...streamPath];
    this.state = deriveState(rootSeed, this.path);
  }

  static restore(snapshot: RngSnapshot): DeterministicRng {
    if (snapshot.version !== RNG_VERSION) {
      throw new RangeError(`Unsupported RNG snapshot version '${snapshot.version}'`);
    }
    if (!Array.isArray(snapshot.streamPath)) {
      throw new TypeError("RNG snapshot streamPath must be an array");
    }
    if (!Array.isArray(snapshot.state) || snapshot.state.length !== 4) {
      throw new TypeError("RNG snapshot state must contain four words");
    }
    snapshot.state.forEach((word, index) => requireUint32(word, `state[${index}]`));
    if (snapshot.state.every(word => word === 0)) {
      throw new RangeError("RNG snapshot cannot restore the all-zero state");
    }
    if (!Number.isSafeInteger(snapshot.draws) || snapshot.draws < 0) {
      throw new RangeError("RNG snapshot draws must be a non-negative safe integer");
    }

    const restored = new DeterministicRng(snapshot.rootSeed, snapshot.streamPath);
    restored.state = [...snapshot.state];
    restored.drawCount = snapshot.draws;
    return restored;
  }

  fork(...segments: string[]): DeterministicRng {
    segments.forEach(requireStreamSegment);
    if (segments.length === 0) {
      throw new RangeError("RNG forks require at least one named path segment");
    }
    return new DeterministicRng(this.rootSeed, [...this.path, ...segments]);
  }

  substream(...segments: string[]): DeterministicRng {
    return this.fork(...segments);
  }

  nextUint32(): number {
    const [state0, state1, state2, state3] = this.state;
    const result = Math.imul(rotateLeft(Math.imul(state1, 5) >>> 0, 7), 9) >>> 0;
    const shifted = (state1 << 9) >>> 0;

    let nextState2 = (state2 ^ state0) >>> 0;
    let nextState3 = (state3 ^ state1) >>> 0;
    const nextState1 = (state1 ^ nextState2) >>> 0;
    const nextState0 = (state0 ^ nextState3) >>> 0;
    nextState2 = (nextState2 ^ shifted) >>> 0;
    nextState3 = rotateLeft(nextState3, 11);

    this.state = [nextState0, nextState1, nextState2, nextState3];
    this.drawCount += 1;
    return result;
  }

  nextPpm(): Ppm {
    return Math.floor((this.nextUint32() * PPM) / UINT32_SIZE);
  }

  bernoulli(probabilityPpm: Ppm): boolean {
    if (!Number.isSafeInteger(probabilityPpm) || probabilityPpm < 0 || probabilityPpm > PPM) {
      throw new RangeError(`probabilityPpm must be a safe integer from 0 through ${PPM}`);
    }
    return this.nextPpm() < probabilityPpm;
  }

  integer(minInclusive: number, maxExclusive: number): number {
    if (!Number.isSafeInteger(minInclusive) || !Number.isSafeInteger(maxExclusive)) {
      throw new RangeError("integer bounds must be safe integers");
    }
    const span = maxExclusive - minInclusive;
    if (span <= 0 || span > UINT32_SIZE) {
      throw new RangeError("integer range must be positive and no wider than 2^32");
    }

    const rejectionLimit = Math.floor(UINT32_SIZE / span) * span;
    let draw = this.nextUint32();
    while (draw >= rejectionLimit) draw = this.nextUint32();
    return minInclusive + (draw % span);
  }

  snapshot(): RngSnapshot {
    return {
      version: RNG_VERSION,
      rootSeed: this.rootSeed,
      streamPath: [...this.path],
      state: [...this.state],
      draws: this.drawCount,
    };
  }
}

export { DeterministicRng as SeededRng };

export function createRng(seed: string): DeterministicRng {
  return new DeterministicRng(seed);
}
