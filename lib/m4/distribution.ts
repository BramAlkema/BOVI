// Opt-in cohort aggregates (k-anon is YOUR job when wiring real data)
export interface DistPoint {
  segment: string;
  winners: number;
  losers: number;
  delta: number;
} // simple

const KEY = "dist-agg";
let data: DistPoint[] = [];

export function pushDist(dp: DistPoint) {
  data.push(dp);
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getDist() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) data = JSON.parse(s);
  } catch (error) {
    // ignore malformed data and reset
    console.error("Failed to parse distribution data", error);
    data = [];
  }
  return data;
}

export function clearDist() {
  data = [];
  localStorage.removeItem(KEY);
}
