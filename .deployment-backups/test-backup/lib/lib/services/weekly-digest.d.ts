export interface WeeklyDigest {
    period: string;
    highlights: string[];
    netChange: number;
    recommendations: string[];
}
export declare function generateWeeklyDigest(): Promise<WeeklyDigest>;
//# sourceMappingURL=weekly-digest.d.ts.map