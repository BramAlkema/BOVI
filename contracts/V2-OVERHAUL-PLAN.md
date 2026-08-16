# Contract system V2 — ground-up overhaul and closure audit

*Candidate architecture, 2026-08. Nothing in this document is deployed. V1 remains the executable reference until V2 passes the gates below.*

## Decision

V2 is not an expansion of the cast and not an in-place refactor of sixteen contracts. It starts from the institutional circuit each contract is trying to represent, derives a typed specification, and only then chooses which parts belong in proof, simulation, Solidity, or the world.

The governing correction is simple:

> A contract can preserve a record and constrain a state transition. It cannot, by itself, make a physical or social fact true, make somebody notice it, make somebody call, or make other people care about the result.

That is not a defect to hide behind an oracle or a generic `keeper` address. It is the boundary V2 must make explicit.

### Verified V1 baseline

As of this candidate plan:

- sixteen Solidity contracts compile with solc 0.8.20;
- nineteen tests pass across three suites;
- `forge coverage` reports 45.21% lines, 42.93% statements, 26.25% branches and 40.78% functions;
- seven contracts have no executed test path: `BigoniCameraCasari`, `Cantillon`, `ChallengeBond`, `Fiske`, `KiyotakiWright`, `Starr` and `Stigler`;
- no Solidity deployment script, broadcast artifact, proxy or address registry has been found in this repository, so V2 defaults to a side-by-side new genesis rather than an ABI/storage-compatible upgrade. Live deployment state must be re-checked before that assumption is used.

This is a reproducible demonstrator baseline, not a security, adoption or institutional-closure result.

## New ground

V2 begins from seven propositions established by the recent audit and research thread. They are candidate synthesis, not claims that the current Solidity proves them.

1. **Selection has a lifecycle.** A possible money moves through `candidate → priming → propagation → installed use → maintenance/repair → decline, exit or succession`. A stationary acceptance equilibrium starts after the hard part.
2. **Cold start is siphon priming.** Before a continuous acceptance path exists, somebody must bear a priming cost: subsidy, coercion, tax receivability, legal privilege, platform leverage, prior use, speculation, familiar form, or some other wedge. Network effects usually defend the incumbent before they amplify the challenger.
3. **Continuation surplus can replace the priming wedge.** Once enough parties expect future opportunities from continued participation, the loss of future trade, credit, cooperation, access and specialisation can make performance locally self-enforcing. This is conditional, not magic: the surplus must reach the relevant actor, exceed defection and keeper costs, and remain sufficiently likely and soon.
4. **Keepership is a topology, not necessarily an office.** Observation, triggering, authentication, accounting, challenge, finding, consequence, repair and rule maintenance may be divided among counterparties, ordinary users, open callers, providers, quorums, rotating members, a named office, or an external institution. `Ostrom` represents one topology. It is not the terminus of every regress.
5. **Record, judgement and consequence are different stages.** `Greif` can preserve contextual reputation memory. `ChallengeBond` can make an assertion contestable. Neither is “the teeth.” The consequence may come from later refusal, reduced exposure, lost trade, collateral, an office, law, or no response at all. No reputation output may silently become a sanction input.
6. **Monies coexist and compete at more than one level.** Units, ledgers, instruments and rails can divide work within the same person and transaction: local currency and dollars, card and cash, payment and tip, casino chip and national unit, venue token and card rail. Acceptance must therefore be scoped to a domain, function and relationship, not assigned once to a whole currency.
7. **One source must face three kinds of contact.** The same institutional claim should derive to `prove`, `simulate` and `deploy`. Solidity is one target, not the ontology. Agreement across the three is evidence; disagreement is a finding.

## V2's unit of design: the institutional circuit

Thinker names remain citations and intellectual lineage. They stop being the primary module boundary. Every V2 mechanism must first fill one **circuit card**:

