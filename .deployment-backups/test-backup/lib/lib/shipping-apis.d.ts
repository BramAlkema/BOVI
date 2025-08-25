export interface Ruler {
    id: string;
    name: string;
    method: string;
    lastUpdated: string;
    bpDrift: number;
}
export declare function getRulers(): Promise<Ruler[]>;
export declare function switchRuler(rulerId: string): Promise<void>;
export interface IndexCommonsEntry {
    id: string;
    timestamp: string;
    sources: string[];
    median: number;
    mad: number;
    quality: number;
    notes: string;
    basket?: any[];
}
declare class IndexCommonsStore {
    private dbName;
    private version;
    private db;
    init(): Promise<void>;
    store(entry: IndexCommonsEntry): Promise<void>;
    getAll(): Promise<IndexCommonsEntry[]>;
    exportJSON(): Promise<string>;
}
export declare const indexCommons: IndexCommonsStore;
export interface HamburgerBasket {
    id: string;
    name: string;
    items: Array<{
        name: string;
        brand: string;
        size: string;
        price: number;
        usual: number;
        location: string;
        date: string;
    }>;
    created: string;
    lastUpdated: string;
    public: boolean;
    shareUrl?: string;
}
export declare function createHamburgerBasket(name: string, items: HamburgerBasket['items']): Promise<HamburgerBasket>;
export declare function publishBasket(basketId: string): Promise<string>;
export declare function calculateHamburgerInflation(basketId: string): Promise<{
    current: number;
    previous: number;
    change: number;
    changePercent: number;
}>;
export interface MoneyVeilData {
    userId: string;
    inflationDrift: number;
    bracketCreep: number;
    realRate: number;
    netImpact: number;
    lastCalculated: string;
}
export declare function calculateMoneyVeil(income: number, savings: number, interestRate: number): Promise<MoneyVeilData>;
export declare function generateWeeklyDigest(): Promise<{
    period: string;
    highlights: string[];
    netChange: number;
    recommendations: string[];
}>;
export interface ContractClause {
    ltsIndex: string;
    capBp?: number;
    floorBp?: number;
    carry: boolean;
    undoWindowHours: number;
}
export interface SmartContract {
    id: string;
    templateId: string;
    parties: string[];
    clause: ContractClause;
    humanReadable: string;
    created: string;
    effectiveFrom: string;
    undoDeadline: string;
    signed: boolean;
}
export declare function createSmartContract(templateId: 'rent' | 'salary' | 'loan', parties: string[], clause: ContractClause): Promise<{
    contract: SmartContract;
    receipt: {
        pdf: Blob;
        json: string;
    };
}>;
export interface CohortAuction {
    id: string;
    category: string;
    participants: number;
    currentBest: number;
    improvement: number;
    noWorseOffCheck: boolean;
    joinDeadline: string;
    status: 'forming' | 'active' | 'completed';
}
export declare function createCohortAuction(category: string, targetSize?: number): Promise<CohortAuction>;
export declare function joinCohortAuction(auctionId: string): Promise<{
    joined: boolean;
    projectedSavings: number;
    guarantee: string;
}>;
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
            frequency: 'high' | 'medium' | 'low';
            channels: string[];
        };
    };
    triggers: string[];
}
export declare function createStormProfile(profile: Omit<StormProfile, 'id'>): Promise<StormProfile>;
export declare function activateStormMode(profileId: string): Promise<{
    activated: boolean;
    changes: string[];
    revertTime: string;
}>;
export {};
//# sourceMappingURL=shipping-apis.d.ts.map