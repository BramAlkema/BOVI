# SelectionLifecycle — V2 source specification

_Implemented JSON-safe source contract and deterministic headless ABM, 2026-08. This is not a proof target or Solidity deployment._

## Decision

`SelectionLifecycle` is the mechanism-named V2 module for how a possible money enters, spreads through, persists in and leaves a bounded acceptance domain. It replaces `KiyotakiWright` as the architectural home of selection. The V1 [`KiyotakiWright.sol`](../../contracts/KiyotakiWright.sol) contract remains frozen as a compatibility fixture: it can reproduce its old three-score threshold trace, but it is not extended and supplies no V2 lifecycle state.

The module owns only:

- the scoped lifecycle state machine;
- the minimum credible circulation circuit required to leave priming;
- propagation and reverse-cascade assumptions;
- the declared handoff from external support to self-maintenance;
- actor-specific continuation tests; and
- references to typed observations, findings, keeper assignments and world boundaries.

It does not own a ledger, a custom, reputation, an office, a tax sink or an experiment. Those mechanisms may supply narrow observations. They do not set lifecycle state themselves.

This specification instantiates the source-model direction in [`V2-OVERHAUL-PLAN.md`](../../contracts/V2-OVERHAUL-PLAN.md) and the one-source/three-target rule in [`SPECIFICATION-LANGUAGE.md`](../SPECIFICATION-LANGUAGE.md).

## Source shape

The source representation is declarative and JSON-safe: identifiers, tagged records and bounded integers, with no callbacks, hidden reads or target-specific addresses. Quantities and payoffs use safe-integer `MicroUnits`; their monetary unit comes from the referenced instrument/domain. Probabilities use integer `Ppm` constrained to `0..1_000_000`; time uses integer `Tick`. Arithmetic that would exceed JavaScript's safe-integer range is rejected rather than rounded. A continuation payoff with no actor, domain, counterfactual or evidence is invalid.

The concrete source lives under `lib/v2/selection-lifecycle/`. Its serialized root is `ScenarioSpec` at `schemaVersion = "selection-lifecycle/v1"`; `SelectionLifecycle` is the mechanism/module name, not a second competing envelope. The root fields are:

| Field                                                            | Type                            | Required meaning                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`, `modelVersion`, `scheduleVersion`, `rngVersion` | version literals                | Pin source semantics, engine, staged schedule and random generator.                                                        |
| `id`, `title`                                                    | identifiers/text                | Stable scenario identity and human label. Thinker lineage stays citation metadata in documentation, never a discriminator. |
| `initialCondition`                                               | tagged literal                  | `orphan-candidate`, `matched-obligation` or `inherited-installed`.                                                         |
| `ticks`                                                          | safe integer                    | Declared simulation horizon.                                                                                               |
| `warmupTicks`                                                    | safe integer                    | Reserved schema-v1 field: validated and serialized, but not consumed by the schedule or metrics.                           |
| `actors`                                                         | `ActorSpec[]`                   | Heterogeneous roles, domains, outside options, beliefs, thresholds, costs and learning/exit parameters.                    |
| `domains`                                                        | `DomainSpec[]`                  | Acceptance domains, installation/maintenance criteria and initial per-instrument lifecycle state.                          |
| `instruments`                                                    | `InstrumentSpec[]`              | Unit, ledger, rail, issuer, transaction/authentication cost, fractionation and repairability.                              |
| `relationships`                                                  | `RelationshipSpec[]`            | Directed actor opportunities scoped to domains and instruments.                                                            |
| `circuits`                                                       | `MinimumCredibleCircuitSpec[]`  | Exactly one circulation circuit and its credibility threshold for every declared domain/instrument pair in schema v1.      |
| `keeperAssignments`                                              | `KeeperAssignmentSpec[]`        | Per-function topology, actors, capacity, reliability, cost/reward, funding, fallback and open boundary.                    |
| `primingMechanisms`                                              | `PrimingMechanismSpec[]`        | Who bears cold-start cost and how. `orphan-candidate` requires at least one.                                               |
| `continuationOpportunities`                                      | `ContinuationOpportunitySpec[]` | Actor-accessible, decomposed cooperative surplus attached to relationships.                                                |
| `continuationAssumptions`                                        | `ContinuationAssumptionSpec[]`  | Exact records are required for every load-bearing actor/action; additional diagnostic records may remain non-circuit.      |
| `bondedAssumptions`                                              | `BondedAssumptionSpec[]`        | Scope, claim, asserter, stake, refutation, standing and provenance.                                                        |
| `policies`, `shocks`                                             | tagged records                  | Versioned behaviour rule and declared interventions; legacy K–W is compatibility-only.                                     |
| `worldBoundaries`, `killConditions`                              | non-empty text lists            | What no target can guarantee and what rejects the scenario.                                                                |

`DomainSpec` is the concrete `AcceptanceDomain`: it declares `unit`, `ledger`, `rail`, `function`, `relationship`, `place`, `period`, `population`, eligible/incumbent instruments, competing/coexisting domains and per-instrument state. Where a layer is absent, the profile names an explicit `none` or physical-possession profile rather than leaving the string blank. Card for a bill and cash for a tip therefore remain two scoped selections, not inconsistent answers to “which money won?”

## The minimum credible circulation circuit

A seed is not circulation. `MinimumCredibleCircuitSpec` declares a directed path that begins with availability and returns to renewed availability after use:

```text
available
  → acquired
  → tendered or offered
  → accepted
  → transferred or posted
  → re-spent, cleared or redeemed
  → available again
