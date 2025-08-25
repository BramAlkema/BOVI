/**
 * BOVI Visual Flow Editor
 * Draggable node cards with visual connectors
 */

import type { FlowNode, FlowEdge, FlowSpec } from "../flow/types.js";

export interface NodePosition {
  x: number;
  y: number;
}

export interface VisualNode extends FlowNode {
  position: NodePosition;
  selected?: boolean;
}

export interface Connection {
  from: { nodeId: string; port: string };
  to: { nodeId: string; port: string };
  path?: string; // SVG path for the connection line
}

export interface FlowEditorConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  gridSize?: number;
  snapToGrid?: boolean;
}

export class FlowEditor {
  private container: HTMLElement;
  private canvas!: HTMLElement;
  private svgLayer!: SVGElement;
  private nodes: Map<string, VisualNode> = new Map();
  private connections: Connection[] = [];
  private selectedNode: string | null = null;
  private dragState: {
    isDragging: boolean;
    nodeId: string | null;
    startPos: { x: number; y: number };
    offset: { x: number; y: number };
  } = { isDragging: false, nodeId: null, startPos: { x: 0, y: 0 }, offset: { x: 0, y: 0 } };

  private config: Required<FlowEditorConfig>;

  constructor(config: FlowEditorConfig) {
    this.config = {
      width: 800,
      height: 600,
      gridSize: 20,
      snapToGrid: true,
      ...config
    };

    this.container = config.container;
    this.setupEditor();
    this.bindEvents();
  }

