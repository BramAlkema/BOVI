---
title: Common Knowledge of Acceptance
type: core
tags: [value, axiom, schelling-point, network, anchor]
sources: [conversation-derived, MINIMAL-MONEY-THEORY.md]
related: [five-axioms.md, three-anchor-types.md, portable-forgetful-ledger.md]
---

# Common Knowledge of Acceptance — The Single Value Axiom

## Definition

Money has value because of **symmetrical common knowledge that enough counterparties will keep accepting it at roughly known terms**.

This is the load-bearing axiom that underwrites monetary value. It is a *Schelling point* — money works because everyone believes everyone else will keep accepting it, and that belief is self-fulfilling once established.

## The single axiom, three inputs

The earlier framing split this into two pillars (anchored supply + network acceptance). Conversation-derived synthesis collapses them into one axiom with three inputs:

| Input | What it provides |
|---|---|
| **Anchored supply** | Credible answer to "how many of these are there?" — legal, natural, or mathematical (see [anchor types](three-anchor-types.md)) |
| **Network depth** | Enough current holders/acceptors that the next counterparty will likely take it |
| **Issuer/protocol credibility** | Track record that the answer to the supply question won't suddenly change |

All three feed the single property: *belief that future acceptance will continue at known terms*.

## Why this collapses the old two-pillar model

You cannot have one without the other for money to function:

- Known supply without acceptance = perfectly anchored local scrip nobody wants
- Acceptance without known supply = loyalty points whose issuer can dilute freely without disclosure

Both fail axiom 4. So they're really facets of one underlying property — *predictable continued acceptability*.

## Failure modes (diagnostic)

Each input can break independently:

- **Anchor break (Zimbabwe dollar)**: supply unknowable → axiom fails; people no longer believe future acceptance at known terms
- **Network shrink (defunct project token)**: acceptance shrinks below threshold → axiom fails
- **Credibility break (memecoin, scammy stablecoin)**: anchor was never real → axiom brittle from day one
- **Hybrid break (Argentinian peso)**: anchor partially broken → axiom holds for small daily amounts (state coercion guarantees minimal acceptance) but fails for stores of value

## Why this works for fiat, gold, and crypto

The framework neutralises the chartalism-vs-commodity-vs-crypto debate:

- **Fiat**: legal anchor + state-coercion-bootstrapped network + central-bank credibility
- **Gold**: natural anchor + millennia-old network + geological credibility
- **Bitcoin**: mathematical anchor + 16-year network + algorithm + miner-incentive credibility

Same axiom satisfied by different supplier configurations. None is privileged; the framework's neutrality on which is "real money" is built into the axiom.

## The Schelling-point property

Once common knowledge is established, the equilibrium is self-reinforcing:
- I will accept this because I expect others to
- They will accept it because they expect me to
- Everybody's expectation depends on everybody else's expectation

This makes mature monetary networks robust to small shocks but vulnerable to coordinated belief collapses (bank runs, hyperinflation onset, currency crises).

## See also

- [Three Anchor Types](three-anchor-types.md) — the supply input in depth
- [Five Axioms](five-axioms.md) — the full minimum spec
- [Cold-Start Problem](../architecture/cold-start-problem.md) — how common knowledge gets established in the first place
- [Inflation as Broken Common Knowledge](../pathologies/inflation-broken-knowledge.md) — what happens when this axiom cracks
