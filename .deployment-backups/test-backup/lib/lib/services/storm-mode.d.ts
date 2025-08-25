export interface StormProfile {
    id: string;
    name: string;
    description: string;
    changes: {
        pots: {
            [key: string]: number;
        };
        contracts: string[];
        rails: string[];
        notifications: {
            frequency: "high" | "medium" | "low";
            channels: string[];
        };
    };
    triggers: string[];
}
export declare function createStormProfile(profile: Omit<StormProfile, "id">): Promise<StormProfile>;
export declare function activateStormMode(profileId: string): Promise<{
    activated: boolean;
    changes: string[];
    revertTime: string;
}>;
export declare function deactivateStormMode(): Promise<void>;
export declare function getActiveStormProfile(): string | null;
export declare function getStormProfiles(): StormProfile[];
//# sourceMappingURL=storm-mode.d.ts.map