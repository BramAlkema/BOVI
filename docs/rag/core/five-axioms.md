---
title: Five Axioms of Money
type: core
tags: [axioms, definition, money, minimal-money, requirements]
sources: [MINIMAL-MONEY-THEORY.md, conversation-derived]
related: [portable-forgetful-ledger.md, common-knowledge-of-acceptance.md, three-anchor-types.md]
---

# The Five Axioms of Money

The cleaned-up minimum requirements for a token to function as money. Reduced from the original four-pillar framing (in `MINIMAL-MONEY-THEORY.md`) by collapsing supply-knowledge and acceptance into a single axiom with three inputs.

## The five

1. **Transferable** — can move between parties (physical or digital).
2. **Sufficiently divisible** — granular enough for the trades you actually need to do; doesn't need to be infinite, just "good enough" for the context.
3. **Sufficiently verifiable** — real vs fake distinguishable; persists as itself; doesn't need perfect anti-counterfeiting, just "good enough" trust.
4. **Symmetrical common knowledge that enough counterparties will keep accepting it at roughly known terms** — the single value axiom (see [common-knowledge](common-knowledge-of-acceptance.md)).
5. **Sufficient acceptance** — enough counterparties take it (the network pillar; can also be folded into axiom 4 as one of three inputs).

## What is NOT in the axioms

The standard textbook list adds properties that either reduce to one of the above or belong to a *different function* of money entirely:

| Textbook property | What it actually is |
|---|---|
| **Scarce** | Special case of *symmetrically known supply* (natural-anchor implementation). Not a separate requirement. |
| **Durable** | Special case of *verifiability over time*. |
| **Portable** | Special case of *transferable*. |
| **Recognisable / fungible** | Special case of *verifiability*. |
| **Acceptable** | The network pillar (axiom 4/5). |
| **Stable in value** | **Does not belong to medium of exchange.** It's the unit-of-account function bleeding in (see [four functions](../architecture/four-functions.md)). |

## Why scarcity is not the requirement

POW-camp cigarettes worked as money even though Red Cross parcels were arriving regularly — because supply was *symmetrically known*, not because cigarettes were scarce in any absolute sense. Bitcoin's hard cap is not what makes it satisfy axiom 4; the *publicly verifiable schedule* is. Inflationary tokens with transparent issuance can satisfy the axiom equally well.

Goldbug confusion: defaults to natural-anchor case and mistakes the symptom (scarcity) for the requirement (common knowledge).

## Why "stable in value" is not the requirement

Demanding stability of medium-of-exchange forces the bundling that the minimal-money thesis is trying to undo. Stability belongs in indices and contracts (unit of account), not in the transaction rail. See [four functions](../architecture/four-functions.md).

## The clean axiom set, restated

```
Required of a medium of exchange:
1. Transferable
2. Sufficiently divisible
3. Sufficiently verifiable
4. Symmetrical common knowledge that enough counterparties will keep accepting it
   (with three inputs: anchored supply, network depth, issuer/protocol credibility)
```

Five axioms become four if axiom 5 is absorbed into axiom 4 as an input. The conversation-derived synthesis prefers four.

## Source quote

> "Minimal Money: The simplest possible system that enables exchange by unlocking otherwise-impossible trades... Four Requirements: Transferable Tokens, Sufficient Divisibility, Sufficient Verifiability, Symmetrically Known Supply." — `MINIMAL-MONEY-THEORY.md`

The "symmetrically known supply" axiom was later refined in conversation to "symmetrical common knowledge of acceptance," with three feeding inputs (anchor / network / credibility).

## See also

- [Common Knowledge of Acceptance](common-knowledge-of-acceptance.md) — the load-bearing axiom 4 in depth
- [Three Anchor Types](three-anchor-types.md) — how axiom 4 gets satisfied
- [The Four Functions](../architecture/four-functions.md) — why "stable in value" lives elsewhere
- [Portable Forgetful Ledger](portable-forgetful-ledger.md) — what these axioms add up to
