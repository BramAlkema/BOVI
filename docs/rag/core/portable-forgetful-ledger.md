---
title: Portable Forgetful Ledger
type: core
tags: [definition, money, minimal-money, ledger]
sources: [MINIMAL-MONEY-THEORY.md]
related: [five-axioms.md, common-knowledge-of-acceptance.md, three-anchor-types.md, unbundling-thesis.md]
---

# Portable Forgetful Ledger

## Definition

**Minimal money is a portable forgetful ledger** — a transferable record of *who has what now*, with no memory of how they got it.

The "portable" part: tokens move between parties; the tokens *are* the ledger.
The "forgetful" part: history is not retained; each token is fungible with every other.

This is the simplest possible system that enables exchange by unlocking otherwise-impossible trades.

## Why this framing matters

It distinguishes minimal money from:

- **Debt ledgers** (Balanced mode primitives): track *history of obligations*, who owes whom; *not* forgetful
- **Reputation systems**: track *identity-tied* records; *not* forgetful
- **Surveillance money**: digital systems that retain transaction history; only *pretend* to be forgetful

The forgetful property is what allows anonymous spot trade between strangers without a relational substrate.

## What minimal money is NOT

- **NOT a unit of account** — prices fluctuate too wildly for human memory; that's what PDAs and indices are for
- **NOT a store of value** — holding it means missing returns from productive assets; that's what stocks/bonds/real-estate are for
- **NOT a price discovery mechanism** — it enables trades, but PDAs track and compare prices
- **NOT scarce** — can be abundant as long as supply is symmetrically known
- **NOT stable** — value fluctuates based on expected future trades it will unlock

## The value formula

```
Minimal Money Value = Trades that ONLY happen because the money exists
```

Not all trades — just the ones that were blocked without a medium of exchange. The value comes from unlocking stuck trades, not from the tokens themselves.

## Caveat: digital forgetfulness is increasingly fictional

Physical shells, coins, cash are anonymous by default — they really are forgetful. Digital tokens, mobile money, blockchain — every conversion, sweep, and balance is logged. The forgetfulness becomes a *design choice* (mixers, privacy coins, deliberate amnesia) rather than a free property.

For the unbundling project to preserve forgetfulness in digital form, *engineered* forgetfulness has to be a load-bearing requirement, not assumed.

## Source quote

> "Minimal Money: The simplest possible system that enables exchange by unlocking otherwise-impossible trades. It is fundamentally a portable forgetful ledger - a distributed record of who has what now, with no memory of how they got it." — `MINIMAL-MONEY-THEORY.md`

## See also

- [Five Axioms](five-axioms.md) — the formal requirements
- [Common Knowledge of Acceptance](common-knowledge-of-acceptance.md) — the value mechanism
- [Three Anchor Types](three-anchor-types.md) — how supply gets known
- [Unbundling Thesis](unbundling-thesis.md) — why minimal money forces unbundling
