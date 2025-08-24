// Registry + Host
import type { UIPlugin } from "./types.js";

const REG = new Map<string, UIPlugin>();
let activeId: string | null = null;

export function registerUIPlugin(p: UIPlugin) { 
  REG.set(p.manifest.id, p); 
}

export function listUIPlugins() { 
  return [...REG.values()].map(p => p.manifest); 
}

export function getUIPlugin(id: string) { 
  return REG.get(id) || null; 
}

export function getActiveUIPluginId() { 
  return activeId || localStorage.getItem("ui:active") || null; 
}

export function setActiveUIPluginId(id: string) { 
  activeId = id; 
  localStorage.setItem("ui:active", id); 
}