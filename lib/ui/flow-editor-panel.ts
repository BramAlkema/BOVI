/**
 * BOVI Flow Editor Panel
 * Integration component for the visual flow editor
 */

import { FlowEditor } from './flow-editor.js';
import type { FlowSpec } from '../flow/types.js';

export function setupFlowEditorPanel(): void {
  // Find a suitable container (bundle or scenarios section)
  const targetContainer = document.querySelector("#bundle") || document.querySelector("#scenarios");
  
  if (targetContainer && !targetContainer.querySelector(".flow-editor-panel")) {
    const panel = document.createElement("div");
    panel.className = "panel flow-editor-panel";
    panel.innerHTML = `
      <div class="flow-editor-header">
        <h3>🎛️ Visual Flow Editor</h3>
        <p class="text-muted">Drag and connect BOVI nodes to create custom flows</p>
        <div class="flow-editor-toolbar">
          <button id="add-pda-node" class="btn secondary small">📊 Add PDA</button>
          <button id="add-calculate-node" class="btn secondary small">🔢 Add Calculate</button>
          <button id="add-detect-node" class="btn secondary small">🔍 Add Detect</button>
          <button id="add-sweep-node" class="btn secondary small">🧹 Add Sweep</button>
          <button id="clear-flow" class="btn danger small">🗑️ Clear</button>
          <button id="export-flow" class="btn brand small">💾 Export PNG</button>
        </div>
      </div>
      <div id="flow-editor-container" class="flow-editor-container">
        <!-- Flow editor will be mounted here -->
      </div>
      <div class="flow-editor-footer">
        <div class="flow-info">
          <span id="node-count">0 nodes</span>
          <span id="connection-count">0 connections</span>
        </div>
        <button id="execute-flow" class="btn brand">▶️ Execute Flow</button>
      </div>
    `;
    
    targetContainer.appendChild(panel);
    initializeFlowEditor();
  }
}

function initializeFlowEditor(): void {
  const container = document.querySelector("#flow-editor-container") as HTMLElement;
  if (!container) return;

  // Create flow editor instance
  const flowEditor = new FlowEditor({
    container,
    width: 800,
    height: 500,
    gridSize: 20,
    snapToGrid: true
  });

  // Node creation buttons
  document.getElementById("add-pda-node")?.addEventListener("click", () => {
    flowEditor.addNode({
      type: "V.PDA",
      label: "Personal Data Assessment",
      description: "Calculate nominal vs real prices",
      config: { items: [] }
    }, getRandomPosition());
    updateFlowInfo(flowEditor);
  });

  document.getElementById("add-calculate-node")?.addEventListener("click", () => {
    flowEditor.addNode({
      type: "V.Calculate", 
      label: "Calculate",
      description: "Perform mathematical operations",
      config: { formula: "sum", inputs: [] }
    }, getRandomPosition());
    updateFlowInfo(flowEditor);
  });

  document.getElementById("add-detect-node")?.addEventListener("click", () => {
    flowEditor.addNode({
      type: "I.Detect",
      label: "Violation Detector", 
      description: "Detect fairness violations",
      config: { triggers: ["shrink"] }
    }, getRandomPosition());
    updateFlowInfo(flowEditor);
  });

  document.getElementById("add-sweep-node")?.addEventListener("click", () => {
    flowEditor.addNode({
      type: "B.Sweep",
      label: "KPI Sweep",
      description: "Collect performance metrics", 
      config: { kpis: {} }
    }, getRandomPosition());
    updateFlowInfo(flowEditor);
  });

  // Action buttons
  document.getElementById("clear-flow")?.addEventListener("click", () => {
    if (confirm("Clear all nodes and connections?")) {
      flowEditor.clear();
      updateFlowInfo(flowEditor);
    }
  });

  document.getElementById("export-flow")?.addEventListener("click", () => {
    flowEditor.exportAsPNG();
  });

  document.getElementById("execute-flow")?.addEventListener("click", async () => {
    const flowSpec = flowEditor.getFlowSpec();
    await executeCustomFlow(flowSpec);
  });

  // Add some demo nodes
  addDemoNodes(flowEditor);
  updateFlowInfo(flowEditor);
}

