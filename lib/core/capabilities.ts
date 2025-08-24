// M0: Capability profiles & gating

export type ProfileId = "L0" | "L1" | "L2" | "L3R" | "L5";
export type Capability =
  | "SAFE_CTA" | "TILES" | "EPISODES"
  | "MONEY_VEIL" | "PDA" | "POTS" | "RENT_COUNTER" | "COHORT"
  | "STUDIO" | "INDEX_LAB" | "CONTRACTS" | "RAILS" | "RULERS" | "STORM"
  | "RULES" | "PROVIDERS" | "BUTLER_HUB" | "TRIALS" | "DISTRIBUTION" | "EXPORT";

export const PROFILES: Record<ProfileId, Capability[]> = {
  L0: ["SAFE_CTA", "TILES", "EPISODES"],
  L1: ["SAFE_CTA", "TILES", "EPISODES"],
  L2: ["SAFE_CTA", "TILES", "EPISODES", "MONEY_VEIL", "PDA", "POTS", "RENT_COUNTER", "COHORT"],
  L3R: ["STUDIO", "INDEX_LAB", "CONTRACTS", "RAILS", "RULERS", "STORM"],
  L5: ["RULES", "PROVIDERS", "BUTLER_HUB", "TRIALS", "DISTRIBUTION", "EXPORT", "RULERS"]
};

let currentProfile: ProfileId = (localStorage.getItem("profile") as ProfileId) || "L1";

export function getProfile(): ProfileId {
  return currentProfile;
}

export function setProfile(p: ProfileId) {
  currentProfile = p;
  localStorage.setItem("profile", p);
  window.dispatchEvent(new CustomEvent("profile:changed", { detail: p }));
}

/** Feature gating helper */
export function can(cap: Capability, profile: ProfileId = currentProfile): boolean {
  // L3R inherits L2 for convenience (optional – remove if you want strict caps)
  const inheritsL2 = profile === "L3R" && PROFILES["L2"].includes(cap);
  return PROFILES[profile].includes(cap) || inheritsL2;
}