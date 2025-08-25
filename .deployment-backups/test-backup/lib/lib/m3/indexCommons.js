const KEY = "index-commons";
export class M3IndexCommons {
    constructor() {
        this.sources = [];
        try {
            const s = localStorage.getItem(KEY);
            if (s)
                this.sources = JSON.parse(s);
        }
        catch (error) {
            console.error("Failed to parse index commons from storage", error);
            this.sources = [];
        }
    }
    add(src) {
        this.sources.push(src);
        localStorage.setItem(KEY, JSON.stringify(this.sources));
    }
    list(limit = 200) {
        return this.sources.slice(-limit).reverse();
    }
    clear() {
        this.sources = [];
        localStorage.removeItem(KEY);
    }
    compute() {
        const ps = this.sources.map(s => s.price);
        ps.sort((a, b) => a - b);
        const m = ps.length
            ? ps.length % 2
                ? ps[(ps.length / 2) | 0]
                : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2
            : 0;
        const mad = median(ps.map(p => Math.abs(p - m)));
        return {
            id: new Date().toISOString(),
            method: "median+MAD",
            median: +m.toFixed(2),
            mad: +mad.toFixed(2),
            sources: [...this.sources],
        };
    }
}
const median = (xs) => {
    const a = [...xs].sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length ? (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2) : 0;
};
export function hamburgerSentinel(sources) {
    const staples = ["bread", "milk", "burger", "bus"];
    const items = sources.filter(s => staples.includes((s.item || "").toLowerCase()));
    const byItem = new Map();
    for (const s of items) {
        byItem.set(s.item, [...(byItem.get(s.item) || []), s.price]);
    }
    const medians = [...byItem.values()].map(arr => median(arr));
    const m = median(medians);
    return { items: staples, median: +m.toFixed(2) };
}
//# sourceMappingURL=indexCommons.js.map