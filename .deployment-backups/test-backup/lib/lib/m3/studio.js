export function renderStudio(flow, mount) {
    mount.innerHTML = "";
    const layers = toposort(flow);
    const xGap = 220, yGap = 96, w = 180, h = 64, pad = 20;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    const width = layers.length * xGap + pad * 2, height = Math.max(...layers.map(col => col.length)) * yGap + pad * 2;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    const pos = new Map();
    layers.forEach((col, i) => col.forEach((n, j) => pos.set(n.id, { x: pad + i * xGap, y: pad + j * yGap })));
    for (const e of flow.edges) {
        const a = pos.get(e.from), b = pos.get(e.to);
        if (!a || !b)
            continue;
        const p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", `M${a.x + w} ${a.y + h / 2} L${b.x} ${b.y + h / 2}`);
        p.setAttribute("stroke", "rgba(255,255,255,0.25)");
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-width", "1.5");
        svg.appendChild(p);
    }
    for (const n of flow.nodes) {
        const p = pos.get(n.id);
        const g = document.createElementNS(svgNS, "g");
        g.setAttribute("transform", `translate(${p.x},${p.y})`);
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("width", String(w));
        rect.setAttribute("height", String(h));
        rect.setAttribute("rx", "12");
        rect.setAttribute("fill", "rgba(255,255,255,0.06)");
        rect.setAttribute("stroke", "rgba(255,255,255,0.18)");
        g.appendChild(rect);
        const stripe = document.createElementNS(svgNS, "rect");
        stripe.setAttribute("width", "6");
        stripe.setAttribute("height", String(h));
        stripe.setAttribute("rx", "12");
        stripe.setAttribute("fill", modeColour(n.type.split(".")[0]));
        g.appendChild(stripe);
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", "12");
        text.setAttribute("y", "36");
        text.setAttribute("fill", "#E7EEF9");
        text.setAttribute("font-size", "12");
        text.textContent = n.label;
        g.appendChild(text);
        svg.appendChild(g);
    }
    mount.appendChild(svg);
}
function toposort(flow) {
    const indeg = new Map(flow.nodes.map(n => [n.id, 0]));
    for (const e of flow.edges)
        indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    const S = flow.nodes.filter(n => (indeg.get(n.id) ?? 0) === 0);
    const layers = [];
    let layer = S;
    const outs = new Map(flow.nodes.map(n => [n.id, []]));
    for (const e of flow.edges)
        outs.get(e.from).push(e.to);
    const seen = new Set();
    while (layer.length) {
        layers.push(layer);
        const next = [];
        for (const n of layer) {
            seen.add(n.id);
            for (const m of outs.get(n.id)) {
                indeg.set(m, (indeg.get(m) ?? 0) - 1);
                if ((indeg.get(m) ?? 0) === 0)
                    next.push(flow.nodes.find(x => x.id === m));
            }
        }
        layer = next;
    }
    const orphans = flow.nodes.filter(n => !seen.has(n.id));
    if (orphans.length)
        layers.push(orphans);
    return layers;
}
function modeColour(m) {
    return m === "B" ? "#a1ffb5" : m === "O" ? "#ffd166" : m === "V" ? "#4cc9f0" : "#e7eef9";
}
//# sourceMappingURL=studio.js.map