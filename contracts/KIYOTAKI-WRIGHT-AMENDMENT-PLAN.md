# Kiyotaki-Wright Solidity amendment plan

_Working boundary, 2026-08. This plan amends the existing Solidity demonstrator by lifting a narrow vertical slice from V2. It does not begin the whole-cast V2 rewrite._

## Objective

Amend `AcceptanceThreshold.sol` so it can demonstrate this claim:

> Wants precede money. A candidate money gains instrumental value when it gives an actor a better, more credible route to wanted future opportunities than the available alternatives. Repeated use may strengthen that route, but neither Solidity nor acceptance creates the wants or the world-side opportunity.

The deliverable remains a Solidity demonstrator. It is not a deployment-ready monetary system, an ABM port, a welfare theorem, or a claim that a contract can compel production, delivery, consent, reacceptance, observation, or maintenance.

## Fixed scope

This slice changes only:

- `contracts/AcceptanceThreshold.sol`;
- a new focused Foundry test file for that contract; and
- the narrow Kiyotaki-Wright descriptions that become false after the amendment.

No other Solidity contract is redesigned in this slice. After it passes, the other contracts receive a read-only disposition ledger. Rewriting them requires a later, explicit plan.

## Causal model

The amendment must preserve the direction of explanation:

```text
exogenous want
  -> actor values access to a future opportunity
  -> candidate instrument is compared with alternatives
  -> sufficiently fit instrument is accepted and used
  -> completed use supplies evidence of a continuing circuit
  -> credible continuation may increase the instrument's usefulness
```

The forbidden reversal is:

```text
money -> creates wants or world-side surplus
```

## Solidity projection

The contract will remain deliberately small and fixed to three candidate instruments. It will add only the following V2-derived distinctions.

### 1. Scoped actors and opportunities

- Actors self-register into a bounded demonstrator domain; no governance address invents their wants or speaks for them.
- An opportunity identifies its actor, instrument, declared accessible surplus, credibility, horizon, outside option, defection gain, participation cost, protection/keeper cost, and whether it is active.
- Each actor declares its own values. Their events name the declarant and do not call them objective facts.
- No opportunity may represent entitlement to another person's body or override contemporaneous consent.

### 2. Comparative instrumental fitness

For each actor and instrument, the contract calculates a declared expected continuation margin:

```text
credible discounted accessible surplus + immediate reward
  - outside option
  - defection gain
  - participation cost
  - holding cost
  - protection/keeper cost
```

The actor accepts only when this margin is positive and the instrument beats the actor's declared alternative. There is no global `continuationSurplus` and one actor's gain cannot be copied to another actor.

### 3. Priming versus continuation

- A bounded priming allowance accepted by its named actor may carry that actor/instrument pair during cold start.
- Priming has a payer, remaining budget, per-use cost, and stop condition.
- Priming expenditure is recorded and cannot exceed its budget.
- Priming may start acceptance; it cannot certify self-maintenance.
- After priming ends, fresh completed-use evidence and positive actor-specific continuation margins are required.

### 4. Scoped lifecycle

Each instrument receives the smallest lifecycle needed for this claim:

```text
candidate -> priming -> propagating -> installed-supported
          -> installed-self-maintaining
          -> fragile
```

Transitions are derived only from stored declarations and recorded uses. Names such as `installed` and `self-maintaining` apply to this bounded demonstrator domain, never to money universally.

### 5. Recorded use, not asserted world completion

- A registered actor may record offer, acceptance, and re-spend/renewal steps.
- A completed circuit requires the declared participants; one caller cannot fabricate every side.
- The resulting event means those addresses made those assertions.
- It does not prove physical delivery, genuine belief, fair allocation, consent, or future performance.

### 6. Distributed protection without mandatory Ostrom

- Required protection actions are assigned to named actors or counterparties.
- Each acting party must have its own positive continuation margin or a bounded priming payment.
- Missing action remains a visible failure; the contract does not invent an automatic keeper.
- No `AppointedOffice` office is required for a circuit whose participant-carried protection path passes.
- Failure of that path does not prove an office is unnecessary; it leaves the topology open.

## Compatibility rule

The existing three-good constructor, public score getters, `holdingCost`, `step`, `run`, and `emergedMoney` interface remain callable for the V1 trace. Legacy score evolution is labelled compatibility behavior and cannot set the amended scoped lifecycle to installed or self-maintaining.

The new path uses separate functions and events. This prevents an old sticky `isMoney` flag from masquerading as V2 evidence while retaining the repository's executable V1 example.

## Implementation order

1. Add the new enums, structs, mappings, bounds, errors, and declaration events without changing legacy behavior.
2. Add bounded self-registration and actor-specific opportunity/alternative declarations.
3. Add a pure/view continuation-margin calculation with overflow-safe bounded arithmetic.
4. Add bounded priming configuration and accounting.
5. Add multi-party circuit assertions and completed-use accounting.
6. Add lifecycle evaluation using only fresh post-priming evidence.
7. Add distributed protection assignments and failure visibility.
8. Update only documentation statements contradicted by the compiled amendment.

## Required tests

The slice is incomplete until Foundry proves all of these:

1. The legacy constructor and threshold trace still behave as before.
2. A sticky legacy `isMoney` flag cannot install the scoped lifecycle.
3. No positive margin means no unprimed adoption.
4. A candidate with lower commodity-like or ledger score can win when it is the better route to accessible future opportunities.
5. A large inaccessible surplus for somebody else cannot motivate the required actor.
6. Priming can start use but cannot establish self-maintenance.
7. Exhausted or removed priming requires a fresh evidence window.
8. One address cannot assert both sides of a completed exchange.
9. Re-spend/renewal, not a seed or one transfer, completes the minimum circuit.
10. A required protection action without a willing actor makes the instrument fragile.
11. Two instruments can remain installed in distinct declared scopes; no forced universal winner is inferred.
12. Bounds reject overflow-prone values, invalid probabilities, empty actors, zero clocks, and overspent priming.
13. Events and comments call world-side inputs declarations/assertions, never facts or enforcement.
14. An unaccepted sponsor cannot impose priming on an actor.
15. An unused priming allowance cannot count as support or block an unrelated circuit.

## Verification gate

Before this slice is called complete:

```sh
forge fmt --check
forge build --force
forge test --match-contract KiyotakiWrightAmendmentTest -vvv
forge test
git diff --check
```

The final diff is checked against the fixed-scope file list. Passing tests establish only the encoded assertions. They do not establish security, economic robustness, truthful reporting, adoption, welfare, or institutional closure.

## Stop conditions

Stop and revise this plan rather than widening the implementation if any of these becomes necessary:

- changing `SignedPositionLedger`, `AppointedOffice`, `ReputationMemory`, `ModePermissionGate`, or another contract;
- introducing a general-purpose governance, identity, oracle, reputation, or sanction system;
- porting the full TypeScript ABM into Solidity;
- treating subsistence deprivation as proof of healthy continuation;
- treating access to intimacy as a transferable entitlement;
- making an external report automatically true; or
- calling the entire monetary system closed because this one circuit passes.

## Later contract review

After the vertical slice passes, produce one ledger row per V1 contract:

```text
artifact | retained claim | V2 concept to lift | Solidity-suitable state/transitions
         | world boundary | unsafe V1 trace | disposition | required tests
```

That ledger is analysis only. It determines the next vertical slice; it does not authorise a whole-cast rewrite.
