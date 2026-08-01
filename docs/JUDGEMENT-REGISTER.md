# The Judgement Register — where the code stops and a person decides

Solidity bends further than its critics think. `ChallengeBond` is an incomplete contract with designated residual control rights; `jubilee` is forgiveness; a dispute window is a third state that is neither true nor false while it runs. The limit is not expressiveness.

The limit is that **every bend relocates a judgement rather than removing it**. So the honest claim the canon can make is not *"this is precise."* It is:

> Each bend is a specific claim about where human judgement gets reinserted, and who guards it.

That claim is only worth anything if the points are enumerated. This is the enumeration. Two columns follow every entry: **A — close it** (the gap is a design deficiency and code can take it) and **B — refer it** (the gap is constitutive and belongs to an institution, named).

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

### 0.2 Nothing in the canon can act — Constitutive, unguarded

Ciatto et al. find that mainstream contracts lack three mechanisms: encapsulation of control flow, asynchronous communication, and **pro-activeness**. "SC are strictly reactive to stimuli coming exclusively from off-chain entities" — a limitation they attribute to the object-oriented computational model, not to blockchains as such (their agent-oriented Tenderfone supports time triggers and contract-to-contract messages; Ethereum and HLF fail only on Linda's *suspensive semantics*, Corda additionally on reference uncoupling).

This bites the canon precisely. `Fisher.settle()`, `Clark.step()`, `Krugman`'s rule, `Kocherlakota`'s demurrage accrual: none of them can wake up. **Someone must call them.** So the framework's central claim — a mode is a rule for *when* the ledger must clear — is only half-executable. The code enforces *whether* a clearing is valid when poked; it cannot enforce *that it happens*. If nobody calls `settle()`, the obligation silently does not clear, and no event records the non-event.

Whoever runs the keeper is therefore a load-bearing party with no contract, no vote and no name in the cast.

**A — close it:** incentivise invocation (keeper rewards), and event *staleness* so a missed clearing is visible as a positive fact rather than an absence.
**B — refer it:** the keeper. An institution must run it, and be accountable for running it. Naming this is the honest alternative to pretending the ledger is self-executing.

## The register (written contracts)

### `ChallengeBond` — the enforcement teeth
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Who resolves a dispute (`arbiter` is a single resolver) | Adjudicative | Replace with a decentralised verifier / schelling vote; add an appeals path | The court of last resort. No chain supplies one |
| "Truthful" means undisputed or arbiter-upheld, not true | Adjudicative | — | Irreducible. Say it in the header, as it does |
| Bond size decides **who can afford to dispute** | Normative | Mutualised or subsidised challenge pools, so standing is not means-tested | Who funds the pool |

### `Greif` — reputation
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Who may report, and what counts as a default | Adjudicative | Route reports through `ChallengeBond`; require an evented reason | The default-definition standard |
| A public registry is a panopticon | Normative | ZK selective disclosure — prove "standing ≥ X" without the history | What may be asked at all |
| Sybil-resistance | **Constitutive** | — | Open problem. Named as irreducible in the README, correctly |

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
| Cantillon incidence of expansion | Normative | The tracer the header already says is missing | Who bears the skim |

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

### `Friedman` — governance of the dials
| Judgement | Class | A — close it | B — refer it |
|---|---|---|---|
| Membership — one member, one vote | **Constitutive** | — | Prior to the contract. "Capture it and you capture the system" |
| Whether a minority can leave or fork | Normative | — | **Explicitly outside the contract.** Exit rights are institutional — this is Hirschman's *exit, voice, loyalty*, and the canon currently supplies only voice |

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

## The irreducible residue

Four, and the canon already names three of them:

1. **Constitutive membership / Sybil** (`Greif`, `Friedman`) — no code solves it.
2. **The inter-community reserve floor** (`Keynes`, between truly trustless parties) — already listed in the README.
3. **Moral force** (`Fiske`) — the contract flags; humans care.
4. **Exit** (`Friedman`) — the canon implements voice and not exit, and should say so.
5. **The keeper** (§0.2) — no contract in the canon can act on its own. Every clearing discipline depends on an unnamed party choosing to invoke it. This one was not previously on any list.

## The cost of every bend, stated against ourselves

Skims live in the gaps. Every bend adds a gap. Arbiters, windows, overlays and escape hatches each buy expressiveness by creating surface for exactly the extraction the canon exists to expose — `Kocherlakota`'s steward cannot break conservation but *can* redistribute through limits, demurrage and jubilee, which is one feature and one attack surface. A register of judgement points is therefore also a register of capture points. Read it both ways.

## Prior art — we are not alone, and that is the point

Consistent with "been done before is a plus":

- **ADICO → Solidity.** Frantz & Nowostawski, *From Institutions to Code: Towards Automated Generation of Smart Contracts* (IEEE FAS\*W 2016), maps Crawford & Ostrom's grammar of institutions — Attributes, Deontic, aIm, Conditions, Or else (*A Grammar of Institutions*, APSR 89:582–600, 1995) — onto Solidity constructs, with automated translation from ADICO "programs" to contracts. Ciatto et al. (below) credit it as "an interesting first step towards re-interpreting smart contracts and blockchains as virtual institutions" but note its demonstration is a voting scenario that counts and triggers sequential activities rather than coordinating.
- **The expressiveness benchmark.** Ciatto, Mariani, Maffi & Omicini, *Blockchain-Based Coordination: Assessing the Expressive Power of Smart Contracts* (Information 11(1):52, 2020) — benchmarks Ethereum, HyperLedger Fabric, Corda and their Tenderfone against the Linda coordination model. Findings that bear directly on this register are folded into the two entries above.
- **Ostrom and blockchains.** Rozas et al. (2021) apply Ostromian analysis to blockchain governance across six affordances — tokenisation, self-enforcement, autonomous automation, decentralised power, transparency, codified trust — with monitoring and graduated sanctioning as the live cases. Also *Ostrom Amongst the Machines* (blockchain as knowledge commons).
- **Deployed mechanism design.** Quadratic funding (Solidity, deployed) and Harberger taxation from *Radical Markets* are economic mechanisms running as contracts, with sybil resistance and collusion as their live failure modes — the same residues found here.
- **Deployed community money.** Grassroots Economics' **Sarafu** network in Kenya: community inclusion currencies, ~30,000 users and 300,000+ transactions, USSD on feature phones, migrated to Celo in 2023, Kenya Red Cross distribution, an RCT, and an open dataset in *Scientific Data* (2022). The nearest deployed relative of `Kocherlakota`, with real data — and evidence that this whole line of work has a field, not just a repo.
