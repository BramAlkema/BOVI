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

**Selection has a lifecycle and a scope.** `candidate → priming → propagating → installed-supported → installed-self-maintaining`, with explicit repairing, fragile, declining and terminal paths, is a first-class state machine—not an introductory paragraph that disappears before equilibrium. Acceptance attaches to a declared domain—unit, ledger, instrument, rail, function, relationship, place and period—so the notation can express card for the meal, cash for the tip, local currency for taxes and dollars for saving without forcing one global winner. A `PrimingMechanism` names who pays the siphon-priming cost, the incumbent function being challenged, the wedge used, and the condition under which that wedge ends. Leaving priming additionally requires a **minimum credible circulation circuit** from availability through acquisition, tender, acceptance and posting/transfer to re-spending, clearing or redemption and renewed availability. Ongoing or mixed external support remains `installed-supported`; only a passed wedge-removal test and actor-specific continuation coverage permits `installed-self-maintaining`, though fees/rewards funded internally by the circuit may continue. The normative state and field semantics live in [`v2/SELECTION-LIFECYCLE.md`](v2/SELECTION-LIFECYCLE.md); the frozen V1 `AcceptanceThreshold` threshold is only a compatibility fixture.

**Modes are types.** This is the sharp one, and it is already sitting in Epilogue A.9 as a table:

| mode | scale | permitted arithmetic |
|---|---|---|
| Immediate | nominal | recorded, never nettable |
| Obligated | ordinal | ranked, clears on schedule with penalty |
| Balanced | interval | differences meaningful; nets over a window |
| Value | ratio | ratios meaningful; clears instantly at prices |

Make that a **typing rule and the compiler catches category errors economics currently makes in prose.** Averaging Immediate-mode entries is a type error. Netting an Obligated entry against a Value entry without a declared conversion is a type error. Summing across modes to get a total is the type error that produces most of what this book calls extraction.

And it gives the Tiv chapter a formal reading: a society's spheres *are* a type system, and general-purpose money is **type erasure** — one denominator laid underneath every sphere, after which nothing can be said to be the wrong kind of thing. Bohannan's moral disquiet is a type error that the notation of the day could not express.

**Contracts, obligations and powers have lifecycles.** Following the useful Symboleo distinction, a duty names both debtor and creditor while a power names its holder and the party or state it can affect. Creation, assent, activation, suspension, due time, partial performance, apparent violation, cure, forgiveness, discharge, termination and succession are distinct states. A ledger posting is not automatically performance, acceptable tender, correct change or discharge; those require a settlement episode and the appropriate evidence or acknowledgement.

**Keeperhood is assigned per function.** The specification separately names who recognises validity, authenticates, observes, triggers, records, contests, finds, responds, repairs, maintains infrastructure and changes rules. Each assignment declares a topology—self, bilateral, open users, competitive providers, quorum, rotating members, appointed office, protocol or external institution—plus clock, cost, motivation or duty, failure signal, fallback and succession. `AppointedOffice` is the appointed-office instance, not a universal `keeper` type.

**Claim, finding and consequence cannot collapse into one field.** The required chain is `rule/custom → observation → claim → challenge → finding → separately authorised response → appeal/repair/exit`. `ChallengeBond` is one way to price and resolve a contest; it does not manufacture truth or equal standing. `ReputationMemory` is contextual memory of attributed findings; it does not punish. A later counterparty may refuse, change exposure, require collateral, forgive or ignore the finding under its own declared policy.

**Continuation is a bonded behavioural assumption, not an on-chain number masquerading as fact.** Declare it separately for every load-bearing actor × action × domain. Decompose the claimed cooperative surplus, without overlap, into gains from specialisation, fractionating trade across quantity/time/counterparty, and conflict mitigation; state the no-circuit counterfactual, the actor's accessible share, horizon, uncertainty and direct or finding-mediated loss path. Then declare outside option, one-shot defection gain, participation cost, keeper effort, risk and any immediate reward. The self-maintenance claim survives only over ranges where that actor's accessible surplus at risk covers those costs. There is no global `continuationSurplus` or social-credit multiplier. This is distinct from bootstrap: the priming wedge fills the siphon; actor-accessible continuation may keep the established column moving, while an ongoing external input must remain named as such.

