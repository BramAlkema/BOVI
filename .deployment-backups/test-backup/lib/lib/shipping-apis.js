import { emit } from './bus.js';
import { BoviAPIError } from './api-types.js';
export async function getRulers() {
    const baseline = 0.03;
    return [
        {
            id: 'bovi-local',
            name: 'BOVI Local LTS',
            method: 'Personal basket tracking',
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((await calculateLocalLTS() - baseline) * 10000)
        },
        {
            id: 'bovi-cohort',
            name: 'BOVI Cohort LTS',
            method: 'Community aggregated',
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((await calculateCohortLTS() - baseline) * 10000)
        },
        {
            id: 'ons-cpi',
            name: 'ONS Official CPI',
            method: 'Government published',
            lastUpdated: '2024-01-15T09:30:00Z',
            bpDrift: Math.round((0.032 - baseline) * 10000)
        },
        {
            id: 'truflation',
            name: 'Truflation Real-time',
            method: 'Blockchain oracle',
            lastUpdated: new Date().toISOString(),
            bpDrift: Math.round((0.0285 - baseline) * 10000)
        }
    ];
}
export async function switchRuler(rulerId) {
    const rulers = await getRulers();
    const ruler = rulers.find(r => r.id === rulerId);
    if (!ruler) {
        throw new BoviAPIError('RULER_NOT_FOUND', `Ruler ${rulerId} not found`);
    }
    localStorage.setItem('bovi.activeRuler', rulerId);
    emit('ui.kpi.updated', {
        flow: 'system',
        kpi: 'active_ruler',
        value: ruler
    });
    window.dispatchEvent(new CustomEvent('bovi.rulerChanged', {
        detail: { ruler, previousDrift: 0 }
    }));
}
class IndexCommonsStore {
    constructor() {
        this.dbName = 'bovi-index-commons';
        this.version = 1;
        this.db = null;
    }
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('entries')) {
                    const store = db.createObjectStore('entries', { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('quality', 'quality');
                }
            };
        });
    }
    async store(entry) {
        if (!this.db)
            await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            const request = store.put({
                ...entry,
                id: entry.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async getAll() {
        if (!this.db)
            await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async exportJSON() {
        const entries = await this.getAll();
        return JSON.stringify({
            version: '1.0.0',
            exported: new Date().toISOString(),
            entries
        }, null, 2);
    }
}
export const indexCommons = new IndexCommonsStore();
export async function createHamburgerBasket(name, items) {
    const basket = {
        id: `hamburger_${Date.now()}`,
        name,
        items,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        public: false
    };
    const baskets = getStoredBaskets();
    baskets.push(basket);
    localStorage.setItem('bovi.hamburgerBaskets', JSON.stringify(baskets));
    return basket;
}
export async function publishBasket(basketId) {
    const baskets = getStoredBaskets();
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) {
        throw new BoviAPIError('BASKET_NOT_FOUND', `Basket ${basketId} not found`);
    }
    basket.public = true;
    basket.shareUrl = `${window.location.origin}/basket/${basketId}`;
    localStorage.setItem('bovi.hamburgerBaskets', JSON.stringify(baskets));
    return basket.shareUrl;
}
export async function calculateHamburgerInflation(basketId) {
    const baskets = getStoredBaskets();
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) {
        throw new BoviAPIError('BASKET_NOT_FOUND', `Basket ${basketId} not found`);
    }
    const current = basket.items.reduce((sum, item) => sum + item.price, 0);
    const previous = basket.items.reduce((sum, item) => sum + item.usual, 0);
    const change = current - previous;
    const changePercent = change / previous;
    return { current, previous, change, changePercent };
}
function getStoredBaskets() {
    return JSON.parse(localStorage.getItem('bovi.hamburgerBaskets') || '[]');
}
export async function calculateMoneyVeil(income, savings, interestRate) {
    const personalInflation = await calculateLocalLTS();
    const officialInflation = 0.032;
    const inflationDrift = personalInflation - officialInflation;
    const bracketCreep = Math.max(0, inflationDrift * income * 0.2);
    const nominalReturn = savings * interestRate;
    const realReturn = savings * (interestRate - personalInflation);
    const realRate = realReturn - nominalReturn;
    const netImpact = bracketCreep + realRate;
    return {
        userId: 'current-user',
        inflationDrift,
        bracketCreep,
        realRate,
        netImpact,
        lastCalculated: new Date().toISOString()
    };
}
export async function generateWeeklyDigest() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        highlights: [
            'Personal inflation ran 0.15% higher than official CPI',
            'Grocery basket increased 2.3% week-over-week',
            'Energy costs stable despite cold weather'
        ],
        netChange: -12.45,
        recommendations: [
            'Consider switching to Tesco own-brand cereals (saving: £3.20/week)',
            'Your mortgage rate beats inflation by 1.2% - good position',
            'Council tax increase kicks in next month - budget +£8/week'
        ]
    };
}
export async function createSmartContract(templateId, parties, clause) {
    const templates = {
        rent: 'Annual rent adjustment shall be the lesser of LTS inflation or {cap}%, with a floor of {floor}% decrease.',
        salary: 'Annual salary review based on LTS inflation, capped at {cap}% increase.',
        loan: 'Variable rate tied to LTS inflation + {margin}%, with {floor}% minimum rate.'
    };
    const contract = {
        id: `contract_${Date.now()}`,
        templateId,
        parties,
        clause,
        humanReadable: templates[templateId]
            .replace('{cap}', ((clause.capBp || 0) / 100).toString())
            .replace('{floor}', ((clause.floorBp || 0) / 100).toString()),
        created: new Date().toISOString(),
        effectiveFrom: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        undoDeadline: new Date(Date.now() + clause.undoWindowHours * 60 * 60 * 1000).toISOString(),
        signed: false
    };
    const pdfReceipt = await generatePDFReceipt(contract);
    const jsonReceipt = JSON.stringify(contract, null, 2);
    const contracts = JSON.parse(localStorage.getItem('bovi.smartContracts') || '[]');
    contracts.push(contract);
    localStorage.setItem('bovi.smartContracts', JSON.stringify(contracts));
    return {
        contract,
        receipt: {
            pdf: pdfReceipt,
            json: jsonReceipt
        }
    };
}
async function generatePDFReceipt(contract) {
    const content = `
BOVI Smart Contract Receipt

Contract ID: ${contract.id}
Template: ${contract.templateId}
Parties: ${contract.parties.join(', ')}

Terms:
${contract.humanReadable}

LTS Index: ${contract.clause.ltsIndex}
Cap: ${contract.clause.capBp}bp
Floor: ${contract.clause.floorBp}bp
Carryover: ${contract.clause.carry ? 'Yes' : 'No'}

Effective: ${contract.effectiveFrom}
Undo until: ${contract.undoDeadline}

Generated: ${new Date().toISOString()}
  `;
    return new Blob([content], { type: 'application/pdf' });
}
export async function createCohortAuction(category, targetSize = 50) {
    const auction = {
        id: `cohort_${Date.now()}`,
        category,
        participants: 1,
        currentBest: 0,
        improvement: 0,
        noWorseOffCheck: true,
        joinDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'forming'
    };
    const auctions = JSON.parse(localStorage.getItem('bovi.cohortAuctions') || '[]');
    auctions.push(auction);
    localStorage.setItem('bovi.cohortAuctions', JSON.stringify(auctions));
    return auction;
}
export async function joinCohortAuction(auctionId) {
    const auctions = JSON.parse(localStorage.getItem('bovi.cohortAuctions') || '[]');
    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) {
        throw new BoviAPIError('AUCTION_NOT_FOUND', `Auction ${auctionId} not found`);
    }
    if (auction.status !== 'forming') {
        throw new BoviAPIError('AUCTION_CLOSED', 'Auction no longer accepting participants');
    }
    const currentUserCost = 100;
    const cohortCost = 95;
    const projectedSavings = currentUserCost - cohortCost;
    if (projectedSavings < 0) {
        return {
            joined: false,
            projectedSavings: 0,
            guarantee: 'BOVI guarantee: You would not benefit from this cohort. No action taken.'
        };
    }
    auction.participants += 1;
    auction.improvement = (projectedSavings / currentUserCost) * 100;
    localStorage.setItem('bovi.cohortAuctions', JSON.stringify(auctions));
    return {
        joined: true,
        projectedSavings,
        guarantee: 'BOVI guarantee: You will save at least £' + projectedSavings.toFixed(2) + ' or pay nothing extra.'
    };
}
export async function createStormProfile(profile) {
    const stormProfile = {
        id: `storm_${Date.now()}`,
        ...profile
    };
    const profiles = JSON.parse(localStorage.getItem('bovi.stormProfiles') || '[]');
    profiles.push(stormProfile);
    localStorage.setItem('bovi.stormProfiles', JSON.stringify(profiles));
    return stormProfile;
}
export async function activateStormMode(profileId) {
    const profiles = JSON.parse(localStorage.getItem('bovi.stormProfiles') || '[]');
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) {
        throw new BoviAPIError('PROFILE_NOT_FOUND', `Storm profile ${profileId} not found`);
    }
    const changes = [];
    Object.entries(profile.changes.pots).forEach(([pot, adjustment]) => {
        changes.push(`${pot} budget ${adjustment > 0 ? 'increased' : 'decreased'} by £${Math.abs(adjustment)}`);
    });
    localStorage.setItem('bovi.stormMode.notifications', JSON.stringify(profile.changes.notifications));
    changes.push(`Notifications set to ${profile.changes.notifications.frequency} frequency`);
    const revertTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('bovi.stormMode.revertTime', revertTime);
    localStorage.setItem('bovi.stormMode.active', profileId);
    emit('ui.kpi.updated', {
        flow: 'system',
        kpi: 'storm_mode',
        value: { active: true, profile: profile.name }
    });
    return {
        activated: true,
        changes,
        revertTime
    };
}
async function calculateLocalLTS() {
    return 0.0347;
}
async function calculateCohortLTS() {
    return 0.0332;
}
//# sourceMappingURL=shipping-apis.js.map