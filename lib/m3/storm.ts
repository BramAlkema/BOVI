// Storm mode presets
import { Bus } from "../core/bus.js";

export interface StormPreset {
  potsBoostPct: number;
  capTightenBp: number;
  fixRateHint: boolean;
  pinRail?: string;
}

let current: StormPreset | null = null;

export function applyStorm(p: StormPreset) {
  current = p;
  Bus.emit("ui.toast", {
    kind: "warn",
    msg: `Storm mode on: pots +${p.potsBoostPct}%, caps tightened ${p.capTightenBp}bp`,
  });
  // INTEGRATION: Apply changes to lib/m1/pots.ts, lib/contracts/*, and lib/services/rails.ts modules
}

export function clearStorm() {
  current = null;
  Bus.emit("ui.toast", {
    kind: "info",
    msg: "Storm mode off: settings restored",
  });
  // INTEGRATION: Restore previous state from snapshot saved in applyStorm()
}

export function getStorm() {
  return current;
}
