// M1: Episodes (tutorial podcast) – minimal queue

export interface Episode {
  id: string;
  title: string;
  mode: "B" | "O" | "V" | "I";
  lengthMin: number;
  played: boolean;
}

const seed: Episode[] = [
  { id: "ep-shrink", title: "Spotting shrinkflation", mode: "V", lengthMin: 5, played: false },
  { id: "ep-pots", title: "Pots & sweeps basics", mode: "B", lengthMin: 4, played: false },
  { id: "ep-rent", title: "Fair rent counters", mode: "O", lengthMin: 6, played: false },
  { id: "ep-cohort", title: "Joining buying cohorts", mode: "I", lengthMin: 3, played: false },
  { id: "ep-rails", title: "Payment rails explained", mode: "V", lengthMin: 7, played: false },
];

// Load played status from localStorage
function loadPlayedStatus() {
  try {
    const played = JSON.parse(localStorage.getItem("bovi.episodes.played") || "[]");
    seed.forEach(ep => {
      if (played.includes(ep.id)) {
        ep.played = true;
      }
    });
  } catch {
    // ignore parse errors
  }
}

function savePlayedStatus() {
  const played = seed.filter(ep => ep.played).map(ep => ep.id);
  localStorage.setItem("bovi.episodes.played", JSON.stringify(played));
}

// Initialize on load
loadPlayedStatus();

export async function nextEpisodes(limit = 3): Promise<Episode[]> {
  // ENHANCEMENT: Implement contextual ranking based on user's current mode preferences and activity
  return seed.filter(e => !e.played).slice(0, limit);
}

export async function markPlayed(id: string): Promise<void> {
  const ep = seed.find(e => e.id === id);
  if (ep && !ep.played) {
    ep.played = true;
    savePlayedStatus();
  }
}

export async function getAllEpisodes(): Promise<Episode[]> {
  return [...seed];
}

export async function getEpisode(id: string): Promise<Episode | undefined> {
  return seed.find(e => e.id === id);
}
