# Claude Quick Reference for BOVI

*A working card for anyone — including an AI — building or writing on BOVI **without drifting**. BOVI is an anti-drift tool against money-essentialism; this reference applies the same discipline to the work itself. The default (the "floor") reasserts unless actively held.*

## What BOVI is

An **educational / transmission tool** — the relational, floorless, **ledger** theory of money, plus the four fairness modes (**B**alanced, **O**bligated, **V**alue, **I**mmediate) — built to *arm people to see through money*. It is **not** a currency, not a financial product, not a claim to originality. *Stand on giants; grade **efficacy** (does a learner reach for the four questions?), not novelty.* **A tool for the taxed, not the taxer.**

## The canon — read these first

- **`docs/FOUNDATIONS.md`** — the six-stone derivation (what money *is*, what it's *worth*, what a substrate *requires*, where it *tends*).
- **`docs/CANON.md`** — the 20 Quirks + apparatus (modes, anchors, bootstrap engines, scenes). FOUNDATIONS is canonical on the *foundations*; CANON on the *quirks*.
- **Project memory** — `MEMORY.md` indexes the cross-session notes; load it.

**The six stones, one line each:**
1. **Pull** — money is *pulled* by the need for a reliable memory of *who gave and hasn't yet received* (not *pushed* by what it's made of).
2. **Ledger** — that memory *is* a ledger = **credit**; a divisible, known good *is* one; **credit/record came first**, the token is a later substrate.
3. **Value: floorless-but-fruitful** — worth = the trades it unlocks (generated *inside* the acceptance loop, no floor under it); value is in the **flow**, not the stock.
4. **Axioms** — Resolution (divisible) + Integrity (conservation · authentication · **symmetrically-known supply**); the **skims live in the sufficiency-gaps**. *Known ≠ fixed.*
5. **Bolt-ons** — backing, scarcity, durability, the token, store-of-value: *neither necessary nor sufficient.* Unbundle them.
6. **Melt** — a good medium is a bad store (they can't co-optimise); demurrage/elasticity keep it circulating.

## The working discipline (why the project keeps its integrity)

- **State at exact strength** — no tidy wrapper *above* a result, no false modesty *below* it. Both are miscalibration.
- **Truth-sandwich; never headline a misconception** — fact → brief myth → fact, example clinches. Headlining a myth feeds the very default you're fighting. (See `teaching-truth-sandwich` in memory.)
- **The enemy is essentialism** — "magic in the blood / flag / ground / money" (the *push*). The framework is the *pull*: value is relational. Goldbug / cryptopoof / nationalist are **one error, three substrates.**
- **Concede the demand, refuse the label** — "don't let an authority silently debase the medium" is a legitimate *governance* demand; "therefore the value is in the metal" is the essentialist error layered on top.
- **Verify before asserting or building** — don't build on unseen ground; read the source. **This includes your own tools:** survey subagents over-dramatise ("contradiction!" at an aligned predecessor) — treat their verdicts as leads and verify the load-bearing ones yourself.
- **Borrowed is the strength** — the contribution is *assembly + transmission*, not new theorems.

## Drift-watch (catch and correct on sight)

- barter-first origin / **headlining the barter myth** → it's credit/record-first; double-coincidence is the *acute Value-mode case*, not the root.
- token/commodity-first → the **record** is the money; the token is an optional substrate.
- **fixed/scarce supply as load-bearing** → it's **known ≠ fixed** (auditable & symmetric; can be elastic).
- "money is worth its acceptance" → that's **selection** (which money wins), *not* **value-source** (what it's worth = floorless-but-fruitful).
- the four **modes "emerge" from Value-money** → they're **co-present from the start**; a money that ignores them lets the suppressed ones *reassert*.
- **store-of-value bolted onto the medium** → unbundle it; the medium melts.

## The map

- **Theory** — `docs/FOUNDATIONS.md` + `docs/CANON.md`, with source-children `VALUE-LINEAGE.md`, `MONEY-ABIOGENESIS.md`, `THE-THEORY-OF-MONEY-RECENSION.md`.
- **The app** — *BOVI Exchange Lens / satnav* (TypeScript, M0–M4 layers, deployed: https://bramalkema.github.io/BOVI/). Strong on the **four modes + extraction X-rays** (`lib/m2/moneyVeil`, `lib/m2/pda`). It **predates the rebuild** and is being reconciled — the money-*nature* half (the stones) is the gap. The episode system (`lib/api/episodes.ts`) is **titles-only: no content-delivery mechanism yet** — that's the load-bearing build.
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

1. *What is it, really?* (a claim on whom?)
2. *Why do people accept it?* (anchor: law, math, habit?)
3. *Which job am I using it for — and should spending and saving be the same instrument?*
4. *Who gains when more of it is made?*

Efficacy is measured in a classroom, not a chat.
