export interface M4RuleVersion {
  id: string;
  semver: string;
  summary: string;
  effectiveFrom: string;
  deprecates?: string;
}

const KEY = "rules-registry";
let rules: M4RuleVersion[] = [];

export function loadRules() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) rules = JSON.parse(s);
  } catch (error) {
    // ignore corrupt storage and reset registry
    console.error("Failed to load rules registry", error);
    rules = [];
  }
  return rules;
}

export function getRules() {
  return rules;
}

export function scheduleRule(rv: M4RuleVersion) {
  rules.unshift(rv);
  localStorage.setItem(KEY, JSON.stringify(rules));
  return rv;
}
