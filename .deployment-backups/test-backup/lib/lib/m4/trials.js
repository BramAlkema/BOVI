const KEY = "trials";
let trials = [];
export function loadTrials() {
    try {
        const s = localStorage.getItem(KEY);
        if (s)
            trials = JSON.parse(s);
    }
    catch (error) {
        console.error("Failed to load trials", error);
        trials = [];
    }
    return trials;
}
export function listTrials() {
    return trials;
}
export function addTrial(t) {
    trials.unshift(t);
    localStorage.setItem(KEY, JSON.stringify(trials));
    return t;
}
export function finishTrial(id) {
    const t = trials.find(x => x.id === id);
    if (t) {
        t.status = "done";
        t.end = new Date().toISOString();
        localStorage.setItem(KEY, JSON.stringify(trials));
    }
}
//# sourceMappingURL=trials.js.map