# Contract renaming plan — mechanism names for modules, thinker names for lineage

_Proposed 2026-08-16. Behaviour-neutral. Supersedes [`ECONOMIST-NAMING-REFACTOR-PLAN.md`](ECONOMIST-NAMING-REFACTOR-PLAN.md), which moved four artifacts the other way._

## Why this is not a new decision

[`V2-OVERHAUL-PLAN.md`](V2-OVERHAUL-PLAN.md) line 41 already ruled it:

> Thinker names remain citations and intellectual lineage. They stop being the primary module boundary.

`README.md` repeats it: _"Thinker names remain lineage in V2; they no longer determine module boundaries."_ V2 has been building in the descriptive register for a while — `SelectionLifecycle`, `LedgerTraceAdapter`, `ReadOnlyEvidenceAdapter`, `SinkCapacityAdapter`, `ExperimentCalibrationAdapter`, `CustomOrderAdapter`, `OfficeKeeperAdapter`, `ContextualFindingMemoryAdapter`. V1's Solidity artifacts are the last place the old convention still holds. This plan finishes a decision rather than opening one.

**A third of the work is a revert, not an invention.** Seven contracts still carry their prior descriptive names on the record, three of them inside their own `@title` lines:

`Hayek` was `SharedNumeraire` · `Kocherlakota` was `TallyRope` · `Schumpeter` was `ProductiveCredit` · and `ChallengeBond`, `ContestableAssertion`, `ObservationAggregation`, `SettlementEpisode` became `Tullock`, `Shavell`, `Condorcet`, `Williamson` in the August 2026 refactor this plan reverses.

**The reputational audit is a second, independent reason — not the justification.** The note added to `README.md` (`## Notes`, "The cast honours mechanisms, not men") **stays and is not superseded by this rename.** The two do different jobs: the rename changes the namespace, the note explains the lineage. Renaming for reputational reasons alone would produce a purge list — `Fisher.sol`'s absence would be louder than its presence, and it would invert the argument the README now makes, that these men authoring the error is the argument rather than an embarrassment to it. Rename all of them, for the architectural reason, and the reputational question dissolves as a side effect.

## Scope rule — the one that keeps this small

**Only backticked code identifiers are renamed. Bare prose naming the person is out of scope by construction.**

Across `docs/`, the cast appears 636 times: **296 as code identifiers, 340 as bare prose about the human being.** That second number is the honour roll, the book, the lineage argument — none of it moves. `Fiske` is the proof case: 45 backticked, 119 in prose. The book chapter *On Whose Shoulders* and `appendix-executable-canon.md` keep every name they have.

## Target card

- **Retained executable claim:** every ABI member, state transition, event, arithmetic rule, caller rule and test assertion is unchanged except for Solidity artifact/type/file names and the comments that reference them.
- **Concrete defect:** V1 Solidity artifacts are named for people while V2 names modules for their jobs, so the same repository uses two conventions and the older one implies a module boundary that V2 has explicitly abandoned.
- **Writable:** the 21 Solidity files and their declared types, 6 person-named interfaces, 9 test files, contract/test comments, the V1 plans and ledgers, backticked identifiers in docs, the `README.md` cast table's left column, and the three cast names in `scripts/position-audit.py`'s docstring.
- **Forbidden:** any behaviour-bearing Solidity line, configuration, deployment or optimiser setting; every bare-prose mention of a person; `docs/book/**` in its entirety.
- **World facts:** a mechanism name does not prove the mechanism correct, complete, legitimate or economically robust; and removing a person's name from an artifact neither erases nor endorses them.
- **Compatibility:** artifact names change deliberately. Function selectors, event signatures, constructor arguments and storage layout are unaffected — a Solidity contract's name is not an input to any of them. Runtime bytecode changes only in the trailing CBOR metadata hash. No deployment evidence exists in the repository, so no migration is inferred.
- **Falsification:** compilation failure, any changed function/event ABI, changed runtime beyond metadata, a failed test, an unexpected contract-size change, a changed position-audit count, or a V2 boundary violation stops the rename.
- **Stop condition:** if a proposed mechanism name does not describe what the contract actually does, keep the thinker name until someone can say the job in words.

## Mapping — contracts

| Current | Proposed | Prior name on record | The narrow job |
| --- | --- | --- | --- |
| `Kocherlakota` | `SignedPositionLedger` | _TallyRope_ | records signed positions, clears at net zero |
| `Fiske` | `ModePermissionGate` | — | keeps Immediate-mode bonds off the settlement rail |
| `FiskeModeAgreement` | `BilateralModeAgreement` | — | scoped bilateral mode proposal, assent, expiry |
| `Hayek` | `SharedNumeraire` | **✔ SharedNumeraire** | median rod from competing fresh observations |
| `Condorcet` | `ObservationAggregation` | **✔** | bounded typed aggregation of attributed reports |
| `Fisher` | `IndexedObligation` | — | indexes a promise to the rod, settles on the ledger |
| `JohnCommons` | `BilateralTermsSchedule` | — | futurity: due periods, cure, forgiveness, termination |
| `Schumpeter` | `ProductiveCredit` | **✔ ProductiveCredit** | priced, purpose-scored loan |
| `Greif` | `ReputationMemory` | — | global score trace + contextual findings, advisory |
| `Tullock` | `ChallengeBond` | **✔** | fixed-stake assertion contest |
| `Shavell` | `ContestableAssertion` | **✔** | bounded private adjudication and appeal |
| `Williamson` | `SettlementEpisode` | **✔** | tender, posting, residual, discharge acknowledgement |
| `Friedman` | `GovernedDials` | — | parameter changes must pass vote and delay |
| `Ostrom` | `AppointedOffice` | — | holder, mandate, clock, visible non-performance |
| `Krugman` | `CountercyclicalElasticity` | — | adjusts credit elasticity against an activity shortfall |
| `Stigler` | `PriceDiscoveryCheck` | — | compares a quote with a median observed price |
| `Cantillon` | `NominalExposureMeter` | — | who a moving level moves against |
| `KiyotakiWright` | `AcceptanceThreshold` | — | an acceptance score feeding on itself |
| `Clark` | `LiquidationThreshold` | — | δ > 2r ⇒ liquidating a regenerating stock pays |
| `Starr` | `SinkCapacityEvidence` | — | realised sink capacity; read by `SinkCapacityAdapter` |
| `BigoniCameraCasari` | `ExperimentCalibrationEvidence` | — | paired-treatment evidence; read by `ExperimentCalibrationAdapter` |

