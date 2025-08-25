import * as FriedmanAPI from "../friedman-apis.js";
import * as HayekAPI from "../hayek-apis.js";
import { BoviAPIError } from "../api-types.js";
export class BoviAPI {
    constructor() {
        this.rules = FriedmanAPI;
        this.macro = {
            getRefs: FriedmanAPI.getMacroRefs,
            compareToOfficial: FriedmanAPI.compareLTSToOfficial,
        };
        this.contracts = {
            getTemplates: FriedmanAPI.getContractTemplates,
            create: FriedmanAPI.createContract,
        };
        this.brackets = {
            simulate: FriedmanAPI.simulateBrackets,
        };
        this.rails = {
            quote: FriedmanAPI.quoteRails,
            execute: FriedmanAPI.executePayment,
        };
        this.butlers = {
            register: FriedmanAPI.registerButler,
            list: FriedmanAPI.getRegisteredButlers,
            switch: FriedmanAPI.switchButler,
        };
        this.indices = {
            list: HayekAPI.listIndexProviders,
            setDefault: HayekAPI.setDefaultIndex,
            getCurrent: HayekAPI.getCurrentIndexProvider,
            calculate: HayekAPI.calculateWithProvider,
        };
        this.butlerHub = {
            install: HayekAPI.installButler,
            activate: HayekAPI.activateButler,
            getInstalled: HayekAPI.getInstalledButlers,
            uninstall: HayekAPI.uninstallButler,
        };
        this.fairness = {
            audit: HayekAPI.auditRailSelection,
            report: HayekAPI.generateFairnessReport,
        };
        this.local = {
            compute: HayekAPI.computeLocalIndex,
            share: HayekAPI.shareWithCohort,
        };
        this.appeals = {
            file: HayekAPI.fileAppeal,
            status: HayekAPI.getAppealStatus,
            list: HayekAPI.getUserAppeals,
        };
        this.cohorts = {
            register: HayekAPI.registerClearinghouse,
            choose: HayekAPI.chooseClearinghouse,
            list: HayekAPI.getClearinghouses,
        };
        this.portability = {
            export: HayekAPI.exportAll,
            import: HayekAPI.importBundle,
        };
    }
    async initialize() {
        try {
            await this.ensureDefaults();
            console.log("🚀 BOVI API façade initialized successfully");
        }
        catch (error) {
            console.error("❌ Failed to initialize BOVI API façade:", error);
            throw error;
        }
    }
    async ensureDefaults() {
        try {
            await this.indices.getCurrent();
        }
        catch {
            await this.indices.setDefault("bovi-local");
        }
        const clearinghouses = await this.cohorts.list();
        if (clearinghouses.length === 0) {
            await this.cohorts.register({
                id: "bovi-main",
                name: "BOVI Main Clearinghouse",
                jurisdiction: "UK",
                rulesUrl: "/rules/main.json",
                contact: "support@bovi.money",
            });
        }
    }
    async getSystemStats() {
        try {
            const [compliance, appeals, clearinghouses, railReport] = await Promise.all([
                this.rules.checkRuleCompliance(),
                this.appeals.list(),
                this.cohorts.list(),
                this.fairness.report(),
            ]);
            return {
                ruleCompliance: compliance.compliance,
                activeFlows: compliance.outdatedFlows.length,
                railFairness: railReport.averageFairness,
                appealsPending: appeals.filter(a => a.status === "open").length,
                clearinghousesActive: clearinghouses.length,
            };
        }
        catch (error) {
            throw new BoviAPIError("STATS_FETCH_FAILED", "Failed to fetch system statistics", error);
        }
    }
    async emergencyReset() {
        if (!confirm("This will clear ALL local BOVI data. Are you sure?")) {
            return;
        }
        const keys = Object.keys(localStorage).filter(key => key.startsWith("bovi."));
        keys.forEach(key => localStorage.removeItem(key));
        await this.initialize();
        console.log("🔄 Emergency reset completed");
    }
}
export async function systemHealthCheck() {
    const { dashboard } = await import("../monitoring/kpi-dashboard.js");
    const summary = dashboard.getHealthSummary();
    return {
        status: summary.status,
        score: summary.score,
        issues: summary.issues,
    };
}
export const api = new BoviAPI();
//# sourceMappingURL=facade.js.map