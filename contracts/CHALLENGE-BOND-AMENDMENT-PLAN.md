# Tullock contestable-assertion amendment plan

_Fixed V1 slice, revised at the declared size stop on 2026-08. V2 is read-only source material. This plan authorises only the files listed below._

The first unoptimised build proved that embedding the isolated lifecycle directly in `ChallengeBond` produced 27,390 bytes of runtime, 2,814 bytes above EIP-170. The stop condition therefore preserves that contract byte-for-byte and moves the new lifecycle into `ContestableAssertion.sol`. This is the ledger's planned “split and narrow” disposition, not a second target.

## Objective

Preserve the original `ChallengeBond` demonstrator while adding an isolated contest path in which silence is `Unchallenged`, a resolver finding is explicitly attributed, resolver absence releases escrow, and a designated consumer can use a terminal outcome only once.

The smallest claimed circuit is:

```text
scoped claim plus named challenger and consumer
  -> matched stake opens a dispute
  -> paid primary finding or paid fallback finding
  -> losing party may request one bounded appeal
  -> silent resolver path becomes inconclusive and refunds participants
  -> designated consumer may consume one terminal non-inconclusive outcome once
```

This circuit allocates declared native-asset escrow. It does not establish truth, equal access, due process, or any later social consequence.

## Target card

- **V1 artifact:** the preserved `contracts/ChallengeBond.sol` compatibility trace plus its new V1 mechanism module, `contracts/ContestableAssertion.sol`.
- **Retained executable claim:** a matched bond can price an assertion and open a dispute window.
- **Concrete defect or missing circuit link:** the legacy path calls silence `Truthful`, permits one silent arbiter to strand both bonds, pushes ETH during resolution, lacks scope/provenance/standing, and exposes reusable outcomes.
- **V2 distinctions to borrow:** domain and purpose, opaque claim/provenance/refutation references, challenger standing, `Unchallenged` versus `Upheld`, bounded primary/fallback/appeal clocks, accepted terminal outcomes, and one-time consumption.
- **Writable files:** `contracts/ContestableAssertion.sol`, this plan, `test/ChallengeAndAdjudication.t.sol`, `contracts/README.md`, `contracts/V1-TO-V2-REVIEW-LEDGER.md`, and `docs/book/appendix-executable-canon.md`. `contracts/ChallengeBond.sol` may only be checked against the preserved behavior; it is otherwise outside the amendment.
- **Forbidden files:** every other Solidity contract and test, `lib/v2/**`, `docs/v2/**`, `contracts/V2-OVERHAUL-PLAN.md`, deployment files, Foundry configuration, and optimiser settings.
- **World facts the contract cannot establish:** identity, evidence quality, truthful resolution, resolver neutrality or competence, intimidation, equal capital access, legitimacy, fairness, and actual future response.
- **Compatibility obligations:** preserve `ChallengeBond.sol` byte-for-byte, including its constructor, public storage getters, functions, events, and historical `Truthful` enum label; `ContestableAssertion` has no reference to its state.
- **Required callers and incentives:** claimant and challenger recover or compete for bounded stake; a timely primary or fallback/appeal resolver receives prepaid fees; anyone may advance expired clocks; the designated consumer controls one-time use.
- **Tests that would falsify the amendment:** legacy ABI/state drift, cross-domain reuse, wrong challenger/resolver/appealer/consumer, duplicate reference, deadline replay, double payout, stranded escrow after resolver silence, failed-withdrawal credit loss, or V2 mutation.
- **Stop conditions:** any Greif/Hayek wiring, automatic sanction, external governance, identity/oracle claim, unbounded appeal, unsafe cast, contract-size breach, or unnamed unpaid action required to release escrow.

## Fixed scope

This slice may change only the writable files in the revised target card. The new contest state lives entirely in `ContestableAssertion`; it does not inherit from or call Tullock, Greif, Hayek, Friedman, or another contract.

## Isolated contest path

### Terms and scope

