# Notation — every symbol in the cast, and what it means

The contracts carry maths in their headers. This is the key. Each symbol lists what it *is*, the scale it is carried in, its admissible range, where it is defined, and the equation it appears in.

Two conventions first, because they cause more confusion than anything else here.

<a id="conventions"></a>
## Fixed-point conventions

Solidity has no floats. Everything below is an integer in one of two scales.

| convention | value | used for | read as |
|---|---|---|---|
| <a id="bps"></a>**BPS** | `10_000` | rates, shares, probabilities | `10_000` = 100%, `250` = 2.5% |
| <a id="wad"></a>**WAD** | `1e18` | ratio accumulators inside loops | `1e18` = 1.0 |

Rates arrive as **bps**; anything compounded or discounted moves into **WAD** for the loop and comes back. A quantity named `…Bps` is always a rate or share; a bare quantity is a stock or a flow in the ledger's own units.

One subtlety worth stating because it looks wrong on first read: in the variance terms of [`ExperimentCalibrationEvidence`](#se), a probability in bps multiplied by another probability in bps yields **bps²**, which is then divided by a sample count and square-rooted back to **bps**. The dimensions are right; the intermediate just isn't a percentage.

---

<a id="level"></a>
## Level and exposure — [`NominalExposureMeter.sol`](NominalExposureMeter.sol)

Who a moving price level moves against. The mechanism is a claim fixed in nominal terms with a remaining term — not proximity to the issuer.

| symbol | code | is | scale | range | notes |
|---|---|---|---|---|---|
| <a id="pi"></a>**π** | `piBps` | change in the price level over the measured interval | bps | ≥ 0 | Deflation is out of scope for this meter and returns 0. Read from [`SharedNumeraire`](SharedNumeraire.sol) or supplied. |
| <a id="nnp"></a>**NNP** | `netNominalPosition` | net nominal position: nominal assets − nominal liabilities | ledger units, **signed** | any | `+` = net nominal **creditor** (loses to inflation); `−` = net nominal **debtor** (gains). Σ over a closed set must be **0**. |
| <a id="F"></a>**F** | `flowPerPeriod` | a payment fixed in nominal terms, per period | ledger units | ≥ 0 | The rent, the wage. Cantillon's *baux* and *gages fixes*. |
| <a id="T"></a>**T** | `remainingTerms` | periods still to run before the claim can be re-priced | count | 0 … `MAX_TERMS` (240) | Exposure → 0 as T → 0. Renewal is the cure. |
| <a id="r"></a>**r** | `discountBps` | discount rate per period | bps | ≥ 0 | Same meaning wherever `r` appears in the cast. |
| <a id="dt"></a>**d_t** | `d` | discount factor at period *t*, `(1+r)^−t` | WAD | (0, 1] | Loop accumulator. |
| <a id="ft"></a>**f_t** | `f` | real-value factor at period *t*, `(1+π)^−t` | WAD | (0, 1] | Loop accumulator. `1 − f_t` is the period's real shortfall. |

**Stock channel** — the Fisher/Doepke–Schneider revaluation:

```
realGain_i  =  − NNP_i · π / (1 + π)
```

**Flow channel** — Cantillon's own, and what the duration adds:

```
loss  =  Σ_{t=1..T}  F · d_t · ( 1 − f_t )
      =  Σ_{t=1..T}  F · (1+r)^−t · ( 1 − (1+π)^−t )
```

**Invariant:** `stockRevaluationSum` over a closed set of parties must read **0**. Redistribution conserves. Compare [`netSupply`](#netsupply).

---

<a id="capacity"></a>
## Capacity — [`SinkCapacityEvidence.sol`](SinkCapacityEvidence.sol)

Whether an obligation-sink is big enough to do the work claimed of it. Two conditions that fail independently.

| symbol | code | is | scale | range | notes |
|---|---|---|---|---|---|
| <a id="M"></a>**M** | `stock` | outstanding units the sink must be able to absorb | ledger units | > 0 | A sink with no stock to absorb is not a question. |
| <a id="Ot"></a>**O_t** | `decreed[t]` / `realised[t]` | obligation falling due in period *t* | ledger units | `realised ≤ decreed` | **Realised** enters the verdict. A decree is not a collection. |
| <a id="H"></a>**H** | `decreed.length` | horizon: how many periods the obligation stream runs | count | 1 … `MAX_HORIZON` (240) | Finite by construction — the unravelling argument needs an end. |
| <a id="kappa"></a>**κ** | `coverageBps` | coverage ratio, `Σ O_t / M` | bps | ≥ 0 | **`10_000` = exactly covered.** Below it, some units reach the horizon with no terminal use. Computed **undiscounted** — see below. |
| <a id="gamma"></a>**γ** | `gammaBps` | issuer's share of trading encounters | bps | 0 … `10_000` | Li & Wright's participation measure. |
| <a id="gammastar"></a>**γ\*** | `gammaStarBps` | the threshold γ must clear | bps | 1 … `10_000` | Model-dependent. **Must be declared with a justification**; `verdict` returns `Undeclared` until it is. |

```
Condition A (coverage)       κ  =  Σ_{t=1..H} O_t  /  M        require κ ≥ 1
Condition B (participation)  γ  ≥  γ*
```

**Why κ is undiscounted.** Coverage is an *absorption* question, not a *pricing* one: discounting changes what a sink is worth, not whether it can swallow the stock. `presentValue(id, r)` is exposed for pricing and is deliberately excluded from the verdict.

**Performance shortfall** — `(Σ decreed − Σ realised) / Σ decreed`, in bps. This is a measurement, not an enforcement module. A contextual [`ReputationMemory`](ReputationMemory.sol) record may preserve an attributed finding; affected counterparties or institutions separately choose any future response.

---

<a id="experiment"></a>
## Experiment — [`ExperimentCalibrationEvidence.sol`](ExperimentCalibrationEvidence.sol)

The paired treatment on the zero floor. Descriptive statistics only.

| symbol | code | is | scale | range | notes |
|---|---|---|---|---|---|
| <a id="p"></a>**p** | `cooperationBps` | cooperation rate: helped / opportunities | bps | 0 … `10_000` | One per arm. |
| <a id="b"></a>**b** | `bindingBps` | binding frequency: blocked / attempted | bps | 0 … `10_000` | **Did the floor ever bite?** If `b = 0` in the constrained arm, the limit never bound and no difference between arms is attributable to it. |
| <a id="Delta"></a>**Δ** | `treatmentEffectBps` | treatment effect, `p_constrained − p_unconstrained` | bps, **signed** | any | Capital delta. Their result: positive, collapsing toward 0 when the floor is lifted. |
| <a id="se"></a>**se** | `standardErrorBps` | standard error of a difference in proportions | bps | ≥ 0 | See below. |
| <a id="n"></a>**n** | `minSample`, `opportunities` | sample size per arm | count | ≥ `minSample` | The minimum must be **declared with a justification before collection** and cannot be changed. |

```
p    =  helped / opportunities
b    =  blocked / attempted
Δ    =  p_constrained − p_unconstrained
se   =  sqrt(  p₁(1−p₁)/n₁  +  p₂(1−p₂)/n₂  )
```

`withinNoiseBand` reports whether `|Δ| ≤ 2·se`. **This is a rule of thumb, not a hypothesis test.** There is no p-value here and none is implied.

---

<a id="ledger"></a>
## Ledger — [`SignedPositionLedger.sol`](SignedPositionLedger.sol)

| symbol | code | is | scale | range | notes |
|---|---|---|---|---|---|
| <a id="balance"></a>**balance** | `balance` | signed peg position | ledger units, **signed** | ≥ −`creditLimit` | Negative is permitted — that is the whole design, and the reason the floor's enforcement has to be supplied elsewhere. |
| <a id="creditlimit"></a>**creditLimit** | `creditLimit` | maximum permitted debt | ledger units | ≥ 0 | An ex-ante exposure guard, not enforcement of existing debt. Set it to maximum and you are running [`ExperimentCalibrationEvidence`](#experiment)'s unconstrained arm. |
| <a id="netsupply"></a>**netSupply** | `netSupply()` | Σ of all balances | ledger units, signed | **must be 0** | The conservation invariant. |
| <a id="gross"></a>**gross** | `grossInCirculation()` | Σ of positive balances | ledger units | ≥ 0 | ⚠ Reads raw balances, so it **overstates** by the sum of pending demurrage. |
| <a id="demurrage"></a>**demurrageBps** | `demurrageBps` | melt per `demurragePeriod` on positive balances | bps | ≥ 0 | ⚠ Applied retroactively over the un-accrued span. |

---

<a id="valuation"></a>
## Valuation — Epilogue A.4 (prose, not yet a contract)

| symbol | is | notes |
|---|---|---|
| <a id="phi"></a>**φ_t** | value of one unit of money at *t* | |
| <a id="beta-discount"></a>**β** | discount factor | **See collisions.** |
| <a id="L"></a>**L** | liquidity premium (a rate) | |
| <a id="ell"></a>**ℓ** | per-period liquidity service (a flow) | The numerator. Not the same object as `L`. |
| <a id="delta-hazard"></a>**δ** | per-period probability the acceptance network dies | **See collisions.** Selection and termination live here; value lives in `ℓ`. |

```
φ_t  =  β · E[ φ_{t+1} · (1 + L(q_{t+1})) ]        →  under lim β^T φ_{t+T} → 0
φ_t  =  Σ_{s>t} β^(s−t) · E[ φ_s · L_s ]
V    =  ℓ / (r + δ)
```

Note the summed form carries `φ_s · L_s`, not `L_s` alone — `L` is a rate, so the service in the sum is the rate times the price.

---

<a id="collisions"></a>
## Collisions — read this before adding a symbol

Building this reference surfaced two clashes between the contracts and the Epilogue. **Both are now resolved in favour of the Epilogue**, which had them first and uses them in a published-standard sense.

| symbol | Epilogue A.4 | formerly also in BCC | resolution |
|---|---|---|---|
| **β** | discount factor | binding frequency | BCC's binding frequency is now **`b`** |
| **δ** | network-death hazard | treatment effect | BCC's treatment effect is now **`Δ`** (capital) |

**`r` is shared deliberately** and means the same thing everywhere: a per-period discount rate. That is a convergence, not a collision.

Before introducing a symbol, search this file. A symbol that means two things in one building is a defect, not a shorthand.
