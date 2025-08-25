import { StorageKeys } from "../core/constants.js";
let activeStormProfile = null;
export async function createStormProfile(profile) {
    const stormProfile = {
        id: `storm_${Date.now()}`,
        ...profile,
    };
    const profiles = JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
    profiles.push(stormProfile);
    localStorage.setItem(StorageKeys.STORM_PROFILES, JSON.stringify(profiles));
    return stormProfile;
}
export async function activateStormMode(profileId) {
    const profiles = JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
        throw new Error(`Storm profile ${profileId} not found`);
    }
    const currentState = {
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem(StorageKeys.PRE_STORM_STATE, JSON.stringify(currentState));
    activeStormProfile = profileId;
    localStorage.setItem(StorageKeys.ACTIVE_STORM_PROFILE, profileId);
    const changes = [
        `Budget adjustments: ${Object.keys(profile.changes.pots).length} pots modified`,
        `Contracts: ${profile.changes.contracts.length} affected`,
        `Payment rails: ${profile.changes.rails.length} prioritized`,
        `Notifications: ${profile.changes.notifications.frequency} frequency`,
    ];
    return {
        activated: true,
        changes,
        revertTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
}
export async function deactivateStormMode() {
    if (!activeStormProfile) {
        throw new Error("No active storm profile to deactivate");
    }
    const preStormState = localStorage.getItem(StorageKeys.PRE_STORM_STATE);
    if (preStormState) {
        localStorage.removeItem(StorageKeys.PRE_STORM_STATE);
    }
    activeStormProfile = null;
    localStorage.removeItem(StorageKeys.ACTIVE_STORM_PROFILE);
}
export function getActiveStormProfile() {
    return activeStormProfile || localStorage.getItem(StorageKeys.ACTIVE_STORM_PROFILE);
}
export function getStormProfiles() {
    return JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
}
//# sourceMappingURL=storm-mode.js.map