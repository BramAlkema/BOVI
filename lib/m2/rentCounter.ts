// Rent counter (O-as-Promise)
export interface Caps {
  capBp?: number;
  floorBp?: number;
} // basis points caps (e.g., 300 = 3%)

export function fairRent(
  current: number,
  proposedPct: number,
  userDeflator: number,
  caps: Caps
): number {
  // proposedPct = e.g., 0.06 for +6%; userDeflator ~ 0.12 for 12% inflation
  const target = current * (1 + userDeflator); // keep purchasing power stable
  let counter = target;

  if (typeof caps.capBp === "number") {
    counter = Math.min(counter, current * (1 + caps.capBp / 10_000));
  }
  if (typeof caps.floorBp === "number") {
    counter = Math.max(counter, current * (1 + caps.floorBp / 10_000));
  }

  return +counter.toFixed(2);
}
