# Kocherlakota–Fiske Solidity amendment plan

_Working boundary, 2026-08. This plan defines the vertical slice selected by the V1-to-V2 review ledger. It authorises no Solidity change by itself._

## Objective

Add a new, isolated Solidity path that can demonstrate this claim:

> Two parties may activate a purpose-scoped relational mode, authorise a bounded paired ledger posting, and separately assert tender, acceptance, change, waiver and discharge. The posting conserves positions; it does not prove delivery, correct classification, acceptable tender or legal discharge.

This is the smallest useful continuation of the amended Kiyotaki–Wright slice. It gives a recorded use a typed accounting contact without making money the source of wants, future surplus or cooperation. It does not close the social system, establish underwriting legitimacy, or make an Ostrom office necessary or unnecessary.

## Fixed scope

Implementation of this plan may change only:

- a new `contracts/BilateralModeAgreement.sol`, adding an episode-scoped bilateral mode-agreement path while leaving the V1 `ModePermissionGate.sol` bytecode untouched;
- `contracts/SignedPositionLedger.sol`, adding an isolated bounded posting kernel beside the V1 interface;
- a new `contracts/SettlementEpisode.sol`, composing mode agreement and posting without absorbing either;
- a new focused Foundry test file; and
- narrow documentation statements contradicted by the compiled amendment.

It must not modify `AcceptanceThreshold.sol`, `AppointedOffice.sol`, another economic contract, deployment configuration, or optimiser settings.

## Separation of meanings

The slice must preserve this sequence:

```text
bilaterally active mode for domain and purpose
  -> bounded posting authority
  -> offered tender
  -> counterparty accepts a stated amount
  -> paired ledger posting
  -> explicit resolution of any price or change residual
  -> separate discharge acknowledgement
```

No earlier step entails a later one. In particular:

- a mode is a declared permission type, not proof that the relationship is correctly classified;
- an operator grant is a capability, not consent to an unspecified exchange;
- a posting is an accounting entry, not delivery, tender, change or discharge;
- silence is never a tip, waiver, rounding agreement or discharge; and
- a discharge acknowledgement records an assertion by the named party, not a world-side or legal fact.

## Contract boundaries

### 1. `BilateralModeAgreement`: bilateral scoped modes

Preserve the existing `ModePermissionGate.sol` pair-global `declare`, `mode` and `requireTouchable` path unchanged as a V1 compatibility trace. It cannot authorise the new posting or settlement path. The first unoptimised build proved that adding the V2 lifecycle directly would make `ModePermissionGate` 12,486 bytes against the provisional 8 KiB review threshold. The stop condition therefore split the lifecycle into a mechanism-named source unit; this is a recorded plan revision, not silent scope growth.

The new contract owns a mode-agreement record containing:

- a unique agreement ID;
- proposer and named counterparty;
- domain and purpose IDs;
- one explicit mode: `Immediate`, `Obligated`, `Balanced` or `Value`;
- validity start and end;
- optional predecessor agreement; and
- status: proposed, active, rejected, cancelled, superseded or expired.

Required transitions:

1. Either party proposes an agreement for a named counterparty, domain, purpose and validity window.
2. Only the named counterparty may accept or reject it.
3. A proposal has no authority until accepted.
4. The proposer may cancel only while it is unaccepted.
5. An active agreement expires by its declared clock and cannot be revived.
6. Changing a mode or converting between modes requires a new bilateral agreement referencing its predecessor.
7. The predecessor is superseded only when the replacement is accepted; rejection must leave it unchanged.

The new guard accepts an agreement ID plus the expected parties, domain and purpose. It succeeds only for a matching, currently active, postable mode. `Immediate` is deliberately non-postable. Concurrent agreements for the same pair must be possible where domain or purpose differs.

Domain and purpose are opaque IDs rather than cleartext social descriptions. This limits disclosure but does not remove the privacy risk of recording parties, clocks and mode labels on a public chain.

### 2. `SignedPositionLedger`: bounded posting kernel

Preserve the existing balances, membership, operator approvals, `pay`, `payFrom`, demurrage, stabiliser, jubilee and `Settled` event as V1 compatibility behavior. Add a completely separate V2 state domain; no V1 overlay may read from or mutate it.

The V2 kernel contains:

- signed positions per account;
- an O(1) net-position total so conservation remains observable;
- separately visible gross positive claims;
- unique consumed posting references;
- immutable posting events named `Posted`; and
- payer-created, revocable operator grants scoped by operator, domain, expiry, maximum amount per posting and remaining cumulative allowance.

The posting call identifies a posting reference, settlement episode, active mode agreement, domain, payer, payee and amount. It must:

1. reject zero amount, identical parties and replayed posting references;
2. reject a missing, revoked, expired, wrong-domain or insufficient operator grant;
3. validate the active Fiske agreement against both parties and the declared scope;
4. debit and credit with bounded signed arithmetic before consuming authority;
5. preserve net positions exactly and update gross claims deterministically; and
6. emit the invoker and every reference needed to reconstruct the posting.

Amounts and absolute positions receive explicit compile-time bounds no wider than the safe signed representation. Conversion from `uint256` must be rejected before casting. The bound is a mechanical safety limit, not a judgement that a debt is affordable or legitimate.

The V2 kernel has no demurrage, jubilee, stabilisation, governance, global member roster, direct-user posting shortcut or physical-performance assertion. A payer authorises a narrowly scoped settlement module; that grant alone is not evidence that any particular episode was accepted.

### 3. `SettlementEpisode`: explicit settlement lifecycle

Add a small composition contract with immutable references to the Fiske agreement path and Kocherlakota posting kernel. It owns settlement state, not ledger balances or mode classification.

An episode records:

- payer, payee, mode agreement, domain and purpose;
- declared price or obligation amount;
- expiry and a pre-agreed rounding tolerance;
- offered and accepted tender totals;
- outstanding price and change due;
- posting references; and
- status: proposed, active, tender offered, tender accepted, discharged, cancelled or expired.

Required lifecycle:

1. The payer proposes an episode against an already active matching mode agreement.
2. Only the payee activates it; activation fixes the terms.
3. The payer may offer one or more tenders while the episode is active.
4. An offer alone changes no ledger position.
5. Only the payee accepts an amount, and never more than was offered and remains unresolved.
6. Acceptance consumes the episode's scoped operator authority and produces a `Posted` entry for the accepted amount.
7. Underpayment remains outstanding until another tender, an explicit payee waiver, or an explicit pre-authorised rounding resolution.
8. Overpayment creates change due until the payee returns it, the payer explicitly declares it a tip before acceptance, or the payer explicitly applies agreed rounding.
9. A change return is a reverse posting and therefore requires a separate scoped grant from the payee.
10. Only the beneficiary of a residual may waive it, and rounding is available only within the tolerance accepted at activation.
11. The payee may acknowledge discharge only when both outstanding price and change due are zero.
12. Cancellation or expiry never deletes or reverses an earlier immutable posting.

The proposer may cancel before activation. After activation, cancellation requires both parties' assent unless the declared expiry has passed. Default, cure, enforcement and involuntary reversal are not smuggled into cancellation; they require later source types.

## Compatibility and genesis rules

- Existing public V1 interfaces remain callable so repository integration tests and comparison traces continue to work.
- V1 balances do not migrate into V2 positions. The new kernel begins from its own zero genesis.
- A V1 Fiske pair mode cannot activate a V2 settlement episode.
- A legacy `Settled` event cannot be presented as a new `Posted` receipt.
- V1 demurrage, jubilee and stabiliser calls cannot change V2 positions or posting totals.
- New events and IDs may later feed a narrow `LedgerTrace` observer. They must not call or advance Kiyotaki–Wright directly.

## Explicit exclusions

This slice does not add:

- demurrage, jubilee, stabilisation or rate epochs to the V2 kernel;
- credit scoring, underwriting, default, cure, collateral or interest;
- reputation, claims, challenges, sanctions or external enforcement;
- governance, global membership, identity proof or an Ostrom office;
- price observation, indexation, monetary policy or an oracle;
- proof of production, delivery, desire, bodily consent, truth or continued surplus;
- direct coupling to the Kiyotaki–Wright lifecycle; or
- a claim that bounded accounting closes the monetary or social system.

These are exclusions, not conclusions that the functions are unnecessary.

## Implementation order

