# Greif contextual-memory amendment plan

_Fixed V1 slice, 2026-08. V2 is read-only source material. This plan authorises only the files listed below._

## Objective

Amend `ReputationMemory.sol` so a counterparty can preserve an attributed, purpose-limited and expiring record without turning a global score into truth or automatic punishment.

The smallest claimed circuit is:

```text
subject authorises one reporter for one domain and purpose
  -> reporter records an opaque evidence reference and attributed outcome
  -> subject may challenge and propose a repair reference
  -> original reporter may acknowledge that repair
  -> a later consumer explicitly records whether it will consider the still-active finding
```

Every arrow records an address's action. None proves performance, breach, identity continuity, fairness, forgiveness, or a future response.

## Fixed scope

This slice may change only:

- `contracts/ReputationMemory.sol`;
- `contracts/GREIF-CONTEXTUAL-MEMORY-AMENDMENT-PLAN.md`;
- `test/ContextualFindingMemory.t.sol`; and
- narrow V1-facing documentation contradicted by the compiled amendment.

It must not modify `ChallengeBond.sol`, `GovernedDials.sol`, `AcceptanceThreshold.sol`, `SignedPositionLedger.sol`, `AppointedOffice.sol`, `lib/v2/**`, `docs/v2/**`, `contracts/V2-OVERHAUL-PLAN.md`, deployment configuration, or optimiser settings.

## Compatibility boundary

Preserve the existing constructor and every legacy public function, mapping and event. Legacy governance, registration, reporter authorization, score deltas and `inGoodStanding` remain an explicitly advisory compatibility path. New contextual records neither read nor mutate those legacy mappings.

No migration is attempted. Repository search found no deployment script, broadcast artifact, proxy or address registry outside vendored test fixtures; this is not evidence that no external deployment exists.

## New isolated path

### Scoped reporter authority

- A subject authorises a distinct reporter for one nonzero opaque domain and purpose.
- Authority has a positive expiry no more than one year away.
- The subject may revoke future use at any time.
- Revocation does not erase historical findings.
- Legacy governance and `isReporter` grant no contextual authority.

### Contextual finding

A reporter with active matching authority may append a finding containing:

- subject and reporter;
- opaque domain and purpose identifiers;
- opaque evidence reference;
- attributed outcome: `Performed` or `Breached`;
- recorded and expiry clocks; and
- status: recorded, challenged, repair proposed, repaired, or dynamically expired.

Findings expire no later than the reporter grant and no more than one year after recording. They carry no numerical score and cause no external call.

### Challenge and repair

- Only the subject may challenge its finding, using a nonzero opaque challenge reference.
- Challenge immediately removes the finding from the active-consideration path; it does not refute it.
- Only the subject may propose a nonzero repair reference.
- Only the original reporter may acknowledge the proposed repair.
- Repair acknowledgement does not delete or rewrite the original outcome.
- No resolver, appeal court, bond, sanction or forced response is added.

### Consumer-owned decision

- Any consumer may append either `Ignore` or `Consider` with its own nonzero rationale reference and expected domain/purpose.
- `Consider` is permitted only for an unexpired, unchallenged and unrepaired finding.
- `Ignore` may record a decision about any existing finding.
- A decision is an advisory record only: it changes no score, registration, credit limit, lifecycle, balance or contract outside Greif.

## Required tests

1. Legacy registration, reporting, score and `inGoodStanding` behavior remain reproducible.
2. Legacy reporter status cannot create a contextual finding.
3. Subject authority is scoped by reporter, domain, purpose and expiry.
4. Revocation blocks future findings but preserves existing ones.
5. Finding lifetime is positive, bounded and no longer than the grant.
6. Empty scope/evidence references, self-reporting and unknown findings are rejected.
7. Only the subject can challenge and propose repair.
8. Challenge blocks `Consider` but does not label the finding refuted.
9. Only the original reporter can acknowledge a proposed repair.
10. Repair preserves the original outcome and blocks `Consider`.
11. Expiry blocks `Consider` without requiring a keeper call.
12. Cross-domain and cross-purpose consideration is rejected.
13. A consumer may explicitly ignore challenged, repaired or expired history.
14. New findings and decisions never mutate legacy reputation or registration.
15. Findings remain address-specific; a fresh address inherits nothing.
16. No new path calls another contract or advances a monetary lifecycle.

## Verification gate

```sh
forge fmt --check contracts/ReputationMemory.sol test/ContextualFindingMemory.t.sol
forge build --force --sizes
forge test --match-path test/ContextualFindingMemory.t.sol -vvv
forge test
npm test -- --runInBand
git diff --check
~/.codex/skills/bovi-solidity-amendment/scripts/check_v2_readonly.sh .
```

Passing proves only the encoded authority, clocks, append-only references and advisory decisions. It is not a security audit and does not prove truthful reporting, persistent identity, fair access, repair in the world, continued acceptance, or that an Ostrom office is unnecessary.

## Stop conditions

Stop and revise rather than widen if the slice needs:

- objective truth resolution or a bond/arbiter;
- proof of identity, personhood or relationship;
- automatic credit, settlement, reputation, sanction or lifecycle effects;
- cleartext evidence or personal data;
- governance or a global reporter roster for the new path;
- a change to another V1 contract or any V2 file; or
- a claim that contextual memory alone makes future opportunities credible.
