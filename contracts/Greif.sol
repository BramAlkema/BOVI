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

    function inGoodStanding(address who, int256 min) external view returns (bool) {
        return registered[who] && reputation[who] >= min;
    }
}
