import { RuleId, Ruleset, MacroRefs, IndexClause, ContractTemplate, BracketResult, RailQuote, ButlerManifest } from './api-types.js';
export declare function getRulesets(): Promise<Ruleset[]>;
export declare function getRuleset(ruleId: RuleId): Promise<Ruleset>;
export declare function checkRuleCompliance(): Promise<{
    compliance: number;
    outdatedFlows: string[];
}>;
export declare function getMacroRefs(): Promise<MacroRefs>;
export declare function compareLTSToOfficial(ltsValue: number): Promise<{
    lts: number;
    official: number;
    deviation: number;
    explanation: string;
}>;
export declare function getContractTemplates(): Promise<ContractTemplate[]>;
export declare function createContract(templateId: string, params: Partial<IndexClause>): Promise<{
    contract: string;
    receipt: any;
}>;
export declare function simulateBrackets(income: number, cpi: number): Promise<BracketResult>;
export declare function quoteRails(amount: number, destination: string): Promise<RailQuote[]>;
export declare function executePayment(quote: RailQuote, amount: number, destination: string): Promise<{
    txId: string;
    status: 'pending' | 'completed' | 'failed';
    eta: string;
}>;
export declare function registerButler(id: string, manifest: ButlerManifest): Promise<void>;
export declare function getRegisteredButlers(): Promise<Array<{
    id: string;
} & ButlerManifest>>;
export declare function switchButler(butlerId: string): Promise<{
    switched: boolean;
    activationTime: number;
}>;
//# sourceMappingURL=friedman-apis.d.ts.map