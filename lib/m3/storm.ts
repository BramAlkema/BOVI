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
    msg: `Storm mode on: pots +${p.potsBoostPct}%, caps tightened ${p.capTightenBp}bp` 
  });
  // TODO: actually adjust pots/contracts/rails per your domain modules
}

export function clearStorm() {
  current = null;
  Bus.emit("ui.toast", { 
    kind: "info", 
    msg: `Storm mode off: settings restored` 
  });
  // TODO: restore settings snapshot
}

export function getStorm() { 
  return current; 
}