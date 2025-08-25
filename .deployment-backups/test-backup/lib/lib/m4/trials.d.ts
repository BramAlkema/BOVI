export interface M4Trial {
    id: string;
    hypothesis: string;
    start: string;
    end?: string;
    metrics: string[];
    preregUrl?: string;
    status: "planned" | "running" | "done";
}
export declare function loadTrials(): M4Trial[];
export declare function listTrials(): M4Trial[];
export declare function addTrial(t: M4Trial): M4Trial;
export declare function finishTrial(id: string): void;
//# sourceMappingURL=trials.d.ts.map