/**
 * BOVI Framework Constants
 * Centralized constants for mode codes, event names, and storage keys
 */

// Fiske's relational models as mode codes
export enum BoviMode {
  BALANCED = "B",
  OBLIGATED = "O", 
  VALUE = "V",
  IMMEDIATE = "I"
}

// System event names
export const BoviEvents = {
  SYSTEM_INITIALIZED: "bovi.system.initialized",
  SYSTEM_SHUTDOWN: "bovi.system.shutdown",
  STORM_ACTIVATED: "bovi.stormActivated",
  STORM_DEACTIVATED: "bovi.stormDeactivated",
  RULER_CHANGED: "bovi.rulerChanged",
  BUTLER_ACTIVATED: "bovi.butlerActivated",
  INDEX_PROVIDER_CHANGED: "bovi.indexProviderChanged",
  CLEARINGHOUSE_CHANGED: "bovi.clearinghouseChanged",
  BASKET_CREATED: "bovi.basketCreated",
  BASKET_UPDATED: "bovi.basketUpdated",
  CONTRACT_CREATED: "bovi.createContract",
  COHORT_JOINED: "bovi.joinCohort",
  RECALCULATE_ALL: "bovi.recalculateAll",
  SHOW_DIGEST: "bovi.showDigest"
} as const;

// LocalStorage key prefixes
export const StorageKeys = {
  ACTIVE_RULER: "bovi.activeRuler",
  STORM_PROFILES: "bovi.stormProfiles",
  STORM_MODE_ACTIVE: "bovi.stormMode.active",
  STORM_MODE_PROFILE: "bovi.stormMode.activeProfile",
  STORM_MODE_NOTIFICATIONS: "bovi.stormMode.notifications",
  STORM_MODE_REVERT_TIME: "bovi.stormMode.revertTime",
  PRE_STORM_STATE: "bovi.preStormState",
  ACTIVE_STORM_PROFILE: "bovi.activeStormProfile",
  HAMBURGER_BASKETS: "bovi.hamburgerBaskets",
  SMART_CONTRACTS: "bovi.smartContracts",
  COHORT_AUCTIONS: "bovi.cohortAuctions",
  DEFAULT_INDEX_PROVIDER: "bovi.defaultIndexProvider",
  INSTALLED_BUTLERS: "bovi.installedButlers",
  ACTIVE_BUTLER: "bovi.activeButler",
  APPEALS: "bovi.appeals",
  CLEARINGHOUSES: "bovi.clearinghouses",
  ACTIVE_CLEARINGHOUSE: "bovi.activeClearinghouse",
  BASKETS: "bovi.baskets",
  FLOWS: "bovi.flows",
  CONTRACTS: "bovi.contracts",
  AUDIT_LOG: "bovi.auditLog",
  RECEIPTS: "bovi.receipts",
  EPISODES_PLAYED: "bovi.episodes.played",
  LAST_WEEKLY_DIGEST: "bovi.lastWeeklyDigest",
  USER_INCOME: "bovi.userIncome",
  USER_SAVINGS: "bovi.userSavings"
} as const;

// Default values
export const Defaults = {
  RULER_ID: "bovi-local",
  BUTLER_ID: "bovi-default",
  USER_INCOME: "50000",
  USER_SAVINGS: "10000",
  SUPPORT_EMAIL: "support@bovi.money"
} as const;

// Type helpers
export type BoviEventName = typeof BoviEvents[keyof typeof BoviEvents];
export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
