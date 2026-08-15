---
title: The Cold-Start Problem
type: architecture
tags: [cold-start, bootstrap, network-effects, metcalfe, adoption]
sources: [conversation-derived]
related: [four-bootstrap-engines.md, two-layer-pattern.md, ../core/common-knowledge-of-acceptance.md]
---

# The Cold-Start Problem

## Definition

**Pure utility has never bootstrapped a new *unit of account*.** A new unit has near-zero value to early users (because almost no one accepts it yet), and pure utility has never carried one across the threshold where utility starts to compound.

The scoping matters, because the wider form of this claim — "never bootstrapped a money *network*" — is false, and the record that falsifies it is instructive: mutual-credit networks have repeatedly bootstrapped on transactional utility (WIR since 1934, from 16 founders to over 1,000 active members in five months and ninety years of fee-funded operation; the commercial trade-exchange industry's ~400,000 firms; Sardex 2009–15; Argentina's *créditos* at two-million-member scale). Every one of them arrived in an incumbent-liquidity drought, was built circuit-by-circuit by paid brokers — and **every one borrowed the incumbent unit**, 1:1 with the franc, euro, dollar or peso. Nobody has ever invented a *numéraire* on utility. That is the claim's true and falsifiable form, and it is the half of the cold-start problem utility cannot solve.

This is the central engineering problem of monetary design that economics ignores.

## The math (Metcalfe in reverse)

A money network's value to any one user is roughly the number of *other* users they can transact with. Metcalfe's law: value scales with the square of the user count.

- Network of two: 1 possible exchange relationship
- Network of ten: 45
- Network of a million: 500 billion

Run that in reverse:
- Network of one: 0 relationships
- Network of two: 1
- Network of a thousand: nearly nothing relative to mature networks

Early users get almost no value. Their willingness to hold or accept the token depends entirely on the *expectation* that other users will arrive — an expectation that, at t=0, has no evidence behind it.

This is not just arithmetic intuition; it falls out of the formal search models. In Choi & Rocheteau's mining economy (2019) — money privately produced at a time-cost, agents choosing between mining it and producing goods — early holders hoard the new money "because they have no opportunities to use it as a medium of exchange," and in every equilibrium of their baseline model the new money does not circulate at first, only starting to move once it is sufficiently abundant — their own robustness check softens the starkness (alternative matching lets some trade happen at all dates) while keeping the direction: the market thickens toward the money over time. The initial speculative, non-circulating phase is even constrained-efficient — a phase, not a pathology. Two practical corollaries: circulation begins with abundance, not belief; and a young money's velocity is a misleading signal, since a genuine future transaction role is consistent with none today. *(Their model covers privately mined token money — Engines 2 and 3 below — and is a working paper: cite the direction, not the coefficients.)*

## The historical pattern: Hayek's failure

In 1976 Friedrich Hayek published *The Denationalisation of Money*. The argument was airtight. National monetary monopolies are the source of inflation and political mischief. Let private firms issue competing currencies; users would gravitate to the best.

The logic was beautiful. The economics was rigorous. Hayek was a Nobel laureate. The book was widely read. And what happened next needs saying carefully, because "nobody used the private currencies" is false: private currencies *have* been used at scale — WIR for ninety years, the trade-exchange industry's hundreds of thousands of firms, e-gold's five million accounts (ended by federal prosecution, not disuse), Bitcoin. What never happened is Hayek's *specific* design: competing private issue at **floating** rates was mostly never legal to attempt — legal-tender rules and the tax treatment of currency gains foreclosed it — so its non-adoption is evidence about law, not about utility. And the private currencies that did work ran on engines (speculation, use value, or brokered scarcity — below), never on being better money alone; none of them floated a new unit.

## Why pure utility cannot solve cold-start

A new payment rail might be 100× faster, 10× cheaper, and infinitely more elegant than the existing options. None of that matters if you cannot pay anyone with it. The first thousand users get effectively nothing for their adoption costs. Without a non-utility reason to hold, they never appear, and the network never crosses the threshold.

## The solution: an engine

Every large-scale **general-purpose** money has solved cold-start with one of the first four engines; the documented exceptions — the brokered mutual-credit networks above — are the fifth (see [bootstrap engines](four-bootstrap-engines.md)):

1. **State coercion** (tax demand) — fiat
2. **Speculative appreciation** (number-go-up) — Bitcoin
3. **Industrial / ornamental use value** — gold, salt, cattle
4. **Platform leverage** (existing user base) — M-Pesa, Pix, Apple Pay, GCash
5. **Incumbent-liquidity scarcity, brokered** — WIR, Sardex, the trade exchanges: a credit-constrained trading population, organised into a closed clearing circuit by paid intermediaries, on the incumbent unit

The first four attach a *non-monetary demand source* to the token; the fifth is the special case where scarcity of the *incumbent* money is itself the demand, and brokers close the circuit that diffuse utility cannot close by itself. Without one of these, the network does not start — and without one of the first four, no new *unit* has ever started.

## The "real miners" insight

For Bitcoin specifically: the *real miners* are not the people running ASICs. They are the people who held through bear markets, built exchanges, integrated payment processors, convinced merchants. They are paid in capital appreciation rather than block rewards. Their economic contribution to the network's existence is far larger than the proof-of-work miners'.

And the payment is structural, not incidental: in Choi & Rocheteau's model the value of a privately mined money *must* appreciate over time to induce anyone to mine it — mining competes with ordinary production for the same hours, so the holding return is the wage that calls the supply into existence. One consequence follows: demurrage taxes the very return that recruits the miners, so a melting token must appreciate faster still to be produced at all — and in practice none has: **Freicoin** (2012, explicit Gesellian demurrage on a new token) is the named specimen, launched into the same market that adopted Bitcoin and left with effectively zero users. Gesellian designs ride an already-bootstrapped unit (Wörgl's stamped scrip was denominated in schillings); melt is a post-bootstrap design.

In general: every monetary network is paid for by someone, voluntarily or not.

## The political honesty move

Naming the bootstrap is the most politically honest move in monetary theory:
- Standard economics pretends money emerges spontaneously from barter (it does not)
- Crypto evangelism pretends decentralised protocols escape institutional bootstraps (they do not — speculation IS the institutional bootstrap)
- Anthropology describes past bootstraps without theorising the design problem of *making a new one happen*

The honest framing: every monetary network is paid for by someone. Pick your bootstrap honestly.

## Implication for new money proposals

When evaluating any new monetary instrument — CBDC, crypto project, fintech rail — the first question is **not** *"is the technology good?"* It is **"what is the bootstrap, and who pays for it?"**

If the answer is *"the technology is so good people will adopt it on its own merits,"* the project will fail — unless it is Engine 5's narrow niche: a genuine incumbent-liquidity drought, served by paid brokers, on the incumbent unit. Pure utility has never bootstrapped a new unit of account.

## The two-layer pattern that emerges

Once cold-start is understood, a design pattern becomes visible: every working money is **bundled at the bootstrap layer and unbundled at the use layer**. See [two-layer pattern](two-layer-pattern.md).

## See also

- [Four Bootstrap Engines](four-bootstrap-engines.md) — the four known solutions
- [Two-Layer Pattern](two-layer-pattern.md) — the design pattern that drops out
- [Common Knowledge of Acceptance](../core/common-knowledge-of-acceptance.md) — what cold-start has to deliver
- [Bitcoin](../cases/bitcoin.md) — speculation-bootstrap case
- [Mobile Money](../cases/mobile-money.md) — platform-leverage cases
