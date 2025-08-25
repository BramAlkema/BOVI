export declare enum BoviMode {
    BALANCED = "B",
    OBLIGATED = "O",
    VALUE = "V",
    IMMEDIATE = "I"
}
export declare const BoviEvents: {
    readonly SYSTEM_INITIALIZED: "bovi.system.initialized";
    readonly SYSTEM_SHUTDOWN: "bovi.system.shutdown";
    readonly STORM_ACTIVATED: "bovi.stormActivated";
    readonly STORM_DEACTIVATED: "bovi.stormDeactivated";
    readonly RULER_CHANGED: "bovi.rulerChanged";
    readonly BUTLER_ACTIVATED: "bovi.butlerActivated";
    readonly INDEX_PROVIDER_CHANGED: "bovi.indexProviderChanged";
    readonly CLEARINGHOUSE_CHANGED: "bovi.clearinghouseChanged";
    readonly BASKET_CREATED: "bovi.basketCreated";
    readonly BASKET_UPDATED: "bovi.basketUpdated";
    readonly CONTRACT_CREATED: "bovi.createContract";
    readonly COHORT_JOINED: "bovi.joinCohort";
    readonly RECALCULATE_ALL: "bovi.recalculateAll";
    readonly SHOW_DIGEST: "bovi.showDigest";
    readonly KPI_UPDATED: "bovi.kpi.updated";
};
export declare const StorageKeys: {
    readonly ACTIVE_RULER: "bovi.activeRuler";
    readonly STORM_PROFILES: "bovi.stormProfiles";
    readonly STORM_MODE_ACTIVE: "bovi.stormMode.active";
    readonly STORM_MODE_PROFILE: "bovi.stormMode.activeProfile";
    readonly STORM_MODE_NOTIFICATIONS: "bovi.stormMode.notifications";
    readonly STORM_MODE_REVERT_TIME: "bovi.stormMode.revertTime";
    readonly PRE_STORM_STATE: "bovi.preStormState";
    readonly ACTIVE_STORM_PROFILE: "bovi.activeStormProfile";
    readonly HAMBURGER_BASKETS: "bovi.hamburgerBaskets";
    readonly SMART_CONTRACTS: "bovi.smartContracts";
    readonly COHORT_AUCTIONS: "bovi.cohortAuctions";
    readonly DEFAULT_INDEX_PROVIDER: "bovi.defaultIndexProvider";
    readonly INSTALLED_BUTLERS: "bovi.installedButlers";
    readonly ACTIVE_BUTLER: "bovi.activeButler";
    readonly APPEALS: "bovi.appeals";
    readonly CLEARINGHOUSES: "bovi.clearinghouses";
    readonly ACTIVE_CLEARINGHOUSE: "bovi.activeClearinghouse";
    readonly BASKETS: "bovi.baskets";
    readonly FLOWS: "bovi.flows";
    readonly CONTRACTS: "bovi.contracts";
    readonly AUDIT_LOG: "bovi.auditLog";
    readonly RECEIPTS: "bovi.receipts";
    readonly EPISODES_PLAYED: "bovi.episodes.played";
    readonly LAST_WEEKLY_DIGEST: "bovi.lastWeeklyDigest";
    readonly USER_INCOME: "bovi.userIncome";
    readonly USER_SAVINGS: "bovi.userSavings";
};
export declare const Defaults: {
    readonly RULER_ID: "bovi-local";
    readonly BUTLER_ID: "bovi-default";
    readonly USER_INCOME: "50000";
    readonly USER_SAVINGS: "10000";
    readonly SUPPORT_EMAIL: "support@bovi.money";
};
export type BoviEventName = typeof BoviEvents[keyof typeof BoviEvents];
export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
//# sourceMappingURL=constants.d.ts.map