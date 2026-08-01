# Appendix: The Executable Canon

> *A contract is an argument stripped of its adjectives. It cannot tell us that an institution is wise, fair, or legitimate. It can tell us who may do what, to whom, under which condition, and where the remainder goes. That is already a severe improvement in honesty.*

**Part VIII — The Machinery** · [Index](README.md) · Prev: [Epilogue](epilogue-the-machinery.md) · Next: [The Field Book](fieldbook-the-money-tool.md)

The body of this book made a claim about money in ordinary language. The Epilogue made the same claim in mathematics. Here we make it one last time in code.

That progression matters. Prose can slide between *money is memory* as a metaphor and *money is memory* as an institutional proposition. Mathematics stops some of the sliding by forcing us to state the relation. Code stops a different kind. It asks which address may change the memory, which line conserves the total, who supplies the index, what happens when a debtor fails, and whether the person supposedly constrained by a rule can simply call around it. A noun such as *trust*, *governance*, or *stability* must become a verb with a caller.

The result is not a proposed currency. It is not production software, an audit, a monetary constitution, or an empirical demonstration that people would want to live under these rules. It is an **executable canon**: a set of small Solidity contracts that translate the book's claims into operations precise enough to inspect and contest. The contracts do not prove that the theory is true. They prove that we have stopped hiding its verbs.

At the snapshot used for this edition, the repository contains eleven implemented contracts. Seven appear in the end-to-end demonstration; four stand as separate mechanisms. Gesell's demurrage is an overlay inside the memory ledger rather than a twelfth contract. A further set of named rooms now exists as provisional protocol blueprints. That distinction—implemented, integrated, and specified—is part of the argument. A blueprint is not a building, and a building that compiles is not a city.

---

## 1 · The building at a glance

The suite is easiest to understand as a building, not a chain of famous names. The memory ledger is the floor. Around it sit constitutional controls, measurement devices, enforcement devices, and tools that unbundle jobs ordinarily forced into one instrument.

| Layer | Implemented module | The narrow job |
|---|---|---|
| Emergence | *Kiyotaki–Wright* | shows an acceptance score feeding on itself |
| Settlement spine | *Kocherlakota* | records signed positions and clears at net zero |
| Relational boundary | *Fiske* | keeps Immediate-mode bonds off the settlement rail |
| Constitutional control | *Friedman* | makes changes pass through vote and delay |
| Enforcement | *Greif*, *ChallengeBond* | attaches consequences to records and assertions |

| Layer | Implemented module | The narrow job |
|---|---|---|
| Unit of account | *Hayek* | derives a shared rod from competing fresh observations |
| Deferred obligations | *Fisher* | indexes a contract to the rod and settles it on the ledger |
| Productive credit | *Schumpeter* | exposes loan purpose, score, price, repayment, and default |
| Price discovery | *Stigler* | compares a quote with a median observed price |
| Stabilisation | *Krugman* | adjusts credit elasticity against an activity shortfall |

This is an unbundled monetary stack. No module is permitted to announce itself as *money* and thereby inherit all monetary functions. The ledger settles. The rod measures. The Fisher contract carries a promise through time. The Schumpeter contract prices a loan. Greif supplies a reputational primitive. Friedman can control attached dials. Kiyotaki–Wright abstracts one acceptance feedback. Each layer can therefore fail in its own name.

The actual dependency path is narrower than the cast list suggests. In `CoreE2E`, Friedman governs Kocherlakota, Greif, and Hayek; Hayek supplies Fisher's rod; and Fisher settles through Kocherlakota. Krugman can scale Kocherlakota's limits but remains governed by the deployer in that setup. ChallengeBond and Fiske are optional paths, and the test attaches neither. Greif and ChallengeBond sit horizontally as different attempts to supply the enforcement that every elegant ledger quietly presupposes. Stigler observes prices beside the rail. Schumpeter allocates an existing settlement asset in an isolated scene. Kiyotaki–Wright stands alone as a threshold demonstrator.

Already the architecture says something that a balance in a banking app conceals. “Money” is not one object. It is a settlement record surrounded by institutions that govern admission, credit, measurement, enforcement, time, and exit. The usual bundle makes those institutions look like properties of a thing. The executable canon turns the thing back into a stack of decisions.

Each implemented dossier now includes a **protocol card**. It is deliberately close to a programming specification:

- **State** names what must persist.
- **Roles** name who may call privileged transitions.
- **Commands** reproduce the public write surface.
- **Transition** states the decisive preconditions and writes.
- **Invariant** names what must remain true.
- **Audit boundary** names where the current code stops earning its prose.

The cards describe the source as it exists, including unsafe input domains and missing connections. They are not proposed production interfaces. Where the intended rule is stronger than the current Solidity, the card says so rather than silently repairing it.

---

## 2 · Kocherlakota: the memory ledger

The central contract is named for Narayana Kocherlakota's “Money Is Memory.” Its proposition is severe: if a community can preserve a trustworthy public history of who has given and not yet received, a token is a redundant compression of that history. So the contract does not issue a token. It keeps signed balances.

The payment operation is the whole machine in miniature:

```solidity
balance[from] = balance[from] - int256(amount);
balance[to]   = balance[to]   + int256(amount);
```

One position moves down, another moves up. There is no mint, reserve vault, commodity field, redemption promise, or total-token supply. The balances *are* the monetary record. If an employer buys one hundred units of work, the employer moves to minus one hundred and the worker to plus one hundred. The pair records one unfinished social fact from opposite sides.

### Net is an invariant; gross is a condition

The contract exposes two quantities that ordinary monetary language often muddles:

```solidity
netSupply()
grossInCirculation()
```

`netSupply()` sums every signed balance. If every settlement performs one subtraction and one addition, the result remains zero. This is conservation. `grossInCirculation()` sums only positive balances. It tells us how much purchasing power is currently held on the positive side of the ledger.

The distinction is not cosmetic. Net is an accounting identity; gross is an institutional outcome. Gross positions expand when participants extend more credit to one another and contract when positions clear. The system can therefore be elastic without pretending that claims have appeared from nowhere. **Known does not mean fixed.** A supply can change while its rule and current magnitude remain inspectable.

This is the rope from Chapter 8A rendered in state variables. The length of rope is not wealth stored inside fibre. The knots locate members in a relation. Likewise, the signed integers do not contain value. They preserve who may make the next claim on the network's output.

### Admission, authentication, and the credit dial

The ledger is not permissionless. A steward admits members—called `knights` in the code—and assigns each a credit limit. A payment can push a payer no lower than the negative of that effective limit. Membership answers *whose marks count*. The limit answers *how far the group will let this member pull purchasing power forward*.

That is the contract's authentication and risk boundary. It is also an extraction boundary. Whoever controls admission and credit limits controls whose promises become spendable and on what scale. The contract does not disguise that authority as neutral monetary plumbing. Every admission and limit change emits an event, and the steward can be transferred to the Friedman governance contract so that the dial cannot be moved by an administrator's private call.

Approved operators add another explicit delegation. A member may authorize a contract such as Fisher to settle on the member's behalf. The mapping is owner-specific: approval by one payer does not become a general licence to debit everyone. This is the small hinge by which a recurring obligation can use the settlement rail without owning it.

The code also permits two optional guards. A Krugman stabiliser can scale every base credit limit through a public multiplier. A Fiske module can reject a settlement between people whose relationship has been marked Immediate. Both are off by default. The base ledger therefore remains legible: the overlays are attachments, not hidden premises.

### Demurrage: the medium is allowed to be a bad store

Gesell's mechanism lives inside Kocherlakota. Governance may set a rate, a period, and a commons account. When a positive balance is touched—or when anyone calls `poke`—the contract computes a time-proportional fee:

```text
fee = positive balance × rate × elapsed time / period
```

The holder moves down by the fee and the commons moves up by the same amount. Net remains zero. Nothing is burned and nothing is created. The rule redistributes a positive position from holder to commons.

This makes the book's medium–store conflict visible. A settlement rail can be engineered to circulate precisely because it is unattractive as a long-term silo. Wealth storage can then migrate to a tool designed for that job. But the code also prevents us from romanticising the mechanism. Demurrage is a tax schedule administered by whoever governs the rate, period, and destination. The word *melt* sounds natural; the state transition is political. The fee is only legitimate to the degree that the rule, commons, exit, and governing process are legitimate.

Nor does the implementation literally distinguish a virtuous transactor from an idle hoarder. It accrues against elapsed time on a positive balance. Movement causes accrual to be calculated; it does not erase it. “Idle” is therefore an interpretation of the economic design, not a behavioural fact detected by the contract.

### Jubilee: settlement as forgetting

The `jubilee` operation starts with a debtor in a negative position. It totals all positive balances, calculates how much of the debt can be absorbed, and cuts each creditor's positive balance proportionally. The debtor is then raised by exactly the amount actually removed from creditors. Conservation survives even when an obligation does not.

That is a useful reversal. Default does not make the accounting identity fail. It forces the institution to say where the loss lands. The contract socialises it across current creditors rather than inventing a reserve or letting the mismatch disappear into an opaque balance sheet.

Integer division may leave a small residual rather than clearing the debtor perfectly, so the function forgives only the sum actually absorbed. That detail is more than programming housekeeping. It expresses the constitutional rule: even mercy may not manufacture a phantom remainder.

