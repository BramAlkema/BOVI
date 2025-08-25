import * as FriedmanAPI from "../friedman-apis.js";
import * as HayekAPI from "../hayek-apis.js";
export declare class BoviAPI {
    readonly rules: typeof FriedmanAPI;
    readonly macro: {
        getRefs: typeof FriedmanAPI.getMacroRefs;
        compareToOfficial: typeof FriedmanAPI.compareLTSToOfficial;
    };
    readonly contracts: {
        getTemplates: typeof FriedmanAPI.getContractTemplates;
        create: typeof FriedmanAPI.createContract;
    };
    readonly brackets: {
        simulate: typeof FriedmanAPI.simulateBrackets;
    };
    readonly rails: {
        quote: typeof FriedmanAPI.quoteRails;
        execute: typeof FriedmanAPI.executePayment;
    };
    readonly butlers: {
        register: typeof FriedmanAPI.registerButler;
        list: typeof FriedmanAPI.getRegisteredButlers;
        switch: typeof FriedmanAPI.switchButler;
    };
    readonly indices: {
        list: typeof HayekAPI.listIndexProviders;
        setDefault: typeof HayekAPI.setDefaultIndex;
        getCurrent: typeof HayekAPI.getCurrentIndexProvider;
        calculate: typeof HayekAPI.calculateWithProvider;
    };
    readonly butlerHub: {
        install: typeof HayekAPI.installButler;
        activate: typeof HayekAPI.activateButler;
        getInstalled: typeof HayekAPI.getInstalledButlers;
        uninstall: typeof HayekAPI.uninstallButler;
    };
    readonly fairness: {
        audit: typeof HayekAPI.auditRailSelection;
        report: typeof HayekAPI.generateFairnessReport;
    };
    readonly local: {
        compute: typeof HayekAPI.computeLocalIndex;
        share: typeof HayekAPI.shareWithCohort;
    };
    readonly appeals: {
        file: typeof HayekAPI.fileAppeal;
        status: typeof HayekAPI.getAppealStatus;
        list: typeof HayekAPI.getUserAppeals;
    };
    readonly cohorts: {
        register: typeof HayekAPI.registerClearinghouse;
        choose: typeof HayekAPI.chooseClearinghouse;
        list: typeof HayekAPI.getClearinghouses;
    };
    readonly portability: {
        export: typeof HayekAPI.exportAll;
        import: typeof HayekAPI.importBundle;
    };
    initialize(): Promise<void>;
    private ensureDefaults;
    getSystemStats(): Promise<{
        ruleCompliance: number;
        activeFlows: number;
        railFairness: number;
        appealsPending: number;
        clearinghousesActive: number;
    }>;
    emergencyReset(): Promise<void>;
}
export declare function systemHealthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    score: number;
    issues: string[];
}>;
export declare const api: BoviAPI;
//# sourceMappingURL=facade.d.ts.map