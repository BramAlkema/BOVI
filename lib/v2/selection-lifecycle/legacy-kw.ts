/**
 * Frozen, pure characterization oracle for V1 KiyotakiWright.sol.
 *
 * This intentionally retains V1's three basis-point scores and sticky flag so
 * differential tests can detect accidental changes. Nothing here satisfies a
 * V2 circuit, actor, installation or continuation guard.
 */

export const LEGACY_KW_SCALE = 10_000 as const;

export interface LegacyKwState {
  round: number;
  ledger: readonly [number, number, number];
  marketability: readonly [number, number, number];
  isMoney: readonly [boolean, boolean, boolean];
  adopt: number;
  decay: number;
}

function validateLegacyState(state: LegacyKwState): void {
  const numbers = [state.round, ...state.ledger, ...state.marketability, state.adopt, state.decay];
  if (numbers.some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError("legacy Kiyotaki-Wright values must be non-negative safe integers");
  }
  if (state.ledger.some(value => value > LEGACY_KW_SCALE)) {
    throw new RangeError("legacy ledger scores must not exceed SCALE");
  }
}

export function stepLegacyKw(state: LegacyKwState): LegacyKwState {
  validateLegacyState(state);
  const nextMarketability = [...state.marketability] as [number, number, number];
  const nextIsMoney = [...state.isMoney] as [boolean, boolean, boolean];
  for (let good = 0; good < 3; good += 1) {
    const cost = LEGACY_KW_SCALE - state.ledger[good];
    const marketability = state.marketability[good];
    nextMarketability[good] =
      marketability > cost
        ? Math.min(LEGACY_KW_SCALE, marketability + state.adopt)
        : marketability > state.decay
          ? marketability - state.decay
          : 0;
    if (!nextIsMoney[good] && nextMarketability[good] >= LEGACY_KW_SCALE) {
      nextIsMoney[good] = true;
    }
  }
  return {
    ...state,
    round: state.round + 1,
    marketability: nextMarketability,
    isMoney: nextIsMoney,
  };
}

export function runLegacyKw(initial: LegacyKwState, rounds: number): LegacyKwState[] {
  if (!Number.isSafeInteger(rounds) || rounds < 0) {
    throw new RangeError("rounds must be a non-negative safe integer");
  }
  const trace: LegacyKwState[] = [{ ...initial }];
  for (let round = 0; round < rounds; round += 1) {
    trace.push(stepLegacyKw(trace[trace.length - 1]));
  }
  return trace;
}