### What the ledger demonstrates

Kocherlakota supplies a clean existence proof for several claims:

- settlement can occur without a base token;
- elastic gross positions can coexist with a conserved net;
- credit is a governed limit on a relationship, not a pile lent out from prior savings;
- demurrage and default can redistribute positions without violating conservation;
- measurement, governance, stabilisation, and relational permission can be attached as separate modules.

It does not prove that strangers will accept the marks, that admitted identities represent unique people, that debtors can or should be compelled to perform, or that the chosen credit limits are just. It cannot. Those are the social facts from which the record gets its teeth.

The implementation is deliberately small and correspondingly unfit for scale. Several view and jubilee operations loop over the full member list. Members can be added but not removed. The ledger is public. Credit policy remains discretionary unless governance is attached. There is no recovery process, privacy layer, appeal, legal interface, or resistance to one person acquiring many identities. The code isolates the hard questions; it does not dissolve them.

### Protocol card — `Kocherlakota`

**State.** `steward`; optional `stabiliser` and `fiske`; append-only `knights`; membership, signed balances, base credit limits, and owner-to-operator approvals; demurrage rate, period, commons, and last-accrual time.

**Roles and commands.** The steward calls `admit`, `setCreditLimit`, `setStabiliser`, `setFiske`, `setDemurrage`, `jubilee`, and `setSteward`. A member calls `pay` and `approveOperator`. An approved operator calls `payFrom`. Anyone calls `poke`. Anyone reads `netSupply` and `grossInCirculation`.

**Payment transition.** Require both parties admitted, distinct, and `amount > 0`; ask Fiske to permit the pair; accrue demurrage for both; compute `newPayer = balance[from] − int256(amount)`; require `newPayer ≥ −effectiveLimit(from)`; write payer down and payee up by the same signed amount; emit `Settled`.

**Invariant.** Starting from zero, `Σ balance = 0` after `pay`, `payFrom`, demurrage, and jubilee—provided arithmetic stays inside the signed domain and every external overlay returns normally. Gross positive balances are elastic and are not an invariant.

**Audit boundary.** The code does not bound `amount`, limits, stabiliser factors, or demurrage rates before signed casts and multiplication. An extreme amount can reverse sign; an extreme fee can push a positive holder below zero. A newly enabled or changed demurrage rule applies the current parameters to elapsed time since the account's last accrual, so policy can act retroactively. Operator approval is unlimited within the payer's effective credit limit. Jubilee and supply views are linear in membership; proportional integer rounding can make a small jubilee absorb nothing. There is no member removal, scoped operator allowance, policy epoch, or safe member-count getter.

That is exactly what a useful demonstrator should do. A mechanism that names its residual teaches more than a complete-looking product that buries it.

---

## 3 · Fiske: the boundary before the balance

The Fiske contract asks the question every accounting system is tempted to skip: **should this relationship be accounted for in this way at all?**

It defines five states: Unset, Immediate, Balanced, Obligated, and Value. A relationship identifier is symmetric, so the pair Alice–Bob is the same pair as Bob–Alice. Another contract can ask whether that pair is Immediate and, if so, refuse to record or price the interaction.

Only one mode currently has mechanical force. `requireTouchable` rejects an Immediate relationship. This is intentional. The other three clearing disciplines describe *how* an entry should settle; Immediate says that compulsory settlement is the category error. Its first protection is exclusion.

The irony is visible in the design. To defend a gift from accounting, the contract records a minimal fact about the relationship: *do not account for this*. Even that may be too much. The cleanest Immediate ledger is often no ledger at all. The tag is therefore best read as a defensive opt-out at the edge of an otherwise hungry system, not as a digital description of intimacy.

The second operation, `flagIfTaboo`, emits an event when a fee, interest charge, price, or other extraction appears inside an Immediate relationship. It does not reverse the charge or punish the caller. It turns a disguised mode switch into an observable. This is the executable version of the book's defensive vocabulary: first name what happened; then decide what institution should follow.

The limitations are sharp. Either party may unilaterally declare the mode, and a later declaration overwrites an earlier one. There is no mutual signature, challenge period, evidence standard, or appeal. Balanced, Obligated, and Value are labels rather than complete settlement behaviours. A production design would require consent and perhaps a ChallengeBond around contested classification. Yet automatic classification by an “intelligent” agent would not solve the political problem. It would merely move the power to whoever owns the classifier.

Fiske is therefore less a mode engine than a permission primitive. It shows where the modes belong in a monetary stack: not as sentimental commentary after the transaction, but as a boundary condition before a generic rail is allowed to touch the relationship.

### Protocol card — `Fiske`

**State.** One `Mode` value—Unset, Immediate, Balanced, Obligated, or Value—per symmetric hash of an address pair.

**Roles and commands.** Either member of a pair calls `declare(counterparty, mode)` because the caller is implicitly one endpoint. Anyone reads `mode` or `isImmediate`, calls the read-only gate `requireTouchable`, or calls `flagIfTaboo` with a free-form violation label.

**Transition.** `declare` computes the order-independent pair identifier and overwrites its mode. `requireTouchable` reverts only when that stored mode is Immediate. `flagIfTaboo` changes no state; it emits `Taboo` only for an Immediate pair.

**Invariant.** `relId(a,b) = relId(b,a)`. No third party can declare a mode for a pair to which it is not an endpoint. Immediate is the only mode with executable consequences.

**Audit boundary.** Declaration is unilateral, last-writer-wins, and may explicitly restore Unset. The mode belongs to the whole pair rather than a particular transaction, purpose, time window, or pot. `flagIfTaboo` accepts arbitrary text and supplies neither evidence nor remedy. Mutual consent, versioning, challenge, expiry, and the distinct clearing rules for Balanced, Obligated, and Value remain unimplemented.

---

## 4 · Friedman: who may turn the dials

Once credit limits, provider lists, demurrage rates, reporters, and oracle parameters are visible, a harder question arrives: who may change them?

The Friedman contract answers with a deliberately thin rule: one member, one vote; proposal; quorum; timelock; execution. A member proposes an arbitrary call to a target contract. Members cast yes-votes. When the required headcount is reached, the proposal is queued. Only after the delay may anyone execute the call.

The timelock is not decoration. It is an **exit window**. A minority cannot necessarily stop a decision, but it can see the decision before it lands and, where the surrounding institutions permit, leave or fork. The contract's promise is not benevolent rule. It is rule made slow and public enough to contest.

Membership and the rule's own parameters can change only through proposals addressed to the Friedman contract itself. Once another module transfers governance to Friedman, a former administrator cannot call around the process. This is what the end-to-end demonstration tests: a direct attempt to change a Kocherlakota credit limit fails; the same change succeeds after proposal, two votes, and the timelock.

But constitutional thinness is not constitutional completeness. The contract has yes-votes but no no-votes, delegation, abstention, cancellation, expiry, or emergency brake. A queued proposal remains executable after its delay. A captured majority can call any target with any calldata. One-member-one-vote avoids plutocracy only if membership itself is not captured, duplicated, bought, coerced, or selectively denied. The constructor does not supply the theory of citizenship.

This is a recurring lesson in the suite: removing monetary mysticism does not remove government. It reveals where government was hiding. A hard-coded rule is still law technology. Its politics live in membership, amendment, exit, and the distribution of practical power to fork—not in whether the rule is written by a parliament or a compiler.

### Protocol card — `Friedman`

**State.** Current membership and headcount; timelock and quorum; proposals containing target, calldata, queue time, yes-count, and executed flag; one vote bit per proposal and address.

**Roles and commands.** A current member calls `propose` and `vote`. Anyone calls `execute` after queueing and delay. Only a low-level call from Friedman to itself can call `addMember`, `removeMember`, or `setParams`.

**Transition.** `propose` appends an open proposal. Each current member may add one yes-vote while it is open. The vote that brings `yes ≥ quorum` sets `eta = now + timelock` and closes voting. After `eta`, `execute` marks the proposal executed, calls the stored target with the stored bytes, and reverts the whole execution if that call fails.

**Invariant.** A successfully governed target can reject every direct administrator call after its governance address is transferred to Friedman. The same proposal cannot execute twice.

**Audit boundary.** The constructor and amendments permit zero addresses, zero or impossible quorum, and zero delay. There are no no-votes, cancellation, expiry, veto, delegation, emergency stop, or proposal-type restrictions. Votes are not snapshotted: removed members' old votes remain and new members may vote on old proposals. A queued proposal survives later membership or quorum changes. Any calldata may be relayed, so capture of the membership captures every attached module.

---

## 5 · Greif and ChallengeBond: the teeth

A ledger can remember perfectly and still be useless. If a participant may take from the network, abandon the negative position, return under a new name, and suffer no consequence, memory is archival rather than monetary. Credit needs teeth.

The suite offers two different primitives. Greif attaches consequences to a person-like address. ChallengeBond attaches consequences to an assertion. Neither creates truth. Both change the price of lying.

### Greif: standing as an exclusion surface

Greif maintains a registry, a signed reputation score, and a set of authorised reporters. Governance admits participants and reporters. A reporter may add or subtract from a registered participant's score. Another contract can ask whether that participant is in good standing relative to a threshold.

