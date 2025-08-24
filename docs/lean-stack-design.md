# BOVI Lean Stack Architecture Design

**Date:** 2024-08-24  
**Status:** Approved Design - Implementation Pending  
**Replaces:** XState-based flow system

## Core Philosophy

**Lean, typed, vanilla-first approach** that delivers sophisticated flow management without framework bloat. Focus on browser natives: EventTarget, setTimeout, SVG, BroadcastChannel.

## Stack Overview

| Layer | Technology | Size | Purpose |
|-------|------------|------|---------|
| **Flow Model** | JSON + Zod validation | ~2kb | Single source of truth |
| **Events** | Typed EventBus (pure TS) | ~1kb | Central nervous system |
| **Timers** | TimerManager (vanilla) | ~1kb | Timeout/countdown logic |
| **Studio** | SVG + elkjs layout | ~15kb | Live flow visualization |
| **Storage** | IndexedDB (Dexie) | ~8kb | Optional persistence |
| **Total** | | **~27kb** | vs XState ~50kb+ |

## 1. Typed EventBus (Pure TypeScript)

### Event Type System
```typescript
export type Mode = "B" | "O" | "V" | "I";

export type AppEvent =
  // Value mode events
  | "V.pda.viewed" | "V.pda.scored" 
  | "V.cohort.joined" | "V.cohort.cleared"
  
  // Balanced mode events  
  | "B.pot.created" | "B.pot.breached" | "B.sweep.applied"
  | "B.group.expenseAdded" | "B.group.netted"
  
  // Obligated mode events
  | "O.promise.signed" | "O.promise.countered" | "O.power.jitScheduled"
  
  // Immediate mode events (timeouts/defaults)
  | "I.default.started" | "I.default.ticked" 
  | "I.default.cancelled" | "I.default.applied";
```

### Type-Safe Payloads
```typescript
type PayloadMap = {
  "I.default.started": { flow: string; node: string; seconds: number };
  "I.default.ticked":  { flow: string; node: string; secondsLeft: number };
  "I.default.cancelled": { flow: string; node: string };
  "I.default.applied": { flow: string; node: string };
  "B.sweep.applied": { potId: string; amount: number };
  "V.cohort.joined": { cohortId: string; savings: number };
  // ... complete mapping for all events
};
```

### EventBus Implementation
```typescript
export class EventBus {
  private et = new EventTarget();
  
  emit<K extends AppEvent>(type: K, detail: PayloadMap[K]) {
    this.et.dispatchEvent(new CustomEvent(type, { detail }));
  }
  
  on<K extends AppEvent>(type: K, cb: (detail: PayloadMap[K]) => void) {
    const handler = (e: Event) => cb((e as CustomEvent).detail);
    this.et.addEventListener(type, handler);
    return () => this.et.removeEventListener(type, handler);
  }
}

export const Bus = new EventBus();
```

**Key Benefits:**
- **Pure browser native** - uses EventTarget, no dependencies
- **Type safety** - compile-time checking of event names and payloads
- **Tiny footprint** - ~1kb compiled
- **Easy testing** - no framework mocking required
- **Clear patterns** - obvious emit/on API

## 2. Flow DSL (Unchanged, Enhanced)

### Flow Specification
```typescript
export interface FlowSpec {
  id: string;
  context?: Record<string, unknown>;
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  meta?: { 
    version: string; 
    bovi_modes: Mode[];
    primary_mode: Mode;
  };
}

export interface NodeSpec {
  id: string;
  type: `${Mode}.${string}`;    // "V.PDA", "B.Sweep", "O.Promise", "I.Default"
  label: string;
  timeout_s?: number;           // only for defaultable nodes
  episode?: string;             // tutorial episode trigger
  kpi?: Record<string, string>; // KPI calculation formulas
}

export interface EdgeSpec { 
  from: string; 
  to: string; 
  label?: string; 
  condition?: string;           // simple condition evaluation
}
```

**Optional Zod Validation:**
```typescript
import { z } from 'zod';

const FlowSpecSchema = z.object({
  id: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string().regex(/^[BOVI]\./),
    label: z.string(),
    timeout_s: z.number().optional(),
  })),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
  }))
});
```

## 3. Vanilla Timer Management

