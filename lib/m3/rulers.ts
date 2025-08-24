// Full switcher UI helpers (build on core)
export interface Ruler {
  id: string;
  name: string;
  method: string;
  lastUpdated: string;
  bpDrift: number;
}

let activeRuler: Ruler = {
  id: "CPI",
  name: "Official CPI",
  method: "gov",
  lastUpdated: new Date().toISOString(),
  bpDrift: 0,
};

const rulers: Ruler[] = [
  activeRuler,
  {
    id: "LTS",
    name: "Your €LTS",
    method: "personal-basket",
    lastUpdated: new Date().toISOString(),
    bpDrift: 120,
  },
  {
    id: "COHORT",
    name: "Cohort LTS",
    method: "cohort-basket",
    lastUpdated: new Date().toISOString(),
    bpDrift: 80,
  },
];

export async function getRulers(): Promise<Ruler[]> {
  return rulers;
}

export async function setActiveRuler(id: string) {
  const r = rulers.find(x => x.id === id);
  if (r) {
    activeRuler = r;
    window.dispatchEvent(new CustomEvent("ruler:changed", { detail: r }));
  }
}

export function getActiveRuler() {
  return activeRuler;
}
