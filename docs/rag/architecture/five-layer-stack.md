---
title: The Five-Layer Financial Stack
type: architecture
tags: [stack, architecture, wealth, transactions, contracts, sweep, PDA]
sources: [WEALTH-TRANSACTION-SEPARATION.md]
related: [four-functions.md, ../core/unbundling-thesis.md, ../practice/unbundled-personal-stack.md]
---

# The Five-Layer Financial Stack

## Definition

Practical architecture for an unbundled personal money system. Stops bundling wealth storage with transaction currency; optimises each function separately.

This is what Doña Elena (the framework's protagonist) actually does on her iPhone. It is also how sophisticated institutions (treasury departments, family offices, hedge funds) have always operated.

## The five layers

### 1. Long-term Contracting Layer
- **Purpose**: Multi-year obligations (mortgages, pensions, insurance)
- **Solution**: Personal indices denominated in relatable units
  - Housing contracts indexed to local construction costs
  - Pension obligations indexed to cost-of-living baskets
  - Insurance indexed to healthcare costs
- **Key**: Stability over decades, not daily price movements

### 2. Short-term Transaction Layer
- **Purpose**: Daily purchases and immediate exchanges
- **Solution**: Spot money or just-in-time currency conversion
  - Use whatever currency the merchant accepts
  - Convert at point of purchase from wealth storage
  - No need to hold transaction currency in advance
- **Key**: Acceptance and convenience, not returns

### 3. Wealth Storage Layer
- **Purpose**: Maximise returns on assets
- **Solution**: Optimised investment allocation
  - Pension funds for long-term growth
  - Stock markets for appreciation
  - Currency spreads when advantageous
  - High-yield accounts when spreads justify
- **Key**: Never leave wealth sitting in transaction currency

### 4. Price Discovery Layer
- **Purpose**: Know if you're getting a good deal
- **Solution**: PDA (Personal Data Assistant) handles all comparisons
  - No reliance on human memory ("what did this cost yesterday?")
  - Real-time price comparison across venues
  - Automatic inflation/shrinkflation adjustment
  - Context-aware recommendations
- **Key**: Outsource price memory to technology (or a notebook)
- → see [personal PDA](../practice/personal-pda.md)

### 5. Account Sweeping Layer
- **Purpose**: Never leave money idle
- **Solution**: Automatic daily sweeps
  - Current accounts swept to optimal instruments nightly
  - Just-in-time funding for anticipated transactions
  - No idle balances earning zero
- **Key**: Every dollar working every day

## The flow in practice

### Daily transaction example

1. **Morning**: All wealth sits in optimised investments
2. **Lunch purchase**:
   - PDA identifies merchant accepts Euros
   - System pulls $15 from stock position
   - Converts to €14 at spot rate
   - Transaction completes
3. **Evening**: Any unspent currency swept back to investments

### Monthly rent example

1. **Contract**: Rent indexed to local housing costs (denominated in dollars for familiarity)
2. **Payment day**:
   - System calculates indexed amount
   - Liquidates optimal investment mix
   - Converts to landlord's preferred currency
   - Executes transfer
3. **No holding**: Never hold "rent money" — just convert when due

## Why this beats the current path-dependent system

| Current (bundled) | Separated (unbundled) |
|---|---|
| Keep savings in same currency you spend | Wealth always earning returns |
| Hold "emergency funds" in cash earning nothing | Convert only what you need when you need it |
| Remember prices yourself | PDA handles all price intelligence |
| Manual management of accounts | Automatic optimisation |
| Wealth sits idle between uses | No idle capital |

## Implementation requirements

### Technical infrastructure
- Real-time conversion APIs between investment types and currencies
- Personal indexing services for long-term contracts
- PDA with comprehensive price data access
- Automated sweep systems for account management
- Smart liquidation algorithms to minimise conversion costs

### Behavioural changes
- Stop thinking in one currency — think in purchasing power
- Stop holding transaction balances — convert just-in-time
- Stop remembering prices — let PDA handle it
- Stop manual account management — automate everything

## Common objections (and replies)

**"But conversion costs!"** — Even 0.5% conversion cost beats losing 5% annual returns on idle cash.

**"But complexity!"** — The system handles it automatically; simpler than current manual management.

**"But emergencies!"** — Credit lines provide instant liquidity; no need for idle emergency funds.

**"But volatility!"** — Short-term volatility in wealth storage matters less than long-term opportunity cost of cash.

## The bottom line

**Stop storing wealth in transaction currency.** It's like keeping your retirement savings in your wallet — inefficient and unnecessary given modern technology.

The path dependency of "one currency for everything" is costing everyone returns. Time to separate these functions and optimise each layer independently.

## Source quote

> "Stop bundling wealth storage with transaction currency. They serve completely different functions and should be optimized separately." — `WEALTH-TRANSACTION-SEPARATION.md`

## See also

- [Four Functions](four-functions.md) — what each layer satisfies
- [Unbundling Thesis](../core/unbundling-thesis.md) — the framing
- [Unbundled Personal Stack](../practice/unbundled-personal-stack.md) — how to actually build this
- [Personal PDA](../practice/personal-pda.md) — the price-discovery layer