### TimerManager Core
```typescript
export type TimerKey = `${string}:${string}`; // `${flowId}:${nodeId}`

export class TimerManager {
  private intervals = new Map<TimerKey, number>();
  private timeouts  = new Map<TimerKey, number>();

  start(flow: string, node: string, seconds: number, onApply: () => void) {
    const key: TimerKey = `${flow}:${node}`;
    this.cancel(key);

    let left = seconds;
    Bus.emit("I.default.started", { flow, node, seconds });

    // Tick every second
    const intId = window.setInterval(() => {
      left -= 1;
      Bus.emit("I.default.ticked", { flow, node, secondsLeft: left });
    }, 1000);
    
    // Apply after full timeout
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
    this.clear(key);
    const [flow, node] = key.split(":");
    Bus.emit("I.default.cancelled", { flow, node });
  }
  
  private clear(key: TimerKey) {
    const intId = this.intervals.get(key);
    if (intId) { 
      clearInterval(intId); 
      this.intervals.delete(key); 
    }
    
    const toId = this.timeouts.get(key);
    if (toId) { 
      clearTimeout(toId); 
      this.timeouts.delete(key); 
    }
  }
}

export const Timers = new TimerManager();
```

**Usage Patterns:**
```typescript
// Groceries shrinkflation swap (Immediate mode)
export function suggestShrinkSwap() {
  Timers.start("groceries", "act1", 10, () => {
    applyShrinkSwap();
    Bus.emit("B.sweep.applied", { potId: "food", amount: 2.10 });
  });
}

// Rent counter-offer (Balanced mode)  
export function suggestCounterOffer() {
  Timers.start("rent", "counter", 10, () => {
    Bus.emit("O.promise.countered", { fairRent: 1226 });
    submitCounterOffer();
  });
}

// Energy cohort enrollment (Obligated mode)
export function suggestCohortEnrollment() {
  Timers.start("energy", "enrol", 10, () => {
    Bus.emit("V.cohort.joined", { cohortId: "Q3-ENERGY", savings: 168 });
    enrollInCohort();
  });
}
```

**Key Benefits:**
- **Vanilla JavaScript** - browser setInterval/setTimeout, no abstractions
- **Precise control** - exact millisecond timing, no state machine overhead
- **Simple debugging** - clear timer lifecycle, easy to reason about
- **Memory safe** - proper cleanup prevents leaks
- **Event integration** - every timer action emits typed events

## 4. SVG Studio with Live Highlighting

### Studio Rendering
```typescript
import ELK from "elkjs/lib/elk.bundled.js";
import { Bus } from "./bus";
import type { FlowSpec } from "./flow";

const elk = new ELK();
type NodeMap = Record<string, SVGRectElement>;

export async function renderStudio(flow: FlowSpec, mount: HTMLElement) {
  // Clear previous render
  mount.innerHTML = "";
  
  // ELK graph structure
  const graph = {
    id: "root",
    layoutOptions: { 
      "elk.direction": "RIGHT", 
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60"
    },
    children: flow.nodes.map(n => ({ 
      id: n.id, 
      width: 180, 
      height: 64,
      layoutOptions: { "elk.nodeSize.constraints": "FIXED" }
    })),
    edges: flow.edges.map(e => ({ 
      id: `${e.from}-${e.to}`, 
      sources: [e.from], 
      targets: [e.to] 
    }))
  };
  
  const layout = await elk.layout(graph);
  const nodeMap = renderSVG(layout, flow, mount);
  
  // Live event highlighting
  setupLiveHighlighting(nodeMap);
}
```

### Live Event Integration
```typescript
function setupLiveHighlighting(nodeMap: NodeMap) {
  // Timer events
  Bus.on("I.default.started", ({ node }) => 
    highlight(node, nodeMap, "pulsing"));
  Bus.on("I.default.applied", ({ node }) => 
    highlight(node, nodeMap, "success"));
  Bus.on("I.default.cancelled", ({ node }) => 
    highlight(node, nodeMap, "cancelled"));
    
  // Flow events  
  Bus.on("V.pda.scored", ({ node }) => 
    highlight(node, nodeMap, "active"));
  Bus.on("B.sweep.applied", ({ node }) => 
    highlight(node, nodeMap, "success"));
}

function highlight(nodeId: string, nodeMap: NodeMap, type: "active" | "pulsing" | "success" | "cancelled") {
  const rect = nodeMap[nodeId];
  if (!rect) return;
  
  const colors = {
    active: "#4cc9f0",
    pulsing: "#ffd166", 
    success: "#7cf08a",
    cancelled: "#ff6b6b"
  };
  
  rect.setAttribute("stroke", colors[type]);
  rect.setAttribute("stroke-width", type === "success" ? "3" : "2");
  
  if (type === "pulsing") {
    rect.style.animation = "pulse 2s infinite";
  }
  
  // Auto-clear after animation
  setTimeout(() => {
    rect.setAttribute("stroke", "rgba(255,255,255,0.18)");
    rect.setAttribute("stroke-width", "1");
    rect.style.animation = "";
  }, type === "success" ? 3000 : 1800);
}
```

