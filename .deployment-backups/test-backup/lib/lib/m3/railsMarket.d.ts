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
    send(p: PaymentIntent): Promise<{
        txId: string;
    }>;
    status(txId: string): Promise<"pending" | "confirmed" | "failed">;
}
export declare function registerRail(r: RailAdapter): void;
export declare function listQuotes(p: PaymentIntent): Promise<M3RailQuote[]>;
export declare function bestQuote(p: PaymentIntent): Promise<M3RailQuote>;
//# sourceMappingURL=railsMarket.d.ts.map