import { StorageKeys, Defaults } from "./constants.js";
let activeRulerId = localStorage.getItem(StorageKeys.ACTIVE_RULER) || Defaults.RULER_ID;
export async function getRulers() {
    const baseline = 0.03;
    return [
        {
            id: "bovi-local",
            name: "BOVI Local LTS",
            method: "Personal basket tracking",
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((0.0347 - baseline) * 10000),
        },
        {
            id: "bovi-cohort",
            name: "BOVI Cohort LTS",
            method: "Community aggregated",
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((0.0332 - baseline) * 10000),
        },
        {
            id: "ons-cpi",
            name: "ONS Official CPI",
            method: "Government published",
            lastUpdated: "2024-01-15T09:30:00Z",
            bpDrift: Math.round((0.032 - baseline) * 10000),
        },
        {
            id: "truflation",
            name: "Truflation Real-time",
            method: "Blockchain oracle",
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((0.0285 - baseline) * 10000),
        },
    ];
}
export async function setActiveRuler(id) {
    const rulers = await getRulers();
    if (!rulers.find(r => r.id === id)) {
        throw new Error(`Ruler ${id} not found`);
    }
    activeRulerId = id;
    localStorage.setItem(StorageKeys.ACTIVE_RULER, id);
    window.dispatchEvent(new CustomEvent("ruler:changed", {
        detail: { rulerId: id },
    }));
}
export function getActiveRulerId() {
    return activeRulerId;
}
export async function getActiveRuler() {
    const rulers = await getRulers();
    return rulers.find(r => r.id === activeRulerId) || rulers[0];
}
//# sourceMappingURL=rulers.js.map