```

Its concrete fields are:

- `id`, `domainId` and `instrumentId`;
- ordered `edges: CircuitEdgeSpec[]`, each with `id`, `relationshipId`, an action (`acquire`, `tender`, `accept`, `post`, `respend`, `clear`, `redeem` or `renew`), both relationship endpoints in `loadBearingActorIds`, `keeperAssignmentIds` and a `renewal` marker;
- `minCompletedCycles`, `minDistinctActors` and `windowTicks`; and
- `maxFailurePpm`.

Schema v1 requires exactly one circuit for each domain/instrument pair. The source validator rejects a path that ends at first acceptance, lacks exactly one acquisition/tender/acceptance/posting step, lacks exactly one re-spend/clear/redeem continuation, or does not end in a single marked renewal. Edges are continuous: each relationship must begin with the preceding relationship's recipient, and each edge must name both endpoints exactly once as load-bearing actors. The engine executes these edges in declaration order and stops the cycle at the first unavailable opportunity, refusal or keeper failure. Only a path that reaches its final renewal counts as a completed cycle.

Outside an explicitly targeted active priming wedge, both load-bearing actors must also have a positive continuation margin for that edge's action. Aggregate gains elsewhere cannot make their tender, posting or renewal happen. Actor-local cooperative surplus is credited only after the final renewal closes the full circuit; a posting followed by failed re-spending or renewal creates no realised circuit surplus.

Attempted and completed histories are stored by `circuitId`, and credibility is recomputed from that circuit's own window, failure ceiling and distinct accepting load-bearing actors. Activity in one circuit therefore cannot make another circuit credible. “People will re-spend it” is a bonded assumption until observed. The circuit is _credible_, not metaphysically closed: physical delivery, genuine assent and future response remain at the world boundary.

## Lifecycle state machine

`SelectionLifecycleState` is a tagged state, not a percentage:

| State                        | Meaning                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `candidate`                  | Scoped possible instrument; no priming or continuous use claimed.                                                                                                                                                                                                                                                                                                     |
| `priming`                    | At least one declared wedge bears a cold-start cost.                                                                                                                                                                                                                                                                                                                  |
| `propagating`                | A minimum credible circuit has been found; use may spread but installation is not yet established.                                                                                                                                                                                                                                                                    |
| `installed-supported`        | Installation passed, but external support remains or the removal, maintenance and continuation evidence is not yet mature. It is the mandatory certification state even when support is already absent.                                                                                                                                                               |
| `installed-self-maintaining` | A complete post-removal operating window passes the circuit and maintenance tests, every required circuit actor/action claim holds, and each required keeper root has a viable primary-or-fallback path including any funders. Unrelated diagnostic claims and unused assignments do not gate it. Fees or rewards funded internally by the circuit may remain active. |
| `repairing`                  | A named closure dimension failed and a bounded repair path is active.                                                                                                                                                                                                                                                                                                 |
| `fragile`                    | Circulation still occurs, but mature circuit/maintenance evidence or post-removal continuation is missing, disputed or below its robust range; observed decline is not yet established.                                                                                                                                                                               |
| `declining`                  | Use or circuit credibility is below the declared floor or follows the declared reverse-cascade condition.                                                                                                                                                                                                                                                             |
| `exited`                     | Terminal: the profile's exit and record-disposition procedure completed.                                                                                                                                                                                                                                                                                              |
| `collapsed`                  | Terminal: the circuit ceased to be credible and no repair or re-priming path completed in time.                                                                                                                                                                                                                                                                       |
| `superseded`                 | Terminal: a named successor assumed the function under an explicit state/record map.                                                                                                                                                                                                                                                                                  |

The allowed phase-changing events are deliberately few:

| Event                    | From → to                                                                    | Minimum guard                                                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `startPriming`           | `candidate` or `declining` → `priming`                                       | Complete `PrimingMechanismSpec`, authorised invoker and keeper path.                                                                                                                 |
| `confirmCircuit`         | `priming` → `propagating`                                                    | The named circuit's own completed-cycle, failure and distinct-actor window meets its declared credibility guard.                                                                     |
| `confirmInstalledUse`    | `propagating` → `installed-supported`                                        | Repeated completed circuits meet the installation criterion; support may remain, or certification evidence may still be maturing.                                                    |
| `confirmSelfMaintenance` | `installed-supported` → `installed-self-maintaining`                         | External wedge passes its removal test; required circuit actor/action claims and a primary-or-fallback keeper/funder path hold. Internally circuit-funded fees/rewards are allowed.  |
| `reportFragility`        | either installed state → `fragile`                                           | After evidence maturity, circuit credibility or maintenance failed; after removal grace, a required continuation assumption may also fail. Mere absence of support is not fragility. |
| `reportDecline`          | `propagating` or `fragile` → `declining`                                     | The declared recent-use/circuit floor or reverse-cascade guard is crossed.                                                                                                           |
| `restoreSupport`         | `fragile` → `installed-supported`                                            | Explicit external support restored and fresh installation guard met.                                                                                                                 |
| `restoreSelfMaintenance` | `fragile` → `installed-self-maintaining`                                     | Fresh wedge-removal and actor-coverage guards met.                                                                                                                                   |
| `beginRepair`            | either installed state, `fragile` or `declining` → `repairing`               | Repair owner, clock, fallback and attainable completion condition declared.                                                                                                          |
| `completeRepair`         | `repairing` → either installed state                                         | Repair finding plus the corresponding fresh support or self-maintenance guard.                                                                                                       |
| `failRepair`             | `repairing` → `fragile` or `declining`                                       | Timeout or failed repair condition, distinguished by whether circulation still meets its floor.                                                                                      |
| `completeExit`           | any non-terminal state → `exited`                                            | Exit rights, unresolved claims and record portability disposed of.                                                                                                                   |
| `confirmCollapse`        | `priming` through `declining` → `collapsed`                                  | Declared collapse condition and terminal disposition.                                                                                                                                |
| `completeSuccession`     | either installed state, `repairing`, `fragile` or `declining` → `superseded` | Successor, consent/authority, state map and non-retroactivity guard.                                                                                                                 |

The current event vocabulary represents these semantic operations with `lifecycle-transitioned` records rather than separate command types. Mechanical transitions are `engine-derived`: replay recomputes their declared guard and rejects an invented state jump, wrong invoker, wrong keeper path, missing evidence, mismatched reason or illegal edge. `startRemovalTest` is represented by the external-support removal clock rather than a phase change. A fork remains outside the automatic ABM.

The engine automatically covers candidate, priming, propagation, installation, support removal, self-maintenance, fragility, decline and mechanically guarded collapse/re-priming paths. It does **not** manufacture a repair, exit or successor. Entry to `repairing`, entry to `exited` or `superseded`, and departure from `repairing` require an externally supplied `accepted-finding` transition with named finding references. An accepted finding may also record an allowed externally determined collapse; accepted-finding transitions on ordinary automatic edges must still satisfy the mechanical lifecycle guard. The reducer checks the allowed state edge and scoped keeper/evidence metadata but does not establish that the finding is true. Merely stopping a wedge never proves self-maintenance.

## Keeper execution and funding

`KeeperAssignmentSpec` makes each load-bearing service executable rather than naming a generic keeper. It declares the function and topology, assigned actors, `requiredActorsPerAction`, per-tick action and funding capacities, reliability, action cost/reward, fallback assignment and any open boundary. An unassigned open boundary never acts on behalf of the model: its failure remains visible and only a viable declared fallback may close that edge. A fallback must serve the same keeper function; changing function requires a separate explicit conversion type that schema v1 does not provide. A concrete-instrument primary may fall back only to that instrument or an instrument-agnostic assignment, while an instrument-agnostic primary may fall back only to another instrument-agnostic assignment. Coverage counts the circuit-required root obligation, not every diagnostic attempt: a successful fallback satisfies the failed primary's slot instead of inflating the denominator. For `bilateral` topology, the engine filters the actors to the current edge's two endpoints. Structural replay checks assignment, fallback reachability, root-obligation identity and edge scope; exact endpoint selection and fulfillment are authenticated by deterministic regeneration.

Funding is typed separately from performance:

- `internal` assignments name participant `fundingActorIds` and a `fundingCapacityPerActorPerTick`. A positive keeper reward also requires a matching `fund-keeper` continuation claim for every named funder. At runtime an active funder must have a positive actor-specific margin after cumulative same-tick payments replace the claim's generic funding-cost estimate, plus remaining per-tick capacity; one continuation value cannot be reused for each payment before state advances. Funding cost, keeper cost and keeper reward are recorded separately.
- `external` assignments name at least one non-participant identifier in `externalPayerIds` and bound rewards with `externalFundingBudgetPerTick`. The budget must cover at least one required keeper action; exhaustion makes the action fail or use its declared fallback. Acting keeper events preserve the payer identifiers and reward paid even though external payers have no participant account in the ABM.
- `unfunded` assignments cannot promise a reward.

Schema validation always requires a matching continuation claim for every circuit-edge actor/action, every assigned keeper actor/function, and every participant asked to fund a positive keeper reward. When a concrete keeper assignment is evaluated, cumulative same-tick actual rewards and costs replace the matching claim's generic `immediateReward` and `keeperEffortCost` estimates; the same actor/action claim is shared across assignments in that scope, so neither repeated calls nor a parameter sweep can multiply one continuation value. Each attempted root records `rootEconomicsCovered` for the complete primary/fallback path. The engine preflights enough cumulative-margin-positive internal funding slots before drawing keeper reliability, so a random miss cannot hide the absence of anyone able to fund the work. Positive actor/action margins can carry circuit-edge performance during cold start, while an active priming mechanism may temporarily carry its named target actors instead. Continuation cannot carry cold-start keeper performance or internally fund its reward before the circuit exists; a named active priming mechanism or named external funding must carry that keeper work.

A priming-carried keeper slot consumes the assignment's declared reward from the active mechanism's remaining budget. Each tick's fixed priming cost and carried-keeper rewards are summed before the mechanism can spend; insufficient remaining budget makes the keeper path fail or take its declared fallback. Every spend is divided deterministically across sorted `payerIds`: participant payers receive an explicit `primingCosts` debit, non-participant payers accumulate mechanism `externalSpent`, and those two totals must equal mechanism spend. The keeper separately bears `costPerAction` and receives `rewardPerAction`; only that reward is `keeperCarryCost`. `totalBudget` is therefore a bounded named commitment, not a free simulator input. Whether the wedge counts as external support is determined by `externalInput`, not by payer identity.

## `PrimingMechanismSpec`

Each priming mechanism has exactly these semantic fields:

- `id`, `domainId`, `instrumentId` and `circuitId`;
- `payerIds`: the named bearers of the priming cost;
- `targetActorIds`;
- `wedgeKind`, one of `subsidy`, `coercion`, `tax-receivability`, `legal-privilege`, `platform-leverage`, `prior-use`, `speculation`, `familiar-form` or `other`, plus `wedgeDescription` where needed;
- `startsAtTick`, `costPerTick`, `totalBudget`, `acceptanceBoostPpm` and `switchingCostOffset`;
- `stopCondition`, tagged as `tick`, `credible-circuit`, `installed` or `budget-exhausted`;
- `removalTestTicks` and `externalInput`;
- `keeperAssignmentIds`; and
- `bondedAssumptionIds`, which carry provenance, scope, refutation and standing for claims the mechanism cannot observe directly.

`stopCondition` says when the sponsor _may test removal_. `removalTestTicks` defines the minimum post-removal observation window. They are not the same field. Runtime external support means either an active priming mechanism with `externalInput: true` or an executable externally funded keeper on a circuit-required assignment or fallback path. Unused external assignments elsewhere in the domain do not count. When the last required external support disappears, the engine records that tick as `wedgeRemovedAtTick`; returning support clears the clock, and a later removal starts a fresh test. An initially installed profile, or a new installation, with no external support starts that clock immediately. Self-maintenance waits for the larger of the removal test, domain-maintenance window and circuit observation window, so every circuit, keeper-coverage and use observation used for certification was generated after support disappeared; priming-era history cannot fill that window.

Required external support, or an incomplete post-removal operating window, prevents qualification for `installed-self-maintaining`; a mixture of internal and external funding does not count as self-maintenance. Support never substitutes for circulation: after the declared evidence window, lost circuit credibility or failed maintenance moves even a supported instrument to `fragile`. If every primary/fallback path for an attempted keeper root lacks a positive cumulative actor/funder margin, that economic opening moves an installed instrument to `fragile` immediately; a reliability draw, disabled office or capacity miss remains governed by the declared credibility and keeper-coverage windows instead of overriding their tolerated failure rates. A newly inherited installed profile receives only that bounded evidence grace, not permanent presumed health. A `fragile` lifecycle does not recover merely because external support exists: it must also regain its installation guard and current keeper economics. Only after a fresh full window of renewed circuit/maintenance evidence, every required circuit actor/action claim and a viable keeper/funder path hold can a qualifying lifecycle become `installed-self-maintaining`. Unrelated diagnostic assumptions and unused keeper assignments remain visible source but are not load-bearing gates. A non-external priming wedge starts its removal clock on installation. A fee or reward funded entirely by the continuing circuit is not an external wedge and may remain after that transition.

## `AcceptanceFeedback` composition

`AcceptanceFeedback` is the simulation-facing propagation mechanism, not a separate serialized interface. It composes `ActorSpec.acceptance` (initial reacceptance belief, adoption/abandonment thresholds and windows, switching/holding costs and installed complement), directed `RelationshipSpec` opportunities, `DomainSpec` scopes and a tagged `PolicySpec`. The normal policy is `threshold-learning`; `legacy-kw-threshold` exists only to reproduce compatibility traces. Priming directly boosts acceptance and offsets switching cost only for `targetActorIds`. All adoption decisions for one tick are calculated from the same pre-adoption state and emitted only after the whole staged snapshot has been evaluated, so the seed can affect neighbours only on later ticks and actor iteration order cannot create a within-phase cascade. The canonical tally-rope cold start targets one seed: neighbouring vulnerable actors adopt from the prior tick's signal, and the last unprimed actor follows only in a later batch. Initial acceptors begin with the declared installed complement; a false-to-true adopter acquires it, and it currently persists after abandonment. If that instrument later becomes installed, accepted complements in a declared competing domain contribute to path-dependent defence against a challenger. Competing and coexisting declarations must be symmetric, are mutually exclusive and cannot self-link; coexistence supplies no defence cost. The composition does not contain a forced winner or a sticky universal `isMoney` flag. Multiple instruments may remain installed for different functions or relationships. `coexistingDomainIds` records intended non-interference; it is not itself a causal adoption force.

Kiyotaki–Wright is lineage for this submechanism. The V1 compatibility fixture has no agents, matching, production, consumption, inventories or scoped domains, so its external scores cannot satisfy this type.

## `ContinuationOpportunitySpec` and `ContinuationAssumptionSpec`

The source separates what may be lost from the actor/action incentive claim.

`ContinuationOpportunitySpec` contains `id`, `domainId`, `relationshipId`, `instrumentId`, `arrivalPpm`, `clearProbabilityPpm`, `provenance`, `bondedAssumptionIds` and `accessibleSurplus`. The last field lists actors and their non-overlapping `SurplusComponentSpec` records, each tagged as:

- `specialisation`: incremental output or option value enabled by narrower productive roles;
- `trade-fractionation`: gain from splitting barter coincidence across quantity, time or counterparty; or
- `conflict-mitigation`: avoided search, bargaining, dispute, enforcement or relationship-repair cost;

Each component supplies `amount: MicroUnits`, `counterfactualId`, `overlapKey` and, for fractionation, `fractionationKind`. Every opportunity must be referenced by at least one continuation assumption. Duplicate overlap keys for one actor/opportunity are invalid, as are repeated actor/overlap keys across the full set of opportunities claimed by load-bearing actions on one circuit.

Every `ContinuationAssumptionSpec` is keyed by `actorId × action × domainId × instrumentId`. An exact record is required for every load-bearing actor/action; additional records may describe diagnostic or non-circuit actions and remain non-gating and non-realising unless linked to a circuit edge. Each record names `opportunityIds`, `horizonTicks`, `discountPpm`, a direct or finding-mediated `lossPath`, `outsideOptionAdvantage`, `immediateReward`, `oneShotDefectionGain`, `participationCost`, `keeperEffortCost`, `riskCost` and `bondedAssumptionIds`. A finding-mediated loss path keeps `observationPpm`, `upheldFindingPpm` and `responsePpm` separate. The referenced `BondedAssumptionSpec` supplies scope, claim, asserter, stake, refutation condition, challenger standing and provenance.

Expected future flow and realised accounting are deliberately separate. Completing `renew` credits only non-overlapping opportunity IDs explicitly referenced by an exact actor/action claim carrying an ordered edge of that circuit. The credited amount is the active relationship's one-tick accessible flow after its runtime opportunity scale, `arrivalPpm` and `clearProbabilityPpm`; an inactive, zero-arrival or zero-clear opportunity credits nothing. An orphan opportunity, or one referenced only by a diagnostic/non-circuit action, cannot silently enlarge realised surplus.

For one actor/action, the tested claim is:

```text
P(opportunity remains available)
  × P(declared loss path if this actor stops)
  × PV(non-overlapping accessible surplus components)
  + immediate reward
  > outside-option advantage
  + one-shot defection gain
  + participation cost
  + keeper effort cost
  + risk cost