| Field | Required question |
|---|---|
| Scope | In which population, relationship, function, place, period and acceptance domain does this claim apply? |
| Monetary object | Which unit, ledger, claim, instrument and rail are involved? Which may coexist? |
| Parties and positions | Who can act, who is acted upon, who benefits, who bears cost, and who has standing? |
| Stocks and state | What persists, under whose control, at what resolution, and with what conservation rule? |
| Lifecycle | What creates, activates, suspends, performs, violates, repairs, terminates or succeeds the arrangement? |
| Transitions | Which event changes which state; who may invoke it; which guard and deadline apply? |
| Observation | Which fact comes from the world, who reports it, by what method, with what provenance and staleness rule? |
| Priming | Who bears the cold-start cost, what early domain is targeted, and when may the wedge stop? |
| Keeper topology | For every observation and transition, who notices, triggers, records, challenges, finds, responds and repairs? |
| Continuation | What future surplus makes each participant and keeper continue; who does not receive it; what is the outside option? |
| Contest | What may be challenged, by whom, at what cost, before what deadline, and with what appeal? |
| Consequence | Who chooses and applies a response to a finding? Is it advisory, automatic, bilateral, collective or external? |
| Recovery | How can an error, default, lost key, incapacity or fulfilled remedy restore standing and participation? |
| Constitution | Who can change the rule, by what procedure, with what non-retroactivity and affected-party guard? |
| Exit and succession | How can a party leave, a group fork, a role rotate, or a failed provider be replaced without losing the record? |
| Threats | What can collusion, capture, censorship, Sybil identities, surveillance, timing, wealth or resource asymmetry do? |
| Evidence | What proof, simulation, deployment test and observable kill condition would refute the claim? |

A card does not compile while one of these fields is blank. “The market,” “governance,” “the community,” “users,” “the oracle,” and “the keeper” are not filled fields unless their membership, powers and topology are declared.

## Required types

The V2 source model should minimally type:

- `AcceptanceDomain`: unit × ledger × instrument × rail × function × relationship × place × time.
- `InstrumentProfile`: optional issuer, validity/authentication topology, denominations, supply rule, redemption, repair/replacement and exit. `issuer = none` is valid.
- `Party`, `Role` and `Position`: bearer, claimant, payer, payee, observer, reporter, challenger, finder, responder, beneficiary and rule-changer are not interchangeable `address` values.
- `Ledger` and `Entry`: resolution, authentication, conservation, supply visibility, write authority and completion condition.
- `SettlementEpisode`: price obligation, tender, accepted amount, residual/change claim, agreed rounding, explicit waiver or tip, and discharge acknowledgement. Silence cannot become a tip.
- `Mode`: Immediate, Obligated, Balanced or Value, including declared cross-mode conversions rather than silent type erasure.
- `Contract`, `Obligation` and `Power`: each with a lifecycle, debtor/creditor or grantor/holder, activation, deadline, performance, suspension, violation, discharge and termination.
- `Rule` and `Custom`: scope, source, adoption evidence, revision history and the parties for whom it is claimed to hold.
- `Observation`: method, reporter, provenance, timestamp, uncertainty and challenge status.
- `JudgementHole`: adjudicative, epistemic, normative, constitutive or executive, with the correct guard declared.
- `KeeperAssignment`: function plus topology, cost, incentive or duty, clock, fallback and succession.
- `Assertion`, `Challenge`, `Finding`, `Consequence`, `Appeal` and `Repair`: separate objects with no implicit wire between them.
- `ExposurePolicy`: the future counterparty who bears risk chooses whether to accept, refuse, shorten terms, require collateral, forgive or ignore a contextual finding.
- `PrimingMechanism`: payer, cost, targeted domain, wedge, stop condition and capture risk.
- `ContinuationAssumption`: future opportunity, beneficiary, horizon, probability, outside option, defection gain and keeper cost, with a refutation condition.
- `Exit`, `Fork` and `Succession`: rights and data/state consequences.

Candidate keeper topologies are `self`, `bilateral`, `open`, `provider`, `federated`, `quorum`, `rotating`, `office`, `protocol` and `external`. A circuit may compose several. These are specification types, not a proposal for one giant Solidity dispatcher.

## Enforcement without a skyhook

V2 replaces the single “teeth” box with a visible chain:

```text
rule or custom
  → observed performance or non-performance
  → claim with provenance
  → challenge window
  → finding under a declared guard
  → separately authorised response
  → repair, appeal or exit
```

The record supplies memory. People and institutions may supply consequences through future acceptance or refusal, continued or withdrawn credit, reciprocal performance, exclusion from a bounded activity, collateral, formal process, forgiveness, or exit. A finding may also produce no response. V2 must represent that possibility rather than relabel a score update as enforcement.

