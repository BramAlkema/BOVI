const KEY = "dist-agg";
let data = [];
export function pushDist(dp) {
    data.push(dp);
    localStorage.setItem(KEY, JSON.stringify(data));
}
export function getDist() {
    try {
        const s = localStorage.getItem(KEY);
        if (s)
            data = JSON.parse(s);
    }
    catch (error) {
        console.error("Failed to parse distribution data", error);
        data = [];
    }
    return data;
}
export function clearDist() {
    data = [];
    localStorage.removeItem(KEY);
}
//# sourceMappingURL=distribution.js.map