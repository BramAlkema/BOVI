const REG = new Map();
let activeId = null;
export function registerUIPlugin(p) {
    REG.set(p.manifest.id, p);
}
export function listUIPlugins() {
    return [...REG.values()].map(p => p.manifest);
}
export function getUIPlugin(id) {
    return REG.get(id) || null;
}
export function getActiveUIPluginId() {
    return activeId || localStorage.getItem("ui:active") || null;
}
export function setActiveUIPluginId(id) {
    activeId = id;
    localStorage.setItem("ui:active", id);
}
//# sourceMappingURL=registry.js.map