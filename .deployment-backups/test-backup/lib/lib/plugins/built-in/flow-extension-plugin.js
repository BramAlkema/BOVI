export class FlowExtensionPlugin {
    constructor() {
        this.manifest = {
            id: 'bovi-core-flow-extensions',
            name: 'BOVI Flow Extensions',
            version: '1.0.0',
            category: 'flow-extension',
            description: 'Core flow system extensions and custom node types',
            provides: ['custom-nodes', 'flow-validation', 'flow-analytics'],
            requires: ['flow-runner'],
            config: {
                defaults: {
                    enableCustomNodes: true,
                    enableFlowValidation: true,
                    enableFlowAnalytics: false
                }
            }
        };
    }
    async initialize(context) {
        context.log('Flow extension plugin initializing');
        if (!context.flowRunner) {
            throw new Error('Flow extension plugin requires flow runner');
        }
    }
    async activate(context) {
        const config = context.getPluginConfig(this.manifest.id);
        if (config.enableCustomNodes) {
            this.registerCustomNodeTypes();
        }
        if (config.enableFlowValidation) {
            this.setupFlowValidation();
        }
        if (config.enableFlowAnalytics) {
            this.setupFlowAnalytics();
        }
        context.log('Flow extension plugin activated');
    }
    extendFlow(flowSpec) {
        const extended = {
            ...flowSpec,
            meta: {
                ...flowSpec.meta,
                extended: true,
                extensionVersion: this.manifest.version,
                extensionTimestamp: Date.now()
            }
        };
        return extended;
    }
    registerNodeTypes() {
        return {
            'V.Analytics': {
                execute: async (node, context) => {
                    return {
                        analyticsData: {
                            nodeId: node.id,
                            timestamp: Date.now(),
                            flowId: context.flowId
                        }
                    };
                }
            },
            'B.Notification': {
                execute: async (node, context) => {
                    const message = node.config?.message || 'Flow notification';
                    const type = node.config?.type || 'info';
                    console.log(`[Flow Notification] ${message}`);
                    return {
                        notificationSent: true,
                        message,
                        type
                    };
                }
            }
        };
    }
    registerCustomNodeTypes() {
        const nodeTypes = this.registerNodeTypes();
        console.log('Registered custom node types:', Object.keys(nodeTypes));
    }
    setupFlowValidation() {
        console.log('Flow validation enabled');
    }
    setupFlowAnalytics() {
        console.log('Flow analytics enabled');
    }
    getStatus() {
        return {
            state: 'active',
            lastUpdated: Date.now(),
            metrics: {
                customNodeTypes: Object.keys(this.registerNodeTypes()).length,
                validationEnabled: true,
                analyticsEnabled: false
            }
        };
    }
}
//# sourceMappingURL=flow-extension-plugin.js.map