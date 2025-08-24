// Rival butlers (manifests only; you wire execution)
export interface M4ButlerManifest { 
  id: string; 
  name: string; 
  version: string; 
  caps: string[];
}

const BUTLERS: M4ButlerManifest[] = [
  { 
    id: "core", 
    name: "Core Butler", 
    version: "1.0.0", 
    caps: ["defaults","pda","pots"] 
  }
];

let active = "core";

export async function installButler(_pkgUrl: string) { 
  /* stub: add new manifest */ 
}

export async function listButlers() { 
  return BUTLERS; 
}

export async function activateButler(id: string) { 
  active = id; 
  localStorage.setItem("butler", id); 
}

export function getActiveButler() { 
  return active || localStorage.getItem("butler") || "core"; 
}