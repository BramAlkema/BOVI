// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Ostrom — the office (who holds the crank, and what their silence looks like)
 *
 * Executes: Elinor Ostrom, *Governing the Commons* (1990) — the design principle
 * that a durable commons has MONITORS, and that the monitors are accountable to
 * the appropriators or are drawn from them. Not a mechanism. An office.
 *
 * WHY THIS CONTRACT EXISTS, WHICH IS A CONFESSION BEFORE IT IS A DESIGN.
 * Nothing in this canon can act on its own (judgement register §0.2). Every
 * clearing discipline waits on somebody choosing to invoke it: `Fisher.settle`,
 * `Clark.step`, `Krugman`'s rule, `Kocherlakota`'s demurrage accrual. That party
 * was load-bearing from the first commit and had no contract, no vote and no name
 * in the cast. The canon called them "the keeper" in a footnote and moved on.
 *
 * Then the stock-and-flow audit found what the omission costs. `setDemurrage` is
 * documented as a steward lever that, set to zero, erases "every holder's pending
 * liability" — uniform, as written. It is not uniform. `_accrue` erases only the
 * span nobody has CHARGED yet, so the erasure reaches exactly the holders no one
 * happened to poke first. Two holders, same balance, same elapsed time, same rate,
 * different outcome, and the only thing separating them is when an unnamed party
 * chose to call a public function. See
 * `test_Gesell_WhoPaysTheMeltIsDecidedByWhoeverPokesFirst`. Governance sets the
 * rate; the keeper decides who it lands on.
 *
 * AND THE GRAMMAR UNDERNEATH IT. The framework defines a mode as "a rule about
 * when and whether the ledger must clear." Must — who must? A duty with nobody it
 * falls to is not a stricter duty, it is an unfinished one, and an agentless *must*
 * is precisely the essentialist grammar this project exists to refuse (money *has*
 * value; the market *clears*). The book's own field card always asked the question
 * the definition dropped — *and says who?* This contract is that question given a
 * storage slot.
 *
 * WHAT IT DOES, AND THE MUCH LARGER LIST OF WHAT IT DOES NOT
 * An office is a named duty, a holder, and a clock. The holder DISCHARGES it by
 * recording that they ran the crank. When the clock runs past the period, anyone
 * may call `flagOverdue`, which emits. That single event is the whole point and it
 * comes straight from the register's own class-A remedy: *event staleness so a
 * missed clearing is visible as a positive fact rather than an absence.* A thing
 * that does not happen emits nothing, which is why nobody ever noticed the keeper.
 * Here, not happening leaves a mark.
 *
 * It does NOT call the target. It cannot: §0.2 is a property of the platform, not
 * an oversight, and a contract claiming to make the ledger self-executing would be
 * lying about the thing this cast is most careful about. `flagOverdue` still needs
 * a caller. The regress is real and is not closed here — what changes is that the
 * regress now terminates in a NAMED party rather than in nobody, and their absence
 * is a public fact rather than a silence.
 *
 * It also does not punish. `missed` accumulates and is exposed; no sanction fires.
 * Ostrom's other principle here is GRADUATED SANCTIONS, and wiring one would repeat
 * the mistake ruled against in `Greif`: an adjudicative input (did they fail?)
 * driving a normative output (what happens to them) with neither class's guard in
 * the path. The sanction is referred — to `Friedman`, which since the audit must
 * state a reason on the record, and which can cite `missed` as that reason.
 *
 * DIVISION OF LABOUR, NAMED SO THE CREDIT IS RIGHT.
 *   - Alchian & Demsetz (1972), team production: the monitor must be given the
 *     residual or they will not monitor. That half is ALREADY BUILT — it is
 *     `Kocherlakota.pokeRewardBps`, which pays a caller a share of what they
 *     collect. The incentive was never the gap.
 *   - Ostrom: the monitor must be *accountable*, and to the people affected. That
 *     is the gap, and it is this contract.
 *   - Hohfeld (1913), "Some Fundamental Legal Conceptions as Applied in Judicial
 *     Reasoning", Yale L.J. 23 — jural correlatives: every duty has a bearer and a
 *     correlative claimant. Citation confirmed via Symboleo (RE'20), whose legal-
 *     position ontology is built on it; the text itself is still unread here.
 *
 * WHY THE REGRESS IS NOT A SOLIDITY PROBLEM (revised 2026-08, after reading Symboleo).
 * This header first blamed the platform: nothing can act, so a duty cannot fire. That
 * is true and too narrow. Symboleo is a platform-independent specification language
 * with an event-calculus semantics, a statechart lifecycle for obligations, and a
 * Prolog compliance checker — no EVM anywhere — and in its own worked example the
 * passing of a deadline is an asserted fact: `happens(deliveryDuePassed, 10)`. A duty
 * whose moment arrives and is not discharged still produces nothing until someone
 * records that the moment arrived.
 *
 * So the real ground is narrower and harder: in any event-based formalism, NOTHING
 * HAPPENED IS NOT AN EVENT. Non-occurrence has no representation of its own; it has
 * to be reified as an observation, and an observation needs an observer. A better
 * runtime does not retire the keeper. The keeper is what a breach needs in order to
 * be seen at all.
 *
 * THE REGISTER'S MISSING CLASS. Its four classes sort DECISIONS — adjudicative,
 * epistemic, normative, constitutive — and give each a guard. The keeper makes no
 * decision in any of the four; they make a TIMING choice, and there was no row for
 * it, which is why the register could not see the one human its own §0.2 had named.
 * A fifth class was withheld because there was no guard to put in it. This is the
 * guard.
 */
contract Ostrom {
    address public governance;

    struct Office {
        string  duty;             // what must be done, in words, on the record
        address target;           // the contract it is a duty toward (informational)
        address holder;           // who holds it; address(0) = VACANT, which is itself a finding
        uint64  period;           // how often it must be discharged
        uint64  lastDischarged;   // when it last was
        uint64  missed;           // how many times it has been flagged overdue
        bool    exists;
    }

    Office[] public offices;

    event OfficeCreated(uint256 indexed id, string duty, address indexed target, uint64 period);
    event Appointed(uint256 indexed id, address indexed holder, string mandate);
    event Vacated(uint256 indexed id, address indexed formerHolder, string reason);
    event Discharged(uint256 indexed id, address indexed by, uint64 at);
    event Overdue(uint256 indexed id, address indexed holder, uint64 dueAt, uint64 observedAt, uint64 missedTotal);
    event PeriodChanged(uint256 indexed id, uint64 from, uint64 to, string reason);

    modifier onlyGovernance() { require(msg.sender == governance, "not governance"); _; }

    constructor() { governance = msg.sender; }

    function setGovernance(address to) external onlyGovernance { governance = to; }

    /// A duty must be stated in words. An office whose obligation nobody wrote down
    /// is the condition this contract exists to end, so it cannot be created here.
    function createOffice(string calldata duty, address target, uint64 period)
        external onlyGovernance returns (uint256 id)
    {
        require(bytes(duty).length > 0, "state the duty");
        require(period > 0, "a duty with no clock is not a duty");
        offices.push();
        Office storage o = offices[offices.length - 1];
        o.duty   = duty;
        o.target = target;
        o.period = period;
        o.lastDischarged = uint64(block.timestamp);
        o.exists = true;
        id = offices.length - 1;
        emit OfficeCreated(id, duty, target, period);
    }

    /// Appointment is governance's call and carries a mandate on the record — the
    /// same discipline `Friedman.propose` keeps. Naming someone silently would
    /// reproduce the anonymity this contract is here to remove.
    function appoint(uint256 id, address holder, string calldata mandate) external onlyGovernance {
        Office storage o = offices[id];
        require(o.exists, "no such office");
        require(holder != address(0), "use vacate");
        require(bytes(mandate).length > 0, "state the mandate");
        o.holder = holder;
        o.lastDischarged = uint64(block.timestamp);   // the clock starts on appointment
        emit Appointed(id, holder, mandate);
    }

    function vacate(uint256 id, string calldata reason) external onlyGovernance {
        Office storage o = offices[id];
        require(o.exists && o.holder != address(0), "not held");
        address former = o.holder;
        o.holder = address(0);
        emit Vacated(id, former, reason);
    }

    function setPeriod(uint256 id, uint64 period, string calldata reason) external onlyGovernance {
        Office storage o = offices[id];
        require(o.exists, "no such office");
        require(period > 0, "a duty with no clock is not a duty");
        require(bytes(reason).length > 0, "state a reason");
        emit PeriodChanged(id, o.period, period, reason);
        o.period = period;
    }

    // --- the two functions that matter ---

    /// The holder records having run the crank. This contract does not verify that
    /// they did — it cannot see into the target, and a claim to could would be the
    /// oracle problem wearing a different hat. What it establishes is that a named
    /// party asserted it, at a time, under their own address.
    function discharge(uint256 id) external {
        Office storage o = offices[id];
        require(o.exists, "no such office");
        require(msg.sender == o.holder, "not the holder");
        o.lastDischarged = uint64(block.timestamp);
        emit Discharged(id, msg.sender, o.lastDischarged);
    }

    /// ANYONE may mark an office overdue, and this is the contract's whole reason
    /// for being: it turns a non-event into an event. A missed clearing previously
    /// left no trace anywhere — the ledger simply did not move, and an absence is
    /// unreadable. Now it is a log line with a name in it.
    ///
    /// Note what this still does not fix: someone has to call THIS too. The regress
    /// does not close. It terminates in a named office instead of in nobody, which
    /// is the difference between an accountable gap and an invisible one.
    function flagOverdue(uint256 id) external returns (bool flagged) {
        Office storage o = offices[id];
        require(o.exists, "no such office");
        uint64 dueAt = o.lastDischarged + o.period;
        if (block.timestamp <= dueAt) return false;
        o.missed += 1;
        o.lastDischarged = uint64(block.timestamp);   // one flag per elapsed period, not per caller
        emit Overdue(id, o.holder, dueAt, uint64(block.timestamp), o.missed);
        return true;
    }

    // --- views: the state of the offices, which is the state of the duties ---

    function isOverdue(uint256 id) public view returns (bool) {
        Office storage o = offices[id];
        return o.exists && block.timestamp > o.lastDischarged + o.period;
    }

    /// A vacant office is not a neutral state. It means a duty exists that nobody
    /// bears, which is exactly the condition the canon was in before this contract.
    function isVacant(uint256 id) public view returns (bool) {
        Office storage o = offices[id];
        return o.exists && o.holder == address(0);
    }

    function missedCount(uint256 id) external view returns (uint64) { return offices[id].missed; }
    function officeCount() external view returns (uint256) { return offices.length; }

    /// The standing question this contract was built to answer: are there duties in
    /// this system that nobody is currently carrying?
    function vacancies() external view returns (uint256 n) {
        for (uint256 i = 0; i < offices.length; i++) if (offices[i].holder == address(0)) n++;
    }
}
