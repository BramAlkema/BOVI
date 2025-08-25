import { BoviAPIError } from './api-types.js';
export async function listIndexProviders() {
    return [
        {
            id: 'bovi-local',
            name: 'BOVI Local LTS',
            method: 'LTS-local',
        },
        {
            id: 'bovi-cohort',
            name: 'BOVI Cohort LTS',
            method: 'LTS-cohort',
        },
        {
            id: 'ons-cpi',
            name: 'ONS Official CPI',
            method: 'CPI',
            url: 'https://www.ons.gov.uk/economy/inflationandpriceindices'
        },
        {
            id: 'ons-wages',
            name: 'ONS Average Earnings',
            method: 'WAGE',
            url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork'
        },
        {
            id: 'shadow-stats',
            name: 'ShadowStats Alternative',
            method: 'CPI',
            url: 'http://www.shadowstats.com/'
        },
        {
            id: 'truflation',
            name: 'Truflation Real-time',
            method: 'CPI',
            url: 'https://truflation.com/'
        }
    ];
}
export async function setDefaultIndex(providerId) {
    const providers = await listIndexProviders();
    if (!providers.find(p => p.id === providerId)) {
        throw new BoviAPIError('PROVIDER_NOT_FOUND', `Index provider ${providerId} not found`);
    }
    localStorage.setItem('bovi.defaultIndexProvider', providerId);
    window.dispatchEvent(new CustomEvent('bovi.indexProviderChanged', {
        detail: { providerId }
    }));
}
export async function getCurrentIndexProvider() {
    const providerId = localStorage.getItem('bovi.defaultIndexProvider') || 'bovi-local';
    const providers = await listIndexProviders();
    return providers.find(p => p.id === providerId) || providers[0];
}
export async function calculateWithProvider(providerId, basket) {
    const provider = (await listIndexProviders()).find(p => p.id === providerId);
    if (!provider) {
        throw new BoviAPIError('PROVIDER_NOT_FOUND', `Provider ${providerId} not found`);
    }
    let value = 0.03;
    let confidence = 0.95;
    switch (provider.method) {
        case 'LTS-local':
            value = await calculateLocalLTS(basket);
            confidence = 0.85;
            break;
        case 'LTS-cohort':
            value = await calculateCohortLTS(basket);
            confidence = 0.92;
            break;
        case 'CPI':
            value = 0.032;
            confidence = 0.99;
            break;
        case 'WAGE':
            value = 0.045;
            confidence = 0.97;
            break;
    }
    return {
        value,
        method: provider.method,
        timestamp: new Date().toISOString(),
        confidence
    };
}
export async function installButler(pkgUrl) {
    try {
        const mockPackage = {
            id: `butler_${Date.now()}`,
            name: 'Community Butler',
            version: '1.0.0',
            paramsSchema: {
                type: 'object',
                properties: {
                    aggressiveness: { type: 'number', min: 0, max: 1 },
                    risktolerance: { type: 'string', enum: ['low', 'medium', 'high'] }
                }
            }
        };
        const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
        installed.push(mockPackage);
        localStorage.setItem('bovi.installedButlers', JSON.stringify(installed));
        return mockPackage;
    }
    catch (error) {
        throw new BoviAPIError('BUTLER_INSTALL_FAILED', 'Failed to install butler', error);
    }
}
export async function activateButler(id) {
    const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
    const butler = installed.find((b) => b.id === id);
    if (!butler) {
        throw new BoviAPIError('BUTLER_NOT_FOUND', `Butler ${id} not installed`);
    }
    localStorage.setItem('bovi.activeButler', id);
    window.dispatchEvent(new CustomEvent('bovi.butlerActivated', {
        detail: { butlerId: id, butler }
    }));
}
export async function getInstalledButlers() {
    return JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
}
export async function uninstallButler(id) {
    const installed = JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]');
    const filtered = installed.filter((b) => b.id !== id);
    localStorage.setItem('bovi.installedButlers', JSON.stringify(filtered));
    if (localStorage.getItem('bovi.activeButler') === id) {
        localStorage.setItem('bovi.activeButler', 'bovi-default');
    }
}
export async function auditRailSelection(selectedRail, allQuotes) {
    const bestQuote = allQuotes.reduce((best, quote) => quote.fee < best.fee ? quote : best);
    const selectedQuote = allQuotes.find(q => q.rail === selectedRail);
    if (!selectedQuote) {
        throw new BoviAPIError('RAIL_NOT_FOUND', 'Selected rail not in quotes');
    }
    const feeDifference = selectedQuote.fee - bestQuote.fee;
    const fairnessScore = Math.max(0, 1 - (feeDifference / bestQuote.fee));
    return {
        selectedRail,
        bestQuote,
        fairnessScore
    };
}
export async function generateFairnessReport() {
    return {
        period: '2024-01-08 to 2024-01-14',
        averageFairness: 0.94,
        flaggedIncidents: 2,
        railPerformance: [
            { rail: 'SEPA', fairnessScore: 0.96, volume: 1240 },
            { rail: 'FPS', fairnessScore: 0.89, volume: 890 },
            { rail: 'Card', fairnessScore: 0.78, volume: 2100 },
            { rail: 'StableL2', fairnessScore: 0.99, volume: 156 }
        ]
    };
}
export async function computeLocalIndex(basket) {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 50));
    const sources = ['local-receipts', 'price-scraping', 'user-input'];
    const prices = basket?.map(item => item.price) || [2.50, 1.20, 3.80, 0.90];
    const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const mad = prices.reduce((sum, price) => sum + Math.abs(price - median), 0) / prices.length;
    const quality = Math.min(1, prices.length / 20);
    const result = {
        sources,
        median,
        mad,
        quality,
        lastUpdated: new Date().toISOString()
    };
    const computeTime = Date.now() - startTime;
    if (computeTime > 200) {
        console.warn(`Local computation took ${computeTime}ms (target: <200ms)`);
    }
    return result;
}
export async function shareWithCohort(data, consent) {
    if (!consent) {
        return { shared: false, cohortSize: 0, anonymized: false };
    }
    const anonymizedData = {
        median: data.median,
        mad: data.mad,
        quality: data.quality,
        timestamp: data.lastUpdated
    };
    console.log('Sharing anonymized data:', anonymizedData);
    return {
        shared: true,
        cohortSize: 1247,
        anonymized: true
    };
}
export async function fileAppeal(actionId, reason) {
    const appeal = {
        actionId,
        opened: new Date().toISOString(),
        status: 'open',
        providerId: 'bovi-default',
        outcome: undefined
    };
    const appeals = JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
    appeals.push(appeal);
    localStorage.setItem('bovi.appeals', JSON.stringify(appeals));
    return appeal;
}
export async function getAppealStatus(appealId) {
    const appeals = JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
    const appeal = appeals.find(a => a.actionId === appealId);
    if (!appeal) {
        throw new BoviAPIError('APPEAL_NOT_FOUND', `Appeal ${appealId} not found`);
    }
    return appeal;
}
export async function getUserAppeals() {
    return JSON.parse(localStorage.getItem('bovi.appeals') || '[]');
}
export async function registerClearinghouse(meta) {
    if (!meta.id || !meta.name || !meta.jurisdiction) {
        throw new BoviAPIError('INVALID_CLEARINGHOUSE', 'Clearinghouse metadata incomplete');
    }
    const clearinghouses = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
    if (clearinghouses.find((c) => c.id === meta.id)) {
        throw new BoviAPIError('CLEARINGHOUSE_EXISTS', 'Clearinghouse already exists');
    }
    clearinghouses.push(meta);
    localStorage.setItem('bovi.clearinghouses', JSON.stringify(clearinghouses));
}
export async function chooseClearinghouse(id) {
    const clearinghouses = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
    if (!clearinghouses.find(c => c.id === id)) {
        throw new BoviAPIError('CLEARINGHOUSE_NOT_FOUND', `Clearinghouse ${id} not found`);
    }
    localStorage.setItem('bovi.activeClearinghouse', id);
    window.dispatchEvent(new CustomEvent('bovi.clearinghouseChanged', {
        detail: { clearinghouseId: id }
    }));
}
export async function getClearinghouses() {
    const stored = JSON.parse(localStorage.getItem('bovi.clearinghouses') || '[]');
    if (stored.length === 0) {
        const defaults = [
            {
                id: 'bovi-main',
                name: 'BOVI Main Clearinghouse',
                jurisdiction: 'UK',
                rulesUrl: '/rules/main.json',
                contact: 'support@bovi.money'
            },
            {
                id: 'eu-cohort',
                name: 'EU Community Cohort',
                jurisdiction: 'EU',
                rulesUrl: '/rules/eu-cohort.json',
                contact: 'admin@eu-cohort.org'
            }
        ];
        localStorage.setItem('bovi.clearinghouses', JSON.stringify(defaults));
        return defaults;
    }
    return stored;
}
export async function exportAll() {
    const bundle = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
            baskets: JSON.parse(localStorage.getItem('bovi.baskets') || '[]'),
            flows: JSON.parse(localStorage.getItem('bovi.flows') || '[]'),
            contracts: JSON.parse(localStorage.getItem('bovi.contracts') || '[]'),
            auditLog: JSON.parse(localStorage.getItem('bovi.auditLog') || '[]'),
            settings: {
                defaultIndexProvider: localStorage.getItem('bovi.defaultIndexProvider'),
                activeButler: localStorage.getItem('bovi.activeButler'),
                activeClearinghouse: localStorage.getItem('bovi.activeClearinghouse'),
                installedButlers: JSON.parse(localStorage.getItem('bovi.installedButlers') || '[]')
            }
        }
    };
    return bundle;
}
export async function importBundle(bundle) {
    const conflicts = [];
    try {
        Object.entries(bundle.data).forEach(([key, value]) => {
            if (key === 'settings') {
                Object.entries(value).forEach(([settingKey, settingValue]) => {
                    if (settingValue) {
                        localStorage.setItem(`bovi.${settingKey}`, typeof settingValue === 'string' ? settingValue : JSON.stringify(settingValue));
                    }
                });
            }
            else if (Array.isArray(value)) {
                localStorage.setItem(`bovi.${key}`, JSON.stringify(value));
            }
        });
        return {
            imported: true,
            conflicts,
            summary: {
                baskets: bundle.data.baskets.length,
                flows: bundle.data.flows.length,
                contracts: bundle.data.contracts.length,
                auditEntries: bundle.data.auditLog.length
            }
        };
    }
    catch (error) {
        throw new BoviAPIError('IMPORT_FAILED', 'Failed to import bundle', error);
    }
}
async function calculateLocalLTS(basket) {
    if (!basket || basket.length === 0)
        return 0.025;
    const prices = basket.map(item => item.price || 0);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return Math.min(0.1, Math.max(-0.02, avgPrice / 100));
}
async function calculateCohortLTS(basket) {
    const localLTS = await calculateLocalLTS(basket);
    const cohortAdjustment = 0.005;
    return localLTS + cohortAdjustment;
}
//# sourceMappingURL=hayek-apis.js.map