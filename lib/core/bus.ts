// M0: Typed Event Bus

export type Mode = "B" | "O" | "V" | "I";

export type AppEvent =
  | "I.default.started"
  | "I.default.ticked"
  | "I.default.cancelled"
  | "I.default.applied"
  | "B.sweep.applied"
  | "B.pot.breached"
  | "ui.toast"
  | "profile.changed";

type PayloadMap = {
  "I.default.started": { flow: string; node: string; seconds: number };
  "I.default.ticked": { flow: string; node: string; secondsLeft: number };
  "I.default.cancelled": { flow: string; node: string };
  "I.default.applied": { flow: string; node: string };
  "B.sweep.applied": { potId: string; add: number };
  "B.pot.breached": { potId: string; kind: "min" | "max" };
  "ui.toast": { kind: "info" | "success" | "warn" | "error"; msg: string };
  "profile.changed": { profile: string };
};

export class EventBus {
  private et = new EventTarget();

  emit<K extends AppEvent>(type: K, detail: PayloadMap[K]) {
    this.et.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends AppEvent>(type: K, cb: (detail: PayloadMap[K]) => void) {
    const h = (e: Event) => cb((e as CustomEvent).detail);
    this.et.addEventListener(type, h);
    return () => this.et.removeEventListener(type, h);
  }
}

export const Bus = new EventBus();
