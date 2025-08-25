export interface ScenarioInterface {
    id: string;
    title: string;
    primaryMode: string;
    description: string;
    breakdown: Record<string, string>;
    insights: string[];
}
declare class ScenarioEngine {
    private scenarios;
    private currentScenario;
    registerScenario(id: string, scenario: ScenarioInterface): void;
    showScenario(scenarioId: string, containerSelector: string): void;
    private renderScenarioAnalysis;
    private renderInsights;
    private getModeLabel;
    getAvailableScenarios(): string[];
}
export declare class Scenario implements ScenarioInterface {
    readonly id: string;
    readonly title: string;
    readonly primaryMode: string;
    readonly description: string;
    breakdown: Record<string, string>;
    insights: string[];
    constructor(id: string, title: string, primaryMode: string, description: string);
    addModeBreakdown(mode: string, description: string): this;
    addInsights(...insights: string[]): this;
}
export declare const scenarioEngine: ScenarioEngine;
export declare const registerScenario: (scenario: ScenarioInterface) => void;
export declare const showScenario: (scenarioId: string, containerSelector: string) => void;
export {};
//# sourceMappingURL=scenario-engine.d.ts.map