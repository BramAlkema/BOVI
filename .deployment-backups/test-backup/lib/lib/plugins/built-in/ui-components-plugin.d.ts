import type { PluginContext, UIPlugin } from '../plugin-types.js';
export declare class UIComponentsPlugin implements UIPlugin {
    manifest: {
        id: string;
        name: string;
        version: string;
        category: "ui-component";
        description: string;
        provides: string[];
        requires: string[];
        config: {
            defaults: {
                enableRulerSwitcher: boolean;
                enableMoneyVeilCard: boolean;
                enableHamburgerSentinel: boolean;
                enableSmartContracts: boolean;
                enableCohortEngine: boolean;
                enableStormMode: boolean;
            };
        };
    };
    private activeComponents;
    initialize(context: PluginContext): Promise<void>;
    activate(context: PluginContext): Promise<void>;
    deactivate(context: PluginContext): Promise<void>;
    render(container: HTMLElement, context: PluginContext): void;
    unmount(): void;
    configure(config: Record<string, any>): Promise<void>;
    getStatus(): {
        state: "active";
        lastUpdated: number;
        metrics: {
            activeComponents: number;
            components: string[];
        };
    };
}
//# sourceMappingURL=ui-components-plugin.d.ts.map