# Money Abiogenesis — how money precipitates from a tradeability gradient

The genesis half of the value theory. `VALUE-LINEAGE.md` says what money's value _is_ (floorless but fruitful — the marginal trades it enables). This says where money _comes from_, and _why it is the ledger that wins_.

It is the transaction-cost (Mengerian) counterpart to Samuelson's relay: where Samuelson shows fiat money _can hold_ value once it exists, this shows money **self-assembles** from a gradient — an abiogenesis — and decomposes "tradeability" to reveal that the heavy lifting is done by **known, divisible supply: the ledger**, not by anything commodity-like.

## Setup

Agents each hold one good and want a different one, arranged so **direct double-coincidences are rare** (a long want-cycle, not matched pairs). Give each good _i_ a **tradeability** `τ_i ∈ (0,1]` — the ease of executing one trade-leg involving _i_ (1 = frictionless).

Trade-leg cost rises as goods get less tradeable. Two regimes:

- **Direct** `X → Y` needs a _double_ coincidence (someone holding Y who wants X). With `d ≪ 1` the double-coincidence factor:

  `C_direct = κ / (τ_X · τ_Y · d)`

  — the `d` in the denominator makes it expensive: matches are rare.

- **Indirect** `X → M → Y` (_mix in_ M) is two _single_-coincidence legs (everyone takes M; everyone gives goods for M):

  `C_indirect = κ/(τ_X·τ_M) + κ/(τ_M·τ_Y)`.

## Result 1 — mixing in lowers total cost (Menger, formalized)

`C_indirect < C_direct`:

```
  1/(τ_X·τ_M) + 1/(τ_M·τ_Y)  <  1/(τ_X·τ_Y·d)
  (τ_X + τ_Y)/(τ_X·τ_Y·τ_M)  <  1/(τ_X·τ_Y·d)
  (τ_X + τ_Y)/τ_M            <  1/d
```

reduces cleanly to:

> **τ_M > d · (τ_X + τ_Y)**

Because `d` is tiny (direct barter is so improbable), the bar on the right is near zero — so **even a modestly-tradeable intermediary beats direct exchange, despite adding a trade.** And the higher `τ_M`, the more goods-pairs for which mixing-in-M wins. _Adding_ a trade _lowers_ the total because the added legs route through a good that is cheap to trade. That is the whole of "money's value is the transaction cost it avoids," in one inequality.

## Result 2 — abiogenesis (money self-assembles)

Make tradeability **endogenous**. Let `a_M` = the fraction of agents who'll accept M, and `τ_M = β_M · g(a_M)` with `g` increasing (more acceptors → easier to offload → higher tradeability) and `β_M` the good's _intrinsic_ edge. Agents route every trade through `argmax_i τ_i`. Then:

> use M as intermediary → `a_M` ↑ → `τ_M` ↑ → (Result 1) M wins _more_ pairs → more use → `a_M` ↑ → …

**Positive feedback — autocatalysis.** A good whose use-as-money raises its own tradeability, which raises its use-as-money, is the economic analogue of an _autocatalytic set_ in origin-of-life chemistry: the smallest initial edge `β` snowballs to monopoly. The dynamics converge to **one** good with `τ → 1, a → 1` (universal money), all others → 0.

As in Samuelson, there are **multiple equilibria** — _which_ good wins is path-dependent (a Schelling point) — but _that_ some good wins is **generic**. Money isn't designed or decreed; it precipitates out of the gradient. Trade is the primordial soup; money is the self-replicating cycle that bootstraps out of it.

## Result 3 — the ledger does the heavy lifting in `τ`

Everything turns on `β`, the intrinsic edge that seeds the snowball. Decompose the per-leg cost into what it is actually made of, and ask which good-properties cut each piece:

