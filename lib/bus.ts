/**
 * BOVI Event Bus
 * Central event system for BOVI actions and flow coordination
 */

// BOVI event types with strong typing
export interface BoviEventMap {
  // Value mode events (V.*)
  'V.pda.started': { flow: string; node: string; items: any[] };
  'V.pda.completed': { flow: string; node: string; nominal: number; real: number; quality: string };
  'V.calculate.started': { flow: string; node: string; context: any };
  'V.calculate.completed': { flow: string; node: string; result: number };
  'V.assess.completed': { flow: string; node: string; assessment: boolean };
  'V.default.started': { flow: string; node: string; timeout_s: number; action: string };
  'V.default.cancelled': { flow: string; node: string; reason: string };
  'V.default.applied': { flow: string; node: string; action: string; result: any };
  
  // Immediate mode events (I.*)
  'I.detect.violation': { flow: string; node: string; violation: string; affected: any[] };
  'I.default.started': { flow: string; node: string; timeout_s: number; action: string };
  'I.default.cancelled': { flow: string; node: string; reason: string };
  'I.default.applied': { flow: string; node: string; action: string; result: any };
  
  // Balanced mode events (B.*)
  'B.calculate.started': { flow: string; node: string; context: any };
  'B.calculate.completed': { flow: string; node: string; values: Record<string, number> };
  'B.default.started': { flow: string; node: string; timeout_s: number; action: string };
  'B.default.cancelled': { flow: string; node: string; reason: string };
  'B.default.applied': { flow: string; node: string; action: string; result: any };
  'B.sweep.updated': { flow: string; node: string; kpis: Record<string, any> };
  'B.learn.triggered': { flow: string; node: string; episode: string; priority: string };
  
  // Obligated mode events (O.*)
  'O.assess.completed': { flow: string; node: string; assessment: boolean; reason: string };
  'O.default.started': { flow: string; node: string; timeout_s: number; action: string };
  'O.default.cancelled': { flow: string; node: string; reason: string };
  'O.default.applied': { flow: string; node: string; action: string; result: any };
  
  // Flow control events
  'flow.started': { flow: string; context: any };
  'flow.completed': { flow: string; outputs: any };
  'flow.error': { flow: string; error: Error; node?: string };
  
  // UI events
  'ui.countdown.tick': { flow: string; node: string; remaining: number };
  'ui.action.override': { flow: string; node: string; action: string };
  'ui.kpi.updated': { flow: string; kpi: string; value: any };
  'ui.ai_butler.toggled': { enabled: boolean };
}

// Type-safe event bus
class TypedEventBus extends EventTarget {
  emit<K extends keyof BoviEventMap>(
    type: K, 
    detail: BoviEventMap[K],
    options?: { bubbles?: boolean; cancelable?: boolean }
  ): boolean {
    const event = new CustomEvent(type, { 
      detail,
      bubbles: options?.bubbles ?? false,
      cancelable: options?.cancelable ?? false
    });
    
    // Log event for debugging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log(`🚌 BOVI Event: ${type}`, detail);
    }
    
    return this.dispatchEvent(event);
  }
  
  on<K extends keyof BoviEventMap>(
    type: K,
    listener: (event: CustomEvent<BoviEventMap[K]>) => void,
    options?: AddEventListenerOptions
  ): void {
    this.addEventListener(type, listener as EventListener, options);
  }
  
  off<K extends keyof BoviEventMap>(
    type: K,
    listener: (event: CustomEvent<BoviEventMap[K]>) => void,
    options?: EventListenerOptions
  ): void {
    this.removeEventListener(type, listener as EventListener, options);
  }
  
  once<K extends keyof BoviEventMap>(
    type: K,
    listener: (event: CustomEvent<BoviEventMap[K]>) => void
  ): void {
    this.addEventListener(type, listener as EventListener, { once: true });
  }
}

// Global event bus instance
export const Bus = new TypedEventBus();

// Convenience functions for common patterns
export const emit = Bus.emit.bind(Bus);
export const on = Bus.on.bind(Bus);
export const off = Bus.off.bind(Bus);
export const once = Bus.once.bind(Bus);

