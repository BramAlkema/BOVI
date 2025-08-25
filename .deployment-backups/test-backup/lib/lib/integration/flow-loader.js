import { flowRunner } from "../flow/index.js";
export class FlowLoaderService {
    constructor() {
        this.flowSpecs = new Map();
    }
    async loadFlowSpecs(flowIds = ["groceries", "rent", "energy"]) {
        for (const flowId of flowIds) {
            try {
                const response = await fetch(`/flows/${flowId}.json`);
                const flowSpec = await response.json();
                this.flowSpecs.set(flowId, flowSpec);
                await flowRunner.loadFlow(flowSpec);
                console.log(`📋 Loaded flow: ${flowId}`);
            }
            catch (error) {
                console.warn(`Failed to load flow ${flowId}:`, error);
            }
        }
    }
    getFlowSpec(flowId) {
        return this.flowSpecs.get(flowId);
    }
    getAllFlowSpecs() {
        const result = {};
        this.flowSpecs.forEach((spec, id) => {
            result[id] = spec;
        });
        return result;
    }
    isFlowLoaded(flowId) {
        return this.flowSpecs.has(flowId);
    }
    async reloadFlow(flowId) {
        try {
            const response = await fetch(`/flows/${flowId}.json`);
            const flowSpec = await response.json();
            this.flowSpecs.set(flowId, flowSpec);
            await flowRunner.loadFlow(flowSpec);
            console.log(`🔄 Reloaded flow: ${flowId}`);
        }
        catch (error) {
            console.error(`Failed to reload flow ${flowId}:`, error);
            throw error;
        }
    }
}
export const flowLoader = new FlowLoaderService();
//# sourceMappingURL=flow-loader.js.map