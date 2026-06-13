---
title: The Four Functions of Money
type: architecture
tags: [functions, textbook, medium-of-exchange, store-of-value, unit-of-account, deferred-payment]
sources: [UNBUNDLING-MONEY-FUNCTIONS.md, MINIMAL-MONEY-THEORY.md]
related: [../core/unbundling-thesis.md, five-layer-stack.md]
---

# The Four Functions of Money

## Definition

The textbook list of "functions of money" — taught in every Econ 101 — is **not** a description of money's nature. It is a description of *forced bundling*. Each function wants different properties, and bundling them in one instrument creates impossible trade-offs.

## The textbook four

1. **Medium of exchange** — facilitates transactions
2. **Unit of account** — common measure of value
3. **Store of value** — preserves purchasing power over time
4. **Standard of deferred payment** — denominator of debts and contracts (sometimes folded into 3)

## Each function's actual requirements (table of conflicting wants)

| Function | Wants | Conflicts with |
|---|---|---|
| **Medium of exchange** | Low friction, divisible, abundant, fast | (the minimal-money base) |
| **Unit of account** | Stability, standardisation, memory | Medium of exchange (which fluctuates) |
| **Store of value** | Appreciation, scarcity, durability | Medium of exchange (which should circulate, not be hoarded) |
| **Standard of deferred payment** | Contract-grade purchasing-power stability over decades | Medium of exchange (which is volatile by necessity) |

These are *engineering trade-offs*. You cannot maximise stability AND velocity AND appreciation AND standardisation in one instrument. Demanding all four creates a perpetually-failing optimisation problem that central banks dress up as policy.

## The dissolution: each function in its right tool

| Function | Optimal instrument |
|---|---|
| Medium of exchange | Minimal money / transaction rail (cash, mobile money, BTC-as-rail, USDT) |
| Unit of account | Indices and personal PDAs (Big Mac index, your notebook) |
| Store of value | Appreciating assets (real estate, equities, gold, BTC-as-asset) |
| Standard of deferred payment | Indexed contracts (rent tied to housing costs, pensions tied to CPI) |

That's the proper stack. The four "functions of money" aren't functions of money — they're four *separate problems* the textbook taught us to demand from one instrument.

## Why the textbook list is the source of confusion

Most of what gets called "monetary theory" downstream of Econ 101 is just sophisticated derivation from the bundled assumption. Once you reject the bundled assumption, large parts of monetary economics become *answers to a question that doesn't need asking*:

- *"How do we balance price stability with growth?"* — only a problem because you've insisted unit-of-account and medium-of-exchange share an instrument
- *"Is the dollar overvalued?"* — only matters if you're forcing the dollar to be a store of value
- *"Should we return to a gold standard?"* — a debate about which instrument should bundle all four
- *"Is Bitcoin too volatile?"* — only if you require the transaction rail to also be the savings vehicle

The unbundling move doesn't *answer* these questions. It dissolves them.

## Why "stable in value" isn't a property of medium of exchange

The standard list adds "stable in value" as a property of money. Half the goldbug critique of fiat ("the dollar lost 96% of its value since 1913") and half the Bitcoin critique ("it's too volatile to be money") rest on this assumption. **It's wrong.** Stability is a property of unit-of-account, which the framework hands off to indices and personal PDAs. Medium-of-exchange just needs to settle the transaction; volatility for the seconds you hold it is irrelevant.

## The political consequence

In the textbook frame, your professor of monetary economics is the expert; Doña Elena is uneducated. In the unbundled frame, Doña Elena is the expert (she's solved the four-functions problem in her actual life); your professor is a specialist in defending the assumption that the four functions belong together.

That inversion isn't political. It's just what happens when you stop teaching the bundled assumption as a definition.

## Source quote

> "Money's functions don't need to be bundled in the same instrument: Contracts → Indexed obligations in familiar units; Transactions → Whatever currency works, converted just-in-time; Wealth → Optimized returns in best instruments; Prices → PDA-managed discovery, not human memory; Accounts → Swept daily, never idle." — `WEALTH-TRANSACTION-SEPARATION.md`

## See also

- [Unbundling Thesis](../core/unbundling-thesis.md) — the engineering response
- [Five-Layer Stack](five-layer-stack.md) — practical architecture
- [Five Axioms](../core/five-axioms.md) — what's actually load-bearing for medium of exchange
- [Unbundled Personal Stack](../practice/unbundled-personal-stack.md) — building this for yourself
