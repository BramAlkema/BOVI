export interface Episode {
    id: string;
    title: string;
    mode: "B" | "O" | "V" | "I";
    lengthMin: number;
    played: boolean;
}
export declare function nextEpisodes(limit?: number): Promise<Episode[]>;
export declare function markPlayed(id: string): Promise<void>;
export declare function getAllEpisodes(): Promise<Episode[]>;
export declare function getEpisode(id: string): Promise<Episode | undefined>;
//# sourceMappingURL=episodes.d.ts.map