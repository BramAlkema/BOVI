// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Greif — identity & reputation (the teeth)
 *
 * Executes: Avner Greif — reputation institutions that let strangers trade
 * (the Maghribi coalition). This is the enforcement Kocherlakota's theorem
 * needs: a record's power over a token is that it can reward and punish
 * individually. Authorized reporters adjust reputation; another system may use
 * `inGoodStanding` as an exclusion gate. The current Schumpeter contract does
 * not report defaults here. Governance can be transferred to Friedman; this is
 * done for Greif in CoreE2E but is not enforced by Greif itself.
 *
 * REPUTATION HERE IS ADVISORY, AND THAT IS A RULING (2026-08, stock-and-flow audit).
 * `inGoodStanding` is a view and nothing in the cast consumes it. The obvious repair —
 * read it inside `Kocherlakota._limitOf`, so a default automatically shrinks the
 * defaulter's credit — is refused, for three reasons that are worth more than the wire.
 *
 *   1. `report` below adjusts standing WITHOUT EVIDENCE OR APPEAL. That is stated in
 *      its own comment, and it is honest about what a reputation primitive is. Wire it
 *      to a credit limit and an authorised reporter acquires an unappealable lever over
 *      another member's capacity to trade.
 *
 *   2. It would fuse two classes of judgement with different correct guards. In the
 *      judgement register's table, "what counts as a default" is ADJUDICATIVE — guarded
 *      by arbitration and an appeals path. "Credit limits per member" is NORMATIVE —
 *      guarded by the affected members, voting, and the register calls it the most
 *      consequential distributional call in the system. An automatic wire supplies
 *      neither guard. It is not the wrong guard. It is the absence of one.
 *
 *   3. THE SIGN FLIPS DEPENDING ON WHO IS READING. As a loop it looks balancing:
 *      default → standing falls → exposure reduced → fewer defaults. That is the
 *      ledger's view of itself. From the member's side the same arrows read
 *      reinforcing: default → standing falls → limit falls → less room to trade out of
 *      the hole → default. One loop, balancing in the system's exposure and reinforcing
 *      in the member's capacity, and which one you call it is a choice of vantage — the
 *      aggregate vantage this framework exists to distrust.
 *
 * WHAT WOULD HAVE TO EXIST FIRST, if the gate is ever wired: reports routed through
 * `ChallengeBond` with a stated reason and a dispute window (the register already
 * prescribes this), a floor the gate cannot cut capacity below, and a route back up.
 * Without a terminus the reinforcing arm in (3) has no bottom, and a reputation system
 * with no bottom is a debt trap with a clean interface. Until then: advisory, said
 * plainly, and callers who choose to read `inGoodStanding` do so as a named decision.
 *
 * ⚠ Two residuals, deliberately out of scope here (flagged, not solved):
 *   - PRIVACY: a public reputation registry is a panopticon. A real version
 *     uses ZK selective disclosure — prove "standing ≥ X" without revealing who
 *     you are or your history.
 *   - SYBIL-RESISTANCE: teeth need real identities; decentralized
 *     proof-of-personhood is the open problem. Genesis registration is a
 *     stand-in for the demonstrator.
 */
contract Greif {
    address public governance;
    mapping(address => bool)   public registered;
    mapping(address => int256) public reputation;
    mapping(address => bool)   public isReporter;

    event GovernanceChanged(address indexed to);
    event Registered(address indexed who);
    event Deregistered(address indexed who);
    event ReporterSet(address indexed who, bool ok);
    event Reported(address indexed who, int256 delta, int256 total);

    modifier onlyGov() { require(msg.sender == governance, "not gov"); _; }

    constructor() { governance = msg.sender; emit GovernanceChanged(msg.sender); }

    function setGovernance(address to) external onlyGov { governance = to; emit GovernanceChanged(to); }
    function register(address who) external onlyGov { if (!registered[who]) { registered[who] = true; emit Registered(who); } }
    function deregister(address who) external onlyGov { registered[who] = false; emit Deregistered(who); }
    function setReporter(address who, bool ok) external onlyGov { isReporter[who] = ok; emit ReporterSet(who, ok); }

    // the teeth primitive: an authorized reporter adjusts standing without evidence or appeal
    function report(address who, int256 delta) external {
        require(isReporter[msg.sender], "not reporter");
        require(registered[who], "unknown");
        reputation[who] += delta;
        emit Reported(who, delta, reputation[who]);
    }

    /// ADVISORY. Nothing in the cast consumes this, by ruling — see the header.
    /// A caller that gates on it is making that call itself, and owns the consequence.
    function inGoodStanding(address who, int256 min) external view returns (bool) {
        return registered[who] && reputation[who] >= min;
    }
}
