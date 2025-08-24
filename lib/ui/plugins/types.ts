// UI Plugin types (slots + lifecycle)
import type { ProfileId } from "../../core/capabilities.js";
import type { EventBus } from "../../core/bus.js";
import type { TimerManager } from "../../core/timers.js";

export type UISlot = "appShell" | "home" | "panel" | "overlay";

export interface UIContext {
  root: HTMLElement;                // app root
  bus: EventBus;
  timers: TimerManager;
  profile: ProfileId;
  i18n?: (key: string) => string;
  storage?: Storage;                // local/session
  navigate: (route: string) => void;
  openOverlay: (id: string, props?: any) => void;
  closeOverlay: () => void;
}

export interface UIPluginManifest {
  id: string;
  name: string;
  version: string;
  targets: ProfileId[];             // e.g., ["L0","L1","L2"]
  provides: UISlot[];               // which slots it renders
  cssScoped?: boolean;              // use shadow DOM for isolation
}

export interface UIComponentPlugin {
  manifest: UIPluginManifest;
  mount(ctx: UIContext): Promise<UIInstance>;
}

export interface UIInstance {
  unmount(): void;
  onProfileChange?(p: ProfileId): void;
  onThemeChange?(theme: "light"|"dark"): void;
}