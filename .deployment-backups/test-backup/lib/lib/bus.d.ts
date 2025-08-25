import { BoviEvents } from "./core/constants.js";
export interface BoviEventMap {
    'V.pda.started': {
        flow: string;
        node: string;
        items: any[];
    };
    'V.pda.completed': {
        flow: string;
        node: string;
        nominal: number;
        real: number;
        quality: string;
    };
    'V.calculate.started': {
        flow: string;
        node: string;
        context: any;
    };
    'V.calculate.completed': {
        flow: string;
        node: string;
        result: number;
    };
    'V.assess.completed': {
        flow: string;
        node: string;
        assessment: boolean;
    };
    'V.default.started': {
        flow: string;
        node: string;
        timeout_s: number;
        action: string;
    };
    'V.default.cancelled': {
        flow: string;
        node: string;
        reason: string;
    };
    'V.default.applied': {
        flow: string;
        node: string;
        action: string;
        result: any;
    };
    'I.detect.violation': {
        flow: string;
        node: string;
        violation: string;
        affected: any[];
    };
    'I.default.started': {
        flow: string;
        node: string;
        timeout_s: number;
        action: string;
    };
    'I.default.cancelled': {
        flow: string;
        node: string;
        reason: string;
    };
    'I.default.applied': {
        flow: string;
        node: string;
        action: string;
        result: any;
    };
    'B.calculate.started': {
        flow: string;
        node: string;
        context: any;
    };
    'B.calculate.completed': {
        flow: string;
        node: string;
        values: Record<string, number>;
    };
    'B.default.started': {
        flow: string;
        node: string;
        timeout_s: number;
        action: string;
    };
    'B.default.cancelled': {
        flow: string;
        node: string;
        reason: string;
    };
    'B.default.applied': {
        flow: string;
        node: string;
        action: string;
        result: any;
    };
    'B.sweep.updated': {
        flow: string;
        node: string;
        kpis: Record<string, any>;
    };
    'B.learn.triggered': {
        flow: string;
        node: string;
        episode: string;
        priority: string;
    };
    'O.assess.completed': {
        flow: string;
        node: string;
        assessment: boolean;
        reason: string;
    };
    'O.default.started': {
        flow: string;
        node: string;
        timeout_s: number;
        action: string;
    };
    'O.default.cancelled': {
        flow: string;
        node: string;
        reason: string;
    };
    'O.default.applied': {
        flow: string;
        node: string;
        action: string;
        result: any;
    };
    'flow.started': {
        flow: string;
        context: any;
    };
    'flow.completed': {
        flow: string;
        outputs: any;
    };
    'flow.error': {
        flow: string;
        error: Error;
        node?: string;
    };
    'ui.countdown.tick': {
        flow: string;
        node: string;
        remaining: number;
    };
    'ui.action.override': {
        flow: string;
        node: string;
        action: string;
    };
    'ui.kpi.updated': {
        flow: string;
        kpi: string;
        value: any;
    };
    'ui.ai_butler.toggled': {
        enabled: boolean;
    };
    [BoviEvents.KPI_UPDATED]: {
        kpi: string;
        value: any;
    };
    [BoviEvents.SYSTEM_INITIALIZED]: {
        timestamp: string;
        version?: string;
    };
    [BoviEvents.SYSTEM_SHUTDOWN]: {
        timestamp: string;
        reason?: string;
    };
    'plugin:registered': {
        pluginId: string;
        manifest: any;
    };
    'plugin:initialized': {
        pluginId: string;
    };
    'plugin:error': {
        pluginId: string;
        error: Error;
        phase: string;
    };
    'plugin:activated': {
        pluginId: string;
    };
    'plugin:deactivated': {
        pluginId: string;
    };
    'plugin:config-changed': {
        pluginId: string;
        config: any;
    };
}
declare class TypedEventBus extends EventTarget {
    emit<K extends keyof BoviEventMap>(type: K, detail: BoviEventMap[K], options?: {
        bubbles?: boolean;
        cancelable?: boolean;
    }): boolean;
    on<K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void, options?: AddEventListenerOptions): void;
    off<K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void, options?: EventListenerOptions): void;
    once<K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void): void;
}
export declare const Bus: TypedEventBus;
export declare const emit: <K extends keyof BoviEventMap>(type: K, detail: BoviEventMap[K], options?: {
    bubbles?: boolean;
    cancelable?: boolean;
}) => boolean;
export declare const on: <K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void, options?: AddEventListenerOptions) => void;
export declare const off: <K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void, options?: EventListenerOptions) => void;
export declare const once: <K extends keyof BoviEventMap>(type: K, listener: (event: CustomEvent<BoviEventMap[K]>) => void) => void;
export declare const onBoviMode: (mode: "V" | "I" | "B" | "O", listener: (event: CustomEvent<any>) => void) => void;
export declare const onFlow: (flowId: string, listener: (event: CustomEvent<any>) => void) => void;
interface AuditLogEntry {
    timestamp: number;
    event_type: string;
    flow: string;
    node?: string;
    detail: any;
    user_agent: string;
}
declare class AuditLogger {
    private logs;
    constructor();
    private logEvent;
    private persistLog;
    getLogs(filter?: {
        flow?: string;
        mode?: string;
        since?: number;
    }): AuditLogEntry[];
    export(): string;
    clear(): void;
}
export declare const AuditLog: AuditLogger;
export declare class StudioSync {
    private channel;
    constructor();
    close(): void;
}
declare let studioSync: StudioSync | null;
export { studioSync };
//# sourceMappingURL=bus.d.ts.map