---
title: The Personal PDA
type: practice
tags: [PDA, price-discovery, notebook, personal-data-assistant, defensive-practice]
sources: [WEALTH-TRANSACTION-SEPARATION.md, conversation-derived]
related: [personal-indices.md, unbundled-personal-stack.md, ../pathologies/inflation-broken-knowledge.md]
---

# The Personal PDA

## Definition

**PDA = Personal Data Assistant.** A tool for tracking your own price history so you can recognise when something is being mispriced (against you).

The minimum viable PDA: **a notebook**. The technology is optional. The discipline is the thing.

## What the PDA does

The minimum function: *"What did I pay for this last time?"*

That single question, asked consistently, defeats:
- **Anchoring** — sellers framing a high reference to make their offer look reasonable
- **Social proof** — "everyone's buying it"
- **Decoy effects** — the €40 option that exists to make €25 feel cheap
- **Recency bias** — forgetting yesterday's price by the time you face today's
- **Surveillance pricing** — sellers individualising the price based on data they have on you that you don't have on the price

Cognitive biases in price perception are not fixable by trying harder. A personal record breaks them at the source.

## The PDA does not have to be all-knowing

A common misunderstanding: that the PDA needs to be a centralised oracle that knows everything. It doesn't. The minimum useful PDA is **just your own purchase history on your own device**.

Your own data, indexed by you, useful to you. No surveillance. No centralised oracle. No governance problem.

## The Spotify analogy

Optional sharing/recommendation features are *upgrades*, not the base case. The base case is "my own data, indexed by me, useful to me." Social features (compare prices with friends, see trends in your area, get warnings about overcharges) are opt-in.

The base PDA cannot be commandeered by the state, the platform, or anyone else. The state can pressure McDonald's to lie about the Big Mac price; it cannot pressure your notebook.

## What goes in the PDA

A minimum-viable PDA tracks:

- A handful of items you actually buy (your personal index — see [personal indices](personal-indices.md))
- Date, location, price, what you actually got
- Optional: vendor, payment method, conversion rate if cross-currency

That's enough to detect:
- Inflation in your actual basket (not the official CPI's basket)
- Surveillance pricing (when one merchant charges you more than another for the same thing)
- Shrinkflation (price stable, package smaller)
- Fee creep (€5 coffee → €5 coffee + €0.50 service + 8% gratuity)
- Currency manipulation (when official rate diverges from blue rate, see [Argentina case](../cases/argentina-bigmac-dollarisation.md))

## Why this beats every cognitive bias

Anchoring, social proof, decoy effects — these all exploit the fact that humans cannot reliably remember prices. They assume you have to *guess* whether a price is fair.

A PDA *answers* the question, instead of guessing. The seller's framing strategies stop working when you can check the actual number.

## The minimum viable PDA in five steps

1. Pick 5–10 items you buy regularly (coffee, transport pass, basics from your weekly shop, rent share, a couple of services)
2. Each time you buy one, write down: date, place, price, what you got
3. Glance at it weekly to notice trends
4. When something is being mispriced, you'll know
5. That's the PDA. No app required.

## Where this fits in the larger framework

The PDA is **the price discovery layer** in the [five-layer financial stack](../architecture/five-layer-stack.md). It separates the unit-of-account function from the medium-of-exchange function — instead of trying to "feel" prices in the currency you transact in, you measure them with your own basket.

It is also the personal-scale parallel to indices like the Big Mac Index. See [personal indices](personal-indices.md).

## Why this is genuinely empowering for a young reader

The framework's defensive vocabulary is most actionable here. After reading the rest of the book a reader may decide not to use crypto, not to start a Tally with friends, not to switch banks — but everyone can pull out a notebook and start tracking what they actually pay for things.

Once installed as a habit, the PDA cannot be uninstalled. The price-tag illusions stop working.

## See also

- [Personal Indices](personal-indices.md) — what to put in your PDA
- [Unbundled Personal Stack](unbundled-personal-stack.md) — where the PDA fits
- [Five-Layer Stack](../architecture/five-layer-stack.md) — the full architecture
- [Inflation as Broken Common Knowledge](../pathologies/inflation-broken-knowledge.md) — why personal measurement beats institutional
- [Argentina: Big Mac War](../cases/argentina-bigmac-dollarisation.md) — why the institutional measure cannot be trusted
