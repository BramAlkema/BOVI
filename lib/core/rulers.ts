// M0: Rulers Core (data model only)

import { StorageKeys, Defaults } from "./constants.js";

export interface Ruler {
  id: string;
  name: string;
  method: string;
  lastUpdated: string;
  bpDrift: number;
}

let activeRulerId: string = localStorage.getItem(StorageKeys.ACTIVE_RULER) || Defaults.RULER_ID;

export async function getRulers(): Promise<Ruler[]> {
  // Seed rulers - replace with real data source later
  const baseline = 0.03; // 3% baseline inflation

  return [
    {
      id: "bovi-local",
      name: "BOVI Local LTS",
      method: "Personal basket tracking",
      lastUpdated: new Date().toISOString(),
      bpDrift: Math.round((0.0347 - baseline) * 10000), // +47bp
    },
    {
      id: "bovi-cohort",
      name: "BOVI Cohort LTS",
      method: "Community aggregated",
      lastUpdated: new Date().toISOString(),
      bpDrift: Math.round((0.0332 - baseline) * 10000), // +32bp
    },
    {
      id: "ons-cpi",
      name: "ONS Official CPI",
      method: "Government published",
      lastUpdated: "2024-01-15T09:30:00Z",
      bpDrift: Math.round((0.032 - baseline) * 10000), // +20bp
    },
    {
      id: "truflation",
      name: "Truflation Real-time",
      method: "Blockchain oracle",
      lastUpdated: new Date().toISOString(),
      bpDrift: Math.round((0.0285 - baseline) * 10000), // -15bp
    },
  ];
}

export async function setActiveRuler(id: string): Promise<void> {
  const rulers = await getRulers();
  if (!rulers.find(r => r.id === id)) {
    throw new Error(`Ruler ${id} not found`);
  }

  activeRulerId = id;
  localStorage.setItem(StorageKeys.ACTIVE_RULER, id);

  // Emit event for UI updates
  window.dispatchEvent(
    new CustomEvent("ruler:changed", {
      detail: { rulerId: id },
    })
  );
}

export function getActiveRulerId(): string {
  return activeRulerId;
}

export async function getActiveRuler(): Promise<Ruler> {
  const rulers = await getRulers();
  return rulers.find(r => r.id === activeRulerId) || rulers[0];
}