The continuation hypothesis is correspondingly precise:

```text
specialisation
  → mutual dependence
  → continuation surplus
  → greater incentive to perform and maintain the record
  → safer local credit and cooperation
  → deeper specialisation
```

This loop is not a universal social-credit score. Reputation must be contextual, purpose-limited, challengeable, time-aware and repairable. V2 rejects automatic cross-context propagation, irreversible exclusion, wealth-weighted truth, and sanctions with no appeal or route back.

The maintenance hypothesis to sweep—not assume—is:

```text
P(observation and consequential response)
× expected discounted continuation surplus at risk
+ immediate bond/reward
>
one-shot defection gain + participation cost + keeper effort + risk
```

Failure does not prove the instrument impossible. It means the profile needs an ongoing subsidy, duty, coercive support, office or other external input and must say so.

## New candidate primitive: `Ellickson`

`Ellickson` is the missing order-without-law layer. It should model a bounded group's customary rule and bilateral performance without pretending that the rule is fair, efficient, unanimous or state-enforced.

Its candidate responsibilities are:

- declare a custom's domain, text/hash, provenance and revision history;
- record which parties claim, accept, reject or contest its application;
- record bilateral obligations and assertions of performance or breach;
- allow a counterparty or eligible peer to challenge with a reason and evidence reference;
- produce a peer finding under a declared topology and guard;
- pass that finding to contextual `Greif` memory without prescribing a consequence;
- record remedy, forgiveness, expiry, appeal and restored standing;
- permit exit, custom succession and a fork where consensus genuinely ends.

It must not infer social assent from silence, universalise a local custom, auto-punish a reported breach, or claim that informal order is benign. The first implementation should be a reference profile for the Knights' Tally Rope, not a universal customary-law machine.

## Loop closure is a vector

No V2 document may call a loop simply “closed.” Every loop receives this closure vector:

| Dimension | Closed only when… |
|---|---|
| **Computational** | every in-system state transition has an executable path and its safety invariants hold. |
| **Trigger/liveness** | an assigned topology can notice and invoke each due transition within a declared bound, with fallback and succession. |
| **Epistemic** | required world facts have a method, provenance, uncertainty, freshness and challenge path. |
| **Adjudicative** | disputed claims reach a finding under the declared guard and resource asymmetry is addressed or exposed. |
| **Normative/consequence** | the party authorised to select a response is named, affected-party legitimacy is declared, and no advisory output becomes punishment by accident. |
| **Recovery** | error, cure, appeal, re-entry, forgiveness, lost keys and incapacity have an attainable path rather than permanent limbo. |
| **Economic continuation** | the relevant actors receive expected continuation surplus exceeding defection, participation and keeper costs under tested ranges. |
| **Constitutional** | rules, roles and providers can change, fork, exit or succeed without retroactive seizure or an unreplaceable actor. |

Each dimension is marked `closed`, `open boundary`, `bonded assumption`, `not applicable` or `failed`, with evidence. An open world boundary is honest. An unnamed edge is a failed audit.

### The loop card

For every causal cycle or purported control path, record:

1. the stock or condition being regulated and the loop's intended sign;
2. every edge in order, without collapsing a human or world step into an ellipsis;
3. the actor, trigger, guard and keeper topology at each edge;
4. observation method, evidence, latency, timeout and fallback;
5. benefit, cost, defection gain and continuation assumption for each actor;
6. consequence authority, challenge, appeal, repair and exit;
7. emitted evidence and the unobservable negative space;
8. the closure vector, failure modes, test and kill condition.

An output-only meter is not forced into a feedback loop. It is recorded as a terminating measurement path and must name who may consume it and under what guard.

### Mandatory loop inventory

The V2 system inventory is not complete until it covers or explicitly excludes:

1. priming and early adoption;
2. acceptance/marketability, including reverse cascade and collapse;
3. authentication/counterfeit detection;
4. exchange, settlement and conservation;
5. obligation, performance and due-time observation;
6. claim, challenge, finding, response and repair;
7. contextual reputation and future-trade response;
8. credit, default, cure and re-entry;
9. price observation, indexation and stale-data response;
10. keeper participation, dropout, replacement and timing incidence;
11. rule change, capture, non-retroactivity and constitutional succession;
12. bridge/conversion across domains, modes, ledgers and rails;
13. exit, fork, collapse and record portability;
14. stabilisation and its real-economy return path;
15. extraction/incidence and the path from a finding to a guarded response;
16. identity, privacy, Sybil resistance, delegation, incapacity and lost keys.

