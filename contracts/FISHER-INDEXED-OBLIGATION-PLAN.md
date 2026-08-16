# Fisher indexed-obligation amendment plan

_Fixed implementation boundary, 2026-08. This plan governs one vertical slice. It does not authorise edits to the legacy Fisher contract or to V2._

## Objective

Add an isolated mechanism that can record a bilateral, indexed obligation without collapsing proposal into assent, a current oracle reading into a due-period observation, tender into performance, non-response into forgiveness, or termination into erasure of arrears.

The mechanism makes a calendar of independently inspectable periods. It does not move tokens, prove delivery, determine an acceptable payment instrument, declare legal discharge, enforce a debt, guarantee future surplus, or establish that an Ostrom-like office is necessary or unnecessary.

## Fixed scope

This slice may change only:

- a new `contracts/BilateralTermsSchedule.sol`;
- a new `test/BilateralTermsSchedule.t.sol`;
- this plan;
- the Fisher row in `contracts/V1-TO-V2-REVIEW-LEDGER.md`;
- the contract catalogue in `contracts/README.md`; and
- the Fisher section of `docs/book/appendix-executable-canon.md`.

It must not modify `contracts/IndexedObligation.sol`, any other existing Solidity source or test, V2, deployment configuration, optimiser settings, or package configuration.

The recorded legacy baseline is:

- `contracts/IndexedObligation.sol` Git blob ID: `813123c01a6f87be2c964210d47a7bfd3bf1a5e4` (raw-file SHA-1 `c2b77776744c1aa3ad33e5ad98ff9dfac91615cf`);
- unoptimised deployed bytecode: 5,187 bytes;
- full Foundry baseline before this slice: 107 passing tests in 8 suites; and
- V1 ABI snapshots: `/tmp/bovi-fisher-v1-abi.txt` and `/tmp/bovi-fisher-v1-storage.txt` for local differential checks.

## Protocol card

### Terms and activation

1. The debtor proposes typed terms naming one distinct creditor, domain, purpose, unit, index basket, performance method, reference amount, start date, period length, period count, observation-age bound, grace period and proposal deadline.
2. Only the creditor may accept or reject before the proposal deadline and first due date.
3. The debtor may cancel only while the proposal is unaccepted.
4. Acceptance activates the fixed schedule. There is no unilateral cancellation after activation.
5. Reusing the same debtor-supplied terms key is rejected.

### Periods and index observations

1. Each numbered scheduled period is opened independently after its due date; opening a later period cannot erase an earlier one.
2. Either party may propose a typed observation for an open period, including its unit, basket, level, observation time, provenance reference and acceptance deadline.
3. Only the other party may accept or reject that proposal.
4. Acceptance rechecks type, deadline and freshness, then fixes that period's due amount and rounding remainder.
5. An observation is a mutually accepted input, not proof that the external index is true.

### Tender, residual and cure

1. Only the debtor may tender an amount and identify the instrument and claimed performance.
2. Tender alone changes no residual. Only creditor acknowledgement reduces the residual; rejection remains in the append-only history.
3. Acknowledgement records the creditor's assertion about performance. It is not token transfer or legal discharge.
4. Only the creditor may explicitly forgive a residual. Silence never waives it.
5. The debtor may propose a bounded cure extension. Only the creditor may accept it, and acceptance changes the arrears clock without reducing the residual.
6. A quantified arrears observation requires an accepted index observation, positive residual and expiry of the grace-or-cure clock.

### Termination

1. Either party may propose termination and only the counterparty may accept or reject it.
2. Accepted termination stops periods whose due dates fall after termination.
3. Already due periods, accepted observations, tender history and residuals remain inspectable.

## World-side boundaries

The contract cannot establish:

- production, delivery, quality, hardship, affordability or continued surplus;
- the truth, representativeness or manipulation-resistance of an index;
- control of an address, succession after lost keys or authority of an agent;
- acceptable tender, title, taxation, insolvency priority or legal discharge;
- coercion, bodily consent, social legitimacy or fairness; or
- enforcement, remedies, adjudication or a socially credible route to food, housing or sex.

Those facts require external institutions, evidence and judgement. They are not inferred from money, posting, passage of time or contract state.

## Actor and incentive map

- The debtor proposes terms, observations, tenders, cure and termination because doing so can make an obligation performable and contestable.
- The creditor accepts terms, observations and acknowledged performance because doing so fixes what the creditor is prepared to recognise.
- Either party may open a due period, propose its observation, propose termination or report arrears, so maintenance is not assigned to an unmotivated universal keeper.
- No third party receives privileged mutation rights. A later resolver would require its own source type, appointment rule, incentive and contest path.

## Required tests

1. Legacy Fisher source and ABI remain unchanged and its existing integration trace still passes.
2. Invalid terms, role overlap, expired proposals and duplicate terms keys are rejected.
3. A proposal has no authority until creditor acceptance; only the debtor can cancel it pre-acceptance.
4. Multiple missed periods open independently and cannot be opened twice or before due.
5. Observation proposals enforce actor, counterparty, unit, basket, time, freshness, expiry and one accepted observation per period.
6. Maximum-width reference amount and index level multiply safely in `uint256`; due and rounding are deterministic.
7. Tender offers do not reduce residual; acknowledgement does, rejection does not, and concurrent offers cannot overfill it.
8. Forgiveness is creditor-only and explicit.
9. Cure is debtor-proposed, creditor-accepted, bounded and unable to reduce residual.
10. Termination requires bilateral action, blocks future periods and preserves already due periods and arrears.
11. Arrears observations enforce the accepted-snapshot, residual and grace-or-cure clock.
12. The new source contains no external call, token transfer, ledger call, Hayek call, governance role or automatic keeper.

## Stop conditions and gates

- Stop if legacy Fisher's source hash or ABI changes.
- Stop if implementation requires changing an existing contract, test, V2 file, deployment file or optimiser setting.
- Stop and split the new mechanism before documentation if its unoptimised deployed bytecode approaches EIP-170; do not conceal size by altering build settings.
- Stop if a transition needs an unassigned world-side fact or an actor with no stated reason to act.
- Require focused tests, the full Foundry suite, forced bytecode sizes, the existing JavaScript checks, the V2 read-only checker, `forge fmt --check`, unsafe-cast lint and `git diff --check`.
