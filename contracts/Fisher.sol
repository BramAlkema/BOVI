// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHayek  { function current() external view returns (uint256); }
interface ILedger { function payFrom(address from, address to, uint256 amount) external; }

/**
 * @title Fisher — indexed obligations
 *
 * Executes: Irving Fisher — index numbers + indexation; protect contracts from
 * the money illusion. An obligation is fixed in ROD terms (units of the Hayek
 * index); the NOMINAL amount settled floats with that reported rod. This keeps
 * the contractual number stable relative to the selected index. It does not
 * prove the payee's lived purchasing power stays constant.
 *
 * This is the unbundling, made watchable: UNSTABLE currency, STABLE contract.
 * Denominate in the shared rod (Hayek), settle across the rope (Kocherlakota).
 * The payer pre-approves Fisher as an operator on the ledger.
 *
 * NOT EVENTED, deliberately (judgement register §0.1): a missed period emits
 * nothing on its own, because nothing happens — no transaction, no log. That is
 * §0.2 in miniature: this contract cannot settle itself, so silence and
 * non-existence look identical on chain. `periodsMissed` and `reportOverdue`
 * exist to make the silence readable and recordable; neither can compel payment.
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
    event Overdue(uint256 indexed id, address indexed payer, address indexed payee, uint256 periodsMissed, uint64 since);

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

    /// How many whole periods have elapsed without settlement. Nothing here settles
    /// itself (judgement register §0.2) — an obligation that quietly stops being
    /// paid is otherwise indistinguishable from one that was never created.
    function periodsMissed(uint256 id) public view returns (uint256) {
        Obligation storage o = obligations[id];
        if (!o.active || block.timestamp < o.lastPaid + o.period) return 0;
        return (block.timestamp - o.lastPaid) / o.period;
    }

    /// Turn a non-payment into a positive fact. Anyone may call; it changes no
    /// balances and cannot force settlement — it only puts the silence on the record.
    function reportOverdue(uint256 id) external returns (uint256 missed) {
        Obligation storage o = obligations[id];
        require(o.active, "inactive");
        missed = periodsMissed(id);
        require(missed > 0, "not overdue");
        emit Overdue(id, o.payer, o.payee, missed, o.lastPaid);
    }

    function obligationCount() external view returns (uint256) { return obligations.length; }
}
