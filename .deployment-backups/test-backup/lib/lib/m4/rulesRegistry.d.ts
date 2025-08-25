export interface M4RuleVersion {
    id: string;
    semver: string;
    summary: string;
    effectiveFrom: string;
    deprecates?: string;
}
export declare function loadRules(): M4RuleVersion[];
export declare function getRules(): M4RuleVersion[];
export declare function scheduleRule(rv: M4RuleVersion): M4RuleVersion;
//# sourceMappingURL=rulesRegistry.d.ts.map