// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHayek  { function current() external view returns (uint256); }
interface ILedger { function payFrom(address from, address to, uint256 amount) external; }

/**
 * @title Fisher — indexed obligations
 *
 * Executes: Irving Fisher — index numbers + indexation; protect contracts from
 * the money illusion. An obligation is fixed in REAL terms (units of the Hayek
 * rod); the NOMINAL amount settled floats with the rod, so the payee's real
 * value stays constant even as the currency (Kocherlakota + Gesell) deliberately
 * melts.
 *
 * This is the unbundling, made watchable: UNSTABLE currency, STABLE contract.
 * Denominate in the shared rod (Hayek), settle across the rope (Kocherlakota).
 * The payer pre-approves Fisher as an operator on the ledger.
 */
contract Fisher {
    uint256 public constant BASE = 1e18;   // matches Hayek's genesis level

    IHayek  public immutable rod;
    ILedger public immutable ledger;

    struct Obligation { address payer; address payee; uint256 rodAmount; uint64 period; uint64 lastPaid; bool active; }
    Obligation[] public obligations;

    event Created(uint256 indexed id, address indexed payer, address indexed payee, uint256 rodAmount, uint64 period);
    event Settled(uint256 indexed id, uint256 rodAmount, uint256 nominalPaid, uint256 rodLevel);
    event Cancelled(uint256 indexed id);

    constructor(IHayek _rod, ILedger _ledger) { rod = _rod; ledger = _ledger; }

    function create(address payee, uint256 rodAmount, uint64 period) external returns (uint256 id) {
        require(rodAmount > 0 && period > 0, "bad terms");
        id = obligations.length;
        obligations.push(Obligation(msg.sender, payee, rodAmount, period, uint64(block.timestamp), true));
        emit Created(id, msg.sender, payee, rodAmount, period);
    }

    function cancel(uint256 id) external {
        Obligation storage o = obligations[id];
        require(msg.sender == o.payer, "not payer");
        o.active = false;
        emit Cancelled(id);
    }

    // nominal currency due now to preserve the real (rod) value
    function due(uint256 id) public view returns (uint256) {
        Obligation storage o = obligations[id];
        return (o.rodAmount * rod.current()) / BASE;   // real → nominal at the current rod level
    }

    // settle one period: move the rod-indexed nominal amount across the rope
    function settle(uint256 id) external {
        Obligation storage o = obligations[id];
        require(o.active, "inactive");
        require(block.timestamp >= o.lastPaid + o.period, "too soon");
        uint256 nominal = due(id);
        o.lastPaid = uint64(block.timestamp);
        ledger.payFrom(o.payer, o.payee, nominal);     // payer pre-approved Fisher as operator
        emit Settled(id, o.rodAmount, nominal, rod.current());
    }

    function obligationCount() external view returns (uint256) { return obligations.length; }
}
