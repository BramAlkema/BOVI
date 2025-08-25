export type ProfileId = "L0" | "L1" | "L2" | "L3R" | "L5";
export type Capability = "SAFE_CTA" | "TILES" | "EPISODES" | "MONEY_VEIL" | "PDA" | "POTS" | "RENT_COUNTER" | "COHORT" | "STUDIO" | "INDEX_LAB" | "CONTRACTS" | "RAILS" | "RULERS" | "STORM" | "RULES" | "PROVIDERS" | "BUTLER_HUB" | "TRIALS" | "DISTRIBUTION" | "EXPORT";
export declare const PROFILES: Record<ProfileId, Capability[]>;
export declare function getProfile(): ProfileId;
export declare function setProfile(p: ProfileId): void;
export declare function can(cap: Capability, profile?: ProfileId): boolean;
//# sourceMappingURL=capabilities.d.ts.map