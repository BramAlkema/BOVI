# Claude Quick Reference for BOVI

_A working card for anyone — including an AI — building or writing on BOVI **without drifting**. BOVI is an anti-drift tool against money-essentialism; this reference applies the same discipline to the work itself. The default (the "floor") reasserts unless actively held._

## What BOVI is

An **educational / transmission tool** — the relational, floorless, **ledger** theory of money, plus the four fairness modes (**B**alanced, **O**bligated, **V**alue, **I**mmediate) — built to _arm people to see through money_. It is **not** a currency, not a financial product, not a claim to originality. _Stand on giants; grade **efficacy** (does a learner reach for the four questions?), not novelty._ **A tool for the taxed, not the taxer.**

## The canon — read these first

- **`docs/FOUNDATIONS.md`** — the six-stone derivation (what money _is_, what it's _worth_, what a substrate _requires_, where it _tends_).
- **`docs/CANON.md`** — the 20 Quirks + apparatus (modes, anchors, bootstrap engines, scenes). FOUNDATIONS is canonical on the _foundations_; CANON on the _quirks_.
- **Project memory** — `MEMORY.md` indexes the cross-session notes; load it.

**The six stones, one line each:**

1. **Pull** — money is _pulled_ by the need for a reliable memory of _who gave and hasn't yet received_ (not _pushed_ by what it's made of).
2. **Ledger** — that memory _is_ a ledger = **credit**; a divisible, known good _is_ one; **credit/record came first**, the token is a later substrate.
3. **Value: floorless-but-fruitful** — worth = the trades it unlocks (generated _inside_ the acceptance loop, no floor under it); value is in the **flow**, not the stock.
4. **Axioms** — Resolution (divisible) + Integrity (conservation · authentication · **symmetrically-known supply**); the **skims live in the sufficiency-gaps**. _Known ≠ fixed._
5. **Bolt-ons** — backing, scarcity, durability, the token, store-of-value: _neither necessary nor sufficient._ Unbundle them.
6. **Melt** — a good medium is a bad store (they can't co-optimise); demurrage/elasticity keep it circulating.

## The working discipline (why the project keeps its integrity)

- **State at exact strength** — no tidy wrapper _above_ a result, no false modesty _below_ it. Both are miscalibration.
- **Truth-sandwich; never headline a misconception** — fact → brief myth → fact, example clinches. Headlining a myth feeds the very default you're fighting. (See `teaching-truth-sandwich` in memory.)
- **The enemy is essentialism** — "magic in the blood / flag / ground / money" (the _push_). The framework is the _pull_: value is relational. Goldbug / cryptopoof / nationalist are **one error, three substrates.**
- **Concede the demand, refuse the label** — "don't let an authority silently debase the medium" is a legitimate _governance_ demand; "therefore the value is in the metal" is the essentialist error layered on top.
- **Verify before asserting or building** — don't build on unseen ground; read the source. **This includes your own tools:** survey subagents over-dramatise ("contradiction!" at an aligned predecessor) — treat their verdicts as leads and verify the load-bearing ones yourself.
- **Borrowed is the strength** — the contribution is _assembly + transmission_, not new theorems.

## Drift-watch (catch and correct on sight)

- barter-first origin / **headlining the barter myth** → it's credit/record-first; double-coincidence is the _acute Value-mode case_, not the root.
- token/commodity-first → the **record** is the money; the token is an optional substrate.
- **fixed/scarce supply as load-bearing** → it's **known ≠ fixed** (auditable & symmetric; can be elastic).
- "money is worth its acceptance" → that's **selection** (which money wins), _not_ **value-source** (what it's worth = floorless-but-fruitful).
- the four **modes "emerge" from Value-money** → they're **co-present from the start**; a money that ignores them lets the suppressed ones _reassert_.
- **store-of-value bolted onto the medium** → unbundle it; the medium melts.

## The map

- **Theory** — `docs/FOUNDATIONS.md` + `docs/CANON.md`, with source-children `VALUE-LINEAGE.md`, `MONEY-ABIOGENESIS.md`, `THE-THEORY-OF-MONEY-RECENSION.md`.
- **The app** — _BOVI Exchange Lens / satnav_ (TypeScript, M0–M4 layers, deployed: https://bramalkema.github.io/BOVI/). Strong on the **four modes + extraction X-rays** (`lib/m2/moneyVeil`, `lib/m2/pda`). It **predates the rebuild** and is being reconciled — the money-_nature_ half (the stones) is the gap. The episode system (`lib/api/episodes.ts`) is **titles-only: no content-delivery mechanism yet** — that's the load-bearing build.
- **The contracts** — `contracts/` + `contracts/README.md`: the executable canon, named after the popularisers (the honour roll). The app's off-chain JS stubs are **not** wired to the Solidity contracts.
- **Memory** — `framework-foundations-rebuild`, `framework-essentialism-enemy`, `framework-micro-vs-macro-positioning`, `teaching-truth-sandwich`, and the value/lineage notes.

## Dev commands

```bash
npm run build     # build to dist/
npm test          # Jest
# deploy: push to main → GitHub Actions → GitHub Pages
```

## The one test that counts

Not "does this read well to us" — **does a real learner, weeks later, reach for the four questions unprompted?**

1. _What is it, really?_ (a claim on whom?)
2. _Why do people accept it?_ (anchor: law, math, habit?)
3. _Which job am I using it for — and should spending and saving be the same instrument?_
4. _Who gains when more of it is made?_

Efficacy is measured in a classroom, not a chat.
