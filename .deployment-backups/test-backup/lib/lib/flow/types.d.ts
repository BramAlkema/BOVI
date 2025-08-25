export interface FlowNode {
    id: string;
    type: string;
    label: string;
    description?: string;
    config?: any;
    outputs?: string[];
}
export interface FlowEdge {
    from: string;
    to: string;
    label: string;
    condition: string;
}
export interface FlowSpec {
    id: string;
    title: string;
    description: string;
    context: any;
    nodes: FlowNode[];
    edges: FlowEdge[];
    meta: {
        version: string;
        bovi_modes: string[];
        primary_mode: string;
        created: string;
        tags: string[];
    };
}
export interface FlowContext {
    flowId: string;
    currentNode?: string;
    nodeOutputs: Record<string, any>;
    activeTimers: Set<string>;
    userOverrides: Record<string, boolean>;
    startTime: number;
    aiButlerEnabled: boolean;
    completed: boolean;
    error?: Error;
}
export type FlowState = "idle" | "running" | "completed" | "error";
export interface NodeExecutionResult {
    [key: string]: any;
}
export interface PDAResult {
    nominal: number;
    real: number;
    quality: "Great" | "OK" | "Poor";
}
export interface CalculateResult {
    result: number;
}
export interface AssessResult {
    assessment: boolean;
    reason: string;
}
export interface DetectResult {
    violation_detected: boolean;
    violation_type?: string | null;
    affected_items: any[];
}
export interface DefaultResult {
    action_applied: boolean;
    result: {
        applied: boolean;
        type: string;
        action: string;
    };
}
export interface SweepResult {
    kpis: Record<string, any>;
}
export interface LearnResult {
    episode_queued: boolean;
}
//# sourceMappingURL=types.d.ts.map