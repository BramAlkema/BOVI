# The Judgement Register — where the code stops and a person decides

Solidity bends further than its critics think. `ChallengeBond` is an incomplete contract with designated residual control rights; `jubilee` is forgiveness; a dispute window is a third state that is neither true nor false while it runs. The limit is not expressiveness.

The limit is that **every bend relocates a judgement rather than removing it**. So the honest claim the canon can make is not *"this is precise."* It is:

> Each bend is a specific claim about where human judgement gets reinserted, and who guards it.

That claim is only worth anything if the points are enumerated. This is the enumeration. Two columns follow every entry: **A — close it** (the gap is a design deficiency and code can take it) and **B — refer it** (the gap remains in the world and needs a declared actor, keeper topology or explicit open boundary).

## Four classes of judgement — and they take different guards

The audit's main finding is that the canon currently routes almost everything to `Friedman`, i.e. to a vote. That is the wrong guard for two of the four classes.

| Class | The question | Correct guard | Wrong guard |
|---|---|---|---|
| **Adjudicative** | this claim is disputed — who decides? | arbitration, an appeals path, a decentralised verifier | a majority with a stake in the outcome |
| **Epistemic** | what is the state of the world? | a measurement body with a published, re-derivable method | **a vote** — you cannot ballot a fact |
| **Normative** | who bears this, who gets that? | the affected members, voting, with real exit | a technocrat, an "objective" formula |
| **Constitutive** | who counts as a member at all? | unsolved; currently an issuer of real-world credentials | any of the above — it is prior to all of them |

Voting on what inflation *is* is a category error. Delegating credit limits to an expert is a different one. The register marks the class for each point so the mismatch is visible.

## Two points that sit above the register

Both come from Ciatto et al. (2020), who benchmarked smart-contract coordination against the Linda model (see Prior Art). Neither is a judgement *inside* a contract; both are judgements the contracts cannot see.

### 0.1 The developer chooses what is visible — Normative, unguarded

> "Everything that happens as part of the computational cycle of a smart contract which does not generate any invocation cannot be registered on the blockchain — as it generates no transaction. This means that **each smart contract developer decides the granularity at which coordination operations are inspectable and recorded**."

For a canon whose purpose is making the skim visible, this is the master judgement point. Publicity is not a property of the chain; it is an authoring decision, taken by us, invisibly, every time we choose what to `emit`. `Stigler` and `Cantillon` X-ray the skim only at the resolution we happened to pick.

**A — close it:** treat the event set as part of the specification, not as debug output. State in each header what is *deliberately* not evented and why.
**B — refer it:** an audit standard for record granularity. There is no chain-level guarantee to appeal to.

### 0.2 Nothing in the canon can act without an event source — Constitutive, unguarded

