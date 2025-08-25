import { BoviAPIError } from './api-types.js';
export async function getRulesets() {
    try {
        return [
            {
                id: 'lts-calculation',
                current: {
                    id: 'lts-calculation',
                    semver: '2.1.0',
                    summary: 'Updated shrinkflation detection thresholds',
                    effectiveFrom: '2024-01-01T00:00:00Z',
                    deprecates: '2.0.0'
                },
                history: [
                    {
                        id: 'lts-calculation',
                        semver: '2.0.0',
                        summary: 'Added median absolute deviation',
                        effectiveFrom: '2023-10-01T00:00:00Z'
                    }
                ]
            },
            {
                id: 'contract-indexation',
                current: {
                    id: 'contract-indexation',
                    semver: '1.3.0',
                    summary: 'Added carryover logic for cap/floor breaches',
                    effectiveFrom: '2024-02-01T00:00:00Z'
                },
                history: []
            }
        ];
    }
    catch (error) {
        throw new BoviAPIError('RULES_FETCH_FAILED', 'Failed to fetch rulesets', error);
    }
}
export async function getRuleset(ruleId) {
    const rulesets = await getRulesets();
    const ruleset = rulesets.find(r => r.id === ruleId);
    if (!ruleset) {
        throw new BoviAPIError('RULE_NOT_FOUND', `Ruleset ${ruleId} not found`);
    }
    return ruleset;
}
export async function checkRuleCompliance() {
    return {
        compliance: 0.85,
        outdatedFlows: ['groceries-v1', 'rent-legacy']
    };
}
export async function getMacroRefs() {
    try {
        return {
            cpiYoY: 0.032,
            wageYoY: 0.045,
            policyRate: 0.0425,
            updated: new Date().toISOString()
        };
    }
    catch (error) {
        throw new BoviAPIError('MACRO_FETCH_FAILED', 'Failed to fetch macro references', error);
    }
}
export async function compareLTSToOfficial(ltsValue) {
    const macro = await getMacroRefs();
    const deviation = ltsValue - macro.cpiYoY;
    let explanation = '';
    if (Math.abs(deviation) < 0.005) {
        explanation = 'LTS closely matches official CPI';
    }
    else if (deviation > 0) {
        explanation = 'LTS shows higher inflation, likely due to local price pressures';
    }
    else {
        explanation = 'LTS shows lower inflation, possibly from better substitution patterns';
    }
    return {
        lts: ltsValue,
        official: macro.cpiYoY,
        deviation,
        explanation
    };
}
export async function getContractTemplates() {
    return [
        {
            id: 'rent-standard',
            text: 'Rent shall be adjusted annually by {{ruler}} inflation, capped at {{capBp/100}}% increase, with floor of {{floorBp/100}}% decrease.',
            index: {
                ruler: 'LTS',
                capBp: 500,
                floorBp: -200,
                carryOver: true
            },
            undoWindowSec: 86400 * 7
        },
        {
            id: 'salary-executive',
            text: 'Annual salary adjustment based on {{ruler}} with {{capBp/100}}% maximum increase.',
            index: {
                ruler: 'WAGE',
                capBp: 300,
                carryOver: false
            },
            undoWindowSec: 86400 * 30
        }
    ];
}
export async function createContract(templateId, params) {
    const templates = await getContractTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) {
        throw new BoviAPIError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }
    const finalIndex = { ...template.index, ...params };
    let contract = template.text
        .replace('{{ruler}}', finalIndex.ruler)
        .replace('{{capBp/100}}', ((finalIndex.capBp || 0) / 100).toString())
        .replace('{{floorBp/100}}', ((finalIndex.floorBp || 0) / 100).toString());
    const receipt = {
        templateId,
        index: finalIndex,
        created: new Date().toISOString(),
        undoDeadline: new Date(Date.now() + template.undoWindowSec * 1000).toISOString()
    };
    return { contract, receipt };
}
export async function simulateBrackets(income, cpi) {
    const brackets = [
        { threshold: 0, rate: 0 },
        { threshold: 12570, rate: 0.20 },
        { threshold: 50270, rate: 0.40 },
        { threshold: 125140, rate: 0.45 }
    ];
    let taxNow = 0;
    for (let i = brackets.length - 1; i >= 0; i--) {
        if (income > brackets[i].threshold) {
            const taxableAtThisRate = income - brackets[i].threshold;
            const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold - brackets[i].threshold : taxableAtThisRate;
            taxNow += Math.min(taxableAtThisRate, nextThreshold) * brackets[i].rate;
        }
    }
    const indexedBrackets = brackets.map(b => ({
        ...b,
        threshold: b.threshold * (1 + cpi)
    }));
    let taxIndexed = 0;
    for (let i = indexedBrackets.length - 1; i >= 0; i--) {
        if (income > indexedBrackets[i].threshold) {
            const taxableAtThisRate = income - indexedBrackets[i].threshold;
            const nextThreshold = i < indexedBrackets.length - 1 ?
                indexedBrackets[i + 1].threshold - indexedBrackets[i].threshold : taxableAtThisRate;
            taxIndexed += Math.min(taxableAtThisRate, nextThreshold) * indexedBrackets[i].rate;
        }
    }
    const creep = taxNow - taxIndexed;
    return { taxNow, taxIndexed, creep };
}
export async function quoteRails(amount, destination) {
    const quotes = [
        {
            rail: "SEPA",
            fee: Math.max(0.35, amount * 0.002),
            etaSec: 3600,
            successP90: 0.998
        },
        {
            rail: "FPS",
            fee: 0.50,
            etaSec: 10,
            successP90: 0.995
        },
        {
            rail: "Card",
            fee: amount * 0.029 + 0.25,
            etaSec: 5,
            successP90: 0.992
        }
    ];
    if (amount > 1000) {
        quotes.push({
            rail: "StableL2",
            fee: 0.02,
            etaSec: 30,
            successP90: 0.989
        });
    }
    return quotes.sort((a, b) => a.fee - b.fee);
}
export async function executePayment(quote, amount, destination) {
    const txId = `${quote.rail.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const eta = new Date(Date.now() + quote.etaSec * 1000).toISOString();
    return {
        txId,
        status: 'pending',
        eta
    };
}
export async function registerButler(id, manifest) {
    if (!id || !manifest.name || !manifest.version) {
        throw new BoviAPIError('INVALID_BUTLER', 'Butler manifest incomplete');
    }
    const butlers = await getRegisteredButlers();
    if (butlers.find(b => b.id === id)) {
        throw new BoviAPIError('BUTLER_EXISTS', 'Butler already registered');
    }
    console.log(`Butler ${id} registered:`, manifest);
}
export async function getRegisteredButlers() {
    return [
        {
            id: 'bovi-default',
            name: 'BOVI Default Butler',
            version: '1.0.0',
            capabilities: ['price-analysis', 'contract-review', 'payment-routing']
        },
        {
            id: 'efficiency-butler',
            name: 'Efficiency Butler',
            version: '2.1.0',
            capabilities: ['optimization', 'cost-minimization', 'auto-swap']
        }
    ];
}
export async function switchButler(butlerId) {
    const start = Date.now();
    const butlers = await getRegisteredButlers();
    if (!butlers.find(b => b.id === butlerId)) {
        throw new BoviAPIError('BUTLER_NOT_FOUND', `Butler ${butlerId} not registered`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
        switched: true,
        activationTime: Date.now() - start
    };
}
//# sourceMappingURL=friedman-apis.js.map