The last two are named to pair with the TypeScript adapters that already read them, which is the clearest signal that the descriptive register was always the repository's real convention.

## Mapping — interfaces and tests

| Interface | Proposed | Declared in |
| --- | --- | --- |
| `IHayek` | `ISharedNumeraire` | `Fisher.sol` |
| `IHayekIndex` | `INumeraireIndex` | `Cantillon.sol` |
| `ITullock` | `IChallengeBond` | `Hayek.sol` |
| `IKrugman` | `ICountercyclicalElasticity` | `Kocherlakota.sol` |
| `IFiske` | `IModePermissionGate` | `Kocherlakota.sol` |
| `IFiskeAgreement` | `IBilateralModeAgreement` | `Kocherlakota.sol` |

Test files follow their subject: `Clark.t.sol` → `LiquidationThreshold.t.sol`, `Condorcet.t.sol` → `ObservationAggregation.t.sol`, `JohnCommons.t.sol` → `BilateralTermsSchedule.t.sol`, `KiyotakiWrightAmendment.t.sol` → `AcceptanceThreshold.t.sol`, `Ostrom.t.sol` → `AppointedOffice.t.sol`, `TullockShavell.t.sol` → `ChallengeAndAdjudication.t.sol`, `Williamson.t.sol` → `SettlementEpisode.t.sol`. `CoreE2E.t.sol` and `ContextualFindingMemory.t.sol` already describe jobs and do not move.

## Two mechanical traps

**1. Replace longest identifier first, always.** A naive word-boundary pass on `Fiske` corrupts `FiskeModeAgreement`; on `Hayek` it corrupts `IHayek` and `IHayekIndex`; on `Tullock` it corrupts `ITullock`. Sort the mapping by descending identifier length and apply in that order, or the rename silently produces `IModePermissionGateAgreement`-shaped garbage that still compiles.

**2. `Commons` is an English word this repository uses.** `JohnCommons` is safe as a whole identifier, but any pass that touches the bare token will hit Ostrom's _Governing the Commons_, "the commons", and the tragedy-of literature. Match `JohnCommons` only, never `Commons`.

## Sequencing — four waves, each independently green

Every wave ends with `forge build --force --ast && forge test`. Do not start the next until the previous is green; the point of the waves is that a mistake is bounded to one of them.

1. **The seven reverts.** `Hayek`, `Kocherlakota`, `Schumpeter`, `Tullock`, `Shavell`, `Condorcet`, `Williamson` → their recorded prior names. Lowest risk, and precedent already exists in the repository for each.
2. **The remaining fourteen contracts**, using the mapping above.
3. **Interfaces and test files**, including `git mv` for the file renames so history follows.
4. **Docs sweep** — backticked identifiers only, then the `README.md` cast table's left column becomes the module and the populariser column keeps every name it has. The table stops being an index of rooms named after people and becomes an index of jobs, each with its lineage attached. Same information, honest ordering.

`ECONOMIST-NAMING-REFACTOR-PLAN.md` is **not deleted** — it keeps the record of why four artifacts were renamed in August 2026 and contributes the falsification card this plan reuses. Add a one-line superseded header pointing here.

## Verification

Reuses the falsification card above, plus:

- `forge build --force --ast && forge test` — **122 tests across 9 suites, 0 failed**, unchanged before and after every wave.
- `python3 scripts/position-audit.py` — must still read **49 authority positions across 20 contracts** (the forced-build reading on 2026-08-16; note `README.md` still documents a stale "26 across 14" from before the V2 contracts landed — correct that separately, not as part of this rename). The script globs `out/*.sol/*.json` and derives labels from artifact paths, so it picks up new names automatically; an unchanged count is the proof that no contract was dropped on the floor mid-rename. Only its docstring hardcodes cast names (`Fisher.payer`, `Schumpeter.borrower`, `Tullock.asserter` at lines 27–28).
- `forge build --sizes` — contract sizes unchanged beyond metadata.
- A diff of `out/**/*.json` ABI blocks before and after: every `"abi"` array must be byte-identical. This is the strongest single check and it is cheap.
- The book must **not** change: rebuild via `../bookcrafter` (`assemble.py` → `build.py build -i bovi-four-modes`) and confirm the emitted `Content.md` is identical to its pre-rename state. Any diff means the sweep leaked into prose and violated the scope rule.
