---
title: The Two-Layer Pattern
type: architecture
tags: [bootstrap, use-layer, bundling, unbundling, design-pattern]
sources: [conversation-derived]
related: [cold-start-problem.md, four-bootstrap-engines.md, ../core/money-as-bundle.md, ../core/unbundling-thesis.md]
---

# The Two-Layer Pattern

## Definition

**Every working money is bundled at the bootstrap layer and unbundled at the use layer.**

This pattern is present in most working money systems but rarely named. Once you see it, the apparent contradiction between the bundling thesis ("money is always bundled") and the unbundling thesis ("functions belong in different tools") dissolves: they describe different *layers*.

## The pattern, three examples

### Fiat (legal anchor + state-coercion bootstrap)

- **Bootstrap layer**: state coercion bundles unit-of-account, store-of-value, and medium-of-exchange into one instrument because the state needs all three for tax administration. Bundled.
- **Use layer**: sophisticated users (Doña Elena, treasury departments, expatriates in dollarised countries) hold wealth in non-currency assets and only convert when needed. Unbundled.

The unbundling at the use layer rides on a fiat bootstrap users did not design and cannot escape.

### Bitcoin (mathematical anchor + speculation bootstrap)

- **Bootstrap layer**: the hard cap conflates store-of-value into the medium-of-exchange in order to attract speculative capital. Bundled.
- **Use layer**: holders use BTC as appreciation play but transact in stablecoins running on the infrastructure BTC paid for. Unbundled.

The bundling at the foundation funded the unbundling at the application.

### Mobile money (legal anchor + platform-leverage bootstrap)

- **Bootstrap layer**: the telco's existing user base subsidises the payment rail. M-Pesa runs on Safaricom infrastructure; users have to be Safaricom subscribers. Bundled.
- **Use layer**: M-Pesa serves only as a transaction rail; users hold their wealth in cattle, real estate, gold, or USD. Unbundled.

## Why the pattern is robust

Pure unbundling at the *bootstrap* layer has no working precedent. There is no such thing as a pure-utility money network. Pure utility is the *eventual* state of mature networks; it is never the bootstrapping state.

Pure bundling at the *use* layer is also rare among sophisticated users. Once a network is mature enough that you can route around it, anyone competent does.

So the pattern emerges by necessity: bootstrap requires bundling (or some non-utility incentive); use rewards unbundling.

## Implication: the unbundling project is a use-layer project

The minimal-money framework calls for unbundling. This conflicts with the empirical fact that money is always bundled — *only at the bootstrap layer*. The framework's actual operational claim:

**Users in mature systems should consciously unbundle the functions in their own portfolio, even though the underlying infrastructure remains impure at the bootstrap layer.**

Doña Elena does this. Most of the framework's practical chapters teach how to do this for ordinary readers (see [unbundled personal stack](../practice/unbundled-personal-stack.md)).

## What this corrects in earlier framing

Before this pattern was named, the framework risked picking on specific instruments for being bundled at the protocol level (e.g., criticising Bitcoin's hard cap as "design flaw"). The two-layer pattern corrects this:

- The hard cap is the bootstrap engine. Without it, no infrastructure.
- The bundled bootstrap *funds the unbundling at the use layer*.
- The right question is not "is this token unbundled?" but "can a user, given the existing instruments, build an unbundled portfolio?"

The answer is yes, and Bitcoin (along with other bundled-at-bootstrap instruments) is part of how that becomes possible — not an obstacle to it.

## Implication for new money design

Any new money proposal needs to answer:

1. **What is the bootstrap engine** (state, speculation, use value, platform)?
2. **What does it bundle at the bootstrap layer** (which functions, which modes)?
3. **How can users unbundle at the use layer** (what tools enable function-routing)?
4. **Is the bundling at the bootstrap visible and consensual** (or is it being hidden as "neutral utility")?

## The honest framing

The framework's purity is a description of the *end state*, not the *bootstrap*. New monies *must* bundle to ignite. Mature monies *can* unbundle once the network is dense enough to sustain itself on transaction utility alone.

Pure unbundling at the bootstrap layer is a maturity criterion, not a design criterion. The bootstrap requires bundling, in some form, to overcome the cold-start problem.

## See also

- [Cold-Start Problem](cold-start-problem.md) — why bootstrap requires non-utility incentives
- [Four Bootstrap Engines](four-bootstrap-engines.md) — the four known sources of bootstrap energy
- [Money as Bundle](../core/money-as-bundle.md) — empirical claim about bundling
- [Unbundling Thesis](../core/unbundling-thesis.md) — the engineering response
- [Unbundled Personal Stack](../practice/unbundled-personal-stack.md) — how to operate at the use layer
