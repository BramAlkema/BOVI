---
title: The Cold-Start Problem
type: architecture
tags: [cold-start, bootstrap, network-effects, metcalfe, adoption]
sources: [conversation-derived]
related: [four-bootstrap-engines.md, two-layer-pattern.md, ../core/common-knowledge-of-acceptance.md]
---

# The Cold-Start Problem

## Definition

**Pure utility has never bootstrapped a money network.** A new monetary token has near-zero value to early users (because almost no one accepts it yet), and pure utility cannot get the network across the threshold where utility starts to compound.

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

## The historical pattern: Hayek's failure

In 1976 Friedrich Hayek published *The Denationalisation of Money*. The argument was airtight. National monetary monopolies are the source of inflation and political mischief. Let private firms issue competing currencies; users would gravitate to the best.

The logic was beautiful. The economics was rigorous. Hayek was a Nobel laureate. The book was widely read. **Nobody used the private currencies.** Not then, not in the half-century since. Hayek's perfect money never happened — not because anyone refuted it, but because nobody had a reason to be the *first* user.

## Why pure utility cannot solve cold-start

A new payment rail might be 100× faster, 10× cheaper, and infinitely more elegant than the existing options. None of that matters if you cannot pay anyone with it. The first thousand users get effectively nothing for their adoption costs. Without a non-utility reason to hold, they never appear, and the network never crosses the threshold.

## The solution: an engine

Every working money in human history has solved cold-start with one of four engines (see [bootstrap engines](four-bootstrap-engines.md)):

1. **State coercion** (tax demand) — fiat
2. **Speculative appreciation** (number-go-up) — Bitcoin
3. **Industrial / ornamental use value** — gold, salt, cattle
4. **Platform leverage** (existing user base) — M-Pesa, Pix, Apple Pay, GCash

Each engine attaches a *non-monetary demand source* to the token to overcome the cold-start. Without one of these (or a known equivalent), the network does not start.

## The formal version (Choi & Rocheteau)

Choi and Rocheteau's *Money Mining and Price Dynamics* (2019) models this directly: a search economy where money is privately produced by a time-consuming mining technology, and agents choose between mining and producing goods. Their results line up with the account above and derive several parts of it.

- **The thin-market mechanism, derived.** Early on, agents holding the new money "hoard it because they have no opportunities to use it as a medium of exchange." That is the Metcalfe-in-reverse story above, obtained as an equilibrium property rather than asserted. In *all* equilibria of the model, the new money does not circulate initially.
- **The speculative return is the wage of the bootstrap.** The value of money "must appreciate over time in order to induce agents to mine." Engine 2's *who pays* column is not a sociological observation about enthusiasts; it is a condition for supply to appear at all. A token that does not reward early holders faster than the discount rate does not get produced.
- **The opening phase is efficient, not pathological.** The initial non-circulating period is shown to be constrained-efficient. Cold-start's first phase is what a planner would also choose, which argues against reading the speculative stage purely as waste.
- **Circulation begins with abundance, not with belief.** "It is only when money is sufficiently abundant that agents stop hoarding it." The binding constraint on becoming transactional is quantity, not sentiment.
- **Velocity is a misleading early signal.** A money can have a real transactional role in the long run while showing none in the short run, so judging a young currency by how little it circulates is a mistake.

Two limits worth stating. The model concerns *privately mined token* money, so it speaks to Engines 2 and 3 and is silent on tax-driven and platform-leveraged bootstraps. And it is a working paper; cite the direction of its results rather than specific coefficients until the published version is checked.

**Hypothesis this suggests (not the authors' claim).** If the appreciation phase exists to call forth a costly supply, then monies with no supply to call forth should not need one. That would sort the four engines into two structural classes: *token* monies (speculative, commodity) which bootstrap through a scarcity-and-appreciation phase, and *ledger* monies (tax-driven, platform-leveraged, mutual credit) which bootstrap through imposed or inherited acceptance. A net-zero mutual-credit ledger has nothing to appreciate and nothing to mine, so on this reading it never has to pass through a bubble to start — a point in its favour that the framework has not previously made. The model does not test this; the inference is from its scope, not its results.

One consequence is already checkable: a **demurrage-bearing token cannot bootstrap by mining**, since a negative holding return cannot induce costly production. Gesellian designs accordingly ride an already-bootstrapped unit — Wörgl's stamped scrip was denominated in schillings. Melt appears to be a post-bootstrap design.

## The "real miners" insight

For Bitcoin specifically: the *real miners* are not the people running ASICs. They are the people who held through bear markets, built exchanges, integrated payment processors, convinced merchants. They are paid in capital appreciation rather than block rewards. Their economic contribution to the network's existence is far larger than the proof-of-work miners'.

In general: every monetary network is paid for by someone, voluntarily or not.

## The political honesty move

Naming the bootstrap is the most politically honest move in monetary theory:
- Standard economics pretends money emerges spontaneously from barter (it does not)
- Crypto evangelism pretends decentralised protocols escape institutional bootstraps (they do not — speculation IS the institutional bootstrap)
- Anthropology describes past bootstraps without theorising the design problem of *making a new one happen*

The honest framing: every monetary network is paid for by someone. Pick your bootstrap honestly.

## Implication for new money proposals

When evaluating any new monetary instrument — CBDC, crypto project, fintech rail — the first question is **not** *"is the technology good?"* It is **"what is the bootstrap, and who pays for it?"**

If the answer is *"the technology is so good people will adopt it on its own merits,"* the project will fail. Pure utility has never bootstrapped a money network in human history.

## The two-layer pattern that emerges

Once cold-start is understood, a design pattern becomes visible: every working money is **bundled at the bootstrap layer and unbundled at the use layer**. See [two-layer pattern](two-layer-pattern.md).

## See also

- [Four Bootstrap Engines](four-bootstrap-engines.md) — the four known solutions
- [Two-Layer Pattern](two-layer-pattern.md) — the design pattern that drops out
- [Common Knowledge of Acceptance](../core/common-knowledge-of-acceptance.md) — what cold-start has to deliver
- [Bitcoin](../cases/bitcoin.md) — speculation-bootstrap case
- [Mobile Money](../cases/mobile-money.md) — platform-leverage cases
