import { BoviEvents } from "./core/constants.js";
class TypedEventBus extends EventTarget {
    emit(type, detail, options) {
        const event = new CustomEvent(type, {
            detail,
            bubbles: options?.bubbles ?? false,
            cancelable: options?.cancelable ?? false
        });
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.log(`🚌 BOVI Event: ${type}`, detail);
        }
        return this.dispatchEvent(event);
    }
    on(type, listener, options) {
        this.addEventListener(type, listener, options);
    }
    off(type, listener, options) {
        this.removeEventListener(type, listener, options);
    }
    once(type, listener) {
        this.addEventListener(type, listener, { once: true });
    }
}
export const Bus = new TypedEventBus();
export const emit = Bus.emit.bind(Bus);
export const on = Bus.on.bind(Bus);
export const off = Bus.off.bind(Bus);
export const once = Bus.once.bind(Bus);
export const onBoviMode = (mode, listener) => {
    const handler = (event) => {
        if (event.type.startsWith(`${mode}.`)) {
            listener(event);
        }
    };
    const eventTypes = Object.keys({}).filter(key => key.startsWith(`${mode}.`));
    eventTypes.forEach(eventType => {
        Bus.addEventListener(eventType, handler);
    });
};
export const onFlow = (flowId, listener) => {
    const handler = (event) => {
        if (event.detail?.flow === flowId) {
            listener(event);
        }
    };
    Object.keys({}).forEach(eventType => {
        Bus.addEventListener(eventType, handler);
    });
};
class AuditLogger {
    constructor() {
        this.logs = [];
        Object.keys({}).forEach(eventType => {
            Bus.addEventListener(eventType, (event) => {
                const customEvent = event;
                this.logEvent(eventType, customEvent.detail);
            });
        });
    }
    logEvent(eventType, detail) {
        const entry = {
            timestamp: Date.now(),
            event_type: eventType,
            flow: detail.flow || 'unknown',
            node: detail.node,
            detail: { ...detail },
            user_agent: navigator.userAgent
        };
        this.logs.push(entry);
        if (typeof window !== 'undefined' && window.indexedDB) {
            this.persistLog(entry);
        }
    }
    async persistLog(entry) {
        try {
            const request = indexedDB.open('bovi-audit', 1);
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['logs'], 'readwrite');
                const store = transaction.objectStore('logs');
                store.add(entry);
            };
        }
        catch (error) {
            console.warn('Failed to persist audit log:', error);
        }
    }
    getLogs(filter) {
        let filtered = this.logs;
        if (filter?.flow) {
            filtered = filtered.filter(log => log.flow === filter.flow);
        }
        if (filter?.mode) {
            filtered = filtered.filter(log => log.event_type.startsWith(`${filter.mode}.`));
        }
        if (filter?.since) {
            filtered = filtered.filter(log => log.timestamp >= filter.since);
        }
        return filtered;
    }
    export() {
        return JSON.stringify(this.logs, null, 2);
    }
    clear() {
        this.logs = [];
    }
}
export const AuditLog = new AuditLogger();
export class StudioSync {
    constructor() {
        this.channel = new BroadcastChannel('bovi-flows');
        Object.keys({}).forEach(eventType => {
            Bus.addEventListener(eventType, (event) => {
                const customEvent = event;
                this.channel.postMessage({
                    type: eventType,
                    detail: customEvent.detail,
                    timestamp: Date.now()
                });
            });
        });
        this.channel.addEventListener('message', (event) => {
            const { type, detail } = event.data;
            if (!detail.__fromStudio) {
                Bus.emit(type, { ...detail, __fromStudio: true });
            }
        });
    }
    close() {
        this.channel.close();
    }
}
let studioSync = null;
if (typeof window !== 'undefined') {
    studioSync = new StudioSync();
}
export { studioSync };
//# sourceMappingURL=bus.js.map