## Ground-up exhaustiveness method

“Exhaustive” can only mean exhaustive relative to a declared boundary. V2 earns that word with four reconciled inventories:

1. **Source inventory.** Extract every contract, state variable, mutating function, modifier, event, external call, identity comparison, deadline and oracle read from V1 and later V2 artifacts.
2. **Institutional inventory.** For every source item, map the circuit-card fields, judgement class, keeper topology and closure-vector dimensions. Conversely, every circuit item must map to proof, simulation, deployment or an explicit world boundary.
3. **Loop inventory.** Trace every feedback claim edge by edge. Reject agentless verbs such as “clears,” “adjusts,” “enforces,” “adopts” or “punishes” until a bearer and trigger are supplied.
4. **Scenario inventory.** Fit materially different monies and payment arrangements without changing the ontology. Record any new primitive each case forces.

The four inventories are checked in both directions. No source item may be orphaned; no specification field may vanish at a target; no target-only behaviour may lack a source declaration; and no scenario exception may be hidden in prose. A negative-space register records what V2 deliberately cannot observe, compel or guarantee.

## Scenario completeness suite

Before a V2 release candidate, one profile for each case must fill the same schema:

| Profile | Distinction it must preserve |
|---|---|
| Bitcoin | independent consensus/authentication topology; speculative priming; no claim that a Solidity wrapper recreates it. |
| Prison cigarettes | commodity possession, bounded acceptance, informal authentication and local future interaction. |
| Knights' Tally Rope | bilateral records, distributed custom maintenance, peer findings and continuation surplus without issuer or regulator. |
| Gold | physical authentication, path-dependent legitimacy, custody/assay costs and coexistence with ledger claims. |
| State fiat | unit, cash, deposits, tax/legal wedges, issuer and many keeper topologies kept distinct. |
| Dollarisation | local unit and dollar coexisting by function; taxes as one wedge rather than a sufficient adoption account. |
| Orphaned Swiss Iraqi dinar in Kurdistan | the disappearance of issuer/regulator separated from installed recognition, denominations, pricing, correct change, debt discharge and continuing acceptance. This is a maintenance/orphaning case, not a cold start. |
| Cash, card and phone payment | one purchase function contested by distinct instruments/rails, including a cash tip beside a card bill. |
| Venue tokens and casino chips | sharply bounded acceptance, issuer redemption/custom and local exit risk. |
| Coupons and company scrip | restricted domain, bridge/redemption terms and coercive lock-in distinguished. |

Passing does not mean each profile is deployed in Solidity. It means proof, simulation, deployment and world-boundary choices are explicit and the shared ontology does not erase the feature the example was chosen to test.

## Candidate disposition of V1

This table is a hypothesis to test, not preservation by sunk cost. Each row still needs a function/state/event migration ledger before implementation.

