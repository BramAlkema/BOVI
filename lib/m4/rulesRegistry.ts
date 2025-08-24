export interface RuleVersion { 
  id: string; 
  semver: string; 
  summary: string; 
  effectiveFrom: string; 
  deprecates?: string;
}

const KEY = "rules-registry";
let rules: RuleVersion[] = [];

export function loadRules() { 
  try { 
    const s = localStorage.getItem(KEY); 
    if(s) rules = JSON.parse(s);
  } catch {} 
  return rules; 
}

export function getRules() { 
  return rules; 
}

export function scheduleRule(rv: RuleVersion) { 
  rules.unshift(rv); 
  localStorage.setItem(KEY, JSON.stringify(rules)); 
  return rv; 
}