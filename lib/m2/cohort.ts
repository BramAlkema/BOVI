// Cohort join (client-side stub + simple clearing)
export interface Intent { 
  userId: string; 
  product: "energy" | "broadband"; 
  maxPrice?: number; 
  usage?: number;
}

export interface Bid { 
  supplierId: string; 
  price: number; 
  terms?: Record<string, string>;
}

export interface ClearRule { 
  minJoiners: number; 
  safe: "noWorseOff";
}

export interface Result { 
  winner?: Bid; 
  enrolled: string[]; 
  savingPerUser: number;
}

const _intents: Intent[] = [];

export function joinCohort(i: Intent) { 
  _intents.push(i); 
}

export function clearCohort(bids: Bid[], rule: ClearRule, baseline: number): Result {
  if (_intents.length < rule.minJoiners) {
    return { enrolled: [], savingPerUser: 0 };
  }
  
  const winner = [...bids].sort((a,b)=>a.price-b.price)[0];
  const enrolled = _intents.filter(i => (i.maxPrice ?? Infinity) >= winner.price).map(i=>i.userId);
  const savingPerUser = Math.max(0, baseline - winner.price);
  
  return { winner, enrolled, savingPerUser: +savingPerUser.toFixed(2) };
}