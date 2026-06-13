// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChallengeBond — optimistic assertion with a bond (the enforcement teeth)
 *
 * Pattern: UMA's optimistic oracle. An asserter posts a value with a bond.
 * During a liveness window anyone may dispute by matching the bond. Undisputed
 * → the value is truthful and the bond returns. Disputed → an arbiter resolves
 * and the loser's bond is slashed to the winner.
 *
 * This is the horizontal that turns "detectable" into "punished" — the teeth
 * Kocherlakota's theorem needs, and that Hayek / Schumpeter / Greif depend on.
 * Truth is cheap to assert; a lie is expensive to maintain.
 *
 * (Demonstrator: `arbiter` is a single resolver — point it at Friedman. A
 *  production version replaces it with a decentralised vote / DVM.)
 */
contract ChallengeBond {
    enum State { None, Asserted, Disputed, Truthful, Refuted }

    struct Assertion {
        address asserter;
        address disputer;
        bytes32 topic;
        uint256 value;
        uint64  assertedAt;
        State   state;
    }

    address public arbiter;     // resolves disputes (→ Friedman; ideally a DVM)
    uint256 public bond;        // required bond, in wei
    uint64  public liveness;    // dispute window

    Assertion[] public assertions;

    event Made(uint256 indexed id, address indexed asserter, bytes32 indexed topic, uint256 value);
    event Disputed(uint256 indexed id, address indexed disputer);
    event Settled(uint256 indexed id, bool truthful);

    constructor(address _arbiter, uint256 _bond, uint64 _liveness) {
        arbiter = _arbiter; bond = _bond; liveness = _liveness;
    }

    // assert a value (cannot be named `assert` — reserved)
    function assert_(bytes32 topic, uint256 value) external payable returns (uint256 id) {
        require(msg.value == bond, "bond");
        id = assertions.length;
        assertions.push(Assertion(msg.sender, address(0), topic, value, uint64(block.timestamp), State.Asserted));
        emit Made(id, msg.sender, topic, value);
    }

    function dispute(uint256 id) external payable {
        Assertion storage a = assertions[id];
        require(a.state == State.Asserted, "not open");
        require(block.timestamp < a.assertedAt + liveness, "window closed");
        require(msg.sender != a.asserter, "self");
        require(msg.value == bond, "bond");
        a.disputer = msg.sender;
        a.state = State.Disputed;
        emit Disputed(id, msg.sender);
    }

    // undisputed after the window → truthful; the asserter's bond returns
    function settle(uint256 id) external {
        Assertion storage a = assertions[id];
        require(a.state == State.Asserted, "not settleable");
        require(block.timestamp >= a.assertedAt + liveness, "too soon");
        a.state = State.Truthful;
        _pay(a.asserter, bond);
        emit Settled(id, true);
    }

    // disputed → arbiter resolves; the loser's bond is slashed to the winner
    function resolve(uint256 id, bool asserterWins) external {
        require(msg.sender == arbiter, "not arbiter");
        Assertion storage a = assertions[id];
        require(a.state == State.Disputed, "not disputed");
        if (asserterWins) { a.state = State.Truthful; _pay(a.asserter, bond * 2); }
        else              { a.state = State.Refuted;  _pay(a.disputer, bond * 2); }
        emit Settled(id, asserterWins);
    }

    function result(uint256 id) external view returns (bool truthful, address asserter, bytes32 topic, uint256 value) {
        Assertion storage a = assertions[id];
        return (a.state == State.Truthful, a.asserter, a.topic, a.value);
    }

    function _pay(address to, uint256 amt) internal {
        (bool ok, ) = payable(to).call{value: amt}("");
        require(ok, "pay failed");
    }
}
