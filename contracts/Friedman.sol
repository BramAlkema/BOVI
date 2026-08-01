// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Friedman — governance of the dials (the DialDAO)
 *
 * Executes: Milton Friedman — rules over discretion. Calls relayed by this
 * contract pass through public, yes-voted, time-locked proposals. An attached
 * target is protected only after its own authority is transferred here.
 * One member, one vote is not stake-weighted. The timelock is a notice window;
 * whether a minority can actually leave or fork is outside this contract.
 *
 * This becomes the `steward`/`governance` of the other contracts (point theirs
 * at this address). Smallest possible surface: it can only relay a call the
 * members have already voted for. Capture it and you capture the system — so it
 * is deliberately thin and slow.
 */
contract Friedman {
    mapping(address => bool) public isMember;
    uint256 public memberCount;
    uint64  public timelock;     // delay between reaching quorum and execution
    uint256 public quorum;       // yes-votes required (headcount)

    struct Proposal { address target; bytes data; uint64 eta; uint256 yes; bool executed; }
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;

    event MemberAdded(address indexed m);
    event MemberRemoved(address indexed m);
    event Proposed(uint256 indexed id, address indexed target);
    event Voted(uint256 indexed id, address indexed m);
    event Queued(uint256 indexed id, uint64 eta);
    event Executed(uint256 indexed id, bool ok);

    modifier onlyMember() { require(isMember[msg.sender], "not member"); _; }
    modifier onlySelf()   { require(msg.sender == address(this), "only via proposal"); _; }

    constructor(address[] memory members, uint64 _timelock, uint256 _quorum) {
        for (uint256 i = 0; i < members.length; i++) {
            if (!isMember[members[i]]) { isMember[members[i]] = true; memberCount++; emit MemberAdded(members[i]); }
        }
        timelock = _timelock; quorum = _quorum;
    }

    // membership & parameters change only through the proposal process (self-call)
    function addMember(address m) external onlySelf { if (!isMember[m]) { isMember[m] = true; memberCount++; emit MemberAdded(m); } }
    function removeMember(address m) external onlySelf { if (isMember[m]) { isMember[m] = false; memberCount--; emit MemberRemoved(m); } }
    function setParams(uint64 _timelock, uint256 _quorum) external onlySelf { timelock = _timelock; quorum = _quorum; }

    function propose(address target, bytes calldata data) external onlyMember returns (uint256 id) {
        id = proposals.length;
        proposals.push(Proposal(target, data, 0, 0, false));
        emit Proposed(id, target);
    }

    function vote(uint256 id) external onlyMember {
        Proposal storage p = proposals[id];
        require(!p.executed && p.eta == 0, "closed");
        require(!voted[id][msg.sender], "voted");
        voted[id][msg.sender] = true;
        p.yes++;
        emit Voted(id, msg.sender);
        if (p.yes >= quorum) { p.eta = uint64(block.timestamp) + timelock; emit Queued(id, p.eta); }
    }

    function execute(uint256 id) external {
        Proposal storage p = proposals[id];
        require(p.eta != 0 && !p.executed, "not queued");
        require(block.timestamp >= p.eta, "timelock");   // the exit window must elapse
        p.executed = true;
        (bool ok, ) = p.target.call(p.data);             // relays the voted governance call
        emit Executed(id, ok);
        require(ok, "call failed");
    }

    function proposalCount() external view returns (uint256) { return proposals.length; }
}
