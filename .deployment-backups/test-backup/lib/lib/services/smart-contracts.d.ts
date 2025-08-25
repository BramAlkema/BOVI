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
export declare function createSmartContract(templateId: "rent" | "salary" | "loan", parties: string[], clause: ContractClause): Promise<{
    contract: SmartContract;
    receipt: {
        pdf: Blob;
        json: string;
    };
}>;
//# sourceMappingURL=smart-contracts.d.ts.map