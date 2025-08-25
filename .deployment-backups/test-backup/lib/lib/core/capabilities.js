export const PROFILES = {
    L0: ["SAFE_CTA", "TILES", "EPISODES"],
    L1: ["SAFE_CTA", "TILES", "EPISODES"],
    L2: ["SAFE_CTA", "TILES", "EPISODES", "MONEY_VEIL", "PDA", "POTS", "RENT_COUNTER", "COHORT"],
    L3R: ["STUDIO", "INDEX_LAB", "CONTRACTS", "RAILS", "RULERS", "STORM"],
    L5: ["RULES", "PROVIDERS", "BUTLER_HUB", "TRIALS", "DISTRIBUTION", "EXPORT", "RULERS"],
};
let currentProfile = localStorage.getItem("profile") || "L1";
export function getProfile() {
    return currentProfile;
}
export function setProfile(p) {
    currentProfile = p;
    localStorage.setItem("profile", p);
    window.dispatchEvent(new CustomEvent("profile:changed", { detail: p }));
}
export function can(cap, profile = currentProfile) {
    const inheritsL2 = profile === "L3R" && PROFILES["L2"].includes(cap);
    return PROFILES[profile].includes(cap) || inheritsL2;
}
//# sourceMappingURL=capabilities.js.map