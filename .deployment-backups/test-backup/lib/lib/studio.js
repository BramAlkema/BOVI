import { on } from './bus.js';
import ELK from 'elkjs/lib/elk.bundled.js';
const BOVI_COLORS = {
    'B': '#4cc9f0',
    'O': '#ff6b6b',
    'V': '#a1ffb5',
    'I': '#ffd166'
};
export class InlineStudio {
    constructor(containerId) {
        this.flowSpec = null;
        this.layout = null;
        this.activeNodes = new Set();
        this.activeEdges = new Set();
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.setupEventListeners();
        this.createSVG();
    }
    setupEventListeners() {
        on('V.pda.started', (event) => this.highlightNode(event.detail.node));
        on('V.pda.completed', (event) => this.unhighlightNode(event.detail.node));
        on('I.detect.violation', (event) => this.highlightNode(event.detail.node));
        on('I.default.started', (event) => this.highlightNode(event.detail.node, 'pulsing'));
        on('I.default.applied', (event) => {
            this.unhighlightNode(event.detail.node);
            this.flashNode(event.detail.node, 'success');
        });
        on('I.default.cancelled', (event) => {
            this.unhighlightNode(event.detail.node);
            this.flashNode(event.detail.node, 'cancelled');
        });
        on('B.default.started', (event) => this.highlightNode(event.detail.node, 'pulsing'));
        on('B.default.applied', (event) => {
            this.unhighlightNode(event.detail.node);
            this.flashNode(event.detail.node, 'success');
        });
        on('B.sweep.updated', (event) => this.flashNode(event.detail.node, 'kpi-update'));
        on('O.default.started', (event) => this.highlightNode(event.detail.node, 'pulsing'));
        on('O.default.applied', (event) => {
            this.unhighlightNode(event.detail.node);
            this.flashNode(event.detail.node, 'success');
        });
        on('flow.started', (event) => this.showFlowStart(event.detail.flow));
        on('flow.completed', (event) => this.showFlowComplete(event.detail.flow));
        on('flow.error', (event) => this.showFlowError(event.detail.flow, event.detail.node));
        on('ui.countdown.tick', (event) => this.updateCountdown(event.detail.node, event.detail.remaining));
    }
    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '400');
        this.svg.setAttribute('viewBox', '0 0 800 400');
        this.svg.style.background = 'rgba(255,255,255,0.02)';
        this.svg.style.borderRadius = '12px';
        this.svg.style.border = '1px solid rgba(255,255,255,0.08)';
        const styles = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styles.textContent = `
      .flow-node {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .flow-node:hover {
        transform: scale(1.05);
      }
      
      .flow-node.active {
        filter: drop-shadow(0 0 8px currentColor);
      }
      
      .flow-node.pulsing {
        animation: pulse 2s infinite;
      }
      
      .flow-edge {
        transition: all 0.3s ease;
      }
      
      .flow-edge.active {
        stroke-width: 3;
        filter: drop-shadow(0 0 4px currentColor);
      }
      
      .node-text {
        font-family: ui-sans-serif, system-ui;
        font-size: 12px;
        fill: #e7eef9;
        text-anchor: middle;
        dominant-baseline: central;
      }
      
      .node-badge {
        font-family: ui-sans-serif, system-ui;
        font-size: 10px;
        font-weight: 600;
        fill: #000;
        text-anchor: middle;
        dominant-baseline: central;
      }
      
      .countdown-text {
        font-family: ui-mono, monospace;
        font-size: 10px;
        fill: #ffd166;
        text-anchor: middle;
        dominant-baseline: central;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      
      .flash-success {
        animation: flashSuccess 1s ease;
      }
      
      .flash-cancelled {
        animation: flashCancelled 1s ease;
      }
      
      .flash-kpi {
        animation: flashKpi 0.5s ease;
      }
      
      @keyframes flashSuccess {
        0% { fill: currentColor; }
        50% { fill: #7cf08a; }
        100% { fill: currentColor; }
      }
      
      @keyframes flashCancelled {
        0% { fill: currentColor; }
        50% { fill: #ff6b6b; }
        100% { fill: currentColor; }
      }
      
      @keyframes flashKpi {
        0% { fill: currentColor; }
        50% { fill: #4cc9f0; }
        100% { fill: currentColor; }
      }
    `;
        this.svg.appendChild(styles);
        this.container.appendChild(this.svg);
    }
    async renderFlow(flowSpec) {
        this.flowSpec = flowSpec;
        this.layout = await this.calculateLayout(flowSpec);
        this.render();
    }
    async calculateLayout(flowSpec) {
        const elk = new ELK();
        const elkGraph = {
            id: 'root',
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': 'DOWN',
                'elk.spacing.nodeNode': '50',
                'elk.layered.spacing.nodeNodeBetweenLayers': '80',
                'elk.spacing.edgeNode': '30'
            },
            children: flowSpec.nodes.map(node => ({
                id: node.id,
                width: 120,
                height: 60,
                labels: [{ text: node.label }]
            })),
            edges: flowSpec.edges.map(edge => ({
                id: `${edge.from}-${edge.to}`,
                sources: [edge.from],
                targets: [edge.to]
            }))
        };
        const layoutedGraph = await elk.layout(elkGraph);
        const nodes = layoutedGraph.children?.map(child => ({
            id: child.id,
            x: child.x || 0,
            y: child.y || 0,
            width: child.width || 120,
            height: child.height || 60
        })) || [];
        const edges = layoutedGraph.edges?.map(elkEdge => {
            const sections = elkEdge.sections || [];
            const points = sections.length > 0
                ? [
                    { x: sections[0].startPoint.x, y: sections[0].startPoint.y },
                    { x: sections[0].endPoint.x, y: sections[0].endPoint.y }
                ]
                : [{ x: 0, y: 0 }, { x: 0, y: 0 }];
            return {
                from: elkEdge.sources?.[0] || '',
                to: elkEdge.targets?.[0] || '',
                points
            };
        }) || [];
        return {
            nodes,
            edges,
            width: Math.max(800, (layoutedGraph.width || 800) + 100),
            height: Math.max(400, (layoutedGraph.height || 400) + 100)
        };
    }
    render() {
        if (!this.layout || !this.flowSpec)
            return;
        const children = Array.from(this.svg.children);
        children.forEach(child => {
            if (child.tagName !== 'style' && child.tagName !== 'defs') {
                this.svg.removeChild(child);
            }
        });
        this.svg.setAttribute('viewBox', `0 0 ${this.layout.width} ${this.layout.height}`);
        this.svg.setAttribute('height', Math.min(600, this.layout.height).toString());
        this.layout.edges.forEach(edge => {
            this.renderEdge(edge);
        });
        this.layout.nodes.forEach(node => {
            const flowNode = this.flowSpec.nodes.find(n => n.id === node.id);
            this.renderNode(node, flowNode);
        });
    }
    renderEdge(edge) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'flow-edge');
        group.setAttribute('data-edge', `${edge.from}-${edge.to}`);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${edge.points[0].x} ${edge.points[0].y} L ${edge.points[1].x} ${edge.points[1].y}`;
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        if (!this.svg.querySelector('#arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', 'rgba(255,255,255,0.3)');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            this.svg.insertBefore(defs, this.svg.firstChild?.nextSibling || null);
        }
        group.appendChild(path);
        this.svg.appendChild(group);
    }
    renderNode(layoutNode, flowNode) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'flow-node');
        group.setAttribute('data-node', flowNode.id);
        group.setAttribute('data-type', flowNode.type);
        const [mode] = flowNode.type.split('.');
        const color = BOVI_COLORS[mode] || '#7a8798';
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', layoutNode.x.toString());
        rect.setAttribute('y', layoutNode.y.toString());
        rect.setAttribute('width', layoutNode.width.toString());
        rect.setAttribute('height', layoutNode.height.toString());
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', 'rgba(17,24,35,0.9)');
        rect.setAttribute('stroke', color);
        rect.setAttribute('stroke-width', '2');
        const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badgeRect.setAttribute('x', (layoutNode.x + 8).toString());
        badgeRect.setAttribute('y', (layoutNode.y + 8).toString());
        badgeRect.setAttribute('width', '16');
        badgeRect.setAttribute('height', '16');
        badgeRect.setAttribute('rx', '3');
        badgeRect.setAttribute('fill', color);
        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('class', 'node-badge');
        badgeText.setAttribute('x', (layoutNode.x + 16).toString());
        badgeText.setAttribute('y', (layoutNode.y + 16).toString());
        badgeText.textContent = mode;
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('class', 'node-text');
        labelText.setAttribute('x', (layoutNode.x + layoutNode.width / 2).toString());
        labelText.setAttribute('y', (layoutNode.y + layoutNode.height / 2 + 4).toString());
        labelText.textContent = this.truncateText(flowNode.label, 14);
        const countdownText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countdownText.setAttribute('class', 'countdown-text');
        countdownText.setAttribute('x', (layoutNode.x + layoutNode.width / 2).toString());
        countdownText.setAttribute('y', (layoutNode.y + layoutNode.height - 8).toString());
        countdownText.setAttribute('data-countdown', flowNode.id);
        countdownText.style.display = 'none';
        group.addEventListener('click', () => {
            this.showNodeDetails(flowNode);
        });
        group.appendChild(rect);
        group.appendChild(badgeRect);
        group.appendChild(badgeText);
        group.appendChild(labelText);
        group.appendChild(countdownText);
        this.svg.appendChild(group);
    }
    truncateText(text, maxLength) {
        return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + '…';
    }
    highlightNode(nodeId, type = 'active') {
        const nodeGroup = this.svg.querySelector(`[data-node="${nodeId}"]`);
        if (nodeGroup) {
            nodeGroup.classList.add(type);
            this.activeNodes.add(nodeId);
        }
    }
    unhighlightNode(nodeId) {
        const nodeGroup = this.svg.querySelector(`[data-node="${nodeId}"]`);
        if (nodeGroup) {
            nodeGroup.classList.remove('active', 'pulsing');
            this.activeNodes.delete(nodeId);
        }
    }
    flashNode(nodeId, flashType) {
        const nodeGroup = this.svg.querySelector(`[data-node="${nodeId}"]`);
        const rect = nodeGroup?.querySelector('rect');
        if (rect) {
            rect.classList.add(`flash-${flashType}`);
            setTimeout(() => {
                rect.classList.remove(`flash-${flashType}`);
            }, 1000);
        }
    }
    updateCountdown(nodeId, remaining) {
        const countdownText = this.svg.querySelector(`[data-countdown="${nodeId}"]`);
        if (countdownText) {
            countdownText.textContent = `${remaining}s`;
            countdownText.style.display = remaining > 0 ? 'block' : 'none';
        }
    }
    showFlowStart(flowId) {
        this.svg.style.border = '2px solid #4cc9f0';
        setTimeout(() => {
            this.svg.style.border = '1px solid rgba(255,255,255,0.08)';
        }, 1000);
    }
    showFlowComplete(flowId) {
        this.svg.style.border = '2px solid #7cf08a';
        setTimeout(() => {
            this.svg.style.border = '1px solid rgba(255,255,255,0.08)';
        }, 2000);
    }
    showFlowError(flowId, nodeId) {
        this.svg.style.border = '2px solid #ff6b6b';
        if (nodeId) {
            this.flashNode(nodeId, 'cancelled');
        }
        setTimeout(() => {
            this.svg.style.border = '1px solid rgba(255,255,255,0.08)';
        }, 3000);
    }
    showNodeDetails(node) {
        const details = {
            id: node.id,
            type: node.type,
            label: node.label,
            description: node.description,
            config: node.config
        };
        console.log('Node details:', details);
        window.dispatchEvent(new CustomEvent('ui.node.selected', { detail: { nodeId: node.id, details } }));
    }
    clear() {
        this.activeNodes.clear();
        this.activeEdges.clear();
        this.svg.querySelectorAll('.flow-node').forEach(node => {
            node.classList.remove('active', 'pulsing');
        });
        this.svg.querySelectorAll('.flow-edge').forEach(edge => {
            edge.classList.remove('active');
        });
        this.svg.querySelectorAll('.countdown-text').forEach(text => {
            text.style.display = 'none';
        });
    }
}
export const createInlineStudio = (containerId) => {
    return new InlineStudio(containerId);
};
//# sourceMappingURL=studio.js.map