This is Kocherlakota's enforcement residual made explicit. The memory ledger says who received without yet giving. Greif makes that history selectively consequential: a poor record can exclude someone from a future opportunity. The end-to-end test registers a borrower, authorises a reporter through Friedman, subtracts five after a default-like event, and verifies that the borrower no longer passes a zero threshold.

That is enough to demonstrate individual punishment. It is nowhere near enough to demonstrate justice. A reporter may lie. A score may collapse context into a number. Registration may become a gate controlled by incumbents. A public registry can become a permanent panopticon. A person can be unable to escape an error—or escape every consequence by creating another address.

The contract comments name the two largest residuals: privacy and Sybil resistance. A more serious implementation might use selective disclosure so someone can prove “standing above threshold” without revealing identity or history. It would still need a defensible answer to one-human-many-addresses, shared devices, lost keys, contested identity, and legitimate rebirth. The code does not pretend those questions are software details.

One integration gap also matters. Schumpeter emits a default event and describes it as a hook for Greif, but the present contracts do not wire that hook. The end-to-end test uses a separate reporter. The institutional sentence—*default lowers future standing*—exists as two clauses awaiting a conjunction.

#### Protocol card — `Greif`

**State.** Governance address; registration bit and signed reputation per address; reporter-authorisation bit per address.

**Roles and commands.** Governance calls `register`, `deregister`, `setReporter`, and `setGovernance`. An authorised reporter calls `report(subject, delta)`. Anyone calls `inGoodStanding(subject, minimum)`.

**Transition.** A report requires an authorised caller and registered subject, then adds an unrestricted signed delta and emits the new total. Deregistration disables threshold checks but does not erase reputation; re-registration restores the old score.

**Invariant.** Unauthorised callers cannot change a score. `inGoodStanding` is true exactly when the subject is registered and its score meets the caller-supplied threshold.

**Audit boundary.** A report contains no reason, evidence hash, affected contract, appeal state, expiry, or per-reporter limit. Governance can appoint the reporter that judges it. Scores are public; addresses are not people; Sybil resistance is absent. Schumpeter default does not call `report`.

### ChallengeBond: optimistic truth with collateral

ChallengeBond implements a familiar optimistic pattern. An asserter posts a value and a bond. During a liveness window, another participant may dispute by matching that bond. If no one disputes, the assertion settles as truthful and the original bond returns. If disputed, an arbiter chooses a winner, who receives both bonds.

The mechanism turns a claim into a wager with a public deadline. It is useful where facts are cheap to verify when challenged but expensive to verify universally in advance. Hayek contains a `finalize` route that accepts an index observation only after a matching ChallengeBond assertion has survived.

Optimistic verification does not make the oracle disappear. It distributes the work and prices the challenge. An undisputed claim becomes “truthful” even if everyone was inattentive, colluding, intimidated, or too poor to post the matching bond. A disputed claim still ends at an arbiter. A large bond deters casual lies and legitimate challengers together; a small bond may price dishonesty too cheaply. The liveness window may be too short for the people most affected.

The current contract fixes the arbiter, bond, and liveness at construction. Bonds are paid in the chain's native asset. There is no appeal, fee, partial slashing, evidence record, or protection against an economically stronger party repeatedly exhausting challengers. The code supplies teeth, not a theory of due process.

#### Protocol card — `ChallengeBond`

**State.** Immutable-in-practice arbiter, native-asset bond, and liveness duration; an append-only array of assertions with asserter, first disputer, topic, value, timestamp, and state.

**Roles and commands.** Anyone posts exactly one bond with `assert_`; any non-asserter may be the first to post a matching bond with `dispute`; anyone calls `settle` after an undisputed window; only the arbiter calls `resolve` on a dispute; anyone reads `result`.

**Transition.** An undisputed assertion becomes Truthful after the deadline and returns one bond. A disputed assertion waits without deadline for the arbiter; the winner receives both bonds and the state becomes Truthful or Refuted.

**Invariant.** Each assertion takes at most one disputer and pays at most the two posted bonds through its normal path. State is set before payout, and a failed payout reverts the state change.

**Audit boundary.** “Truthful” means unchallenged or arbiter-upheld. Zero bond or zero liveness is allowed. There is no evidence field, appeal, timeout for a silent arbiter, assertion-count getter, accidental-fund withdrawal, or defence against a winner that rejects payment and permanently blocks settlement. A settled assertion has no consumed bit, so Hayek may reuse it indefinitely. Only Hayek currently reads this contract; the advertised Schumpeter and Greif links are absent.

This distinction is central to intersubjective money. A rule becomes objective only in the narrow sense that a machine applies it consistently. The choice of rule, reporter, threshold, bond, clock, and arbiter remains intersubjective and institutional. Automation can make power legible. It cannot convert power into physics.

---

## 6 · Hayek, Fisher, and Stigler: separate the rod, the promise, and the price

Textbook money bundles medium of exchange, unit of account, store of value, and deferred payment into one natural object. This cluster of contracts breaks the bundle at its most consequential seam.

Kocherlakota supplies a medium of settlement. Hayek supplies a rod. Fisher writes a promise in the rod and pays it over the settlement rail. Stigler checks a market quote against observed transactions. These are related jobs, but they are not the same job.

### Hayek: competition over the shared rod

The Hayek contract maintains a governed list of index providers. Each provider publishes a price-level observation. Values older than a maximum age are ignored. The current rod is the median of the fresh observations; with an even number, it is the midpoint of the two central values.

The median makes the index robust to a minority of extreme reports. The provider list makes the source of the observations visible. A deviation function shows how far any provider sits from the current median. Users who distrust the shared result may also inspect a specific provider's value.

This is named for Hayek, but it does not implement competing private currencies. It implements competition among suppliers of a **unit-of-account signal** while retaining a shared rod for coordination. That is the deliberate twist. If the unit is where contracts, wages, accounts, and expectations become sticky, competition belongs around the process that measures it—not necessarily in a proliferation of mutually unintelligible settlement media.

The contract exposes two paths. `publish` trusts an admitted provider to submit a positive number. `finalize` accepts a number only when that provider made a matching ChallengeBond assertion that settled as truthful. The contrast is pedagogically useful: an oracle with a provider list is trust administered; an optimistic oracle adds a priced opportunity to contest.

Neither route knows how the index was computed. “Derived from observable settlements” is an off-chain requirement, not an on-chain fact. The contract has no basket composition, weights, data provenance, revisions policy, geographic scope, household profile, or historical series. A median can be robust and wrong. Governance can admit three addresses controlled by one party. Freshness prevents an old value from surviving forever; it does not make a new value honest.

There is also a computational boundary. The implementation gathers and insertion-sorts provider values on every read. That is clear for a demonstrator and poor architecture for a large provider set. Again the point is not throughput. It is to let us point at the exact location where “the value of money” becomes “a governed statistic assembled from observations.”

#### Protocol card — `Hayek`

**State.** Governance address, maximum data age, optional ChallengeBond address, an array of admitted providers, and each provider's latest index value and timestamp.

**Roles and commands.** Governance calls `setGovernance`, `setMaxStale`, `setChallenge`, `admitProvider`, and `removeProvider`. An admitted provider calls `publish`. Anyone calls `finalize` with a provider and assertion identifier, or reads `current`, `valueOf`, `deviationBps`, and `providerCount`.

**Transition.** `publish(value)` requires an admitted caller and `value > 0`, then overwrites that provider's observation and time. `finalize(provider,id)` requires a configured challenge contract and a settled assertion whose asserter is that provider, topic is `HAYEK_INDEX`, and value is positive; it writes the same observation. `current()` filters to positive, fresh observations, sorts them, and returns the middle value or the integer midpoint of the two central values.

**Invariant.** For a fixed provider set, clock, and observation map, the rod is deterministic. Removed providers do not contribute. Governance never writes the rod directly, although it chooses who may write its inputs.

**Audit boundary.** The trusting `publish` route remains open after ChallengeBond is attached, so bonded finalisation does not close the bypass. One provider is a sufficient “median”; independence and quorum are not represented. A settled assertion can be replayed. `valueOf` returns stale data, while `deviationBps` may compare it with a fresh median. Midpoint addition and deviation multiplication can overflow, and every read sorts in quadratic time. Basket construction, provenance, revisions, geography, and household relevance remain off-chain.

### Fisher: a stable promise over an unstable medium

Fisher takes the rod seriously. A payer creates an obligation by naming a payee, a real amount in rod units, and a period. When payment is due, the contract multiplies the real amount by Hayek's current index level to calculate the nominal amount. It then calls Kocherlakota's `payFrom` operation, for which the payer must previously have approved Fisher as an operator.

Suppose a monthly wage is one hundred rod units. At an index level of 1.00, the ledger settles one hundred nominal units. If the settlement unit loses ten per cent against the rod and the index moves to 1.10, the next payment is one hundred and ten nominal units. The balance changes; the promise does not.

That is the unbundle made watchable: **unstable currency, stable contract**. Price-level risk no longer has to be hidden inside a supposedly stable money. It can be allocated explicitly between parties through the denomination of the promise. The money illusion becomes a parameter.

The mechanism also makes an implicit tax visible. If a fixed nominal promise silently loses purchasing power, the transfer from payee to payer is buried inside the unit. When the promise is indexed, the same redistribution would have to be proposed openly as a change in the real terms. Indexation does not settle whether the transfer is fair. It prevents the measuring stick from performing it unnoticed.

