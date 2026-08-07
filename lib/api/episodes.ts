// M1: Episodes (tutorial podcast) – minimal queue

export interface Episode {
  id: string;
  title: string;
  mode: "B" | "O" | "V" | "I" | "mixed";
  lengthMin: number;
  played: boolean;
}

const seed: Episode[] = [
  {
    id: "ep-same-20",
    title: "The same 20, four exchanges",
    mode: "mixed",
    lengthMin: 4,
    played: false,
  },
  {
    id: "ep-dinner-bill",
    title: "The dinner bill is not about the amount",
    mode: "mixed",
    lengthMin: 5,
    played: false,
  },
  {
    id: "ep-subscription",
    title: "When a price becomes an obligation",
    mode: "O",
    lengthMin: 5,
    played: false,
  },
  { id: "ep-pda", title: "Why buyers need price memory", mode: "V", lengthMin: 4, played: false },
  {
    id: "ep-tally",
    title: "A ledger that can also say gift",
    mode: "B",
    lengthMin: 6,
    played: false,
  },
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
