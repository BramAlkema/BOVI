export interface M4Trial {
  id: string;
  hypothesis: string;
  start: string;
  end?: string;
  metrics: string[];
  preregUrl?: string;
  status: "planned" | "running" | "done";
}

const KEY = "trials";
let trials: M4Trial[] = [];

export function loadTrials() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) trials = JSON.parse(s);
  } catch {}
  return trials;
}

export function listTrials() {
  return trials;
}

export function addTrial(t: M4Trial) {
  trials.unshift(t);
  localStorage.setItem(KEY, JSON.stringify(trials));
  return t;
}

export function finishTrial(id: string) {
  const t = trials.find(x => x.id === id);
  if (t) {
    t.status = "done";
    t.end = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(trials));
  }
}