| V1 artifact | V2 candidate disposition | Reason |
|---|---|---|
| `Kocherlakota` | **retain kernel; split and rewrite the rest** | Preserve paired signed writes and conservation; rename `Settled` to `Posted` unless a receipt establishes discharge. Separate membership, credit underwriting, stabilisation, mode gate, demurrage, jubilee, keeper incentives and governance. Bound signed conversion and use rate epochs. |
| `Fiske` | **promote to source-level type system** | Modes and explicit conversions constrain all targets; one last-writer-wins mode per unordered pair cannot express card-meal/cash-tip coexistence and permits unilateral overwrite. Scope mode to episode, purpose, domain and time with appropriate assent. |
| `Greif` | **replace with contextual reputation memory** | Preserve attributed records; remove “teeth,” universal score and implied automatic exclusion. |
| `ChallengeBond` | **split and narrow to contestable assertions** | Bonding prices attention and enables dispute; it does not establish truth, equal standing or enforcement. Separate generic claim lifecycle from this optional topology; add domain separation, timeout, appeal/fallback and consumed findings; use `Unchallenged`/`Upheld`, not `Truthful`. |
| `Ostrom` | **retain as an office-topology adapter** | A named duty, clock and staleness record remain useful; the office is one keeper topology, not the universal terminus. Split performed time from overdue-observation time: V1's `flagOverdue` resets `lastDischarged` even though no discharge occurred. |
| `Friedman` | **rewrite as one constitutional topology** | Preserve rule-bound proposals and rationales; add affected scope, non-retroactivity, exit/fork and succession. |
| `Fisher` | **merge into generic obligation lifecycle** | Indexed obligations need bilateral assent, typed parties, partial performance, due-index snapshot, arrears, acceptable instruments, rounding, contest, cure, forgiveness and termination; V1 permits unilateral creation/cancellation and a late call erases missed periods. |
| `Schumpeter` | **rewrite as a credit composition/profile** | Separate contested attestation, allocation, obligation, default claim and consequence; do not pretend first-funder is an auction. V1 lets any caller race an irreversible default after maturity. |
| `Hayek` | **retain and harden as optional observation aggregation** | Type the unit and basket, expose provenance/freshness and keep provider governance outside the numerical median. Remove or label the trusting bypass and prevent settled assertions from refreshing stale values by replay. |
| `Stigler` | **retain as a measurement path** | Publication discipline is useful; state who may act on a finding and under which guard. |
| `Cantillon` | **retain as an incidence meter** | It measures nominal exposure; it neither diagnoses informational ignorance nor supplies a policy response. |
| `Starr` | **demote to a conditional capacity meter** | Keep decreed versus realised collection separate; remove the claim that the residual belongs to `Greif`, freeze preregistered thresholds before outcomes, and label sufficiency as conditional on its model. |
| `BigoniCameraCasari` | **move to evidence/simulation profile** | It is an experiment treatment and diagnostic, not a production institution. Preregistration must precede observations and the experimental condition must be enforced by the finding. |
| `KiyotakiWright` | **move to simulation profile** | Acceptance feedback requires heterogeneous agents, domains and paths; external scores in Solidity demonstrate only a threshold. |
| `Krugman` | **split rule from deployment adapter** | Prove/simulate the stabiliser; deploy only the typed observation and authorised parameter interface. |
| `Clark` | **keep as Tier-2 proof/simulation profile** | The liquidation threshold tests reach beyond money but is not part of the institutional runtime. |
| `Ellickson` | **add as a new reference profile/primitive composition** | Supplies distributed custom, performance, breach, peer finding and repair without issuer or automatic sanction. |

Blueprint-only cast members receive the same `retain / rewrite / compose / evidence-only / retire` decision before V2 calls its inventory exhaustive. No new thinker-named Solidity contract is admitted merely to complete the honour roll.

### V1 counterexamples that become V2 tests

These are redesign seeds, not claims that V1 is safe for assets:

- `Kocherlakota` casts unbounded `uint256` amounts to `int256`; high values can invert sign. Uncapped demurrage can exceed a positive balance and create debt outside the ordinary credit-limit path.
- `Fisher` permits unilateral obligations/cancellation, while one late settlement advances the clock and can erase arrears.
- `Fiske` lets either party overwrite the pair's mode, including the other party's opt-out.
- `Schumpeter` lets any caller irreversibly mark default immediately after maturity without claim, challenge, grace, cure or restructuring.
- `ChallengeBond` can remain unresolved under a silent single arbiter, lacks appeal and domain separation, and calls an undisputed assertion `Truthful`.
- `Hayek` permits trusted publication beside the bonded path and can replay a settled assertion to refresh stale data.
- `Ostrom.flagOverdue` advances `lastDischarged` despite no discharge, compressing a long absence into a smaller missed count.
- `BigoniCameraCasari` and `Starr` allow supposed preregistration choices after outcome data can already be present.
- `Greif` stores a global, permanent, context-free score; the former “exclude” test proved only that a view returns false and has now been renamed accordingly. No consumer excludes anyone.
- `Friedman` lacks viable-quorum bounds, vote snapshots, proposal expiry/cancellation and exit, and can carry old votes across membership change.
- `Krugman` treats never-reported activity as zero and does not expire stale readings; `KiyotakiWright` begins after priming and forces a global winner.
- unbounded provider/member iteration in several modules is an eventual liveness and denial-of-service boundary.