The demonstrator remains permissive. The payer may cancel unilaterally. There is no acceptance signature from the payee, notice period, arrears logic, grace period, dispute, collateral, or legal remedy. If several periods pass, one call settles one period at the current rod rather than reconstructing every missed date. Anyone may trigger settlement once due, but only the payer's prior operator approval permits the debit. A faulty or captured rod flows directly into the amount owed.

Fisher therefore demonstrates indexation, not a complete employment, rent, pension, or loan contract. The institutional layer around a promise is larger than its arithmetic.

#### Protocol card — `Fisher`

**State.** Immutable rod and settlement-ledger addresses; an append-only array of obligations containing payer, payee, rod amount, period, last-payment time, and active flag.

**Roles and commands.** A payer calls `create` and may call `cancel` on its own obligation. Anyone calls `settle` after the period or reads `due` and `obligationCount`. Before settlement, the payer separately grants Fisher operator authority on Kocherlakota.

**Transition.** `create(payee,rodAmount,period)` requires positive amount and period, fixes the payer as caller, and starts the clock immediately. `due(id)` returns `rodAmount × currentRod / 1e18`. `settle(id)` requires an active obligation and one elapsed period, sets `lastPaid = now`, calls `ledger.payFrom(payer,payee,nominal)`, and emits the rod and nominal amounts. A failed external payment reverts the time update.

**Invariant.** The payer, payee, rod amount, and period of an obligation never change. Each successful call settles exactly one amount computed from the rod at call time.

**Audit boundary.** The payee never accepts the obligation and the payer may cancel unilaterally, repeatedly. Missed periods do not accumulate: a late call pays once and resets the clock to now. `due` remains callable for inactive entries. Multiplication may overflow and division rounds down. Operator approval is broad rather than obligation-scoped. There are no arrears, end date, grace, notice, collateral, dispute, or remedy rules.

### Stigler: the market skim, measured rather than forbidden

Stigler performs a neighbouring but distinct measurement. Governed providers publish observed transaction prices for a named good. The contract ignores stale reports, takes the median of fresh ones, and compares a quoted price with that reference. It returns the deviation in basis points and marks an overcharge when the quote lies above the reference by more than a caller-supplied fair band.

The module is intentionally an observer. It does not set a legal price, block a sale, refund a buyer, or declare a moral verdict. It lowers search cost and makes dispersion visible. A personal discovery agent could search many sellers off-chain, feed observations into competing providers, and ask the contract how far a quote strays.

This is the market counterpart to making monetary extraction visible. Cantillon asks who benefits first from a change in money. Stigler asks whether a buyer is paying more than the discovered terms available elsewhere. Both convert an invisible spread into a number that can be argued over.

The limits are again instructive. The provider set is governed. Observations have no on-chain proof of sale. The fair band comes from the caller. Quality, location, delivery, discrimination, urgency, and bundled service may make two nominally identical goods incomparable. An earlier design proposed ChallengeBond-gated publishing analogous to Hayek, but the current Stigler contract contains no such integration. That room is described, not wired.

Most importantly, the median is not an objective value. It is a public settlement ratio assembled from selected observations under a declared method. That makes it reproducible and contestable, not metaphysically true. Intersubjective finance does not abolish numbers. It becomes much stricter about what the numbers are allowed to claim.

#### Protocol card — `Stigler`

**State.** Governance address, maximum data age, an array of admitted providers, and a provider-by-good map of latest observed price and timestamp.

**Roles and commands.** Governance calls `setGovernance`, `setMaxStale`, `admitProvider`, and `removeProvider`. An admitted provider calls `publish(good,price)`. Anyone reads `referencePrice(good)` or calls `check(good,quoted,fairBandBps)`.

**Transition.** Publishing requires a positive price and overwrites one provider's observation for one `bytes32` good. `referencePrice` filters admitted providers to fresh positive observations, sorts them, and returns their median. `check` returns absolute deviation in basis points and marks an overcharge only when the quote is above the reference by more than the caller's band.

**Invariant.** For a fixed provider set, clock, good identifier, and observation map, the reference and check result are deterministic. Stigler never blocks or reprices the sale it observes.

**Audit boundary.** There is no ChallengeBond path despite the earlier design claim. One provider is sufficient. A `bytes32` good has no governed unit, quality, location, or delivery definition. Removing and later re-admitting a provider revives its stored per-good observations if still fresh. `setMaxStale` emits no event. Midpoint addition and deviation multiplication can overflow; reads sort quadratically. The caller chooses the fair band, so “overcharge” is a policy-relative signal, not an on-chain fact.

---

## 7 · Schumpeter: capital allocation with the take exposed

The memory ledger can clear an exchange once parties agree. It does not decide which uncertain project should receive resources before it produces anything. Comparative advantage needs capital allocation as well as settlement.

The Schumpeter contract stages a loan. A borrower requests an amount, term, maximum acceptable rate, and a hash representing the stated purpose. An attestor assigns a pull score between zero and ten thousand: an attempt to distinguish a project expected to create future production from one organised chiefly to extract an existing flow. Governance sets a minimum score and may set a maximum legal rate. A lender funds the request at a rate no higher than the borrower's ceiling or the governed cap. Repayment separates principal and interest in an event. After maturity, an active loan can be marked defaulted, again with the principal loss visible.

The design gets several things right by refusing euphemism. Interest is not deleted from the record in order to make credit look innocent. It is the price charged for control of resources across time. Default is not hidden in an aggregate or quietly socialised. The lender bears the already-disbursed principal unless another institution intervenes. The stated purpose, attested score, rate, term, interest, and loss all leave traces.

It also shows where the hard oracle moved. “Productive” is not a Solidity type. The attestor decides the score. A politically favoured rent can receive ten thousand; an unfamiliar invention can receive zero. Governance can alter the score floor, rate cap, and attestor. The contract makes these choices inspectable but cannot purify them.

Two discrepancies between aspiration and mechanism deserve explicit notice.

First, the intended market story had lenders “compete down” the rate. The implementation is first acceptable funder wins. Once one lender calls `fund`, the status changes and no rival bid can replace it. The borrower does set a ceiling and may refuse expensive terms before funding, but there is no auction, bid book, or selection period. Competition is an intended market context, not an executed mechanism.

Second, the contract transfers an existing ERC-20 asset from lender to borrower. It does not create deposit money by lending. It demonstrates a priced, purpose-scored loan funded from an existing balance. That is useful, but narrower than Schumpeter's banker creating purchasing power for the entrepreneur. A genuine credit-creation module would have to connect the loan decision to an elastic ledger position and define who absorbs the resulting default.

The current end-to-end test deploys Schumpeter separately with a minimal mock token. It does not hand the contract to Friedman, settle through Kocherlakota, or connect default to Greif. The default event is a proposed hook, not a live reputational consequence. The attestor is a single address. The loan has no collateral, restructuring, partial repayment, late fee, grace, bankruptcy priority, or recovery.

These are not reasons to discard the module. They are the reason to keep the dossier. Schumpeter makes a neglected distinction visible: a payment rail moves an accepted claim; a credit institution decides whose not-yet-produced output may command resources now. Calling both activities “money” hides the allocation decision in the plumbing.

### Protocol card — `Schumpeter`

**State.** Immutable ERC-20 settlement asset; governance and attestor addresses; minimum pull score and optional rate cap; an append-only loan array with borrower, lender, principal, rate ceiling, funded rate, pull score, term, start, purpose hash, and status.

**Roles and commands.** Governance calls `setGovernance`, `setAttestor`, and `setPolicy`. A borrower calls `requestLoan` and later `repay`. The attestor calls `attest`. Any non-borrower with allowance may call `fund`; anyone may call `markDefault` after maturity. Anyone reads `loanCount` and public loan state.

**Transition.** A positive request enters Requested. While Requested, attestation overwrites a score from zero to ten thousand. The first caller offering a permitted rate becomes lender, moves the loan to Funded, and transfers existing ERC-20 units to the borrower. The borrower may repay at any time; interest is principal × rate × elapsed / term, capped at one term. After the strict maturity boundary, anyone may mark an active loan Defaulted without moving funds.

**Invariant.** One request can acquire at most one lender and can leave Funded only once. A successful repayment exposes principal and interest separately; default exposes the already-disbursed principal as loss.

**Audit boundary.** This is first-funder-wins lending of an existing asset, not an auction or creation of bank money. The default minimum score is zero, so an unattested request can fund until governance raises it. Policy may set a score floor above ten thousand or economically extreme rates. There is no cancellation, partial repayment, collateral, recovery, restructuring, or automatic Greif consequence. The purpose is only a hash; arithmetic and unusual ERC-20 behaviour remain trust boundaries. In the test, five interest units are minted to the borrower from outside the loan.

---

## 8 · Kiyotaki–Wright and Krugman: emergence is not stabilisation

Two contracts sit at opposite ends of the monetary life cycle. Kiyotaki–Wright asks how one intermediary becomes accepted as money. Krugman asks what to do when an established settlement system freezes. The usual story compresses both into “confidence.” The code forces them apart.

### Kiyotaki–Wright: acceptance feeds acceptance

