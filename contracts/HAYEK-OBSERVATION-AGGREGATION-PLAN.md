# Hayek observation-aggregation amendment plan

_Fixed V1 slice, 2026-08. V2 is read-only source material. This plan authorises only the files listed below._

## Objective

Preserve `SharedNumeraire.sol` byte-for-byte as the V1 compatibility trace and add a separate `ObservationAggregation.sol` mechanism that can publish one typed, bounded, provenance-carrying median observation without calling it truth or applying it to another contract.

The smallest claimed circuit is:

```text
consumer freezes typed epoch and bounded provider roster
  -> named providers submit one attributed observation each
  -> named challenger may mark a submission challenged
  -> challenged and stale submissions are excluded
  -> quorum median finalizes once or explicitly halts
  -> output remains evidence only
```

## Target card

- **V1 artifact:** exact `contracts/SharedNumeraire.sol` compatibility trace plus new V1 mechanism module `contracts/ObservationAggregation.sol`.
- **Retained executable claim:** a bounded fresh median can aggregate multiple declared observations.
- **Concrete defect or missing circuit link:** Hayek's values have no unit, basket, period, provenance or uncertainty; `publish` bypasses contest; `finalize` can replay one legacy assertion to refresh staleness; provider iteration is unbounded; and no quorum distinguishes one fresh input from a viable reference set.
- **V2 distinctions to borrow:** typed unit/basket/period, provenance, observed/submitted times, declared uncertainty, challenge status, bounded provider topology, stale halt and one-time evidence output.
- **Writable files:** `contracts/ObservationAggregation.sol`, this plan, `test/ObservationAggregation.t.sol`, `contracts/README.md`, `contracts/V1-TO-V2-REVIEW-LEDGER.md`, and `docs/book/appendix-executable-canon.md`.
- **Forbidden files:** `contracts/SharedNumeraire.sol`, every other Solidity contract and test, `lib/v2/**`, `docs/v2/**`, `contracts/V2-OVERHAUL-PLAN.md`, configuration, deployment files and optimiser settings.
- **World facts the contract cannot establish:** basket correctness, unit meaning, observation truth, provider independence, representative weighting, provenance quality, challenger legitimacy, consumer prudence and any downstream real effect.
- **Compatibility obligations:** preserve the complete Hayek source, constructor, storage, ABI and existing CoreE2E behavior. The new mechanism neither reads nor mutates Hayek.
- **Required callers and each caller's incentive:** the named consumer creates and finalizes an epoch because it wants a reference observation; named providers and challenger carry explicit opaque incentive references, but their actual compensation and motivation remain external; absence, challenge or staleness causes no output rather than invented data.
- **Tests that would falsify the amendment:** legacy source/ABI drift; mutable or oversized roster; duplicate provider or observation; unit/basket/period crossover; future/out-of-period time; post-deadline submission/challenge; challenged or stale inclusion; quorum bypass; median overflow; replayed finalization; downstream call; or V2 mutation.
- **Stop conditions:** a provider treasury, contest resolver, mutable roster, automatic policy, external call, unbounded iteration, truth label, other-contract edit or V2 edit.

## Fixed mechanism

### Epoch creation

A consumer creates one epoch with:

- nonzero unit, basket, method and epoch references;
- a closed observed period ending no later than creation;
- distinct future submission, challenge and finalization deadlines;
- `maxStale`, quorum and a provider roster of two through sixteen distinct addresses;
- a named challenger distinct from the consumer and providers; and
- nonzero opaque provider- and challenger-incentive references.

The epoch key includes consumer, unit, basket, period and epoch reference. Reuse is rejected. Roster, quorum, scope, clocks and methods never mutate; a changed configuration requires a new epoch.

### Provider observations

Each rostered provider may submit exactly once. The observation contains nonzero value and provenance reference, an observed time within the epoch period and not in the future, declared uncertainty no greater than 10,000 basis points, and the on-chain submission time. Submission closes at the exact deadline.

### Challenge and aggregation

Only the named challenger may challenge a submitted observation, once, with a nonzero reference before the challenge deadline. Challenge excludes the input but does not refute it.

Only the consumer may finalize after the challenge deadline and no later than the finalization deadline. Included observations must be submitted, unchallenged and no older than `maxStale` at finalization. Fewer than quorum inputs halts. The output records:

- overflow-safe median;
- included observation count;
- maximum declared uncertainty among included inputs;
- finalization time; and
- a deterministic digest of the included provider/value/provenance set.

Finalization occurs once and calls nothing. Historical submissions and challenges remain queryable. Expiry needs no keeper transition: after the finalization deadline the epoch simply cannot produce an output.

## Required tests

1. Existing Hayek CoreE2E publication and median behavior remains unchanged.
2. Hayek source and ABI remain exact.
3. Empty scope/method/epoch/incentive refs and zero or excessive clocks are rejected.
4. Provider count is bounded from two through sixteen.
5. Zero, duplicate, consumer, and challenger provider addresses are rejected.
6. Quorum must be at least two and no greater than roster length.
7. Observed period and submission/challenge/finalization clocks are strictly ordered and bounded.
8. Epoch keys are domain-separated and cannot replay.
9. Only rostered providers submit and each submits once.
10. Unit, basket and period are frozen per epoch and distinct epochs do not mix.
11. Zero values, empty provenance, excessive uncertainty, future and out-of-period observed times revert atomically.
12. Submission at its exact deadline fails.
13. Only the named challenger may challenge; duplicate and exact-deadline challenges fail.
14. Challenge excludes without labelling the observation false.
15. Only the consumer may finalize after challenge close and before finalization expiry.
16. Missing, challenged or stale quorum halts.
17. Odd and even medians are correct, including overflow-safe maximum values.
18. Output count, maximum declared uncertainty and digest match included observations.
19. Finalization cannot replay and emits no downstream call.
20. Provider collusion can move the median when colluders form the included majority; the limitation remains visible.
21. Fuzzed bounded rosters and values match an independent sorted median calculation.

## Verification gate

```sh
forge fmt --check contracts/ObservationAggregation.sol test/ObservationAggregation.t.sol
forge build --force --sizes
forge test --match-path test/ObservationAggregation.t.sol -vvv
forge test
npm test -- --runInBand
npm run format:check
npm run lint
npm run typecheck
npm run build
git diff --check
```

Completion also requires an exact Hayek source/ABI comparison, review that the new mechanism has no external call, runtime-size reporting, and a clean V2 read-only check.

## Stop conditions

Stop and revise rather than widen if the slice needs external payments, another contract, a resolver, provider governance, automatic Fisher/selection use, an unbounded roster, an identity/oracle claim, or a V2 edit.
