/**
 * BOVI Rulers Service
 * Manages inflation measurement rulers with drift calculations
 */

import { StorageKeys, Defaults } from "../core/constants.js";

export interface Ruler {
  id: string;
  name: string;
  method: string;
  lastUpdated: string;
  bpDrift: number; // Basis points of drift from baseline
}

let activeRulerId = localStorage.getItem(StorageKeys.ACTIVE_RULER) || Defaults.RULER_ID;

/**
 * Get all available rulers with drift metrics
 */
export async function getRulers(): Promise<Ruler[]> {
  const baseline = 0.03; // 3% baseline inflation

  return [
    {
      id: "bovi-local",
      name: "BOVI Local LTS",
      method: "Personal basket tracking",
      lastUpdated: new Date().toISOString(),
      bpDrift: Math.round(((await calculateLocalLTS()) - baseline) * 10000),
    },
    {
      id: "bovi-cohort",
      name: "BOVI Cohort LTS",
      method: "Community aggregated",
      lastUpdated: new Date().toISOString(),
      bpDrift: Math.round(((await calculateCohortLTS()) - baseline) * 10000),
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

/**
 * Switch to a different ruler
 */
export async function switchRuler(rulerId: string): Promise<void> {
  const rulers = await getRulers();
  const ruler = rulers.find(r => r.id === rulerId);

  if (!ruler) {
    throw new Error(`Unknown ruler: ${rulerId}`);
  }

  activeRulerId = rulerId;
  localStorage.setItem(StorageKeys.ACTIVE_RULER, rulerId);

  // Emit event for UI updates
  window.dispatchEvent(
    new CustomEvent("ruler:changed", {
      detail: { rulerId, ruler },
    })
  );
}

/**
 * Get the currently active ruler
 */
export async function getActiveRuler(): Promise<Ruler> {
  const rulers = await getRulers();
  return rulers.find(r => r.id === activeRulerId) || rulers[0];
}

/**
 * Get active ruler ID
 */
export function getActiveRulerId(): string {
  return activeRulerId;
}

// Private calculation functions
async function calculateLocalLTS(): Promise<number> {
  // Mock calculation - replace with real basket tracking
  return 0.0347; // 3.47% inflation
}

async function calculateCohortLTS(): Promise<number> {
  // Mock calculation - replace with cohort data
  return 0.0332; // 3.32% inflation
}
