---
title: Three Anchor Types
type: core
tags: [anchor, supply, fiat, gold, crypto, chartalism, commodity-theory]
sources: [MINIMAL-MONEY-THEORY.md, conversation-derived]
related: [common-knowledge-of-acceptance.md, five-axioms.md, cases/bitcoin.md]
---

# Three Anchor Types

## Definition

The **anchor** is the mechanism that produces common knowledge of supply for a money. There are three known types, and **the type does not matter** — only that an anchor exists and is credible.

| Anchor type | Mechanism | Examples |
|---|---|---|
| **Legal** | The state declares the supply | Fiat: USD, EUR, JPY, GBP |
| **Natural** | Physics caps the supply | Gold, silver, salt, cattle, cowries, land |
| **Mathematical** | An algorithm declares the supply | Bitcoin, fixed-supply crypto |

## Why type does not matter

This is the framework's key neutralising move. It dissolves three otherwise-eternal debates:

- **Chartalism vs. commodity theory**: both correct that *an* anchor is needed; both wrong to claim only theirs counts. State coercion (legal) and intrinsic value (natural) are two of three known anchor types.
- **Goldbug vs. fiat-defender**: each defaults to one anchor type and treats it as the only legitimate one. The framework treats both as engineering choices.
- **Crypto-evangelist vs. crypto-skeptic**: the algorithm-as-anchor is genuinely novel (2008 Bitcoin breakthrough) but it solves the same axiom requirement that legal and natural anchors solve. It is not magic; it is a third option on the menu.

## Concrete examples

### Legal anchor (fiat)
- Central bank publishes balance sheets, controls issuance
- Backed by state authority, courts, tax demand
- Failure mode: state authority cracks → anchor fails (Weimar, Zimbabwe, Argentina)

### Natural anchor (commodity money)
- Physics or biology limits the supply
- Gold: hard to mine more, requires geological work
- Cattle: reproduction is slow and constrained
- Failure mode: discovery shock (gold rush, new mine), or physical loss
- Special case: POW-camp cigarettes — supply known by Red Cross parcel deliveries, even though cigarettes are not "scarce"

### Mathematical anchor (cryptographic)
- Protocol fixes supply schedule, enforced by distributed validators
- Bitcoin: 21M cap on a halving schedule, audited by every full node
- Failure mode: 51% attack, protocol governance capture, fork wars

## What "scarcity" gets wrong

Scarcity is a *symptom* of the natural anchor, not a defining property of money. Bitcoin's hard cap is not load-bearing for axiom 4 — *publicly verifiable schedule* is. An inflationary token with transparent issuance can satisfy the axiom equally well.

Goldbug confusion: defaults to natural-anchor case and mistakes the symptom (scarcity) for the requirement (common knowledge of supply). See [five axioms](five-axioms.md).

## Why this matters for the cold-start problem

Each anchor type has its own bootstrap mechanism (see [bootstrap engines](../architecture/four-bootstrap-engines.md)):

- Legal anchor → state coercion (tax demand)
- Natural anchor → industrial / ornamental use value
- Mathematical anchor → speculation (number-go-up)
- Plus orthogonally: platform leverage (any anchor type)

The anchor and the bootstrap are different things. Legal anchor + tax demand bootstraps fiat. Mathematical anchor + speculation bootstraps Bitcoin. Same anchor mechanism could in principle bootstrap differently.

## Source quote

> "Symmetrically Known Supply: Everyone knows roughly how many tokens exist. Anchored by: Legal: 'The law says X tokens exist'; Natural: 'Physics limits it to Y tokens'; Mathematical: 'Algorithm produces Z tokens'. The anchor type doesn't matter, only that it creates common knowledge." — `MINIMAL-MONEY-THEORY.md`

## See also

- [Five Axioms](five-axioms.md) — anchor is what feeds axiom 4
- [Common Knowledge of Acceptance](common-knowledge-of-acceptance.md) — anchor as one of three inputs
- [Four Bootstrap Engines](../architecture/four-bootstrap-engines.md) — how each anchor type typically bootstraps
- [Bitcoin](../cases/bitcoin.md) — mathematical anchor case study
- [Gold Standard Era](../cases/gold-standard-era.md) — natural anchor case study
