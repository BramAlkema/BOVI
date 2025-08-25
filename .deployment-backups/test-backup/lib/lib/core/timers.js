import { Bus } from "./bus.js";
export class TimerManager {
    constructor() {
        this.intervals = new Map();
        this.timeouts = new Map();
    }
    start(flow, node, seconds, onApply) {
        const key = `${flow}:${node}`;
        this.cancel(key);
        let left = Math.max(0, Math.floor(seconds));
        Bus.emit("I.default.started", { flow, node, seconds: left });
        const intId = window.setInterval(() => {
            left -= 1;
            if (left > 0) {
                Bus.emit("I.default.ticked", { flow, node, secondsLeft: left });
            }
        }, 1000);
        const toId = window.setTimeout(() => {
            this.clear(key);
            Bus.emit("I.default.applied", { flow, node });
            onApply();
        }, seconds * 1000);
        this.intervals.set(key, intId);
        this.timeouts.set(key, toId);
    }
    cancelById(flow, node) {
        this.cancel(`${flow}:${node}`);
    }
    cancel(key) {
        const existed = this.intervals.has(key) || this.timeouts.has(key);
        this.clear(key);
        if (existed) {
            const [flow, node] = key.split(":");
            Bus.emit("I.default.cancelled", { flow, node });
        }
    }
    clear(key) {
        const i = this.intervals.get(key);
        if (i) {
            clearInterval(i);
            this.intervals.delete(key);
        }
        const t = this.timeouts.get(key);
        if (t) {
            clearTimeout(t);
            this.timeouts.delete(key);
        }
    }
}
export const Timers = new TimerManager();
export function mountCountdown(el, flow, node) {
    const offStart = Bus.on("I.default.started", d => {
        if (d.flow === flow && d.node === node) {
            el.textContent = `Auto-apply in ${d.seconds}s`;
            el.style.display = "block";
        }
    });
    const offTick = Bus.on("I.default.ticked", d => {
        if (d.flow === flow && d.node === node) {
            el.textContent = `Auto-apply in ${d.secondsLeft}s`;
        }
    });
    const offCancel = Bus.on("I.default.cancelled", d => {
        if (d.flow === flow && d.node === node) {
            el.textContent = "Cancelled";
            setTimeout(() => {
                el.style.display = "none";
            }, 2000);
        }
    });
    const offApply = Bus.on("I.default.applied", d => {
        if (d.flow === flow && d.node === node) {
            el.textContent = "Applied";
            setTimeout(() => {
                el.style.display = "none";
            }, 2000);
        }
    });
    return () => {
        offStart();
        offTick();
        offCancel();
        offApply();
    };
}
//# sourceMappingURL=timers.js.map