// Event grouping utilities
export const onBoviMode = (
  mode: 'V' | 'I' | 'B' | 'O',
  listener: (event: CustomEvent<any>) => void
): void => {
  // Listen to all events for a specific BOVI mode
  const handler = (event: Event) => {
    if (event.type.startsWith(`${mode}.`)) {
      listener(event as CustomEvent<any>);
    }
  };
  
  // Note: EventTarget doesn't support wildcard listeners
  // We'll implement this by listening to all known BOVI events
  const eventTypes = Object.keys({} as BoviEventMap).filter(key => key.startsWith(`${mode}.`));
  eventTypes.forEach(eventType => {
    Bus.addEventListener(eventType, handler as EventListener);
  });
};

export const onFlow = (
  flowId: string,
  listener: (event: CustomEvent<any>) => void
): void => {
  // Listen to all events for a specific flow
  const handler = (event: CustomEvent<any>) => {
    if (event.detail?.flow === flowId) {
      listener(event);
    }
  };
  
  // Listen to all BOVI events
  Object.keys({} as BoviEventMap).forEach(eventType => {
    Bus.addEventListener(eventType, handler as EventListener);
  });
};

// Audit trail: all events are logged for compliance
interface AuditLogEntry {
  timestamp: number;
  event_type: string;
  flow: string;
  node?: string;
  detail: any;
  user_agent: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];
  
  constructor() {
    // Log all BOVI events
    Object.keys({} as BoviEventMap).forEach(eventType => {
      Bus.addEventListener(eventType, (event: Event) => {
        const customEvent = event as CustomEvent<any>;
        this.logEvent(eventType, customEvent.detail);
      });
    });
  }
  
  private logEvent(eventType: string, detail: any): void {
    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      event_type: eventType,
      flow: detail.flow || 'unknown',
      node: detail.node,
      detail: { ...detail },
      user_agent: navigator.userAgent
    };
    
    this.logs.push(entry);
    
    // Store in IndexedDB for persistence (simplified)
    if (typeof window !== 'undefined' && window.indexedDB) {
      this.persistLog(entry);
    }
  }
  
  private async persistLog(entry: AuditLogEntry): Promise<void> {
    // Simplified IndexedDB storage
    // In production, use Dexie for better API
    try {
      const request = indexedDB.open('bovi-audit', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        store.add(entry);
      };
    } catch (error) {
      console.warn('Failed to persist audit log:', error);
    }
  }
  
  getLogs(filter?: { flow?: string; mode?: string; since?: number }): AuditLogEntry[] {
    let filtered = this.logs;
    
    if (filter?.flow) {
      filtered = filtered.filter(log => log.flow === filter.flow);
    }
    
    if (filter?.mode) {
      filtered = filtered.filter(log => log.event_type.startsWith(`${filter.mode}.`));
    }
    
    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!);
    }
    
    return filtered;
  }
  
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
  
  clear(): void {
    this.logs = [];
  }
}

// Global audit logger
export const AuditLog = new AuditLogger();

// Cross-tab sync for Node Studio
export class StudioSync {
  private channel: BroadcastChannel;
  
  constructor() {
    this.channel = new BroadcastChannel('bovi-flows');
    
    // Forward all BOVI events to other tabs
    Object.keys({} as BoviEventMap).forEach(eventType => {
      Bus.addEventListener(eventType, (event: Event) => {
        const customEvent = event as CustomEvent<any>;
        this.channel.postMessage({
          type: eventType,
          detail: customEvent.detail,
          timestamp: Date.now()
        });
      });
    });
    
    // Listen for events from other tabs
    this.channel.addEventListener('message', (event) => {
      const { type, detail } = event.data;
      // Re-emit with special marker to prevent infinite loops
      if (!detail.__fromStudio) {
        Bus.emit(type as keyof BoviEventMap, { ...detail, __fromStudio: true });
      }
    });
  }
  
  close(): void {
    this.channel.close();
  }
}

// Auto-initialize studio sync if in browser
let studioSync: StudioSync | null = null;
if (typeof window !== 'undefined') {
  studioSync = new StudioSync();
}

export { studioSync };