**Assumptions are bonded commitments.** An assumption is not evaluated by the machine; it is *held* by it. Each carries: a scope (population, period, range), a **refutation condition**—the observation that would kill it and who may submit it—a stake, and declared standing to challenge. Results declare which assumptions they rest on. Once a contestable refutation reaches an accepted finding, dependency status can propagate deterministically; the specification must still name who observes, submits, resolves and triggers that propagation. The current `ChallengeBond` is one contest topology. What is missing is the typed evidence lifecycle and dependency graph.

**Judgement points are typed holes.** Adjudicative, epistemic, normative, constitutive — each needs a different guard, and a specification with an unfilled hole does not compile. Part C becomes a compiler check rather than an essay.

**Executive edges have closure certificates.** A transition described with *must*, *automatic*, *enforces*, *adopts*, *excludes* or *clears* must identify its observer, trigger, decision guard, executor, evidence, motivation, delay, failure path, repair and exit. Closure is reported dimension by dimension—computational safety, trigger/liveness, epistemic observation, adjudication, legitimate consequence, recovery, economic continuation and constitutional succession. An explicit world boundary may compile. An unnamed edge may not. The full card and mandatory loop inventory live in [`../contracts/V2-OVERHAUL-PLAN.md`](../contracts/V2-OVERHAUL-PLAN.md).

## What each target buys

**prove.** Nothing new, but it comes free rather than by hand, and it can no longer quietly disagree with the other two.

**simulate.** The honest reason ABM has not displaced DSGE is degrees of freedom: an agent-based model can be made to fit almost anything, so fitting is weak evidence. **The bonded-assumption register is the answer to that specific objection** — it fixes in advance which knobs the modeller was permitted to turn, at what scope, with a stake attached, before the run. An ABM whose free parameters are all declared and staked is a different epistemic object from one whose aren't.

Prior art to stand on rather than reinvent: the agent-based computational economics tradition, and Steve Keen's *Minsky*, which is the clean case of simulation used to pin down an assumption — building the double-entry model is what changed his mind about the sectoral claim.

**deploy.** The Tally, the Exchange Lens, the contracts. Deployment tests what neither proof nor simulation can: whether people will use it, what they do to it, and which judgement points get captured first. Its weaknesses are equally plain — n=1, no counterfactual, and real consent obligations to whoever is inside it.

The design's actual claim is about the **triangle**, not any vertex. A claim that proves, simulates and deploys consistently has survived three different kinds of contact. Where the three disagree is where the theory is doing hidden work.

## Honest limits

- **Nothing is built.** This is a sketch, and the gap between a table of primitives and a working compiler is most of the effort.
- **It does not replace mathematics** and should never be described as doing so.
- **Two boundary families remain irreducible to computation.** The **constitutive** question asks who may enter a claim and who has standing. The **event/response boundary** asks how a world fact is observed, who triggers a recorded transition and why anybody treats its output as consequential. The second may be distributed over users, priced, assigned to an office or left external; naming one keeper does not dissolve it. Everything else moves from *unstated* to typed, contested or bonded—not from social to automatic.
- **The ledger analogy is partial, and the axioms should be marked.** Resolution carries — a claim must be fine-grained enough to be individually refutable. Authentication carries — who asserted this. Conservation does not apply; claims are not conserved in transfer. And **symmetrically-known supply fails outright**: anyone can mint an assumption, so the total is unbounded and unauditable. The bond substitutes *cost-to-mint* for *known-total* — a different integrity mechanism doing the same job. **Borrowed, not derived.**
- **This is a proposal, not a report.** Economics has been studying these systems (Catalini & Gans 2016; Holden & Malani 2018; Roughgarden 2020) and has not adopted anything like this. Nothing here should be written as though the field were already moving.

## Status

Frame, not theorem. Every primitive is borrowed or composed from prior work—Fiske for the scale types, the canon for the ledger, Symboleo for obligation/power lifecycles, contestable assertions for challenge, and the ACE tradition for the simulation target. The contribution on offer is the **composition**: one source, three targets; acceptance domains and lifecycle; modes as types; distributed keeper topologies; contextual findings and responses; and assumptions as bonded edges in a graph whose propagation remains evented and auditable.