A claimant supplies nonzero domain, purpose, claim and provenance references; distinct named challenger, primary resolver, fallback/appeal resolver, and consumer; nonzero stake and resolver fees; and bounded challenge, primary-resolution, appeal and fallback-resolution durations. The claimant prepays its stake and its share of both resolver fees.

The claim key includes claimant, consumer, domain, purpose and claim reference. A used key cannot be replayed.

### Challenge and resolution

- Only the named challenger may challenge, with a nonzero refutation reference and an exactly matching stake-plus-fees deposit.
- The primary resolver may record `Upheld` or `Rejected` before its deadline and earns the prepaid primary fees.
- The losing party alone may request one appeal before the appeal deadline.
- The fallback resolver may resolve either a timely appeal or primary-resolver silence. It earns the applicable prepaid resolver fees.
- A primary finding that is not appealed becomes final after the appeal window.
- `Unchallenged`, `Upheld`, `Rejected`, and `Inconclusive` are the only terminal outcome names. None is named truth.

### Escrow and terminal clocks

- Anyone may finalize an unchallenged claim after its challenge deadline.
- Anyone may finalize primary-resolver silence as inconclusive after the fallback deadline.
- Anyone may finalize appeal-resolver silence as inconclusive after the appeal-resolution deadline.
- Inconclusive paths refund each participant's remaining stake and fees.
- All new-path payments become pull credits before any external call. Withdrawal zeros credit before transfer and restores it if transfer fails.

### Consumption

Only the named consumer may consume an `Unchallenged`, `Upheld`, or `Rejected` outcome, with matching domain and purpose, exactly once. Consumption records intended use; it calls no downstream contract and creates no consequence. `Inconclusive` cannot be consumed as a finding.

## Required tests

1. Every legacy public function remains callable and retains its old state trace.
2. Legacy assertions and new contests remain isolated.
3. Constructor-compatible zero bond/liveness remains a legacy possibility but new terms reject zero stake, fee, scope, refs and durations.
4. Claimant, challenger, resolvers and consumer roles are enforced.
5. Duplicate domain-separated claim keys are rejected without consuming escrow.
6. Wrong deposit, self-dealing roles and unsafe amounts revert atomically.
7. An undisputed claim becomes `Unchallenged`, never `Upheld`, and credits the claimant.
8. Challenge at the deadline fails; finalization at the deadline succeeds.
9. Primary `Upheld` and `Rejected` findings pay the primary resolver and identify the losing party correctly.
10. Only the losing party may appeal, once, during the appeal window.
11. A timely appeal finding supersedes but does not erase the primary finding.
12. Silent primary resolution opens the named fallback window.
13. Silent primary plus silent fallback becomes inconclusive and refunds both participants.
14. Silent appeal resolution becomes inconclusive and refunds remaining participant escrow.
15. A non-appealed primary finding finalizes and refunds unused appeal fees.
16. Pull withdrawal cannot be reentered into a duplicate payout and failed receipt does not destroy credit.
17. Only the named consumer can consume; scope mismatch and replay fail.
18. Inconclusive outcomes cannot be consumed.
19. Terminal states cannot be reopened or paid twice.
20. Fuzzed bounded clocks and values preserve total credited escrow less paid resolver fees.
21. The new path makes no external call except user-initiated credit withdrawal.

## Verification gate

```sh
forge fmt --check contracts/ChallengeBond.sol contracts/ContestableAssertion.sol test/ChallengeAndAdjudication.t.sol
forge build --force --sizes
forge test --match-path test/ChallengeAndAdjudication.t.sol -vvv
forge test
npm test -- --runInBand
npm run format:check
npm run lint
npm run typecheck
npm run build
git diff --check
```

Completion also requires exact preservation of the complete legacy `ChallengeBond.sol` file and ABI, explicit review of new storage and external calls, runtime-size margin reporting for `ContestableAssertion`, and a clean V2 read-only check.

## Stop conditions

Stop and revise rather than widen if implementation needs another contract, an automatic consequence, a truthful-world label, an identity system, an external oracle, an unbounded roster or appeal tree, a privileged keeper to release funds, or a V2 edit.
