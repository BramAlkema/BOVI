# A specification language for economic claims

*Design note. Nothing here is built. This is the programme the Judgement Register implies and the Epilogue's Part C does not contain — written down so it can be argued with.*

## The goal

One notation for an economic claim that compiles to **three targets**:

| target | what it answers | today |
|---|---|---|
| **prove** | is the claim internally consistent? | hand-written maths (Epilogue Part A) |
| **simulate** | what does it do with heterogeneous agents over time? | hand-written ABM, if at all |
| **deploy** | does it survive contact with people and money? | hand-written contracts (the Appendix) |

Today the canon renders the same object three times, independently, and keeps the renderings in step by the author's care. That is the defect. **One source, three derivations, and the discrepancies between targets are findings rather than mistakes.**

## Why not maths — the complaint, stated exactly

Not that maths is imprecise. It is exactly precise about the things it chooses to mention, and **permissive about omission**, which is a different property and the one that matters here.

Write `U(c)` and the notation will never ask you: who may trade with whom, on what record, cleared when and against what, adjudicated by whom when disputed, and who counts as a party at all. Those are not details beneath the model. They are the model's institutional content, and standard notation lets it stay unstated, which means it stays unargued. An equilibrium condition silently fixes an information structure; a functional form silently fixes comparability; a representative agent silently fixes the distribution the whole question was about.

So the claim for a specification language is **not that it is more powerful than mathematics. It is that it is less permissive.** It should refuse to compile an under-specified claim. That is the same discipline a contract imposes — *you cannot implement a step you can only gesture at* — generalised from a contract to a notation.

Maths keeps everything it is good at: optimisation, asymptotics, existence, proof. This is a complement, and any framing in which it replaces mathematics is an overclaim.

## Primitives

Drawn from the framework, not invented for the occasion.

**Agents are declared by their observable actions, not their utilities.** A specification may say what an agent *can do* and what it *observes*. It may not contain a preference. Preferences enter only as bonded assumptions (below), which is where they belong, because that is where they are contestable.

**Ledgers are first-class.** Positions, entries, conservation, resolution, and who may write. Stone 2 is the substrate: an entry is an unfinished exchange, and the specification says what makes it finished.

**Modes are types.** This is the sharp one, and it is already sitting in Epilogue A.9 as a table:

| mode | scale | permitted arithmetic |
|---|---|---|
| Immediate | nominal | recorded, never nettable |
| Obligated | ordinal | ranked, clears on schedule with penalty |
| Balanced | interval | differences meaningful; nets over a window |
| Value | ratio | ratios meaningful; clears instantly at prices |

Make that a **typing rule and the compiler catches category errors economics currently makes in prose.** Averaging Immediate-mode entries is a type error. Netting an Obligated entry against a Value entry without a declared conversion is a type error. Summing across modes to get a total is the type error that produces most of what this book calls extraction.

And it gives the Tiv chapter a formal reading: a society's spheres *are* a type system, and general-purpose money is **type erasure** — one denominator laid underneath every sphere, after which nothing can be said to be the wrong kind of thing. Bohannan's moral disquiet is a type error that the notation of the day could not express.

**Assumptions are bonded commitments.** An assumption is not evaluated by the machine; it is *held* by it. Each carries: a scope (population, period, range), a **refutation condition** — the observation that would kill it, and who may submit it — a stake, and open standing to challenge. Results declare which assumptions they rest on, and refutation **propagates**: kill an assumption and everything downstream is marked unsupported without anyone deciding to do so. The primitive already exists as `ChallengeBond`; what is missing is the dependency graph.

**Judgement points are typed holes.** Adjudicative, epistemic, normative, constitutive — each needs a different guard, and a specification with an unfilled hole does not compile. Part C becomes a compiler check rather than an essay.

## What each target buys

**prove.** Nothing new, but it comes free rather than by hand, and it can no longer quietly disagree with the other two.

**simulate.** The honest reason ABM has not displaced DSGE is degrees of freedom: an agent-based model can be made to fit almost anything, so fitting is weak evidence. **The bonded-assumption register is the answer to that specific objection** — it fixes in advance which knobs the modeller was permitted to turn, at what scope, with a stake attached, before the run. An ABM whose free parameters are all declared and staked is a different epistemic object from one whose aren't.

Prior art to stand on rather than reinvent: the agent-based computational economics tradition, and Steve Keen's *Minsky*, which is the clean case of simulation used to pin down an assumption — building the double-entry model is what changed his mind about the sectoral claim.

**deploy.** The Tally, the Exchange Lens, the contracts. Deployment tests what neither proof nor simulation can: whether people will use it, what they do to it, and which judgement points get captured first. Its weaknesses are equally plain — n=1, no counterfactual, and real consent obligations to whoever is inside it.

The design's actual claim is about the **triangle**, not any vertex. A claim that proves, simulates and deploys consistently has survived three different kinds of contact. Where the three disagree is where the theory is doing hidden work.

## Honest limits

- **Nothing is built.** This is a sketch, and the gap between a table of primitives and a working compiler is most of the effort.
- **It does not replace mathematics** and should never be described as doing so.
- **Two things stay irreducible**, exactly as Part C says: the **constitutive** question (who may enter a claim, who has standing to challenge) and the **keeper** (nothing propagates until someone calls it). Everything else moves from *impossible* to *bonded*.
- **The ledger analogy is partial, and the axioms should be marked.** Resolution carries — a claim must be fine-grained enough to be individually refutable. Authentication carries — who asserted this. Conservation does not apply; claims are not conserved in transfer. And **symmetrically-known supply fails outright**: anyone can mint an assumption, so the total is unbounded and unauditable. The bond substitutes *cost-to-mint* for *known-total* — a different integrity mechanism doing the same job. **Borrowed, not derived.**
- **This is a proposal, not a report.** Economics has been studying these systems (Catalini & Gans 2016; Holden & Malani 2018; Roughgarden 2020) and has not adopted anything like this. Nothing here should be written as though the field were already moving.

## Status

Frame, not theorem. Every primitive is borrowed — Fiske for the scale types, the canon for the ledger, `ChallengeBond` for the stake, the ACE tradition for the simulation target. The contribution on offer is the **composition**: one source, three targets, modes as types, assumptions as bonded edges in a graph that propagates refutation.
