---
title: The Unbundling Thesis
type: core
tags: [unbundling, functions, stack, architecture, design]
sources: [MINIMAL-MONEY-THEORY.md, UNBUNDLING-MONEY-FUNCTIONS.md, WEALTH-TRANSACTION-SEPARATION.md]
related: [money-as-bundle.md, ../architecture/four-functions.md, ../architecture/five-layer-stack.md]
---

# The Unbundling Thesis

## Definition

**Money's functions don't need to be — and shouldn't be — bundled in the same instrument.** Each function has different optimal properties, and forcing one tool to do all four creates impossible trade-offs.

This is the engineering response to the empirical fact that money is bundled (see [bundle](money-as-bundle.md)). Bundling is inevitable at the *bootstrap* layer; unbundling is achievable at the *use* layer (see [two-layer pattern](../architecture/two-layer-pattern.md)).

## The four functions, properly assigned

| Function | Wants | Optimal tool |
|---|---|---|
| **Medium of exchange** | Low friction, divisible, abundant, fast circulation | Minimal money (cash, mobile money, BTC-as-rail, USDT) |
| **Unit of account** | Stability, standardisation, memory | Indices and personal PDAs |
| **Store of value** | Appreciation, scarcity, durability | Productive assets (real estate, equities, gold, BTC-as-asset) |
| **Standard of deferred payment** | Contract-grade purchasing-power stability | Indexed contracts (rent tied to housing index, pensions tied to CPI) |

These four functions *actively conflict* if forced into one instrument:

- Stability-for-contracts vs. flexibility-for-transactions (central bank balancing act)
- Scarcity-for-store-of-value vs. abundance-for-circulation (Bitcoin's deflationary problem)
- Universal-for-tax vs. contextual-for-community (state vs. local-currency tension)

## The five-layer financial stack

Practical implementation of the unbundled architecture (see [stack](../architecture/five-layer-stack.md)):

1. **Long-term contracting layer** — indexed obligations in familiar units (mortgages indexed to construction costs)
2. **Short-term transaction layer** — spot money or just-in-time conversion (whatever the merchant accepts)
3. **Wealth storage layer** — optimised investment allocation (never leave wealth in transaction currency)
4. **Price discovery layer** — PDA handles all comparisons (no human price memory)
5. **Account sweeping layer** — automatic daily sweeps to optimal instruments (no idle balances)

## Why minimal money forces unbundling

If you start with truly minimal money (a portable forgetful ledger), problems emerge immediately:

- **No price memory** → forces creation of PDAs
- **No contract stability** → forces creation of indexed contracts
- **Opportunity cost of holding** → forces wealth into productive assets
- **No time-shifting** → forces creation of debt ledgers (Balanced mode emerges)
- **No public goods funding** → forces creation of taxes (Obligated mode emerges)
- **No social cohesion** → forces creation of gift networks (Immediate mode emerges)

Starting from pure Value mode, the other three modes inevitably emerge. **Minimal money cannot escape the bundle** — it can only make it conscious by routing each function to its right tool.

## Doña Elena as worked example

The book's protagonist (Argentinian woman, 58) runs an unbundled stack on her iPhone:

- Pesos for tax (Obligated)
- USDT for value-storage (Value mode + storage)
- Real estate (deep storage)
- Loan to friend (Balanced)
- Sunday lunch she pays for (Immediate)

She is doing exactly what the textbook says money should do — but with the four functions properly assigned to four different tools. Her "complexity" is just unbundled-correctness.

## Why "is X really money?" debates are category errors

Once functions are unbundled, the question "is X money?" stops making sense. Bitcoin can be a transaction rail (medium of exchange) AND a store of value (deflationary asset) — but those are different functions and the "is it money?" debate is asking which textbook bundle X belongs to. Drop the bundle and the question dissolves.

## Sophisticated users have always done this

Treasury departments, hedge funds, family offices, expatriates in dollarised countries — all run unbundled stacks. What's new is the proposal to make this accessible to everyone, not just institutions.

The unbundled stack is not the future of money; it is the *current practice* of competent users that the textbook has been ignoring.

## Source quote

> "Money's functions don't need to be bundled in the same instrument: Contracts → Indexed obligations in familiar units; Transactions → Whatever currency works, converted just-in-time; Wealth → Optimized returns in best instruments; Prices → PDA-managed discovery, not human memory; Accounts → Swept daily, never idle." — `WEALTH-TRANSACTION-SEPARATION.md`

## See also

- [Money as Bundle](money-as-bundle.md) — the empirical claim
- [Four Functions](../architecture/four-functions.md) — the textbook list, decomposed
- [Five-Layer Stack](../architecture/five-layer-stack.md) — practical architecture
- [Two-Layer Pattern](../architecture/two-layer-pattern.md) — bundled bootstrap, unbundled use
- [Unbundled Personal Stack](../practice/unbundled-personal-stack.md) — how to build your own