The contract named Kiyotaki–Wright contains three candidate slots. Each receives an externally supplied ledger-likeness score and an initial marketability score. It computes a holding threshold as ten thousand minus ledger-likeness. On each round, a candidate above that threshold gains a fixed adoption increment; one at or below it loses a fixed decay increment. Reaching ten thousand sets a sticky `isMoney` flag.

Its purpose is to isolate one feedback:

```text
expected re-tradeability
        → speculative acceptance
        → greater marketability
        → stronger reason to accept
```

A candidate assigned a higher ledger score has a lower threshold and therefore needs a smaller seed to begin the climb. Yet a sufficiently high initial score can make another candidate climb first. Architecture tilts the deterministic path; the seed can select another path.

The canonical guard is crucial. The ledger score is a toy transaction-cost input. It does not inject intrinsic worth. The contract collapses resolution and integrity into one scalar for demonstration; it does not erase their distinction, and it does not make known supply synonymous with fixed supply or divisibility. Acceptance here changes a selection label, not the marginal worth of an additional unit. There is no consumption utility or commodity backing in the state.

The name otherwise promises too much. Kiyotaki and Wright model agents, types, production, consumption, meetings, and strategic acceptance in a search economy. This contract has none of those. It is not mean-field agent matching; it is a three-score threshold dynamic inspired by one result. The inputs arrive from outside, every candidate follows the same increments, and “money” means only that a score once touched the ceiling. No current end-to-end test exercises it.

So the module is not a simulation of the origin of actual money and does not establish Kiyotaki–Wright's equilibrium result. It is an executable thought experiment showing how a declared acceptance feedback can become self-reinforcing without putting a value floor into the candidate.

#### Protocol card — `KiyotakiWright`

**State.** Three ledger-likeness scores, three marketability scores, three sticky `isMoney` flags, a round counter, and fixed adoption and decay increments.

**Roles and commands.** There are no privileged roles after deployment. Anyone calls `step`, `run(rounds)`, `holdingCost(good)`, or `emergedMoney`.

**Transition.** For each of three goods, `holdingCost = 10,000 − ledger`. If current marketability exceeds that cost, one round adds `adopt` and caps the result at ten thousand; otherwise it subtracts `decay` and floors at zero. Reaching the ceiling sets `isMoney` forever and emits an event. `run` repeats this transition the caller's requested number of times.

**Invariant.** With constructor inputs inside their intended domains, each transition keeps marketability between zero and ten thousand, and round increases once per completed step. Given the same state, the update is deterministic.

**Audit boundary.** The constructor validates none of those domains. A ledger score above ten thousand underflows; seeds above the scale and an overflowing `marketability + adopt` can revert or defeat the intended clamp. `run` is unbounded in gas. `isMoney` never clears if acceptance later collapses. `emergedMoney` returns good zero for an all-zero state and resolves ties by first occurrence. Most importantly, this is a three-score threshold dynamic: it contains no agents, types, production, consumption, meetings, trades, or matching, so it is not an implementation of the Kiyotaki–Wright search model.

### Krugman: a rule-bound steering wheel

Krugman begins after emergence. An oracle reports current activity. Governance sets a target and a responsiveness parameter. The contract computes the proportional gap:

```text
stance = responsiveness × (target − activity) / target
```

Kocherlakota reads that stance as a multiplier on base credit limits. Activity below target expands effective limits. Activity above target tightens them, down to zero if the contraction is severe enough. The unit is not pegged. The quantity of credit that can clear is adjusted.

The end-to-end scene is concrete. At trend, an employer has an effective limit of one hundred, so a payment of one hundred and fifty fails. The oracle then reports activity at half the target. The rule expands the limit, and the same willing trade clears. Net supply remains zero throughout. The stabiliser changes the room available for positions; it does not mint a net asset.

This is a steering wheel, not a driver. The activity reading is the hardest input in the system. It can be late, revised, manipulated, or conceptually wrong. The contract stores the report time but does not reject a stale reading. Governance may choose an extreme responsiveness. A proportional rule may amplify noise, miss a supply shock, or expand credit toward the best-connected participants. The code emits the policy inputs and makes the formula reproducible; it does not make macroeconomic control safe.

The separation from Kiyotaki–Wright matters. A currency can be universally accepted and badly managed. It can be well managed and never bootstrap. The social equilibrium that selects a monetary network is not the policy rule that conditions its elasticity. “Trust” is not an explanation of either one. At most it is a summary of many institutions working—or failing—together.

#### Protocol card — `Krugman`

**State.** Governance and oracle addresses; activity target, responsiveness, latest reading, and report time.

**Roles and commands.** Governance calls `setGovernance`, `setOracle`, and `setRule`. The oracle calls `report`. Anyone reads `stance` and `elasticityFactorBps`; Kocherlakota may use the latter as a credit-limit multiplier.

**Transition.** A report overwrites activity and time. If target is nonzero, `stance = responsiveness × (target − reading) / target`, expressed as a signed basis-point adjustment. The exposed multiplier is `max(0, 10,000 + stance)`. Kocherlakota applies it to each member's base credit limit when the stabiliser is attached.

**Invariant.** For fixed parameters and reading, the stance and multiplier are deterministic. The module changes no balance itself and cannot break ledger conservation directly.

**Audit boundary.** `reading` begins at zero, so attachment before the first report behaves as a maximum measured shortfall rather than a neutral state. `readAt` is stored but never used; a report remains effective forever. There is no upper multiplier cap or bounds on target, reading, and responsiveness before unsigned-to-signed casts and multiplication. Target zero silently produces a neutral rule. In `CoreE2E`, Krugman's governance remains the deployer rather than Friedman. The rule expands a limit; it does not establish that activity, distribution, or welfare has stabilised.

---

## 9 · The bench engine: six tests, seven scenes

The repository's single Foundry test file is called `CoreE2E.t.sol`. Its setup deploys six modules: Friedman, Greif, Hayek, Kocherlakota, Fisher, and Krugman. It admits three ledger participants, registers identities, admits three index providers, and sets an employer's credit limit. It then gives Friedman authority over Kocherlakota, Greif, and Hayek. Fisher has immutable dependencies rather than a governor. Krugman's governance remains with the deployer. Schumpeter becomes the seventh implemented module exercised by the file, but it is deployed separately inside its own scene with a mock settlement token and its own deployer governance.

The test is a bench engine. It does not take the system on the road. Each scene turns one conceptual joint far enough to see whether the neighbouring pieces move.

### Scene 1: no change by fiat

After Kocherlakota hands its steward role to Friedman, the original deployer tries to change a credit limit directly. The call reverts with `not steward`. Alice then proposes the same change; Alice and Bob vote; the clock advances beyond the two-day timelock; and the proposal executes. The observed limit equals the voted amount.

What is demonstrated: administrative authority can be surrendered to a public procedure, and the target contract enforces the handover.

What is not: that the membership is legitimate, the quorum is wise, the minority can actually exit, or the adopted policy is good.

### Scene 2: the rope clears

An employer approves Fisher as an operator. Fisher creates a monthly wage of one hundred rod units. Three providers publish a rod level of 1.00. After one period, Fisher settles one hundred nominal units from employer to worker. The worker stands at plus one hundred, the employer at minus one hundred, and net supply is zero.

What is demonstrated: a recurring obligation can be denominated outside the settlement unit and paid over a tokenless mutual-credit ledger.

What is not: consent by the worker, labour-law completeness, identity, enforcement, or acceptance beyond the test addresses.

### Scene 3: real value held while the currency moves

One month later, all three providers publish 1.10. Fisher now calculates one hundred and ten nominal units for the same one hundred real rod units. After settlement, the worker has accumulated plus two hundred and ten. The nominal payment changed; the contractual unit did not. Net remains zero.

What is demonstrated: stability can live in the contract rather than in the medium.

What is not: that the rod accurately measures the worker's cost of living, or that indexation has no distributional consequences.

### Scene 4: a positive balance melts into the commons

After a first wage payment, Friedman enables five-per-cent annual demurrage and names a commons account. A year passes. Anyone pokes the worker's positive balance. The worker moves down, the commons moves up, and net remains zero.

What is demonstrated: a holding charge can be a transparent redistribution inside the ledger rather than an unexplained loss of unit value.

What is not: that five per cent is fair, that the commons is representative, or that a positive balance reveals hoarding rather than prudence.

### Scene 5: memory acquires teeth

Friedman authorises a reporter in Greif. A registered borrower begins in good standing. The reporter records minus five. The borrower then fails a threshold of zero.

What is demonstrated: a record can punish individually through future exclusion.

What is not: that the report is accurate, proportionate, private, appealable, or attached to a real default. Schumpeter is not wired into this scene.

### Scene 6: priced credit exposes the take

The test creates a mock ERC-20, a lender, an attestor, and a Schumpeter contract. The borrower requests one hundred for a hashed “loom” purpose, accepts rates up to ten per cent, and receives a pull score of eighty per cent. The lender funds at five per cent. After the term, the test mints the five interest units to the borrower from outside the loan; the borrower repays one hundred and five, and the lender's final balance reveals principal and interest separately.

What is demonstrated: a loan can expose purpose, attestation, price, principal, interest, and loss states.

What is not: where interest comes from, competitive rate discovery, bank-money creation, a connection to the memory ledger, governed attestation, or reputational consequences of default.

