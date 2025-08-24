/**
 * BOVI Core Utilities
 * Backward-compatible re-exports from focused modules
 */

// Re-export from focused modules for backward compatibility
export { $, $$, dom } from "./dom.js";
export { fmt } from "./formatting.js";
export { events } from "./events.js";
export { animate } from "./animations.js";
export { state } from "./state.js";
export { debounce, throttle } from "./performance.js";