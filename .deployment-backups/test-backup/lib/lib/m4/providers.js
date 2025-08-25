const PROVIDERS = [
    { id: "CPI", name: "Official CPI", method: "gov" },
    { id: "LTS", name: "Your €LTS", method: "personal-basket" },
    { id: "COHORT", name: "Cohort LTS", method: "cohort-basket" },
];
let chosen = "CPI";
export async function listIndexProviders() {
    return PROVIDERS;
}
export async function chooseProvider(id) {
    chosen = id;
    localStorage.setItem("idx-provider", id);
}
export function getChosenProvider() {
    return chosen || localStorage.getItem("idx-provider") || "CPI";
}
//# sourceMappingURL=providers.js.map