### Scene 7: a freeze and a rule-bound recovery

The test sets the employer's base credit limit to one hundred and attaches Krugman. At trend activity, a payment of one hundred and fifty fails. The oracle reports fifty against a target of one hundred. The elasticity factor rises above its neutral ten thousand basis points. The same payment now succeeds, and net remains zero.

What is demonstrated: countercyclical elasticity can alter the feasibility of exchange while conservation survives.

What is not: that the reported shortfall is real, that expansion reaches the right participants, that the rule improves welfare outside this constructed case, or that Friedman governs Krugman's oracle and rule in this setup.

The file contains six test functions because the indexed-wage function carries two scenes. It is best read as a run-sheet, not a certification. There are no unit tests for Fiske, ChallengeBond, Stigler, or Kiyotaki–Wright in the current test directory; no invariant fuzzing; no adversarial oracle tests; no governance-capture scenario; no privacy or Sybil layer; no gas benchmark; and no security audit. All eleven source contracts compile under Solidity 0.8.20. The Foundry suite was not run during this audit because Forge and its test dependency were unavailable. Even a green run would mean only that these selected state transitions behaved as asserted; it would not mean the monetary constitution was safe.

---

## 10 · Implementation ledger: built, connected, specified

The names in the cast can create a false sense of completeness, so the status deserves its own ledger.

| Module | Compiles with 0.8.20 | In `CoreE2E` | Present connection |
|---|---:|---:|---|
| Kocherlakota | yes | yes | settlement spine |
| Fiske | yes | no | optional gate exists but is not attached |
| Friedman | yes | yes | governs Kocherlakota, Greif, and Hayek |
| Greif | yes | yes | standalone reporter exercises one score change |
| ChallengeBond | yes | no | Hayek can read a settled assertion; trusting bypass remains |
| Hayek | yes | yes | supplies Fisher's rod through trusting publication |
| Fisher | yes | yes | settles through Kocherlakota |
| Schumpeter | yes | yes | isolated scene with a mock ERC-20 |
| Stigler | yes | no | standalone observer |
| Kiyotaki–Wright | yes | no | standalone threshold model |
| Krugman | yes | yes | scales limits; governance remains the deployer |

The gaps between those columns are where the next honest work lives. “Compiles” means the compiler accepted the types and control flow. “In the test” means at least one selected path appears in the run-sheet. “Connected” means one module's output currently reaches another. None of the three means the path was adversarially tested, audited, production-ready, or socially legitimate.

### The unbuilt rooms, reduced to interfaces

A second audit changes the catalogue. A name is not automatically a contract. Mitchell-Innes is already latent as a view over Kocherlakota; Bohannan belongs as a policy extension to Fiske; Lietaer is a factory that composes existing rooms. The remaining names describe new state machines. What follows is therefore not fictional source code. It is the minimum interface each room would have to pay for before the prose may call it implemented.

#### Mitchell-Innes — a view, not a second ledger

**Kind and state.** A read-only library or adapter over Kocherlakota's signed balances. It owns no monetary state.

**Interface.**

```text
claimOf(account)       = max(balance(account), 0)
obligationOf(account)  = max(-balance(account), 0)
positionOf(account)    = (claimOf(account), obligationOf(account))
systemClaims()         = Σ claimOf(account)
systemObligations()    = Σ obligationOf(account)
```

**Transition and invariant.** There is no independent transition. Every result is derived from the memory ledger. For each account, at most one of claim and obligation is positive, `claim − obligation = balance`, and total claims equal total obligations whenever Kocherlakota's net is zero.

**Audit boundary.** Deploying a second mutable “credit” contract would create two truths and invite double counting. The missing work is semantic and presentational: identify the counterpart community, maturity, enforceability, and conditions under which an obligation may be forgiven or disputed.

#### Mehrling — layered IOU clearing

**Kind and state.** A new balance-sheet graph: registered institutions, settlement tiers, liabilities by issuer and instrument, holders' matching assets, higher-tier reserves, pledged collateral, haircuts, and settlement status.

**Roles and commands.** Governance registers issuers, instruments, tiers, collateral rules, and emergency authorities. An authorised issuer calls `issueLiability(holder,instrument,amount)`. Holders call `transferLiability`. Issuers call `postReserve` and `settleUp`; a declared resolution authority calls `haircut` or `resolve`.

**Transition and invariant.** Issuance increases one issuer liability and one holder asset by the same amount. A transfer changes the holder, not the issuer's outstanding total. Inter-issuer redemption debits the lower-tier liability and moves an agreed higher-tier reserve. For every instrument, outstanding issuer liabilities must equal attributed holder assets plus an explicit unresolved-loss bucket.

**Audit boundary.** The hierarchy cannot determine its own legal finality, collateral value, convertibility promise, lender of last resort, or loss seniority. Those are constitutional inputs, not balance-sheet arithmetic.

#### Zelizer — earmarked pots

**Kind and state.** An allocation overlay: pot owner, label and purpose hashes, Fiske mode, permitted payees or categories, remaining budget, expiry, and the underlying account or asset from which spending settles.

**Roles and commands.** An owner calls `createPot`, `fundPot`, `authorise`, `spend`, and `closePot`; a counterparty or guardian may be required to call `acceptPot` for shared or obligated relations. Anyone calls `available` and `checkPurpose`.

**Transition and invariant.** Funding moves declared capacity from an owner's unallocated amount into a pot without creating a new claim. Spending requires an active pot, sufficient remainder, permitted purpose and recipient, then decrements the pot and calls the underlying rail atomically. The sum of open pot allocations may never exceed the backing amount the adapter says is allocable.

**Audit boundary.** Earmarks require a classifier, and classifiers encode household power. Labels leak intimate information. Immediate relations should generally remain off-chain and non-transferable; representing a gift pot must not turn it into a collectible debt.

#### Lietaer — community-ledger factory

**Kind and state.** A registry and factory for separately governed communities, each composing Kocherlakota, Fiske, Friedman, and optional demurrage. Each community declares two things about its own claims: the unit they are quoted in, and whether they are positions held by identified members or instruments transferable to anyone. It also records explicit bridge adapters and their conversion policies.

**Roles and commands.** A founding group calls `createCommunity(constitution,initialMembers)`. Community governance calls `join`, `leave`, `setLocalPolicy`, and `authoriseBridge`. Members call their local ledger. Anyone calls `communityOf`, `quoteBridge`, and the declared bridge transition.

**Transition and invariant.** Creation deploys or registers one isolated ledger stack and fixes its initial constitutional addresses. Local settlement changes only local positions. A bridge must make both legs explicit—retiring or locking a claim in one community while issuing or releasing the paired claim in another. Each community preserves its own conservation rule; no bridge may silently merge membership, credit limits, or losses. **Bridges are an invariant of the factory, not an optional adapter.** A community whose bridge set is empty, or whose only bridge is controlled by the community's own issuer, must be readable as such from outside; the factory may not present it as complete. A ledger that clears against a single counterparty and converts nowhere is company scrip whatever its constitution says. Separately, a community that makes its claims freely transferable outside its own membership has issued a bearer instrument, and must be readable as having done so; this is not forbidden, but it may not be a silent consequence of a configuration.

**Audit boundary.** A factory does not solve cold start, exchange-rate formation, reserve adequacy, exit, abandoned negative balances, or conflicts between constitutions. “Complementary” is an institutional relationship, not an automatic technical property—and the distinction is not cosmetic. Among the demurrage experiments of the 1930s, the one that endured was the one whose claims were book positions. WIR runs a clearing circuit among member businesses, units quoted in but not redeemable for francs, licensed as a bank in 1936, and has run for ninety years. Wörgl printed bearer notes—in schillings, backed by schilling deposits—and lasted fourteen months, ended by the national bank asserting its banknote monopoly. Both kept the incumbent's unit, so denomination did not decide it; the form of the claim did, because that is what the instrument keys on. Bridges are an invariant here for a different reason, stated above, and should not be mistaken for protection. Whether the surrounding jurisdiction tolerates the result is not a property any factory controls.

#### Baumol — just-in-time balance sweeper

**Kind and state.** A user-owned router between a transaction rail and approved store instruments: adapters, target transaction buffer, route allowlist, maximum fee and slippage, rebalance cadence, and explicit emergency stop.

**Roles and commands.** The owner calls `setPolicy` and `revokeAdapter`. The owner or its authorised agent calls `quote`, `fundPayment`, `sweepExcess`, and `rebalance`. Adapters expose executable quotes and settlement receipts.

**Transition and invariant.** A sweep converts only the amount above the declared buffer; a payment conversion raises the transaction balance only by the shortfall. Execution requires a live quote inside the user's fee, slippage, asset, and venue constraints. Every conversion emits input, output, route, fee, and price impact. The agent may execute policy but may not amend it.

**Audit boundary.** Liquidity, price feeds, frontrunning, failed legs, tax treatment, custody, and adapter compromise remain. An optimiser owned by the routing platform would face a direct conflict over spreads, data, and lock-in.

#### Bagehot — emergency liquidity

**Kind and state.** A lender-of-last-resort facility: eligible borrowers, approved collateral types, valuation oracles, haircuts, borrower and system caps, penalty rates, pledged collateral, drawn debt, maturity, and loss state.

