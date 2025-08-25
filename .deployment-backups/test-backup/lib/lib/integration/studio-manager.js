import { createInlineStudio } from "../studio.js";
export class StudioManagerService {
    constructor() {
        this.studios = new Map();
    }
    initializeStudios(flowSpecs) {
        Object.entries(flowSpecs).forEach(([flowId, flowSpec]) => {
            this.createStudioForFlow(flowId, flowSpec);
        });
    }
    createStudioForFlow(flowId, flowSpec) {
        let studioContainer = document.getElementById(`${flowId}Studio`);
        if (!studioContainer) {
            const panel = document.querySelector(`#${flowId} .panel:last-child`);
            if (panel) {
                const studioDiv = document.createElement("div");
                studioDiv.innerHTML = `
          <h3>Flow Visualization</h3>
          <div id="${flowId}Studio" class="studio-container"></div>
        `;
                panel.appendChild(studioDiv);
                studioContainer = document.getElementById(`${flowId}Studio`);
            }
        }
        if (studioContainer) {
            const studio = createInlineStudio(`${flowId}Studio`);
            studio.renderFlow(flowSpec).catch(console.error);
            this.studios.set(flowId, studio);
            console.log(`🎨 Studio created for ${flowId}`);
        }
    }
    getStudio(flowId) {
        return this.studios.get(flowId);
    }
    getAllStudios() {
        const result = {};
        this.studios.forEach((studio, id) => {
            result[id] = studio;
        });
        return result;
    }
    async updateStudio(flowId, flowSpec) {
        const studio = this.studios.get(flowId);
        if (studio) {
            await studio.renderFlow(flowSpec);
            console.log(`🔄 Updated studio for ${flowId}`);
        }
    }
    removeStudio(flowId) {
        const studio = this.studios.get(flowId);
        if (studio) {
            const container = document.getElementById(`${flowId}Studio`);
            if (container) {
                container.remove();
            }
            this.studios.delete(flowId);
            console.log(`🗑️ Removed studio for ${flowId}`);
        }
    }
    clearAll() {
        this.studios.forEach((_, flowId) => {
            this.removeStudio(flowId);
        });
    }
}
export const studioManager = new StudioManagerService();
//# sourceMappingURL=studio-manager.js.map