```

The left-hand side is evaluated through the declared loss path and swept across preregistered scenario values. For repeated keeper or `fund-keeper` work within one tick, cumulative concrete rewards and costs replace the single generic estimate before each next action; the margin must remain strictly positive until state advances. There is no system-wide `continuationSurplus`, `socialCredit` or reputation multiplier. Surplus enjoyed by merchants cannot silently motivate an unpaid observer; aggregate gains cannot be assigned to the actor who must trigger, authenticate, challenge or repair. Required circuit actor/action rows and the selected reachable keeper/funder path are self-maintenance gates. Extra diagnostic rows remain sensitivity evidence rather than silently becoming new load-bearing obligations. Failure of a required row leaves economic continuation open unless an ongoing input is named.

## Narrow evidence adapters

These read-only input boundaries are implemented in `lib/v2/selection-lifecycle/adapters.ts`; they deliberately remain outside the serialized `ScenarioSpec`. Each implements `observe(query) → ObservationEnvelope[]`. The envelope preserves domain, reporter, method, provenance, observed period, timestamp, uncertainty, freshness and challenge status. It cannot contain lifecycle state or a transition. Exported names are mechanisms; thinker names appear only in adapter lineage metadata.

| Adapter                          | Legacy/reference input | May emit                                                                                                                            | Must not imply                                                                                                      |
| -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `SinkCapacityAdapter`            | `Starr`                | Outstanding stock; decreed and realised sink; coverage; encounter share; preregistered conditional threshold/finding.               | Price, adoption, general priming sufficiency or realised enforcement.                                               |
| `LedgerTraceAdapter`             | `Kocherlakota`         | Paired postings, positions, write authority, conservation result and staleness. V1 `Settled` maps only to `Posted`.                 | Delivery, acceptable tender, correct change, debt discharge or continued acceptance.                                |
| `CustomOrderAdapter`             | `Ellickson` profile    | Scoped custom assertions, claimed adoption/rejection, performance claims, challenges, peer findings, remedy, expiry, fork and exit. | Silent assent, fairness, universality, truth or automatic sanction.                                                 |
| `ContextualFindingMemoryAdapter` | V2 `Greif` replacement | Attributed, scoped, purpose-limited, expiring, challengeable and repairable findings.                                               | A global score or an exposure decision. V1 global deltas are archive-only.                                          |
| `OfficeKeeperAdapter`            | `Ostrom`               | Office assignment, duty, clock, vacancy, self-asserted discharge and separately timed overdue observation.                          | Performance, timely triggering, accountability or punishment. V1 overdue flags do not reset performance time in V2. |
| `ExperimentCalibrationAdapter`   | `BigoniCameraCasari`   | Preregistration status, arm definition, observations, binding frequency, effect estimate and uncertainty.                           | A production rule or automatic lifecycle transition; post-outcome “preregistration” is invalid.                     |

These inputs may support or refute a guard only after the declared claim/challenge/finding policy. `SelectionLifecycle` owns the deterministic application of an accepted guard result; the adapter owns neither truth nor consequence.

## Irreducible world boundary

`ScenarioSpec v1` stores `worldBoundaries` as a non-empty text list. Until that becomes a tagged union, every entry must name one of two irreducible families in its text:

1. **Constitutive:** who is a person or party, who belongs, who has standing, whether assent is genuine, and whether a claimed custom or successor is legitimate.
2. **Event/response:** whether goods or services were physically delivered; a physical item is authentic; somebody actually noticed a non-event; tender was understood and accepted; participants believe others will reaccept; a future opportunity or counterfactual surplus exists and is accessible; law or coercion will bite; a finding will change future trade; a keeper will continue; and an arrangement is fair or welfare-improving.

A profile may attach an observation process or bonded assumption to one of these questions. That makes the boundary explicit and contestable; it does not move the fact on-chain or make the simulator cause it. Every target must preserve the boundary label and say what it cannot know, compel or guarantee.

## Reproducible simulation

The implementation lives in `lib/v2/selection-lifecycle/`: types and validation, deterministic RNG and canonical hashing, event reducer/replay, lifecycle/continuation/keeper logic, read-only evidence adapters, canonical scenarios and parameter sweeps. The staged schedule and RNG versions are part of every run manifest. Every full trace begins with `run-started { seed, ticks, scenarioHash }`; ticks are positive and cannot exceed the source horizon, and the hash labels the canonical scenario content. At the end of each generated run the engine structurally replays its event log from the validated source and rejects terminal-state divergence.

There are deliberately two verification levels. `replayEvents` and `replayScenario` establish ordering, source references, local transition guards and declared-horizon completeness for events that are present; they cannot prove that an RNG-selected trade, declared shock or required engine decision was omitted. An imported deterministic trace is authenticated only by `verifyDeterministicTrace({ scenario, seed, ticks, events })`. It canonical-snapshots the supplied JSON array once, reruns the pinned model and compares every complete event payload in order against that snapshot before structural replay, so a mutable accessor or second iterator cannot change what is replayed after comparison. The scenario, seed and tick count are trusted inputs and the comparison uses canonical event content, not the non-cryptographic FNV label alone. Accepted external findings remain outside this deterministic verifier.

```sh
npm run build:selection-lifecycle
npm run simulate:selection-lifecycle -- --list
npm run simulate:selection-lifecycle -- --scenario knights-tally-rope --seed lecture-demo
npm run simulate:selection-lifecycle -- --scenario challenger-against-incumbent \
  --sweep /primingMechanisms/0/switchingCostOffset=0,50,100 --replicates 3