  private setupEditor(): void {
    this.container.innerHTML = '';
    this.container.className = 'flow-editor';
    this.container.style.cssText = `
      position: relative;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      background: #1a1d24;
      border: 1px solid #2a2f3a;
      border-radius: 8px;
      overflow: hidden;
      user-select: none;
    `;

    // Canvas for nodes
    this.canvas = document.createElement('div');
    this.canvas.className = 'flow-canvas';
    this.canvas.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(circle, #2a2f3a 1px, transparent 1px);
      background-size: ${this.config.gridSize}px ${this.config.gridSize}px;
    `;

    // SVG layer for connections
    this.svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgLayer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.svgLayer);
  }

  private bindEvents(): void {
    // Mouse events for dragging
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch events for mobile
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Prevent context menu on right click
    this.container.addEventListener('contextmenu', e => e.preventDefault());
  }

  public addNode(nodeData: Omit<FlowNode, 'id'>, position: NodePosition): VisualNode {
    const node: VisualNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: this.config.snapToGrid ? this.snapToGrid(position) : position,
      ...nodeData
    };

    this.nodes.set(node.id, node);
    this.renderNode(node);
    return node;
  }

  public removeNode(nodeId: string): void {
    const nodeElement = this.container.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.remove();
    }
    this.nodes.delete(nodeId);
    
    // Remove connections involving this node
    this.connections = this.connections.filter(
      conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId
    );
    this.redrawConnections();
  }

  public addConnection(from: { nodeId: string; port: string }, to: { nodeId: string; port: string }): void {
    const connection: Connection = { from, to };
    this.connections.push(connection);
    this.renderConnection(connection);
  }

  private renderNode(node: VisualNode): void {
    const nodeElement = document.createElement('div');
    nodeElement.className = `flow-node ${node.type.toLowerCase().replace('.', '-')}`;
    nodeElement.dataset.nodeId = node.id;
    nodeElement.style.cssText = `
      position: absolute;
      left: ${node.position.x}px;
      top: ${node.position.y}px;
      width: 160px;
      min-height: 80px;
      background: linear-gradient(135deg, #2a3441 0%, #1e2832 100%);
      border: 2px solid ${this.getNodeColor(node.type)};
      border-radius: 12px;
      padding: 12px;
      cursor: grab;
      z-index: 2;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      font-family: system-ui, -apple-system, sans-serif;
      color: #e7eef9;
    `;

    // Node header
    const header = document.createElement('div');
    header.className = 'node-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
    `;

    const icon = document.createElement('span');
    icon.textContent = this.getNodeIcon(node.type);
    icon.style.cssText = 'font-size: 16px;';

    const title = document.createElement('span');
    title.textContent = node.label || node.type;

    header.appendChild(icon);
    header.appendChild(title);

    // Node description
    if (node.description) {
      const desc = document.createElement('div');
      desc.className = 'node-description';
      desc.textContent = node.description;
      desc.style.cssText = `
        font-size: 11px;
        opacity: 0.7;
        line-height: 1.3;
        margin-bottom: 8px;
      `;
      nodeElement.appendChild(desc);
    }

    // Connection ports
    const inputPort = document.createElement('div');
    inputPort.className = 'input-port';
    inputPort.style.cssText = `
      position: absolute;
      left: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: ${this.getNodeColor(node.type)};
      border: 2px solid #1a1d24;
      border-radius: 50%;
      cursor: crosshair;
    `;

    const outputPort = document.createElement('div');
    outputPort.className = 'output-port';
    outputPort.style.cssText = `
      position: absolute;
      right: -6px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: ${this.getNodeColor(node.type)};
      border: 2px solid #1a1d24;
      border-radius: 50%;
      cursor: crosshair;
    `;

    nodeElement.appendChild(header);
    nodeElement.appendChild(inputPort);
    nodeElement.appendChild(outputPort);

    // Add hover effects
    nodeElement.addEventListener('mouseenter', () => {
      if (!this.dragState.isDragging) {
        nodeElement.style.boxShadow = `0 8px 32px rgba(${this.hexToRgb(this.getNodeColor(node.type))}, 0.3)`;
        nodeElement.style.transform = 'translateY(-2px)';
      }
    });

    nodeElement.addEventListener('mouseleave', () => {
      if (!this.dragState.isDragging) {
        nodeElement.style.boxShadow = 'none';
        nodeElement.style.transform = 'translateY(0)';
      }
    });

    this.canvas.appendChild(nodeElement);
  }

  private renderConnection(connection: Connection): void {
    const fromNode = this.nodes.get(connection.from.nodeId);
    const toNode = this.nodes.get(connection.to.nodeId);
    
    if (!fromNode || !toNode) return;

    const fromPos = {
      x: fromNode.position.x + 160, // node width
      y: fromNode.position.y + 40   // node height / 2
    };

    const toPos = {
      x: toNode.position.x,
      y: toNode.position.y + 40
    };

    // Create curved path
    const midX = (fromPos.x + toPos.x) / 2;
    const path = `M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y} ${midX} ${toPos.y} ${toPos.x} ${toPos.y}`;

    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    pathElement.setAttribute('stroke', '#4cc9f0');
    pathElement.setAttribute('stroke-width', '2');
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke-dasharray', '5,5');
    pathElement.style.filter = 'drop-shadow(0 0 4px rgba(76, 201, 240, 0.3))';

    connection.path = path;
    this.svgLayer.appendChild(pathElement);
  }

  private redrawConnections(): void {
    this.svgLayer.innerHTML = '';
    this.connections.forEach(connection => this.renderConnection(connection));
  }

  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.flow-node') as HTMLElement;
    
    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId!;
      const rect = nodeElement.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      this.dragState = {
        isDragging: true,
        nodeId,
        startPos: { x: event.clientX, y: event.clientY },
        offset: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      };

      this.selectNode(nodeId);
      nodeElement.style.cursor = 'grabbing';
      nodeElement.style.zIndex = '10';
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.dragState.isDragging || !this.dragState.nodeId) return;

    const containerRect = this.container.getBoundingClientRect();
    const x = event.clientX - containerRect.left - this.dragState.offset.x;
    const y = event.clientY - containerRect.top - this.dragState.offset.y;

    const newPos = this.config.snapToGrid 
      ? this.snapToGrid({ x, y })
      : { x: Math.max(0, Math.min(x, this.config.width - 160)), y: Math.max(0, Math.min(y, this.config.height - 80)) };

    this.updateNodePosition(this.dragState.nodeId, newPos);
  }

