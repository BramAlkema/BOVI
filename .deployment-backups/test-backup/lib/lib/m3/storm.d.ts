export interface StormPreset {
    potsBoostPct: number;
    capTightenBp: number;
    fixRateHint: boolean;
    pinRail?: string;
}
export declare function applyStorm(p: StormPreset): void;
export declare function clearStorm(): void;
export declare function getStorm(): StormPreset | null;
//# sourceMappingURL=storm.d.ts.map