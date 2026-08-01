// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Krugman — the countercyclical stabiliser (the steering wheel)
 *
 * Fills the gap Krugman himself found: the cascade was plumbing, not policy —
 * "who steadies demand when the whole thing has a bad year?" This is that layer.
 *
 * The babysitting co-op, in code: when activity falls below trend (everyone
 * hoarding, velocity collapsing — a spot demand shortfall), EXPAND the elastic
 * supply; when it overheats, tighten. The rails (Kocherlakota credit limits,
 * Bagehot liquidity) read `elasticityFactorBps()` and scale their elasticity by it.
 *
 * Built the framework's way, which gently inverts Krugman's instinct:
 * countercyclical management BY RULE, not by a discretionary central banker
 * (Friedman sets the rule; no one steers by hand). That is the
 * market-monetarist / NGDP-rule synthesis — Krugman's goal, Friedman's method.
 *
 *  CANON GUARDS:
 *   - adjusts QUANTITY (elasticity), never PEGS the unit. The currency still
 *     floats and melts; we steady ACTIVITY, not the currency's value.
 *   - expansion may have Cantillon effects. Rule changes and reports are evented;
 *     downstream recipients and incidence still require a separate tracer.
 *
 *  ⚠ The hardest, most fragile layer, and a demonstrator of the missing steering
 *    wheel — NOT a claim to drive. The activity reading is an ORACLE problem
 *    (gameable — this is *why* stabilisation is hard), and any rule can misfire.
 */
contract Krugman {
    address public governance;     // Friedman — sets the rule's parameters
    address public oracle;         // reports measured activity (the hard input)

    uint256 public target;         // trend activity (NGDP-ish), set by governance
    uint256 public responsiveness; // k, in bps: how hard to lean per unit of gap
    uint256 public reading;        // latest measured activity
    uint64  public readAt;

    event GovernanceChanged(address indexed to);
    event OracleChanged(address indexed to);
    event RuleSet(uint256 target, uint256 responsiveness);
    event Reading(uint256 activity, uint64 at);

    modifier onlyGov() { require(msg.sender == governance, "not gov"); _; }

    constructor(address _oracle, uint256 _target, uint256 _responsiveness) {
        governance = msg.sender; oracle = _oracle; target = _target; responsiveness = _responsiveness;
        emit GovernanceChanged(msg.sender); emit OracleChanged(_oracle); emit RuleSet(_target, _responsiveness);
    }

    function setGovernance(address to) external onlyGov { governance = to; emit GovernanceChanged(to); }
    function setOracle(address to) external onlyGov { oracle = to; emit OracleChanged(to); }
    function setRule(uint256 _target, uint256 _responsiveness) external onlyGov {
        target = _target; responsiveness = _responsiveness; emit RuleSet(_target, _responsiveness);
    }

    function report(uint256 activity) external {
        require(msg.sender == oracle, "not oracle");
        reading = activity; readAt = uint64(block.timestamp);
        emit Reading(activity, readAt);
    }

    // the rule: stance > 0 → EXPAND (demand shortfall); < 0 → tighten.
    // stance(bps) = responsiveness * (target - activity) / target
    function stance() public view returns (int256) {
        if (target == 0) return 0;
        int256 gap = int256(target) - int256(reading);          // shortfall is positive
        return (gap * int256(responsiveness)) / int256(target); // lean proportional to the gap
    }

    // for the rails: a multiplier on a base credit limit (bps over 10000), clamped ≥ 0
    // e.g. effectiveLimit = baseLimit * elasticityFactorBps() / 10000
    function elasticityFactorBps() external view returns (uint256) {
        int256 f = int256(10000) + stance();
        return f < 0 ? 0 : uint256(f);
    }
}
