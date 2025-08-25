let activeRuler = {
    id: "CPI",
    name: "Official CPI",
    method: "gov",
    lastUpdated: new Date().toISOString(),
    bpDrift: 0,
};
const rulers = [
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
export async function getRulers() {
    return rulers;
}
export async function setActiveRuler(id) {
    const r = rulers.find(x => x.id === id);
    if (r) {
        activeRuler = r;
        window.dispatchEvent(new CustomEvent("ruler:changed", { detail: r }));
    }
}
export function getActiveRuler() {
    return activeRuler;
}
//# sourceMappingURL=rulers.js.map