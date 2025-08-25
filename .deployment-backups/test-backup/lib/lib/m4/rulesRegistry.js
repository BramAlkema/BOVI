const KEY = "rules-registry";
let rules = [];
export function loadRules() {
    try {
        const s = localStorage.getItem(KEY);
        if (s)
            rules = JSON.parse(s);
    }
    catch (error) {
        console.error("Failed to load rules registry", error);
        rules = [];
    }
    return rules;
}
export function getRules() {
    return rules;
}
export function scheduleRule(rv) {
    rules.unshift(rv);
    localStorage.setItem(KEY, JSON.stringify(rules));
    return rv;
}
//# sourceMappingURL=rulesRegistry.js.map