| transaction-cost component                        | what cuts it                                | ledger or commodity?                                      |
| ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| **search** (find a counterparty)                  | acceptance / network                        | ledger-network (endogenous — the feedback)                |
| **bargaining / sizing** (match the trade exactly) | **divisibility + fungibility**              | **ledger** (free for a number; a cow can't be halved)     |
| **verification** (cheated on quantity / quality?) | **known, symmetric, auditable supply**      | **ledger** (the total is known; gold's supply is a guess) |
| **carriage** (hold it between leg 1 and leg 2)    | weightless transfer, persistence-while-held | **ledger** (an entry weighs nothing)                      |
| ~~use-value, beauty, "intrinsic worth"~~          | —                                           | **commodity — and it cuts _nothing_**                     |

Every component that actually lowers transaction cost is a **ledger property**. The commodity properties — what the thing is made of, what it's worth to consume — are **orthogonal** to "can I trade this leg cheaply?" They do no work in `τ`. Therefore:

> **`β` is high to the extent a good is _ledger-like_: known, divisible, fungible, auditable, transferable — not to the extent it is a valuable commodity.**

Two pieces do the most lifting, and they are exactly the framework's two supply axioms:

- **Known supply** kills the biggest barter cost — _verification_. A symmetric, auditable total means _you can't be fooled about how much exists, or be handed a fake undetectably._
- **Divisibility** kills _bargaining_ — match any trade exactly, no "can't pay half a cow."

(See the canon: _symmetrically known supply_ and the _freebie_ status of divisibility for a ledger — divisibility is a _property a ledger has for free_, a problem only a commodity must solve.)

## Result 4 — so money evolves toward the pure ledger

Since maximising `τ` _is_ maximising ledger-likeness, the autocatalytic climb does not stop at a commodity. It keeps going **up the tradeability gradient toward the `τ = 1` limit — which is the pure ledger**: infinitely divisible, perfectly fungible, supply exactly known, transfer weightless.

The commodity was only ever an **imperfect carrier** of ledger-properties:

```
  cattle  → metal → coin → banknote → bank-ledger → chain
  (divisibility   (verification +     (near-perfect    (perfect
   failure)        supply doubt)       ledger)          ledger)
```

Each step is more ledger-like → more tradeable → selected. So **money sheds the commodity and approaches the bare ledger.** Abiogenesis at the start; the climb to the pure ledger ever after. This is why the historical record reads as _ledger-reliability improving over time_, not _commodity → abstraction_ — and why the framework's minimal money is a net-zero credit ledger, not a token.

## How it sits next to Samuelson

|                | Samuelson / Tirole                         | this model                                                       |
| -------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| question       | can fiat money _have_ value?               | how does money _come to be_, and _why this good_?                |
| answer         | yes — a self-relaying bubble (consistency) | it precipitates from a tradeability gradient (genesis)           |
| selection      | punted (multiple equilibria)               | same multiplicity, but the _winner_ is the most ledger-like good |
| "tradeability" | not decomposed                             | **decomposed → it _is_ ledger-likeness**                         |

Complementary: Samuelson proves the floorless value is _consistent_; this proves it _emerges_, and identifies what tradeability is _made of_ — and the heavy lifting is **known divisible supply: the ledger.**

## Honest pedigree

- The emergence is **Kiyotaki–Wright (1989)** — money as "the most marketable good" — in transaction-cost dress, with Menger's saleability (_Grundsätze_ 1871, "On the Origin of Money" 1892) underneath.
- The move that is the framework's own: the **decomposition of marketability into ledger-vs-commodity properties**, showing marketability _is_ ledger-likeness — so the autocatalytic climb ends at the bare record, and the two supply axioms (known supply, divisibility) fall out as the `τ`-drivers.

## The identity — a divisible, known-supply good _is_ a ledger

Not an analogy — an identity. Read off what each piece of a circulating good _is_:

| the divisible, known-supply good | =     | the ledger                                                                    |
| -------------------------------- | ----- | ----------------------------------------------------------------------------- |
| how much you hold                | **=** | your **balance** (net claim on everyone else)                                 |
| a trade (good moves A → B)       | **=** | a **ledger entry** (A down, B up)                                             |
| the total in existence           | **=** | the **conserved sum** of all balances                                         |
| **divisibility**                 | **=** | the ledger's **resolution** (entries take any value, not lumps)               |
| **known supply**                 | **=** | the ledger's **integrity** (auditable, conserved total — no phantom balances) |

The _distribution of the good across people_ **is** the ledger state. No separate book is kept; the book is written in who-holds-how-many. The two supply axioms aren't features money happens to have — **they are the definition of a ledger restated as properties of a good:** "sufficiently divisible" _is_ sufficient resolution; "sufficiently known supply" _is_ sufficient integrity. To have enough of both _is_ to be a ledger. (That is why those two do all the heavy lifting in `τ`: they are the two things that make any substrate a ledger at all.)

Two consequences:

1. **Menger and Kocherlakota were never two theories.** "Mix in a saleable good" and "keep a record of who's owed" are the same act from two sides — a divisible, known-supply good _is_ a record of who's owed. The commodity was only ever the **substrate the ledger was kept on**, never a backing under it. _Commodity money was always ledger money in a costume._
2. **There was no transition from commodity money to abstract/fiat money.** It was a ledger from the first circulating divisible-known-supply good. What changed over history wasn't substance becoming abstraction — it was the **substrate getting thinner** (cattle → metal → coin → note → book → chain), each a better place to keep the _same_ ledger, climbing to the `τ = 1` limit where the carrier vanishes and only the record remains. The "abstraction" is just shedding a superfluous carrier. _Money is memory, and always was — even when it looked like gold._

This sharpens Kocherlakota's own theorem. He proved money is _equivalent to_ memory (an equivalence in outcomes). The statement here is tighter: a sufficiently-divisible-known-supply token doesn't _behave like_ a ledger, it **is one, structurally** — the holdings _are_ the balances, the supply-conservation _is_ the accounting identity. The same object, read in the distribution of a good rather than the rows of a book — which is exactly the two lines at the core of `Kocherlakota.sol`: _one mark down, one mark up, summing to zero._ Not a model of a coin changing hands; what a coin changing hands always was.

## See also

- `docs/VALUE-LINEAGE.md` — what money's value _is_ (Simmel / Patinkin: floorless but fruitful). This doc is the _genesis_ companion.
- `contracts/Kocherlakota.sol` — the `τ = 1` limit, instantiated: a net-zero ledger, no token, divisibility free, supply known.
- Canon: _symmetrically known supply_; divisibility as a ledger _freebie_; ledger-reliability-improving-over-time as the read on monetary history.