function getRandomPosition() {
  return {
    x: Math.random() * 600 + 100,
    y: Math.random() * 300 + 100
  };
}

function addDemoNodes(flowEditor: FlowEditor): void {
  // Add a demo flow
  const pdaNode = flowEditor.addNode({
    type: "V.PDA",
    label: "Grocery Assessment",
    description: "Analyze grocery price changes",
    config: { 
      items: [
        { name: "Bread", price: 2.50, usual: 2.00, shrink: false },
        { name: "Milk", price: 1.80, usual: 1.60, shrink: true }
      ]
    }
  }, { x: 100, y: 150 });

  const detectNode = flowEditor.addNode({
    type: "I.Detect",
    label: "Shrinkflation Detector",
    description: "Find hidden price increases", 
    config: { triggers: ["shrink"] }
  }, { x: 350, y: 150 });

  const sweepNode = flowEditor.addNode({
    type: "B.Sweep", 
    label: "Price KPIs",
    description: "Track inflation metrics",
    config: { 
      kpis: {
        "avg_price_change": "last(pda.nominal)",
        "violation_count": "count(detect.violations)"
      }
    }
  }, { x: 600, y: 150 });

  // Connect the nodes
  flowEditor.addConnection(
    { nodeId: pdaNode.id, port: "output" },
    { nodeId: detectNode.id, port: "input" }
  );

  flowEditor.addConnection(
    { nodeId: detectNode.id, port: "output" },
    { nodeId: sweepNode.id, port: "input" }
  );
}

function updateFlowInfo(flowEditor: FlowEditor): void {
  const flowSpec = flowEditor.getFlowSpec();
  const nodeCountEl = document.getElementById("node-count");
  const connectionCountEl = document.getElementById("connection-count");
  
  if (nodeCountEl) {
    nodeCountEl.textContent = `${flowSpec.nodes.length} nodes`;
  }
  
  if (connectionCountEl) {
    connectionCountEl.textContent = `${flowSpec.edges.length} connections`;
  }
}

async function executeCustomFlow(flowSpec: FlowSpec): Promise<void> {
  try {
    console.log("🎛️ Executing custom flow:", flowSpec);
    
    // Import flow execution engine
    const { FlowRunner } = await import("../flow/runner.js");
    const runner = new FlowRunner();
    
    // Execute the flow
    const result = await runner.executeFlow(flowSpec);
    
    // Show results
    showNotification(`Flow executed successfully! Processed ${flowSpec.nodes.length} nodes.`, "success");
    console.log("Flow execution result:", result);
    
  } catch (error) {
    console.error("Flow execution failed:", error);
    showNotification("Flow execution failed. Check console for details.", "error");
  }
}

function showNotification(message: string, type: "info" | "success" | "error" = "info"): void {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.className = `toast show ${type}`;
  toast.textContent = message;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// Add CSS styles for the flow editor
const styles = document.createElement("style");
styles.textContent = `
  .flow-editor-panel {
    margin-top: 2rem;
  }

  .flow-editor-header {
    margin-bottom: 1rem;
  }

  .flow-editor-toolbar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .flow-editor-container {
    border: 2px solid var(--border-color, #2a2f3a);
    border-radius: 12px;
    overflow: hidden;
    margin: 1rem 0;
  }

  .flow-editor-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color, #2a2f3a);
  }

  .flow-info {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .btn.small {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn.danger {
    background: #ff6b6b;
    color: white;
  }

  .btn.danger:hover {
    background: #ff5252;
  }

  /* Flow node styles */
  .flow-node {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .flow-node:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .flow-node.selected {
    border-color: #fff !important;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
  }

  /* Toast notification styles */
  .toast.success {
    background: #4caf50;
    color: white;
  }

  .toast.error {
    background: #f44336;
    color: white;
  }
`;

if (!document.querySelector("#flow-editor-styles")) {
  styles.id = "flow-editor-styles";
  document.head.appendChild(styles);
}