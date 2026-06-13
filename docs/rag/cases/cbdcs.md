---
title: Central Bank Digital Currencies (CBDCs)
type: case
tags: [cbdc, central-bank, digital-currency, surveillance, programmable-money]
sources: [examples.md]
related: [bitcoin.md, ../architecture/four-bootstrap-engines.md, ../core/three-anchor-types.md]
---

# Central Bank Digital Currencies (CBDCs)

## What they are

State-issued digital currencies, designed and operated by central banks. Variously: digital forms of cash, programmable payment instruments, or surveillance-friendly replacements for paper money.

Examples: e-CNY (China, large-scale rollout), the digital euro (in development), digital yen (in pilot), eNaira (Nigeria, struggling adoption), Sand Dollar (Bahamas, live).

## BOVI mode profile

CBDCs are the inverse of Bitcoin: they preserve and *enhance* state-mode authority while attempting V-mode efficiency.

### Obligated mode (O) preservation
- Central bank retains monetary policy control
- Government maintains tax collection mechanism
- **Programmable money enables precise policy implementation** — direct transfers, expiring stimulus, conditional spending
- Authority ranking explicitly maintained and *strengthened*

### Balanced mode (B) enhancement
- Real-time settlement reduces system risk
- Perfect transaction records improve accounting
- Automated compliance reduces enforcement costs
- Transparent ledger (for authorities) improves oversight

### Value mode (V) efficiency
- Lower transaction costs than current payment systems
- Faster settlement than traditional banking
- Better cross-border payment infrastructure
- Enhanced financial inclusion (for the unbanked)

### Immediate mode (I) concerns
- Privacy loss violates personal autonomy expectations
- Programmable restrictions feel coercive
- Government surveillance capability creates unease
- Distance from "real money" intuitions

## CBDC vs Bitcoin: the bundle comparison

| Mode | Bitcoin's coalition | CBDC's coalition |
|---|---|---|
| Value (V) | ✅ optimised for | ✅ enhanced |
| Balanced (B) | ✅ ledger-enhanced | ✅ ledger-perfect |
| Obligated (O) | ❌ rejected | ✅ central |
| Immediate (I) | ✅ "feels fair" | ❌ feels surveilled |

- **Bitcoin**: V+B+I coalition against O-mode
- **CBDC**: O+B+V coalition managing I-mode resistance

Different bundles for different politics. Each is making different mode trade-offs explicit.

## Why most CBDCs are confused designs

Most actual CBDC projects try to be three things at once:

1. **A transaction tool** (efficient payment rail)
2. **A surveillance tool** (full-visibility ledger for the state)
3. **A deposit substitute** (something users hold instead of bank deposits)

These three goals **conflict**:
- A transaction tool wants to be invisible and fast
- A surveillance tool wants to be visible and traceable
- A deposit substitute wants to be held (which threatens commercial banks)

Confused design produces confused adoption. Nigeria's eNaira has had famously poor uptake; the digital euro has been in development for years without launch.

## The framework's recommendation: explicit unbundling

A *thoughtful* CBDC design would commit to one role and unbundle the others. The most plausible synthesis:

**Transaction-only CBDC**: mandated by design to be a transaction-only instrument — no interest paid, no investment yield, anti-hoarding mechanics built in. The state pays the bootstrap (state coercion engine); the design refuses to let the token bundle into store-of-value.

This would be a clean Value-mode (transaction) + Obligated-mode (state-issued) coalition, leaving Balanced (savings) and Immediate (gift) to other instruments.

Some thoughtful proposals aim at this. Most actual CBDC projects do not.

## Where this fits in the cold-start picture

CBDCs have a built-in bootstrap engine: **state coercion** (one of [the four engines](../architecture/four-bootstrap-engines.md)). The state can mandate adoption by banks, accept it for tax, require it for benefit payments.

This makes the cold-start problem much easier than for crypto. But it also means the CBDC inherits the state's *legitimacy* problem: it works as well or as badly as the state behind it.

## What this case teaches the framework

1. **Bundling at design vs at use**: CBDCs choose their bundle explicitly (which is honest); but most choose *too much* bundle (transaction + surveillance + deposit substitute = confusion)
2. **State bootstrap engines have a credibility ceiling**: a corrupt or distrusted state cannot bootstrap a credible currency, no matter the technical design
3. **Programmability is double-edged**: same feature that enables targeted stimulus also enables targeted restriction
4. **The mode trade-offs are visible**: CBDCs make state-mode dominance explicit, which is more honest than fiat (which dresses state coercion as "neutral monetary policy")

## See also

- [Bitcoin](bitcoin.md) — the contrasting design philosophy
- [Three Anchor Types](../core/three-anchor-types.md) — CBDCs use legal anchor
- [Four Bootstrap Engines](../architecture/four-bootstrap-engines.md) — state coercion is the engine
- [Money as Bundle](../core/money-as-bundle.md) — CBDCs make bundling explicit