Every retained mechanism needs a deliberate-break test proving that the corresponding unsafe V1 trace is rejected or explicitly moved outside the V2 target.

## First vertical slice: Knights' Tally Rope

The first V2 slice should be deliberately small and institutionally complete:

- bounded group and contextual identities;
- signed zero-sum positions with explicit mode and acceptance domain;
- a settlement episode that distinguishes tender, acceptance, exact change, pre-agreed rounding and an explicit tip/waiver;
- a bilateral obligation with lifecycle and due time;
- distributed observation and an open breach claim;
- counterparty challenge and a small peer-finding topology;
- advisory, contextual reputation memory;
- separately chosen continuation, refusal, forgiveness or restored credit;
- a quorum rule change plus real exit/fork and role succession;
- a declared priming payer and an ABM that varies continuation surplus and keeper cost.

The slice initially avoids external price oracles, universal identity and automatic physical enforcement. It is complete only if a member can join, exchange, receive correct change or explicitly tip, default, contest, repair, leave and survive replacement of every non-party provider.

## Proof, simulation and deployment gates

### Source/specification gate

- No untyped role, judgement hole, oracle, deadline, conversion or keeper function.
- No agentless causal verb in a loop card.
- Every consequence is downstream of a separately authorised decision or explicitly mechanical rule.
- Every cross-context reputation use is rejected unless independently consented and justified.
- Every lifecycle has terminal, cure and stuck-state handling.
- Every external boundary says what the system cannot know or compel.

### Proof and static-analysis gate

- Conservation for each conserved ledger; no false conservation imposed on claims or assumptions.
- Authorisation and role separation on every state-changing path.
- No retroactive parameter application unless explicitly modelled and consented.
- Rounding, bounds, overflow, timestamp and stale-data properties.
- No wealth-to-vote path unless the profile explicitly declares and tests it.
- No report-to-sanction path without challenge, guard and repair.
- State-machine reachability: no permanent limbo and no impossible terminal state.
- Machine-generated source-to-target traceability and an empty orphan report.

### Simulation gate

- Pre-register/bond assumptions rather than tuning them after the result.
- Sweep priming cost, incumbent switching cost, network threshold and domain size.
- Sweep continuation surplus, horizon, uncertainty, defection gain and keeper cost.
- Test heterogeneous beliefs, multiple simultaneous monies/rails and partial adoption.
- Test keeper dropout, free riding, collusion, censorship, delayed triggering and uneven observation.
- Test false reports, asymmetric challenge resources, repair and re-entry.
- Publish basins of attraction and failure regions, not one favourable trajectory.

### Deployment gate

- Unit, fuzz, invariant, state-machine and adversarial tests for each deployable module.
- No deployable V2 module has a zero-coverage transition; coverage thresholds supplement, rather than replace, mutation and invariant evidence.
- Differential traces: the same source scenario yields compatible proof, ABM and Solidity state transitions where their scopes overlap.
- Explicit oracle provenance, freshness, fallback and halt behaviour.
- Upgrade/succession path that cannot silently rewrite settled history.
- Privacy and data-minimisation review before any reputation record.
- Independent security review before real value; pilot consent and exit plan before real participants.
- No claim that deployment proves adoption, welfare, legitimacy or truth.

### Kill conditions

Stop or redesign a mechanism when any of these persists:

- it needs an unnamed actor or a permanently trusted, irreplaceable provider;
- a finding automatically creates irreversible exclusion;
- a global score leaks across unrelated contexts;
- the keeper cost routinely exceeds the continuation surplus available to keepers;
- the mechanism only works under a hidden subsidy or coercive priming wedge;
- an intended balancing loop reinforces distress for the party who must recover;
- an oracle or governance actor can redistribute retroactively without observable consent;
- proof, simulation and deployment disagree and the discrepancy cannot be scoped and explained;
- a scenario requires an ad hoc primitive that contradicts the common ontology.

## Migration discipline

V2 may import arithmetic; it must not import unilateral assertions as legitimacy. If a live V1 instance is ever discovered, use this default classification:

