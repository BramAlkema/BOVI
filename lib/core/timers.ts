// M0: Vanilla timeout manager (no XState)

import { Bus } from "./bus.js";

export type TimerKey = `${string}:${string}`;

export class TimerManager {
  private intervals = new Map<TimerKey, number>();
  private timeouts = new Map<TimerKey, number>();

  start(flow: string, node: string, seconds: number, onApply: () => void) {
    const key: TimerKey = `${flow}:${node}`;
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

  cancelById(flow: string, node: string) {
    this.cancel(`${flow}:${node}`);
  }

  private cancel(key: TimerKey) {
    const existed = this.intervals.has(key) || this.timeouts.has(key);
    this.clear(key);
    if (existed) {
      const [flow, node] = key.split(":");
      Bus.emit("I.default.cancelled", { flow, node });
    }
  }

  private clear(key: TimerKey) {
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

/** Optional helper: attach a countdown label to an element */
export function mountCountdown(el: HTMLElement, flow: string, node: string) {
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
