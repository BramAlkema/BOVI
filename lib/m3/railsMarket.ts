// Rails marketplace (generic; plug real adapters later)
export type RailId = "SEPA" | "FPS" | "Card" | "L2-USDC" | "L2-EURC";

export interface M3RailQuote {
  rail: RailId;
  fee: number;
  etaSec: number;
  successP90: number;
  redeemable: boolean;
  chargeback: boolean;
}

export interface PaymentIntent {
  to: string;
  amount: string;
  memo?: string;
}

export interface RailAdapter {
  id: RailId;
  init(): Promise<void>;
  quote(p: PaymentIntent): Promise<M3RailQuote>;
  send(p: PaymentIntent): Promise<{ txId: string }>;
  status(txId: string): Promise<"pending" | "confirmed" | "failed">;
}

const REG = new Map<RailId, RailAdapter>();

export function registerRail(r: RailAdapter) {
  REG.set(r.id, r);
}

export async function listQuotes(p: PaymentIntent) {
  const out: M3RailQuote[] = [];
  for (const r of REG.values()) {
    out.push(await r.quote(p));
  }
  return out;
}

export async function bestQuote(p: PaymentIntent) {
  const qs = await listQuotes(p);
  return qs.sort((a, b) => a.fee - b.fee || a.etaSec - b.etaSec)[0];
}