```

Outputs default to `tmp/selection-lifecycle/<scenario>.json`. A normal run contains the summary with its nested manifest, structurally replayable event log and terminal state. Use the exported strict verifier—not structural replay alone—when accepting such a deterministic log from outside the generator. A sweep instead returns its axes/seeds and one compact record per coordinate/seed, including scenario and terminal hashes, lifecycle states, post-priming survival and the weakest keeper margin; it does not duplicate every event log or terminal state. A nominally positive weakest margin is reported as `null` if an actually attempted post-removal root path failed under cumulative same-tick economics, so the compact sweep cannot advertise that infeasible path as robust without its full trace. `--output`, `--ticks` and repeated `--sweep` axes are supported.

## Remaining target boundary

The source schema, validator, deterministic ABM/structural replay, strict source-seed-horizon trace verifier, evidence-adapter boundary, four canonical selection scenarios and safe-integer parameter sweep are implemented. The broader institutional cards and the full Knights' Tally Rope exchange/custom/repair/exit/succession profile are not completed by this selection slice. Repair, exit and succession remain accepted external findings, not simulated discoveries.

No V2 proof derivation or deployable Solidity selection contract is implemented. These targets come only after source checks and institutional/loop audits pass; a Solidity module remains optional rather than the definition of completion. There is no thinker-named V2 directory and no claim that deterministic replay proves adoption, truth, legitimacy, welfare or a world-side fact.
