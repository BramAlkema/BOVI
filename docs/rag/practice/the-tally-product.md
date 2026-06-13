---
title: The Tally — Modern Tally Rope Product
type: practice
tags: [tally, product, splitwise, mode-aware, group-finance, tally-rope]
sources: [STARSHIP-TALLY-ROPE-ADVENTURE.md, conversation-derived]
related: [../modes/balanced-mode.md, ../modes/immediate-mode.md, ../architecture/mode-collision.md]
---

# The Tally — Modern Tally Rope Product

## Definition

**A mode-aware group ledger.** The modern equivalent of the historical tally rope — built for the social units closest to a 20-something's life: flatshare, friend group, couple, festival squad, band.

What Splitwise gets wrong, the Tally fixes: by tagging each transaction with one of the four BOVI modes, the math becomes mode-specific instead of forcibly converting all exchanges into Balanced-mode debts.

## The historical tally rope (background)

The medieval coordination device after which the product is named: a central hub with spokes; each knight has a peg on a shared rope. Pegs slide toward what the knight wants; rope tensions reveal preferences instantly. A mechanical market combined with a public ledger.

Properties:
- **Mechanical conservation**: cannot fake the rope
- **Public visibility**: everyone sees every peg
- **Position-as-preference**: peg movement reveals intent
- **Multilateral coordination**: circular trades become visually obvious
- **Single coherent display**: not per-user dashboards

The historical rope was secretly a Balanced-mode primitive. The Tally extends it to all four modes.

## What Splitwise gets wrong

Splitwise treats *everything* as Balanced. That's the whole problem. It silently converts:
- Gifts → debts
- Market trades → obligations
- Rent payments → peer reciprocity
- Care work → uncompensated invisible labour

It strips mode information and applies one mode to everything — which is precisely the bundled-money mistake the framework is trying to undo. It makes friendships feel transactional because *every act becomes a ledger entry of the same kind*.

## The Tally inversion

The Tally's design move: **the mode is the data, the transaction is the action.** You can't add a transaction without saying what kind it is.

Four colored buttons:

- 🔴 **Obligated** — *"This is rent / bills / something we agreed to pay."* Sets up recurring. Auto-debits. Late is late, not negotiable.
- 🟢 **Value** — *"Market transaction."* Settles immediately. Spot price. No memory beyond the receipt.
- 🔵 **Balanced** — *"You owe me, we'll square up."* Adds to running ledger. Visible to both sides. Auto-nets if a circular debt emerges (A→B→C→A cancels with one tap).
- 🟡 **Immediate** — *"This is a gift."* Recorded but doesn't count toward anyone's score. Visible as an act, not a debt.

The arithmetic is mode-specific:
- Balanced math = running net + auto-netting
- Value math = settle now, no memory
- Obligated math = scheduled recurring
- Immediate math = visible but uncounted

## The Immediate-mode button is the killer feature

It lets you mark something as a gift *without it secretly converting to a debt in someone's head*. That's the warmth-preserving feature Splitwise structurally cannot offer.

Splitwise can't add an "Immediate" tag without breaking its model. The Tally is built around the assumption that some exchanges should not become debts.

## The visualisation

Inherits from the historical rope: one canvas, not per-user dashboards. Everyone's net position visible to everyone. Circular debts highlighted with a *"tap to net"* button. Gifts shown as warm marks with no number attached. Upcoming obligations shown as approaching pulses on a timeline.

## Use cases

- **Flatshare**: rent (Obligated), groceries (Balanced), the time someone covered you when you were broke (Immediate), the night out you all chipped in for (Value)
- **Travel squad**: petrol (Balanced), the meal someone's parent paid for (Immediate), the Airbnb deposit (Obligated), the souvenir round (Value)
- **Couple**: shared bills (Obligated), spontaneous treats (Immediate), the big purchase you're saving for (Balanced), eating out (Value)
- **Band / collective project**: gear (Obligated split), the loan from someone's uncle (Balanced), the gig fee from the bar (Value), the bandmate's cousin who lets you crash for free (Immediate)

Every shared-money situation a 20-something has, with the modes made visible.

## Defensive vocabulary in product form

Every transaction trains the reflex: *"What mode is this?"* becomes muscle memory because the app makes you answer it before anything else happens. The framework gets installed by use, not by reading. After three months in a Tally with flatmates, you're choosing modes in your head about transactions that have nothing to do with the app.

## The relationship-defining commitment

Forming a Tally with someone is heavier than downloading an app, lighter than signing a contract. **You don't just *use* a Tally — you *enter* one.** The act of forming it is the act of saying *"these are the four modes we agree are real between us."*

That social weight is exactly what Splitwise tries to avoid (because they want frictionless onboarding) and what the original tally rope embraced (because the commitment was the whole point).

## Cold-start strategy

The Tally inherits the cold-start problem (see [cold-start](../architecture/cold-start-problem.md)). Its bootstrap engine is **platform leverage** — the Tally lives as a thin layer on top of existing chat infrastructure (WhatsApp, iMessage, Signal). It doesn't need to bootstrap its own social network; it inherits the host's.

Trade-off: dependency on the host platform's politics and survival. But for the friend-group scale this is acceptable.

## Open design questions

1. **Settlement**: does Value-mode actually settle on-chain / via Wise / via a stablecoin, or is it just notation?
2. **Privacy gradient**: full transparency to the group? or can you hide individual line items while showing your net?
3. **Exit**: when someone leaves the Tally, how do you settle Obligated and Balanced cleanly?
4. **Onboarding mode**: do you start in single-mode (Balanced only, Splitwise-equivalent) and unlock the others as the group matures? Or four-mode from day one?

## See also

- [Balanced Mode](../modes/balanced-mode.md) — the original Splitwise problem
- [Immediate Mode](../modes/immediate-mode.md) — what gets preserved
- [Mode Collision](../architecture/mode-collision.md) — what the Tally prevents
- [Bridal party scene](../glossary.md) — the canonical use case
- [Cold-Start Problem](../architecture/cold-start-problem.md) — bootstrap challenge for the Tally itself
