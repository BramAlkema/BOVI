import { PPM, type MicroUnits, type Ppm } from "./types.js";

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer`);
  }
}

function fromSafeBigInt(value: bigint, label: string): number {
  if (value > MAX_SAFE_BIGINT || value < MIN_SAFE_BIGINT) {
    throw new RangeError(`${label} exceeds JavaScript's safe-integer range`);
  }
  return Number(value);
}

/** Deterministic integer multiplication followed by truncating division. */
export function mulDiv(
  multiplicand: number,
  multiplier: number,
  divisor: number,
  label = "mulDiv result"
): number {
  assertSafeInteger(multiplicand, "multiplicand");
  assertSafeInteger(multiplier, "multiplier");
  assertSafeInteger(divisor, "divisor");
  if (divisor === 0) throw new RangeError("divisor must not be zero");
  return fromSafeBigInt((BigInt(multiplicand) * BigInt(multiplier)) / BigInt(divisor), label);
}

export function ppmProduct(left: Ppm, right: Ppm): Ppm {
  return mulDiv(left, right, PPM, "PPM product");
}

export function applyPpm(value: number, probabilityPpm: Ppm): number {
  return mulDiv(value, probabilityPpm, PPM, "PPM-scaled value");
}

export function checkedAdd(left: number, right: number, label = "sum"): number {
  assertSafeInteger(left, "left operand");
  assertSafeInteger(right, "right operand");
  return fromSafeBigInt(BigInt(left) + BigInt(right), label);
}

export function checkedSum(values: readonly number[], label = "sum"): number {
  return values.reduce((sum, value) => checkedAdd(sum, value, label), 0);
}

export function clampPpm(value: number): Ppm {
  assertSafeInteger(value, "PPM value");
  return Math.max(0, Math.min(PPM, value));
}

/**
 * Finite-horizon present value. `discountPpm` is the one-tick discount factor;
 * the first future flow occurs one tick from now and is discounted once.
 */
export function finitePresentValue(
  flowPerTick: MicroUnits,
  horizonTicks: number,
  discountPpm: Ppm
): MicroUnits {
  assertSafeInteger(flowPerTick, "flowPerTick");
  assertSafeInteger(horizonTicks, "horizonTicks");
  if (flowPerTick < 0 || horizonTicks < 0) {
    throw new RangeError("flow and horizon must be non-negative");
  }

  let presentValue = 0;
  let discount = discountPpm;
  for (let tick = 0; tick < horizonTicks; tick += 1) {
    presentValue = checkedAdd(
      presentValue,
      applyPpm(flowPerTick, discount),
      "finite present value"
    );
    discount = ppmProduct(discount, discountPpm);
  }
  return presentValue;
}
