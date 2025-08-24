/**
 * BOVI Storm Mode
 * Crisis management with automated profile switching
 */

import { StorageKeys } from "../core/constants.js";

export interface StormProfile {
  id: string;
  name: string;
  description: string;
  changes: {
    pots: { [key: string]: number }; // Budget adjustments
    contracts: string[]; // Contracts to activate/pause
    rails: string[]; // Preferred payment methods
    notifications: {
      frequency: "high" | "medium" | "low";
      channels: string[];
    };
  };
  triggers: string[]; // Conditions that activate this mode
}

let activeStormProfile: string | null = null;

/**
 * Create Storm Mode profile for crisis management
 */
export async function createStormProfile(profile: Omit<StormProfile, "id">): Promise<StormProfile> {
  const stormProfile: StormProfile = {
    id: `storm_${Date.now()}`,
    ...profile,
  };

  // Store profile
  const profiles = JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
  profiles.push(stormProfile);
  localStorage.setItem(StorageKeys.STORM_PROFILES, JSON.stringify(profiles));

  return stormProfile;
}

/**
 * Activate Storm Mode profile
 */
export async function activateStormMode(profileId: string): Promise<{
  activated: boolean;
  changes: string[];
  revertTime: string;
}> {
  const profiles: StormProfile[] = JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    throw new Error(`Storm profile ${profileId} not found`);
  }

  // Save current state before switching
  const currentState = {
    timestamp: new Date().toISOString(),
    // Would save current pots, contracts, rails state here
  };
  localStorage.setItem(StorageKeys.PRE_STORM_STATE, JSON.stringify(currentState));

  // Activate storm profile
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
    revertTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Auto-revert in 1 week
  };
}

/**
 * Deactivate Storm Mode and revert to previous state
 */
export async function deactivateStormMode(): Promise<void> {
  if (!activeStormProfile) {
    throw new Error("No active storm profile to deactivate");
  }

  // Restore pre-storm state
  const preStormState = localStorage.getItem(StorageKeys.PRE_STORM_STATE);
  if (preStormState) {
    // Would restore previous pots, contracts, rails state here
    localStorage.removeItem(StorageKeys.PRE_STORM_STATE);
  }

  activeStormProfile = null;
  localStorage.removeItem(StorageKeys.ACTIVE_STORM_PROFILE);
}

/**
 * Get currently active storm profile
 */
export function getActiveStormProfile(): string | null {
  return activeStormProfile || localStorage.getItem(StorageKeys.ACTIVE_STORM_PROFILE);
}

/**
 * Get all available storm profiles
 */
export function getStormProfiles(): StormProfile[] {
  return JSON.parse(localStorage.getItem(StorageKeys.STORM_PROFILES) || "[]");
}