### BOVI Mode Visualization
```typescript
function getModeColor(mode: Mode): string {
  return {
    "B": "#4cc9f0", // Balanced - blue (stability)
    "O": "#ff6b6b", // Obligated - red (authority) 
    "V": "#a1ffb5", // Value - green (growth)
    "I": "#ffd166"  // Immediate - yellow (attention)
  }[mode];
}

function renderNode(node: any, flowNode: NodeSpec): SVGGElement {
  const group = document.createElementNS(svgNS, "g");
  const mode = flowNode.type.split(".")[0] as Mode;
  
  // Main rectangle
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("fill", "rgba(255,255,255,0.06)");
  rect.setAttribute("stroke", "rgba(255,255,255,0.18)");
  
  // Mode color stripe
  const stripe = document.createElementNS(svgNS, "rect");
  stripe.setAttribute("width", "6");
  stripe.setAttribute("fill", getModeColor(mode));
  
  // Node label
  const text = document.createElementNS(svgNS, "text");
  text.textContent = flowNode.label;
  
  group.append(rect, stripe, text);
  return group;
}
```

**Key Benefits:**
- **elkjs layout** - proven algorithm, handles complex graphs
- **Pure SVG** - performant, scalable, styleable with CSS
- **Live highlighting** - real-time visual feedback via events
- **BOVI mode colors** - visual reinforcement of fairness modes
- **Responsive design** - scales to container size

## 5. UI Integration Patterns

### Countdown Integration
```typescript
// ui-countdown.ts
export function mountCountdown(element: HTMLElement, flow: string, node: string) {
  const offStart = Bus.on("I.default.started", ({ flow: f, node: n, seconds }) => {
    if (f === flow && n === node) {
      element.textContent = `Auto-apply in ${seconds}s`;
      element.style.display = "block";
    }
  });
  
  const offTick = Bus.on("I.default.ticked", ({ flow: f, node: n, secondsLeft }) => {
    if (f === flow && n === node) {
      element.textContent = `Auto-apply in ${secondsLeft}s`;
    }
  });
  
  const offComplete = Bus.on("I.default.applied", ({ flow: f, node: n }) => {
    if (f === flow && n === node) {
      element.textContent = "Applied!";
      setTimeout(() => element.style.display = "none", 2000);
    }
  });
  
  const offCancel = Bus.on("I.default.cancelled", ({ flow: f, node: n }) => {
    if (f === flow && n === node) {
      element.textContent = "Cancelled";
      setTimeout(() => element.style.display = "none", 1000);
    }
  });
  
  // Return cleanup function
  return () => {
    offStart();
    offTick(); 
    offComplete();
    offCancel();
  };
}

// Usage in existing HTML
const cleanup = mountCountdown(
  document.getElementById("groceryCountdown")!, 
  "groceries", 
  "act1"
);
```

### Flow Integration
```typescript
// groceries-flow.ts
import { Timers } from "./timer";
import { Bus } from "./bus";

export function onShrinkDetected() {
  // Show UI panel
  document.getElementById("groAction")!.hidden = false;
  
  // Start timeout with AI Butler
  Timers.start("groceries", "act1", 10, () => {
    applyShrinkSwap();
  });
}

export function applyShrinkSwap() {
  // Apply the swap logic
  updateBasketUI();
  
  // Update KPIs
  Bus.emit("B.sweep.applied", { potId: "food", amount: 2.10 });
  
  // Trigger educational episode
  Bus.emit("B.learn.triggered", { episode: "ep-shrink" });
  
  // Hide UI
  document.getElementById("groAction")!.hidden = true;
}

export function cancelShrinkSwap() {
  Timers.cancelById("groceries", "act1");
  document.getElementById("groAction")!.hidden = true;
}
```

## 6. Migration from XState

### Immediate Actions
1. **Remove Dependencies:**
   ```bash
   npm rm xstate @xstate/core
   ```

2. **Replace XState Imports:**
   ```typescript
   // OLD
   import { createMachine, interpret } from 'xstate';
   
   // NEW  
   import { Timers } from './timer';
   import { Bus } from './bus';
   ```

3. **Replace State Machines:**
   ```typescript
   // OLD - XState machine
   const flowMachine = createMachine({...});
   
   // NEW - Direct timer calls
   Timers.start("groceries", "act1", 10, onApply);
   ```

4. **Simplify Event Handling:**
   ```typescript
   // OLD - XState events
   service.send('TIMEOUT_STARTED');
   
   // NEW - Direct event bus
   Bus.emit("I.default.started", { flow, node, seconds });
   ```

