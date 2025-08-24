// Money-veil calculators (stub inputs; wire to your data)
import { getRulers } from "../core/rulers.js";

export interface MoneyVeil {
  driftBp: number;        // user LTS vs CPI (basis points / year)
  driftMonthly: number;   // € per month lost/gained (est.)
  realRate: number;       // policyRate - user LTS
  bracketCreep: number;   // € per year
}

export interface Inputs {
  cashBalance: number; 
  policyRate: number; // 0.05 = 5%
  userInflation: number; 
  officialCpi: number; 
  wageYoY: number;
  annualIncome: number; 
  taxBands: { threshold: number; rate: number }[];
}

export function calcMoneyVeil(i: Inputs): MoneyVeil {
  const driftBp = Math.round((i.userInflation - i.officialCpi) * 10_000);
  const driftMonthly = +(i.cashBalance * (i.userInflation - i.officialCpi) / 12).toFixed(2);
  const realRate = +(i.policyRate - i.userInflation).toFixed(4);
  const bracketCreep = Math.max(0, tax(i.annualIncome, i.taxBands, 1) - tax(i.annualIncome, i.taxBands, 1+i.officialCpi));
  return { driftBp, driftMonthly, realRate, bracketCreep: +bracketCreep.toFixed(2) };
}

function tax(income: number, bands: {threshold:number;rate:number}[], indexFactor=1) {
  let due = 0, last = 0;
  for (const b of bands) {
    const th = b.threshold * indexFactor;
    const base = Math.min(Math.max(income - last, 0), Math.max(th - last, 0));
    due += base * b.rate; 
    last = th;
  }
  if (income > last) due += (income-last) * (bands[bands.length-1]?.rate ?? 0);
  return due;
}