  private handleMouseUp(): void {
    if (this.dragState.nodeId) {
      const nodeElement = this.container.querySelector(`[data-node-id="${this.dragState.nodeId}"]`) as HTMLElement;
      if (nodeElement) {
        nodeElement.style.cursor = 'grab';
        nodeElement.style.zIndex = '2';
      }
    }

    this.dragState = { isDragging: false, nodeId: null, startPos: { x: 0, y: 0 }, offset: { x: 0, y: 0 } };
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target
      } as any);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      } as any);
    }
  }

  private handleTouchEnd(): void {
    this.handleMouseUp();
  }

  private updateNodePosition(nodeId: string, position: NodePosition): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.position = position;
    const nodeElement = this.container.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (nodeElement) {
      nodeElement.style.left = `${position.x}px`;
      nodeElement.style.top = `${position.y}px`;
    }

    this.redrawConnections();
  }

  private selectNode(nodeId: string): void {
    // Deselect previous
    if (this.selectedNode) {
      const prevElement = this.container.querySelector(`[data-node-id="${this.selectedNode}"]`) as HTMLElement;
      if (prevElement) {
        prevElement.style.borderColor = this.getNodeColor(this.nodes.get(this.selectedNode)!.type);
      }
    }

    // Select new
    this.selectedNode = nodeId;
    const nodeElement = this.container.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (nodeElement) {
      nodeElement.style.borderColor = '#fff';
    }
  }

  private snapToGrid(position: NodePosition): NodePosition {
    return {
      x: Math.round(position.x / this.config.gridSize) * this.config.gridSize,
      y: Math.round(position.y / this.config.gridSize) * this.config.gridSize
    };
  }

  private getNodeColor(nodeType: string): string {
    const [mode] = nodeType.split('.');
    switch (mode) {
      case 'B': return '#4cc9f0'; // Balanced - Blue
      case 'O': return '#ff6b6b'; // Obligated - Red  
      case 'V': return '#a1ffb5'; // Value - Green
      case 'I': return '#ffd166'; // Immediate - Yellow
      default: return '#8b949e';
    }
  }

  private getNodeIcon(nodeType: string): string {
    switch (nodeType) {
      case 'V.PDA': return '📊';
      case 'V.Calculate': return '🔢';
      case 'V.Assess': return '⚖️';
      case 'I.Detect': return '🔍';
      case 'I.Default':
      case 'B.Default':
      case 'O.Default': return '⚙️';
      case 'B.Sweep': return '🧹';
      case 'B.Learn': return '📚';
      default: return '📦';
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '76, 201, 240';
  }

  public exportAsPNG(): void {
    // Simple implementation - take screenshot of container
    import('html2canvas').then((html2canvas) => {
      html2canvas.default(this.container).then(canvas => {
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'bovi-flow.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      });
    }).catch(() => {
      // Fallback: create simple canvas export
      const canvas = document.createElement('canvas');
      canvas.width = this.config.width;
      canvas.height = this.config.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#1a1d24';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'bovi-flow.png';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    });
  }

  public clear(): void {
    this.nodes.clear();
    this.connections = [];
    this.canvas.innerHTML = '';
    this.svgLayer.innerHTML = '';
    this.selectedNode = null;
  }

  public getFlowSpec(): FlowSpec {
    const nodes: FlowNode[] = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      type: node.type,
      label: node.label,
      description: node.description,
      config: node.config,
      outputs: node.outputs
    }));

    const edges: FlowEdge[] = this.connections.map((conn, index) => ({
      from: conn.from.nodeId,
      to: conn.to.nodeId,
      label: `edge_${index}`,
      condition: 'always'
    }));

    return {
      id: `flow_${Date.now()}`,
      title: 'Custom Flow',
      description: 'Flow created with visual editor',
      context: {},
      nodes,
      edges,
      meta: {
        version: '1.0.0',
        bovi_modes: ['B', 'O', 'V', 'I'],
        primary_mode: 'V',
        created: new Date().toISOString(),
        tags: ['visual', 'custom']
      }
    };
  }
}