### Testing Strategy
```typescript
// timer.test.ts
import { describe, it, expect, vi } from "vitest";
import { Timers } from "./timer";
import { Bus } from "./bus";

describe("TimerManager", () => {
  it("applies after timeout and emits proper events", async () => {
    vi.useFakeTimers();
    
    const onApply = vi.fn();
    const events: any[] = [];
    
    // Capture all timer events
    Bus.on("I.default.started", (detail) => events.push({ type: "started", detail }));
    Bus.on("I.default.ticked", (detail) => events.push({ type: "ticked", detail }));
    Bus.on("I.default.applied", (detail) => events.push({ type: "applied", detail }));
    
    // Start 3-second timer
    Timers.start("test", "node", 3, onApply);
    
    // Fast-forward through timer
    vi.advanceTimersByTime(3000);
    
    // Verify behavior
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      { type: "started", detail: { flow: "test", node: "node", seconds: 3 }},
      { type: "ticked", detail: { flow: "test", node: "node", secondsLeft: 2 }},
      { type: "ticked", detail: { flow: "test", node: "node", secondsLeft: 1 }}, 
      { type: "applied", detail: { flow: "test", node: "node" }}
    ]);
    
    vi.useRealTimers();
  });
  
  it("cancels properly and emits cancel event", () => {
    const onApply = vi.fn();
    const cancelEvents: any[] = [];
    
    Bus.on("I.default.cancelled", (detail) => cancelEvents.push(detail));
    
    Timers.start("test", "node", 10, onApply);
    Timers.cancelById("test", "node");
    
    expect(onApply).not.toHaveBeenCalled();
    expect(cancelEvents).toEqual([
      { flow: "test", node: "node" }
    ]);
  });
});
```

## 7. Value Retention

### What We Keep
- ✅ **Flow DSL JSON** - single source of truth, unchanged
- ✅ **Event-driven architecture** - even cleaner with typed events
- ✅ **SVG Studios** - enhanced with elkjs layout
- ✅ **Timeout logic** - more precise with vanilla timers
- ✅ **BOVI mode integration** - visual and logical consistency
- ✅ **Cross-tab sync** - BroadcastChannel for studio communication

### What We Gain
- ✅ **Smaller bundle** - ~27kb vs 50kb+ (46% reduction)
- ✅ **Better performance** - no framework overhead
- ✅ **Clearer debugging** - vanilla JavaScript, no abstractions
- ✅ **Easier testing** - no mocking frameworks required
- ✅ **Simpler mental model** - obvious timer lifecycle

### What We Lose
- ❌ **State machine diagrams** - but elkjs studios provide better visualization
- ❌ **XState devtools** - but we get better custom tooling
- ❌ **Framework ecosystem** - but we don't need it

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Remove XState dependency
- [ ] Implement pure TypeScript EventBus
- [ ] Add vanilla TimerManager
- [ ] Fix existing countdown integration
- [ ] Ensure GitHub Actions build succeeds

### Phase 2: Visualization (Week 2)  
- [ ] Add elkjs dependency
- [ ] Implement SVG studio rendering
- [ ] Add live event highlighting
- [ ] Create studio mounting for each flow
- [ ] Test cross-tab BroadcastChannel sync

### Phase 3: Enhancement (Week 3)
- [ ] Add Zod validation for Flow DSL
- [ ] Implement IndexedDB persistence (optional)
- [ ] Add comprehensive test suite
- [ ] Performance optimization and bundle analysis
- [ ] Documentation and examples

## 9. Risk Mitigation

### Technical Risks
- **elkjs Bundle Size:** Monitor impact, consider lazy loading
- **Timer Precision:** Test across browsers, handle edge cases
- **Event Memory Leaks:** Ensure proper cleanup patterns
- **SVG Performance:** Optimize for large flows, virtualization if needed

### Migration Risks  
- **Breaking Changes:** Maintain API compatibility where possible
- **Regression Testing:** Comprehensive UI testing after migration
- **Dependency Management:** Careful npm audit after XState removal

## Conclusion

This lean stack delivers the same sophisticated flow management with:
- **46% smaller bundle size** (27kb vs 50kb+)
- **Better performance** (no framework overhead)
- **Clearer architecture** (vanilla JavaScript, obvious patterns)  
- **Enhanced visualization** (elkjs layout, live highlighting)
- **Stronger typing** (compile-time event safety)

The migration preserves all user-facing functionality while providing a more maintainable, performant, and extensible foundation for future BOVI development.

---

**Status:** Ready for implementation  
**Next Action:** Remove XState and implement EventBus foundation