**Roles and commands.** Governance configures eligibility and risk rules. A borrower calls `pledge`, `draw`, and `repay`. Anyone calls `liquidate` after a declared breach; a resolution authority calls `recogniseLoss` where liquidation does not cover the debt.

**Transition and invariant.** At draw time, new debt may not exceed `oracleValue(collateral) × (10,000 − haircut) / 10,000`, the borrower's cap, or the facility cap. Interest accrues at the declared penalty rate. Repayment releases only excess collateral; liquidation applies proceeds in a fixed priority and records any remainder as loss. Every liability must end as repayment, collateral transfer, or an explicitly assigned write-down.

**Audit boundary.** “Solvent but illiquid” is the hard oracle. Collateral correlations, fire-sale prices, privileged access, emergency discretion, and who capitalises the facility cannot be inferred from a haircut formula.

#### Galbraith — countervailing buyer power

**Kind and state.** A demand-aggregation campaign: governed good specification, target quantity, buyer maximum price, commitment deadline, buyer quantities and deposits, seller bids, winning allocation, delivery state, and refund state.

**Roles and commands.** An organiser calls `openCampaign`. Buyers call `commit` and, before the deadline, `withdraw`. Sellers call `bid`. Anyone calls `finalise`; an agreed verifier calls `confirmDelivery`; buyers or sellers call `settle` and `refund`.

**Transition and invariant.** Finalisation considers only bids matching the good specification and at or below the buyers' ceiling, then chooses the declared price rule—such as the lowest sufficient bid. Awarded quantity cannot exceed committed quantity, and escrowed commitments must cover the award. Settlement transfers funds only against the delivery condition; every unmatched or failed commitment remains refundable.

**Audit boundary.** Product quality, delivery, collusion, monopsony abuse, organiser capture, and buyer heterogeneity live outside the price rule. Aggregating buyers creates power; it does not make that power innocent.

#### Keynes — intercommunity clearing

**Kind and state.** A clearing union: admitted communities, credit and debit quotas, signed clearing positions, bilateral trade entries, reserve pledges, symmetric surplus and deficit charge rules, and declared default state.

**Roles and commands.** Union governance calls `registerCommunity`, `setQuota`, and `setChargeRule`. Authorised community gateways call `recordTrade`. Anyone calls `net` and `positionOf`; governance or an automatic rule calls `chargeImbalance`, `adjustQuota`, and `declareDefault`.

**Transition and invariant.** A trade moves the importing community down and exporting community up by exactly the same clearing amount. No community may cross its declared debit quota. Periodic imbalance charges debit both excessive deficit and excessive surplus into a named union account, preserving the full signed sum. At all times, community positions plus union and explicit loss positions sum to zero.

**Audit boundary.** The contract still needs authenticated trade data, unit conversion, reserves, exit, default allocation, and legal finality. Symmetry is a rule choice; enforcing it against sovereign or trustless communities is the institution.

#### Cantillon — issuance-path tracer

**Kind and state.** An observer over newly granted purchasing power: issue identifier, source module, amount, first recipient, timestamp, attributed downstream hops, current attributed holdings, consumed amount, escaped or untraced amount, and tracing horizon.

**Roles and commands.** Approved source adapters call `recordIssue`; approved settlement observers call `recordHop`; anyone calls `closeTrace`, `firstRecipient`, `exposureOf`, and a distribution report. Governance sets adapters and privacy policy but cannot rewrite closed history.

**Transition and invariant.** Each hop reallocates no more attributed amount than the sender currently carries. For an issue, current attributed holdings plus consumed, retired, and explicitly untraced buckets must equal the original amount. Closing freezes attribution at the declared horizon rather than pretending lineage can be followed forever.

**Audit boundary.** Fungibility makes attribution a convention—first-in-first-out, proportional, or another declared rule—not a discovered fact. Privacy, cross-rail transfers, netting, and counterfactual prices remain hard. The module may describe sequence and beneficiaries; it must not call a transfer an implicit tax without identifying the payer, beneficiary, and defensible counterfactual.

#### Bohannan — exchange-sphere policy

**Kind and state.** An extension to Fiske: governed sphere identifiers, tagged instruments or purposes, a matrix of permitted conversions, authorities, consent receipts, expiry, and challenge state.

**Roles and commands.** A legitimate community authority calls `defineSphere` and proposes conversion rules. Affected parties call `consent` or `revokeConsent`. Rails call `requireConvertible(fromSphere,toSphere,relation,purpose)` before settlement. Affected parties call `challengeClassification`.

**Transition and invariant.** A cross-sphere conversion executes only when the current matrix permits it and every required consent receipt is live; otherwise the gate reverts or emits a declared taboo without moving value. Rule changes are versioned so a later policy cannot silently validate an earlier transfer. Immediate relations are excluded rather than tokenised.

**Audit boundary.** Who classifies the good, who represents the community, coercive consent, emergency exceptions, and appeal are political questions. Bohannan is a boundary policy for rails, not another currency and not proof that historical spheres were just.

#### Minsky — exposure graph and default waterfall

**Kind and state.** A graph of obligations and guarantees: debtor, creditor, principal, maturity, seniority, collateral links and marks, refinancing dependency, leverage metrics, default state, and an ordered loss waterfall.

**Roles and commands.** Authorised contracts call `registerExposure` and `repayExposure`. Oracles call `markValue`. Declared actors call `triggerDefault`, `absorbLoss`, and `restructure`; anyone reads direct and network exposure.

**Transition and invariant.** Default freezes the affected edge, values recoveries under the declared rule, and passes the unpaid remainder through collateral, junior creditors, guarantors, insurers, public backstops, and final write-down in a fixed order. `restructure` may change maturity or principal only with the required consent. For every default, recoveries plus allocated losses equal the unpaid claim; no loss disappears into an aggregate.

**Audit boundary.** Hidden off-ledger leverage, correlated collateral, endogenous fire-sale prices, strategic default, bankruptcy stays, and simultaneous cascades defeat a tidy graph. The module can expose assumptions and run declared scenarios; it cannot predict a crisis as an objective event.

#### Brunnermeier — cross-rail router

**Kind and state.** A non-custodial router across units, transaction rails, and store instruments: governed adapter registry, executable quotes, settlement capabilities, and per-user policy for allowed assets, maximum fee and slippage, mode restrictions, latency, counterparty, and privacy.

**Roles and commands.** Governance admits adapters but cannot set user policy. A user calls `setPolicy` and `revokeAgent`. The user or its agent calls `quote`, `route`, `settle`, and `explain`; adapters return standardised costs and receipts.

**Transition and invariant.** The router filters routes by the user's constraints, compares declared total cost rather than headline price alone, selects according to the user's rule, and executes atomically or returns a legible partial-failure state. The receipt names every unit conversion, fee, spread, bridge, custodian, and data disclosure. No route may use an unapproved adapter or exceed the signed policy.

**Audit boundary.** Quote truth, bridge finality, liquidity, censorship, metadata leakage, and composability remain. If a platform owns the agent or adapter ranking, it can turn the comparison layer into the chokepoint. The user's policy and the agent's loyalty are therefore part of the monetary constitution.

These are provisional protocol blueprints, not implementations. Their commands, invariants, and trust boundaries are now precise enough to challenge, split, or translate into interfaces. They are not precise enough to claim compilation, integration, or safety.

The patron spirits receive no room of their own. Menger's subjective value, Simmel's relational value, Patinkin's real-balance service, Graeber's credit-first history, Polanyi's forms of integration, Mauss's gift, Sahlins's kinship distance, and the relational accounts of Ingham and Martin are premises or descriptions. A premise cannot be instantiated as a state transition without being distorted into a mechanism.

There is also no Mises contract, on purpose. The regression theorem's commodity terminus is the proposition the framework declines to install. The absence is not an omission in the status table. It is the cleanest architectural statement in the building: the settlement system contains no field in which intrinsic value could hide.

---

## 11 · The residual ledger

Executable prose is still prose with consequences. Before treating the suite as a design, we should collect what it does not settle.

### Identity

An address is not a person, household, firm, public body, or community. The contracts inherit identities from outside and do not solve duplication, delegation, incapacity, lost keys, coercion, guardianship, succession, or the right to begin again. Greif is effective only if the identity layer is effective; the identity layer is precisely where exclusion can become violence.

### Privacy

Balances, reputation, providers, policy changes, and events are public in the demonstrator. Transparency to all is not the same as accountability to the affected. A credible system would need selective disclosure, data minimisation, purpose limitation, and an answer to who may reconstruct a person's economic life. Visibility can expose extraction and expose the extracted.

### Oracle truth

Activity, index levels, observed prices, productive-purpose scores, modes, and defaults all cross the boundary between world and code. The contracts can authenticate the reporter and preserve the report. They cannot make the report true. ChallengeBond can make a contest possible; it cannot guarantee attention, equal resources, or a legitimate arbiter.

### Enforcement

A negative balance is a record, not a harvest. Greif can exclude an address; ChallengeBond can slash a posted bond. Neither produces the goods, care, labour, tax capacity, or legal judgment that completes a claim. The phrase “no floor, pay with teeth” is diagnostic, not celebratory. If intrinsic backing is absent, the quality and justice of enforcement become more important, not less.

### Governance legitimacy

