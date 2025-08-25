import { Bus } from "../core/bus.js";
let current = null;
export function applyStorm(p) {
    current = p;
    Bus.emit("ui.toast", {
        kind: "warn",
        msg: `Storm mode on: pots +${p.potsBoostPct}%, caps tightened ${p.capTightenBp}bp`,
    });
}
export function clearStorm() {
    current = null;
    Bus.emit("ui.toast", {
        kind: "info",
        msg: "Storm mode off: settings restored",
    });
}
export function getStorm() {
    return current;
}
//# sourceMappingURL=storm.js.map