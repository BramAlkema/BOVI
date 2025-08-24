/**
 * BOVI Studio Manager
 * Manages inline studios for flow visualization
 */

import type { FlowSpec } from "../flow/types.js";
import { createInlineStudio, InlineStudio } from "../studio.js";

/**
 * Studio manager service that handles flow visualization
 */
export class StudioManagerService {
  private studios: Map<string, InlineStudio> = new Map();

  /**
   * Initialize studios for loaded flows
   */
  initializeStudios(flowSpecs: Record<string, FlowSpec>): void {
    Object.entries(flowSpecs).forEach(([flowId, flowSpec]) => {
      this.createStudioForFlow(flowId, flowSpec);
    });
  }

  /**
   * Create studio for a specific flow
   */
  createStudioForFlow(flowId: string, flowSpec: FlowSpec): void {
    // Create studio container if it doesn't exist
    let studioContainer = document.getElementById(`${flowId}Studio`);
    if (!studioContainer) {
      // Add studio to existing panel
      const panel = document.querySelector(`#${flowId} .panel:last-child`);
      if (panel) {
        const studioDiv = document.createElement("div");
        studioDiv.innerHTML = `
          <h3>Flow Visualization</h3>
          <div id="${flowId}Studio" class="studio-container"></div>
        `;
        panel.appendChild(studioDiv);
        studioContainer = document.getElementById(`${flowId}Studio`)!;
      }
    }

    if (studioContainer) {
      const studio = createInlineStudio(`${flowId}Studio`);
      studio.renderFlow(flowSpec).catch(console.error);
      this.studios.set(flowId, studio);

      console.log(`🎨 Studio created for ${flowId}`);
    }
  }

  /**
   * Get studio for a flow
   */
  getStudio(flowId: string): InlineStudio | undefined {
    return this.studios.get(flowId);
  }

  /**
   * Get all studios
   */
  getAllStudios(): Record<string, InlineStudio> {
    const result: Record<string, InlineStudio> = {};
    this.studios.forEach((studio, id) => {
      result[id] = studio;
    });
    return result;
  }

  /**
   * Update studio for a flow
   */
  async updateStudio(flowId: string, flowSpec: FlowSpec): Promise<void> {
    const studio = this.studios.get(flowId);
    if (studio) {
      await studio.renderFlow(flowSpec);
      console.log(`🔄 Updated studio for ${flowId}`);
    }
  }

  /**
   * Remove studio for a flow
   */
  removeStudio(flowId: string): void {
    const studio = this.studios.get(flowId);
    if (studio) {
      // Clean up studio container
      const container = document.getElementById(`${flowId}Studio`);
      if (container) {
        container.remove();
      }

      this.studios.delete(flowId);
      console.log(`🗑️ Removed studio for ${flowId}`);
    }
  }

  /**
   * Clear all studios
   */
  clearAll(): void {
    this.studios.forEach((_, flowId) => {
      this.removeStudio(flowId);
    });
  }
}

// Export global instance
export const studioManager = new StudioManagerService();