| V1 state | V2 default treatment |
|---|---|
| members, balances and limits | Import only from a fixed snapshot with a deterministic reconciliation root and a proved before/after conservation equation; settle one explicit demurrage epoch first. Limits become evidence for renewed underwriting, not necessarily rights. |
| operator approvals | Reset; new modules and blanket authority require fresh consent. |
| `Fisher` obligations | Bilateral re-ratification/novation for active items; otherwise archive as unilateral records. |
| `Fiske` modes | Import only as party assertions/proposals, not as mutually established context or custom. |
| `Greif` scores and reports | Archive only; never generate a V2 consequence from context-free, unchallenged history. |
| active `Schumpeter` loans | Settle under V1 or novate with borrower and lender signatures; public default flags enter V2, if at all, as disputed claims. |
| `ChallengeBond` assertions | Resolve/refund where possible and archive; never replay an outcome into a new domain. |
| provider rosters and readings | Re-admit providers under V2 policy; all readings begin stale and need fresh provenance. |
| governance membership and proposals | Fresh constitutional ratification; do not carry pending proposals or old votes. |
| `Ostrom` offices | Re-declare only where an office topology is chosen; re-ratify holder, scope, clock, fallback and succession. |
| meter and experiment runs | Immutable research archive with new run IDs and genuine preregistration in V2. |
| `KiyotakiWright` and `Clark` state | No migration; rerun from versioned seeds and assumption manifests in simulation/proof targets. |

Some mappings cannot be reconstructed from storage alone; V1 events also omit material context in places. V2 therefore defines an export schema and causal/domain identifiers before storage layout, not after deployment.

1. **Freeze V1 as evidence.** Record the commit, compiler, passing tests, warnings, deployed addresses if any, and known documentary overclaims. V1 stays buildable.
2. **Create the V1 disposition ledger.** For every function, state variable, event and test: `preserve`, `change`, `move target`, `drop` or `new`, with rationale and risk.
3. **Write V2 source before V2 Solidity.** Circuit cards, types, lifecycle diagrams, loop cards, assumptions and scenario profiles come first.
4. **Build the Tally Rope slice in a separate V2 namespace.** No proxy upgrade and no mutation of V1 state. In the absence of a discovered live deployment, V2 begins from a new genesis.
5. **Differentially test preserved claims.** Conservation and agreed retained semantics must hold over generated traces; intentional differences need explicit migration tests.
6. **Treat data migration as a normative act.** Balances may have a mechanically provable mapping. Reputation, membership, findings and sanctions do not migrate automatically; affected parties need a declared process and appeal.
7. **Red-team, pilot, then decide.** A successful prototype is evidence for a release decision, not the release decision itself.

## Work sequence and exit criteria

### Phase 0 — baseline and contradictions

- Pin V1 build/test facts and generate source inventory.
- Correct documentation counts, regenerate derived diagrams, and label V1 claims that confuse memory, contest and consequence.
- **Exit:** reproducible baseline plus an empty unknown-contract list.

### Phase 1 — source model

- Define the required types, circuit-card schema, lifecycle semantics and target boundaries.
- Decide each implemented and blueprint artifact's disposition.
- **Exit:** every declared field has semantics, examples and at least one invalid example the checker must reject.

### Phase 2 — institutional and loop audit

- Complete cards and closure vectors for every retained mechanism.
- Reconcile source, institutional, loop and scenario inventories in both directions.
- **Exit:** no unnamed edges or orphan items; every open boundary and bonded assumption is visible.

### Phase 3 — complete vertical slice

- Implement the Knights' Tally Rope across source, proof, ABM and Solidity subsets.
- **Exit:** join/exchange/correct-change-or-explicit-tip/default/challenge/repair/exit/succession traces pass, including adverse paths.

### Phase 4 — breadth and migration

- Run the scenario suite, differential tests and V1 migration ledger.
- **Exit:** each materially different money fits without ontology-breaking exceptions; intentional incompatibilities are named.

### Phase 5 — security and field decision

- Independent review, privacy review, red team, pilot design and rollback/exit plan.
- **Exit:** an explicit decision to deploy, revise or stop. “Compiles” is not an exit criterion.

V2 is ready to be called sane when its invariants and category guards pass; exhaustive when the four bounded inventories reconcile; loop-complete only by the declared closure vector; and field-ready only when the continuation and keeper assumptions survive adverse simulation and an ethically governed pilot.
