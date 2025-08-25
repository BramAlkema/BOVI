import type { PluginContext, FlowExtensionPlugin as IFlowExtensionPlugin } from '../plugin-types.js';
import type { FlowSpec } from '../../flow/types.js';
export declare class FlowExtensionPlugin implements IFlowExtensionPlugin {
    manifest: {
        id: string;
        name: string;
        version: string;
        category: "flow-extension";
        description: string;
        provides: string[];
        requires: string[];
        config: {
            defaults: {
                enableCustomNodes: boolean;
                enableFlowValidation: boolean;
                enableFlowAnalytics: boolean;
            };
        };
    };
    initialize(context: PluginContext): Promise<void>;
    activate(context: PluginContext): Promise<void>;
    extendFlow(flowSpec: FlowSpec): FlowSpec;
    registerNodeTypes(): Record<string, any>;
    private registerCustomNodeTypes;
    private setupFlowValidation;
    private setupFlowAnalytics;
    getStatus(): {
        state: "active";
        lastUpdated: number;
        metrics: {
            customNodeTypes: number;
            validationEnabled: boolean;
            analyticsEnabled: boolean;
        };
    };
}
//# sourceMappingURL=flow-extension-plugin.d.ts.map