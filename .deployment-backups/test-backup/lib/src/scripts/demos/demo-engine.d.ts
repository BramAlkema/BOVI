export interface DemoInterface {
    id: string;
    title: string;
    mode: string;
    description: string;
    run(container: HTMLElement): Promise<void>;
}
declare class DemoEngine {
    private demos;
    private activeDemo;
    registerDemo(id: string, demo: DemoInterface): void;
    runDemo(demoId: string, containerSelector: string): Promise<void>;
    getAvailableDemos(): string[];
}
export declare abstract class Demo implements DemoInterface {
    readonly id: string;
    readonly title: string;
    readonly mode: string;
    readonly description: string;
    constructor(id: string, title: string, mode: string, description: string);
    abstract run(container: HTMLElement): Promise<void>;
    protected createDemoStructure(container: HTMLElement, content: string): HTMLElement;
    protected createModeAnalysis(analysis: Record<string, string>): string;
}
export declare const demoEngine: DemoEngine;
export declare const registerDemo: (demo: DemoInterface) => void;
export declare const runDemo: (demoId: string, containerSelector: string) => Promise<void>;
export {};
//# sourceMappingURL=demo-engine.d.ts.map