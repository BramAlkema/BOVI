// Price Discovery (robust median/MAD + shrinkflation normalisation)
export interface Quote { 
  itemId: string; 
  venue: string; 
  price: number; 
  ts: number; 
  size?: number;
}

export interface M2PDAResult {
  itemId: string; 
  median: number; 
  mad: number;
  unitPrice?: number; 
  provenance: { venue: string; ts: number }[];
  score: "👍" | "→" | "👎";
}

export const median = (xs: number[]) => {
  const a = [...xs].sort((x,y)=>x-y); 
  const m = Math.floor(a.length/2);
  return a.length ? (a.length%2? a[m] : (a[m-1]+a[m])/2) : 0;
};

export const mad = (xs: number[]) => {
  const m = median(xs); 
  return median(xs.map(x=>Math.abs(x-m)));
};

export const normaliseShrink = (price:number, packNow:number, packBase:number) =>
  price * (packBase / Math.max(1e-6, packNow));

export function computePDA(quotes: Quote[], basePack?:number, packNow?:number, personalMedian?:number): M2PDAResult {
  const ps = quotes.map(q=>q.price);
  const m = median(ps), d = mad(ps);
  const unit = (basePack && packNow) ? normaliseShrink(m, packNow, basePack) : undefined;
  const rel = personalMedian ? ( (unit ?? m) - personalMedian ) / personalMedian : 0;
  const score: M2PDAResult["score"] = rel < -0.02 ? "👍" : rel < 0.02 ? "→" : "👎";
  return {
    itemId: quotes[0]?.itemId ?? "",
    median: +m.toFixed(2), 
    mad: +d.toFixed(2), 
    unitPrice: unit? +unit.toFixed(2): undefined,
    provenance: quotes.map(q=>({ venue:q.venue, ts:q.ts })), 
    score
  };
}