Ciatto et al. find that mainstream contracts lack three mechanisms: encapsulation of control flow, asynchronous communication, and **pro-activeness**. "SC are strictly reactive to stimuli coming exclusively from off-chain entities" — a limitation they attribute to the object-oriented computational model, not to blockchains as such (their agent-oriented Tenderfone supports time triggers and contract-to-contract messages; Ethereum and HLF fail only on Linda's *suspensive semantics*, Corda additionally on reference uncoupling).

This bites the canon precisely. `Fisher.settle()`, `Clark.step()`, `Krugman`'s rule, `Kocherlakota`'s demurrage accrual: none of them can wake up. **Some declared actor or service must call them.** So the framework's central claim—a mode is a rule for *when* the ledger must clear—is only half-executable. The code constrains *whether* a clearing is valid when poked; it cannot compel *that it happens*. If nobody calls `settle()`, the obligation silently does not clear, and no event records the non-event.

The load-bearing object is therefore not necessarily one keeper but a set of **keeper functions**: observe, trigger, authenticate, record, contest, find, respond, repair and maintain the rule. Different people or systems may carry each function.

**A — close it:** declare a topology for each function; where appropriate incentivise invocation, event *staleness*, add fallback/succession, and distinguish a report of non-performance from proof that it occurred.
**B — refer it:** bilateral parties, ordinary users, open callers, competitive providers, a quorum, a rotating group, an appointed office or an external institution may carry different functions. Naming the topology and its failure condition is the honest alternative to pretending the ledger is self-executing.

**A fifth class, and now a topology requirement for it (revised 2026-08).** The four-class table above sorts *decisions* and assigns each a guard. A trigger may make no decision in any of the four—it makes a **timing choice**, and no row covered it. That is why the register did not catch the case now recorded under `Kocherlakota`: when a retroactive rate change meets callers who determine whom to charge first, timing becomes distributional. The instrument built to enumerate judgements could not see a non-judgement action that affected incidence.

| Class | The question | Correct guard | Wrong guard |
|---|---|---|---|
| **Executive** | this must happen—who observes, triggers and follows through, and by when? | a declared keeper topology per function, with motivation or duty, clock, failure signal, fallback and succession. An appointed office is one valid topology | **a reward or office alone.** A reward addresses willingness under a price assumption; an office names responsibility. Neither by itself supplies observation, truth, fallback, adequate funding or continuation |

`Ostrom` implements the appointed-office case: a stated duty, holder, mandate and period, while an open caller may flag it overdue. That makes a report of staleness visible where the group has chosen an office. It does **not** supply the universal guard. `flagOverdue` needs a caller; the holder self-attests performance; its current clock reset also compresses a long absence into one missed count. Nor does it punish, because “did they fail?” and “what response is legitimate?” require different guards. A tally rope, Bitcoin validation, correct change and customary refusal may distribute these same functions without an office.

**And the grammar this was hiding in.** `FOUNDATIONS.md` defined a mode as *"a rule about when and whether the ledger must clear."* Must—who observes, who pulls, who responds? A duty with no bearer topology is not stricter; it is unfinished, and an agentless *must* is the essentialist grammar the framework exists to refuse. The book's field card had asked the missing question all along—*and says who?* The further correction is plural: there may be several answers for one clearing episode.

## The register (written contracts)

### `ChallengeBond` — one contestable-assertion topology
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Who resolves a dispute (`arbiter` is a single resolver) | Adjudicative | Replace with a decentralised verifier / schelling vote; add an appeals path | The court of last resort. No chain supplies one |
| "Truthful" means undisputed or arbiter-upheld, not true | Adjudicative | — | Irreducible. Say it in the header, as it does |
| Bond size decides **who can afford to dispute** | Normative | Mutualised or subsidised challenge pools, so standing is not means-tested | Who funds the pool |

### `Greif` — reputation
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Who may report, and what counts as a default | Adjudicative | Use a typed claim → challenge → finding lifecycle with a reason and evidence; bonded challenge is one optional topology | The default-definition standard |
| A public registry is a panopticon | Normative | ZK selective disclosure — prove "standing ≥ X" without the history | What may be asked at all |
| Sybil-resistance | **Constitutive** | — | Open problem. Named as irreducible in the README, correctly |
| Whether `inGoodStanding` should gate `Kocherlakota._limitOf` | **Adjudicative → Normative** | **Not closable as a wire.** It would drive a normative output (credit capacity) from an adjudicative input (what counts as a default) with neither class's guard in the path — and `report` acts "without evidence or appeal." Prerequisites, in order: reports through `ChallengeBond` with a stated reason and a dispute window; a floor the gate cannot cut capacity below; a route back up | **Ruled advisory, 2026-08.** A caller that chooses to read the gate owns that decision and its sign: the loop is balancing in the system's exposure and reinforcing in the member's capacity, and picking the first label is picking the aggregate vantage |

### `Fiske` — the modes as a permission layer
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Assignment of the mode (an oracle input, gameable) | Normative | Wrap in `ChallengeBond`, as the header already proposes | Who may declare a relationship's mode |
| The moral force — "the contract flags; humans care" | Normative | — | Irreducible **by design**. The contract serves the modes; it cannot be them |
| Immediate mode | Normative | — | Referred **off-chain entirely**. The tag is a defensive opt-out, not a record |

### `Krugman` — the stabiliser
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| The activity reading (an oracle, gameable — "this is *why* stabilisation is hard") | **Epistemic** | Median of competing providers, per `Hayek`; `ChallengeBond` on the report | The measurement body |
| What counts as "activity", and what trend | **Epistemic** | — | A statistics institution with a published method. **Not** `Friedman`. This is the CPI-definition fight |
| Cantillon incidence of expansion | **Epistemic** (reclassified 2026-08 — it was filed Normative) | The tracer the header already says is missing | There is a large identified empirical literature with an answer, so this is a question of fact before it is a question of values. The answer does not match the folk version: the mainstream decomposes monetary redistribution into earnings-heterogeneity, Fisher and interest-rate-exposure channels, tested the sequence-of-receipt story under the name *financial segmentation* and found it small and of the opposite sign (Coibion et al., *JME* 2017), and the best-identified study finding expansion widening inequality (Andersen et al., *J. Finance* 2023) locates it in **asset exposure**, not order of receipt. Whose values decide anything here is downstream of getting that right |

### `Schumpeter` — productive credit
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| The `attestor` scores pull vs push — "the trust point" | Normative | `ChallengeBond` the score; competitive bid window (already flagged as required) | A standing body with published criteria and an appeal. The single largest judgement call in the canon |
| Rate discovery (first acceptable funder, not an auction) | Normative | The lender auction the header says is still needed | — |
| Restructuring and recovery on default | Adjudicative | — | Insolvency practice. Not implemented, and should not be invented here |

### `Stigler` — price discovery
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Who is a provider | Epistemic | The `ChallengeBond` publishing path (proposed, not built) | Admission standard |
| Which goods are the same good | **Epistemic** | — | A comparability standard. Quietly the hardest input in the contract |

### `Cantillon` — the nominal-exposure meter
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Whether an incidence finding may be recorded at all | **Epistemic** | Already closed: `attribute` reverts without a stated counterfactual, per the canon spec | See the `Krugman` row above for the underlying question of fact — it is not restated here |
| Which counterfactual is the right one | **Epistemic** | — | Same guard as the incidence question: the identified literature, not a vote. The contract's default is the indexed alternative (`Fisher`), which is a *choice* and should be argued each time |
| The refusal to accept an order-of-receipt input | **Epistemic** | — | Not a gap. The absent parameter is the contract's argument, and it tracks the evidence |

### `Starr` — the capacity condition
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| `gammaStar`, the participation threshold | **Epistemic** | Already gated: `verdict` returns `Undeclared` and `recordVerdict` reverts until a threshold is declared *with a justification* | Model-dependent. Belongs to whoever defends the model, not to governance |
| The gap between decreed and realised collection | **Epistemic** | Both series are recorded and the shortfall is computed | Referred explicitly to `Greif` — enforcement is not this contract's residual to explain |
| Whether a `Sufficient` verdict may act on the ledger | **Epistemic → Normative** | **Must not be wired.** `verdict` is gate-*shaped* (it returns an enum) and that shape is a lure: its input is epistemic and any ledger action is normative. The header already refuses to cross the line by declining to report a price | The affected members, via `Friedman`, citing the verdict |

### `BigoniCameraCasari` — the experiment
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Minimum sample before a finding is available | **Epistemic** | Already closed: pre-declared with a justification, and `finding` reverts below it | Pre-registration practice |
| What a `withinNoiseBand` result licenses | **Epistemic** | — | Statistical interpretation. The contract reports the band; it cannot stop anyone reading a null as a confirmation |
| Whether `bindingBps == 0` invalidates the run's other claims | **Epistemic** | The quantity is computed and exposed | The reader. This is a meta-finding about the run, not about the world, and nothing in the cast can enforce that distinction |

### `Hayek` — the unit
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Providers should compute from observable settlements, but "provenance and re-derivability are not enforced" | Epistemic | **Closable, and should be.** Require the settlement set or a proof; the ANTI-LIBOR aim is currently an aspiration, not a mechanism | — |
| Basket composition | **Epistemic** | — | A measurement body. Contested by construction — which is why Zelizer overlays ride on top |

### `Kocherlakota` — the ledger
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Credit limits per member | **Normative** | Rule-bind the formula and event every change | The community. The most consequential distributional call in the system |
| `jubilee` — whose debt is forgiven, whose claim is socialised | **Normative** | Require a `Friedman` proposal with timelock | The affected creditors |
| Demurrage rate and destination | Normative | Point at `Friedman`, as the header says | — |
| **Who the retroactive rate actually lands on** | **Normative** | Event *staleness*: make an un-poked span a positive fact rather than an absence, so the set of holders carrying an uncharged liability is public before the rate can move. (A rate-epoch ledger would close it properly and is out of demonstrator scope.) | **The keeper.** Setting the rate to zero is documented as erasing every holder's pending liability; it erases only the spans nobody has charged yet, so the timing of a public function call decides who paid. Demonstrated in `test_Gesell_WhoPaysTheMeltIsDecidedByWhoeverPokesFirst` — same balance, same elapsed time, same rate, different outcome |

### `Friedman` — governance of the dials
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Membership — one member, one vote | **Constitutive** | — | Prior to the contract. "Capture it and you capture the system" |
| Whether a minority can leave or fork | Normative | — | **Explicitly outside the contract.** Exit rights are institutional — this is Hirschman's *exit, voice, loyalty*, and the canon currently supplies only voice |
| A dial that moves with no reason on the record | Normative | **Closed 2026-08.** `propose` requires a `rationale`, stored and evented. Every meter in the cast already gates publication behind a declared discipline; this contract, the only one that can act, recorded a target and a calldata blob and nothing about why | — |
| Whether anyone must *answer* a published finding | Normative | Not closable by publication. Declare who may respond, under which policy and clock, and whether non-response is allowed; affected users may respond independently rather than through one body | The chosen response topology—or an explicit open boundary. A finding has no automatic consequence |

### `Fisher` — indexed obligations
Inherits `Hayek`'s basket judgement whole. No independent point.

### `KiyotakiWright` — acceptance threshold
Ledger-likeness is "an externally supplied toy input." A demonstrator, not deployed: no gap to close.

### `Clark` — the liquidation threshold (Tier 2)
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| `netPriceAtZeroPositive` — does harvesting stay profitable to zero? | **Epistemic** | — | A scientific determination, per stock. **Not a vote, not governance.** The clearest case in the register of a judgement that must go to expertise |
| `r`, `K` | Epistemic | — | Stock assessment. Same guard |
| δ, the demurrage source | Normative | Already evented and gov-gated | — |

### `Ostrom` — the appointed-office topology
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Whether the holder actually did the work | **Epistemic** | Not closable: this contract cannot see into the target, and a claim that it could would be the oracle problem in a different hat. What it establishes is that a named party asserted it, at a time, under their own address | The people affected, who can observe the target directly |
| Who is appointed, and who may remove them | **Constitutive** | Governance-gated, with a mandate required on the record | Prior to the contract, like every membership question here. An office appointed by a captured governance is a captured office |
| What a missed count should cost | **Normative** | Deliberately not wired — see the `Greif` ruling for why an adjudicative input must not drive a normative output unguarded | `Friedman`, citing the count as its stated reason |
| That someone must call `flagOverdue` too | **Executive** | Declare the open-caller topology, its motivation, clock and fallback; do not claim the office closes its own observation path | An office can be accountable for one duty while triggering, observation and consequence remain distributed or external |

## The residue and declared boundaries

Five. The canon already named three; the audits added the rest, and what looked like two separate gaps turned out to be one seen from either side:

1. **Constitutive membership / Sybil** (`Greif`, `Friedman`) — no code solves it.
2. **The inter-community reserve floor** (`Keynes`, between truly trustless parties) — already listed in the README.
3. **Moral force** (`Fiske`) — the contract flags; humans care.
4. **Exit** (`Friedman`) — the canon implements voice and not exit, and should say so.
5. **Keeper topology, its clock and its continuation condition.** The canon supplies capabilities but does not systematically declare who observes, invokes, responds and repairs, or why they continue doing so. Some functions can be distributed over users; some can be priced; some may be assigned to an office; some remain external. Where a retroactive parameter is in play, triggering order can decide incidence (see `Kocherlakota`). Where response depends on lost future trade, expected continuation surplus must exceed defection and keeper cost. These are conditional closure claims to test, not a reason to insert a universal keeper or score.

## The cost of every bend, stated against ourselves

Skims live in the gaps. Every bend adds a gap. Arbiters, windows, overlays and escape hatches each buy expressiveness by creating surface for exactly the extraction the canon exists to expose — `Kocherlakota`'s steward cannot break conservation but *can* redistribute through limits, demurrage and jubilee, which is one feature and one attack surface. A register of judgement points is therefore also a register of capture points. Read it both ways.

## Prior art — we are not alone, and that is the point

*Source discipline (added 2026-08): this section had no ✅/⚠️ legend, and an unverified characterisation lived here undetected as a result. Same convention as the rest of the corpus — ✅ retrieved and read, ⚠️ at one remove. Entries without a mark are unaudited.*

Consistent with "been done before is a plus":

- **ADICO → Solidity.** Frantz & Nowostawski, *From Institutions to Code: Towards Automated Generation of Smart Contracts* (eCAS workshop, SASO 2016; IEEE FAS\*W; DOI 10.1109/FAS-W.2016.53). ✅ **Retrieved and read** (author preprint, 6 pp.) — this entry previously asserted "automated translation from ADICO programs to contracts" at one remove, and both halves of that phrase needed correcting.

  **What it is.** A Scala DSL with an EBNF grammar and a four-step algorithm that emits Solidity **contract skeletons** from nADICO statements. Real code generation, not a conceptual sketch. But the authors' own word is *semi*-automated, and they are blunt about the output: *"the generated contract is far from executable and requires revision by a developer,"* with every generated construct annotated `TODO`. Ciatto et al.'s read (below) is confirmed — Example 1 is indeed voting, Example 2 an escrow.

  **The mapping table is the important artifact, and it is evidence for this register's own thesis:**

  | ADICO component | Solidity construct |
  |---|---|
  | Attributes | structs |
  | **Deontic** | **function modifiers** |
  | aIm | functions, events |
  | Conditions | function modifiers |
  | **Or else** | **`throw` / alternative control flow** |

  Read the two bolded rows together. *May*, *must* and *must not* all land on the same construct — the algorithm says the deontic component "inverts given conditional statements" — and the sanction is a revert. So the only people who have seriously tried to compile a deontic into Solidity ended up expressing **all three deontic values as a guard that can refuse an action**. A modifier can forbid. It cannot oblige. You cannot make someone act by throwing.

  That is the category gap, demonstrated by the attempt rather than argued: Solidity's ontology is *may-call*, and an obligation entering it comes out the other side as a permission check. It is exactly what `Ostrom` had to do — record the duty, event the breach, and wait for a caller.

  **Two further confirmations.** nADICO's nesting is real and load-bearing: an *Or else* may itself contain ADICO statements (their escrow example nests `O(Adico(...))` two deep), so the sanction does not bottom out — which upgrades a claim previously marked here as recalled. And the authors name the layer they do not reach: *"the described approach exclusively concentrates on the operational level of institutional rules; structural institutional regress in the form of Ostrom's meta-rules and constitutional rules (that shape operational rules) is not considered."* That is precisely the `Friedman` / `Ostrom` split this canon arrived at independently — who may change a rule versus who must run it — with the constitutional layer named as out of scope on their side and built on ours.

  **Bearing on the specification-language work:** the notation exists and predates us by three decades; the compile target is what fails. Anything built here inherits that, so the useful question is not "how do we express a duty" but "what does a duty *do* at runtime when nothing can self-trigger."

- **Symboleo — the deepest answer anyone has, and it lands where we landed.** Sharifi, Parvizimosaed, Amyot, Logrippo & Mylopoulos, *Symboleo: Towards a Specification Language for Legal Contracts* (RE'20, IEEE). ✅ **Retrieved and read**, along with the live toolchain — the uOttawa CSM Lab runs ~21 public repositories (IDE, compliance checker, nuXmv model checker, Symboleo2SC code generator, an LLM front end), active into 2026. This is not a paper, it is a programme.

  **What they have that this canon does not.** Obligations and powers are first-class, distinguished, and Hohfeld-grounded: *"legal positions are the legal relationships between roles. For our purposes, there are just two such relationships: obligations and powers."* An obligation is *"the legal duty of a **debtor** towards a **creditor**"* — the correlative pair, both ends named, which is exactly the bearer-and-claimant structure a duty needs and a bare `address` cannot carry. Each of contract, obligation and power has a **statechart lifecycle** (create → in-effect → suspended → fulfilled / violated / discharged / terminated), formalised in 27 event-calculus axioms. Their own related-work section notes that Accord, DAML and CSL *"only capture basic legal notions (obligations but not power)"* — so on this axis Symboleo is ahead of the deployed languages, and far ahead of us.

  **And the finding that matters most for §0.2.** Their compliance checker is trace-based: it *"evaluates whether given sequences of events (i.e., traces) are compliant with given contract specifications,"* with traces *"defined in batch files that are fed sequentially into the Prolog programs."* Now read their own worked example:

  ```prolog
  deadline(cons(oDel), 10).
  happens(deliveryDuePassed, 10).
  ```

  **The deadline passing is itself an event that has to be asserted.** A duty whose moment arrives and is not discharged produces nothing until someone records that the moment arrived.

  **This corrects a claim made elsewhere in this canon.** §0.2 attributes the inability to act to the object-oriented model and the EVM — Ciatto et al.'s framing, and the one `Ostrom` was built under. Symboleo shows that is too narrow. Their language is platform-independent, their semantics is event calculus, their engine is Prolog; there is no EVM anywhere near it, and a deadline is *still* a fact somebody supplies. So the wall is not Solidity's and not the blockchain's. It is this:

  > **In any event-based formalism, "nothing happened" is not an event.** Non-occurrence has no natural representation. Time passing must be reified as an observation, and an observation requires an observer.

  **Where to read next, in order.** Parvizimosaed et al., *Automated generation of smart contract code from legal contract specifications with Symboleo2SC* (2024) — the deontic meeting a compile target, which is the direct comparison with Frantz & Nowostawski's *Deontic → modifier + throw*; then *Specification and analysis of legal contracts with Symboleo* (SoSyM 2022) for the full semantics; then *Engineering Smart Contracts with Symboleo: Progress Report 2024*. Also live: SymboleoPC (property checking), SymboleoNLP and an LLM auto-corrector. ⚠️ No open-access PDFs found for any of these through the citation API — expect a library pull or an author request. Titles verified, contents unread.

  That is a stronger and more honest ground for **keeper functions** than “smart contracts are reactive.” Observation and triggering are not artefacts of a young platform that a better runtime would retire. A duty needs somebody or some accepted process to observe and record its performance or apparent breach in any event-based formalism. `Ostrom` assigns one office topology and still needs a caller for `flagOverdue`; the Symboleo example still needs someone to write `happens(deliveryDuePassed, 10)`. The common terminus is not one named keeper. It is a declared observer/trigger topology—or an explicit open boundary.

- **The expressiveness benchmark.** Ciatto, Mariani, Maffi & Omicini, *Blockchain-Based Coordination: Assessing the Expressive Power of Smart Contracts* (Information 11(1):52, 2020) — benchmarks Ethereum, HyperLedger Fabric, Corda and their Tenderfone against the Linda coordination model. Findings that bear directly on this register are folded into the two entries above.
- **Ostrom and blockchains.** Rozas et al. (2021) apply Ostromian analysis to blockchain governance across six affordances — tokenisation, self-enforcement, autonomous automation, decentralised power, transparency, codified trust — with monitoring and graduated sanctioning as the live cases. Also *Ostrom Amongst the Machines* (blockchain as knowledge commons).
- **Deployed mechanism design.** Quadratic funding (Solidity, deployed) and Harberger taxation from *Radical Markets* are economic mechanisms running as contracts, with sybil resistance and collusion as their live failure modes — the same residues found here.
- **Deployed community money.** Grassroots Economics' **Sarafu** network in Kenya: community inclusion currencies, ~30,000 users and 300,000+ transactions, USSD on feature phones, migrated to Celo in 2023, Kenya Red Cross distribution, an RCT, and an open dataset in *Scientific Data* (2022). The nearest deployed relative of `Kocherlakota`, with real data — and evidence that this whole line of work has a field, not just a repo.