1. Record current ABIs, bytecode sizes and the full Foundry baseline.
2. Add `BilateralModeAgreement` records and transitions, then pass focused agreement tests while preserving byte-for-byte V1 `ModePermissionGate` behavior.
3. Add Kocherlakota's isolated positions, operator grants and posting path, then pass conservation, boundary and differential tests.
4. Add `SettlementEpisode.sol` and its lifecycle tests.
5. Add integration tests proving the three contracts compose without cross-layer semantic shortcuts.
6. Update only contradicted documentation and run the full repository gates.

Each step must compile and test before the next begins. A failed compatibility test stops the slice; it is not repaired by silently changing the V1 trace.

## Required tests

### Compatibility

1. Legacy Kocherlakota payment and conservation behavior remains reproducible.
2. Legacy Fiske declaration behavior remains reproducible only on its compatibility path.
3. A legacy pair mode cannot authorise a new posting or settlement episode.
4. A legacy `Settled` event cannot satisfy a new posting reference.
5. V1 balance changes and overlays never alter V2 positions.

### Mode agreement

6. A unilateral proposal remains inactive.
7. Only the named counterparty can accept or reject.
8. Concurrent domain or purpose scopes coexist for the same pair.
9. `Immediate`, expired, rejected, cancelled and superseded agreements cannot authorise posting.
10. Party, domain or purpose mismatch is rejected.
11. Cross-mode conversion requires a newly accepted bilateral agreement.
12. A rejected replacement does not supersede its predecessor.

### Posting kernel

13. Maximum-value and cast-boundary fuzzing rejects unsafe amounts and positions.
14. Every successful posting preserves net positions and updates gross claims correctly.
15. Missing, expired, revoked, wrong-domain and wrong-operator grants are rejected.
16. Per-post and cumulative grant limits are independently enforced.
17. Duplicate posting references, zero amounts and self-posting are rejected.
18. A failed posting consumes neither reference nor allowance.
19. Demurrage, jubilee and stabiliser calls cannot affect the new state domain.

### Settlement episode

20. Proposal and activation require distinct payer and payee actions.
21. A tender offer alone produces no posting.
22. Only the payee may accept, and accepted tender cannot exceed the unresolved offer.
23. Exact tender permits discharge acknowledgement after posting.
24. Underpayment cannot disappear through silence; it needs more tender, payee waiver or bounded explicit rounding.
25. Overpayment cannot become a tip through silence; it needs returned change, a prior payer tip declaration or bounded explicit rounding.
26. A tip must be declared by the payer before the corresponding tender is accepted.
27. A waiver must be declared by the payee and cannot exceed outstanding price.
28. Rounding requires the activated tolerance and an explicit action by the residual's beneficiary.
29. Returned change requires a valid grant from the payee and produces a distinct reverse posting.
30. Multiple partial tenders resolve deterministically without double counting.
31. Cancellation and expiry preserve all prior postings and unresolved residuals.
32. Discharge events remain acknowledgements and never claim delivery or legal truth.
33. No settlement action mutates a Kiyotaki–Wright lifecycle.

### Size and repository gates

34. Unoptimised deployed bytecode stays below provisional review thresholds: Kocherlakota 20 KiB, legacy Fiske 8 KiB, FiskeModeAgreement 8 KiB and Williamson 18 KiB, as well as EIP-170.
35. Focused tests, the full Foundry suite, the existing JavaScript suite, formatting and `git diff --check` all pass.

## Verification gate

Before an implementation is called complete:

```sh
forge fmt --check
forge build --force --sizes
forge test --match-path test/PostingSettlement.t.sol -vvv
forge test
npm test -- --runInBand
git diff --check
```

If the repository's actual focused test filename or JavaScript command differs at implementation time, use the checked-in command and record the substitution. Passing these gates establishes only the encoded state transitions and arithmetic.

## Stop conditions

Stop and revise this plan instead of widening the implementation if:

- settlement logic must be placed inside Kocherlakota or mode lifecycle must be placed back inside legacy Fiske;
- a mode requires an external truth oracle rather than bilateral declaration;
- safe posting requires credit underwriting rather than the stated mechanical and consent bounds;
- default, cure, indexed obligations or involuntary reversal become necessary;
- physical delivery or contemporaneous bodily consent must be inferred on-chain;
- direct mutation of Kiyotaki–Wright is proposed instead of a later evidence-only adapter;
- governance, a global roster, reputation or an Ostrom office becomes a prerequisite; or
- any contract approaches its provisional size threshold before all required tests are present.

The result of a stopped slice is a narrower revised plan, not an improvised super-contract.