Friedman makes procedure visible. It does not define the demos. One-member-one-vote can coexist with selective membership, employer coercion, inaccessible exit, cartel control, or a majority that repeatedly extracts from a minority. A timelock gives notice only to someone able to understand and act on it. Code can enforce a constitution; it cannot confer constituent power.

### Scalability and security

Several contracts iterate over provider or member arrays and use simple in-memory sorting. The suite has one integration file and no external audit. There are no upgrade, migration, emergency, key-recovery, denial-of-service, front-running, re-entrancy, economic-attack, or chain-governance analyses. Solidity's consistent execution is not institutional safety.

### Welfare and public purpose

The code can show who moved down and who moved up. It cannot decide whether the transfer was deserved, whether a commons should exist, whether a climate externality should be priced, whether care belongs outside the ledger, or which goods should be socially provided rather than sold. Those questions require a mode decision and a polity. An optimiser can execute the decision once supplied; it should not smuggle the decision in as an objective price.

### Adoption

Kiyotaki–Wright models a feedback, not a launch. The suite has no interface, merchant network, legal tender rule, tax obligation, subsidy, social ritual, conversion market, or migration path. A technically superior rail with no one on it remains worth nothing as a rail. The cold-start is an institutional problem, not a missing button.

### Agent ownership

An agent could watch every public parameter, compare providers, index promises, route payments, challenge assertions, and warn about extraction more consistently than a person. That is a strong argument for agentic finance. It is also an argument about ownership. If the agent belongs to a platform that profits from routing, credit, data, or lock-in, the optimiser becomes another extraction surface. The same code that makes rules machine-readable makes capture machine-scalable.

The relativist advantage is therefore conditional. An intersubjective model presents the agent with plural objectives, declared modes, contested indices, and visible governance. An objectivist model invites it to optimise a single price as though the objective were given by nature. The former can represent more of what people actually care about. It does not choose whose cares should prevail.

---

## 12 · How to reproduce the demonstration

The source tree is intentionally small:

```text
contracts/
    ChallengeBond.sol
    Fisher.sol
    Fiske.sol
    Friedman.sol
    Greif.sol
    Hayek.sol
    KiyotakiWright.sol
    Kocherlakota.sol
    Krugman.sol
    Schumpeter.sol
    Stigler.sol
test/
    CoreE2E.t.sol
```

The Foundry configuration fixes Solidity at version 0.8.20 and declares a remapping for `forge-std`. The dependency is not currently present in `lib/`. The source-only compiler audit used:

```bash
mkdir -p /tmp/bovi-solc-audit
npx --yes solc@0.8.20 --bin --abi \
  -o /tmp/bovi-solc-audit contracts/*.sol
```

All eleven source files compiled successfully as Solidity `0.8.20+commit.a1b79de6`; the command produced an ABI and bytecode artifact for each contract and interface it encountered. Compilation checks syntax, types, and compiler-enforced arithmetic. It does not execute a transition or prove an invariant.

With Foundry installed and its dependency fetched, the intended test reproduction is:

```bash
forge install foundry-rs/forge-std
forge test -vv
```

The useful reading order is not alphabetical.

1. Start with `Kocherlakota.sol`. Find the paired balance writes, the credit-limit check, `netSupply`, and `grossInCirculation`.
2. Read `Fiske.sol`, then return to the optional gate in Kocherlakota. Notice that the deepest protection is refusal to record.
3. Read `Friedman.sol` and follow the handover in `CoreE2E.t.sol`. Verify that the old steward loses its direct power.
4. Read Hayek and Fisher together. Trace a rod observation into a nominal settlement.
5. Read Greif and ChallengeBond as two non-equivalent kinds of teeth.
6. Read Schumpeter and compare the comments with the actual first-funder-wins transition.
7. Read Stigler beside Hayek: one estimates a general rod; the other checks a price for a named good.
8. Read Kiyotaki–Wright before Krugman. Keep selection and stabilisation separate.
9. Finish with the test file. For every assertion, ask which social premise had to be supplied before the machine could reach it.

Then alter the machine. Remove one side of the paired settlement in a disposable copy and watch conservation fail. Bypass the credit limit and see unbounded promises enter. Replace the median with one provider. Set an extreme responsiveness. Let one party overwrite an Immediate tag. Give a reporter power without an appeal. The point is not to vandalise the code. It is to learn the shape of the institution by touching its load-bearing walls.

Forge was not available in the environment that assembled this edition, and the declared `forge-std` path was absent, so `CoreE2E.t.sol` was not executed. The source was freshly compiled; the test file is included as a bench-engine specification, not reported as a passing run. A later edition should record compiler output, test count, commit identifier, dependency lock, invariant suite, and audit status rather than letting “there are tests” harden into “the system is tested.”

---

## Demonstrations of reach

A fair objection to everything above is that it is self-contained: a framework about money, demonstrated on money, judged by its own lights. So a second tier exists, and it is admitted by a rule rather than by taste — **an entry must show a monetary parameter driving a non-monetary outcome, through a published result, isolable to one mechanism.** The rule earns its keep by what it excludes. Several candidates we would have liked failed it: a hyperinflation study whose outcome was still monetary; a fiscal-mortality literature whose identification is contested; an exchange-rate-and-deforestation chain that is tempting precisely because it flatters an audience we would like to reach, which is the reason it stays out until there is a citation worth defending. A rule that admits everything we like is a preference wearing a rule's clothes.

What survives is short, and three of the survivors the reader has already met as chapters.

**Clark (1973): the discount rate that makes extinction rational.** For a regenerating stock — a fishery, a forest, a herd — there is a threshold at which liquidating the whole thing and banking the proceeds beats harvesting it forever. Above roughly twice the stock's growth rate, extermination is the profit-maximising policy *for a secure sole owner with no competitors and perfect property rights.* This is the cleanest demonstration in the tier, because it defeats the standard consolation. We are used to blaming the commons: the fish die because nobody owns them. Clark's owner owns them completely and kills them anyway, on arithmetic, because the money's rate of return outran the animal's. A dial that monetary policy sets is visible here as a policy on a population, and the Gesell overlay in the memory ledger is interesting for exactly this reason — a carry cost pushes the same dial the other way.

**Sen (1981): famine at unchanged supply.** The entitlement collapse of Chapter 18, stated formally: aggregate availability adequate, claims on it failed, people died. In this tier it is the micro-over-aggregate position entire.

**Forstater and Bundy: the tax that made a labour force.** Chapter 13's hut tax as a mechanism — an obligation denominated in a currency obtainable only by wage labour, producing a migrant-labour system and a rural social structure that outlived it. It is the book's own claim about where demand for a record comes from, running at the scale of a region.

**Mundell (1961), Bernanke (1983), Eichengreen and Sachs (1985).** One unit across divergent regions, so shocks are absorbed in unemployment and emigration rather than the exchange rate (Chapters 17 and 19). The destruction of the credit *record* as a real cost, distinct from the quantity of money — the ledger claim tested by its own negation. And recovery timing off gold, which is the anchor-rigidity axis with a date attached.

The point of the tier is reach, not coverage. Six entries that survive a rule are worth more than sixty that survive a preference.

## The ratio is the argument

We can now make the book's minimality claim by measurement rather than by assertion.

The whole of money, in the ledger that carries it, is **two lines**: one balance down, one balance up, summing to zero, on a record both parties trust. Around those two sit about twenty more — is the payer admitted, is the payee admitted, is this within the credit limit, has carry cost accrued, is this a relationship the ledger has been told never to record. And around *those* sit some fourteen hundred lines of everything else: governance of the dials, index construction and competing providers, purpose-scored credit, price discovery, reputation, enforcement bonds, stabilisation, jubilee, the modes as a permission layer.

Two lines against fourteen hundred. That proportion is the argument of this entire book rendered as a count. The monetary act is nearly nothing — a stone-age band could weave it in an evening, and one did, on a rope. Everything else is **governance and repair**: not what money *is*, but what has to be true around it before people will use it, and what has to be rebuilt each time they stop.

Which is why the question *what is money, really?* has always disappointed the people who asked it. They were pointing at the two lines and expecting the fourteen hundred to be inside.

---

## Coda: what code is for

The executable canon does not end the argument. It improves the argument's manners.

It prevents us from saying that money is “trust” without naming the trusted act. It prevents us from saying that a unit is “stable” without naming the index, providers, clock, and household. It prevents us from saying that credit is “allocated by the market” when the first lender wins. It prevents us from calling demurrage natural when governance chooses the rate and recipient. It prevents us from treating a public ledger as neutral when exclusion, privacy, and identity supply its force.

Most of all, it prevents the monetary object from swallowing its institutions. What looked like a thing with value becomes a record, a permission boundary, a measurement convention, a credit rule, a governance process, an enforcement system, and an expectation equilibrium. Gold outsources part of that stack to mining technology. Bitcoin outsources part to cryptographic and protocol technology. Fiat outsources part to law technology. None escapes institutions; each chooses where to harden them.

Once the stack is visible, we can ask a better question than “what is money really?” We can ask: **which relations should be remembered, which should be allowed to clear, which promises should travel through time, which measurements should govern them, who may turn the dials, who can contest the result, and who owns the agent acting on our behalf?**

Those are not engineering questions with social complications. They are social questions made precise enough to engineer.
