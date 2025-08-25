const seed = [
    { id: "ep-shrink", title: "Spotting shrinkflation", mode: "V", lengthMin: 5, played: false },
    { id: "ep-pots", title: "Pots & sweeps basics", mode: "B", lengthMin: 4, played: false },
    { id: "ep-rent", title: "Fair rent counters", mode: "O", lengthMin: 6, played: false },
    { id: "ep-cohort", title: "Joining buying cohorts", mode: "I", lengthMin: 3, played: false },
    { id: "ep-rails", title: "Payment rails explained", mode: "V", lengthMin: 7, played: false },
];
function loadPlayedStatus() {
    try {
        const played = JSON.parse(localStorage.getItem("bovi.episodes.played") || "[]");
        seed.forEach(ep => {
            if (played.includes(ep.id)) {
                ep.played = true;
            }
        });
    }
    catch {
    }
}
function savePlayedStatus() {
    const played = seed.filter(ep => ep.played).map(ep => ep.id);
    localStorage.setItem("bovi.episodes.played", JSON.stringify(played));
}
loadPlayedStatus();
export async function nextEpisodes(limit = 3) {
    return seed.filter(e => !e.played).slice(0, limit);
}
export async function markPlayed(id) {
    const ep = seed.find(e => e.id === id);
    if (ep && !ep.played) {
        ep.played = true;
        savePlayedStatus();
    }
}
export async function getAllEpisodes() {
    return [...seed];
}
export async function getEpisode(id) {
    return seed.find(e => e.id === id);
}
//# sourceMappingURL=episodes.js.map