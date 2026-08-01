// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 { function transferFrom(address from, address to, uint256 amount) external returns (bool); }

/**
 * @title Schumpeter — priced productive credit (formerly "ProductiveCredit")
 *
 * Executes a narrow slice of Joseph Schumpeter, "Theorie der wirtschaftlichen
 * Entwicklung" (1911): a lender allocates an EXISTING ERC-20 balance to a
 * proposed productive use. It does not yet create bank money. Pairs conceptually
 * with Kocherlakota, but the current demonstrator does not wire the two.
 *
 * Avoids the two errors we caught:
 *  - interest is RESTORED — it is the price of capital, the allocation signal
 *    (Hayek's knowledge problem; Aristotle was wrong that money is barren).
 *  - the borrower posts a rate ceiling and the first acceptable lender funds.
 *    A competitive bid window / lender auction is still required before the
 *    rate can honestly be called market-discovered.
 *
 *  PULL vs PUSH, SCORED   does it fund production (pull) or extract rent (push)?
 *                         The `attestor` scores it (the hard oracle); governance
 *                         sets the floor; push is gated, survivors flagged.
 *  EXTRACTION VISIBLE     rate, the principal/interest split, defaults — all events.
 *  DEFAULT IS VISIBLE     the lender has already transferred the principal;
 *                         default emits the loss. Recovery and restructuring
 *                         are not implemented.
 *  VALUE INCIDENTAL       settles in any IERC20 (a Kocherlakota-wrapper, a
 *                         stablecoin, whatever).
 *  HARD PART NAMED        the attestor is the trust point. Greif, legal teeth,
 *                         a bid process, and restructuring remain proposed
 *                         integrations, not current state transitions.
 */
contract Schumpeter {
    enum Status { Requested, Funded, Repaid, Defaulted }

    struct Loan {
        address borrower;
        address lender;
        uint256 principal;
        uint16  rateBps;     // over the term; lender-set, ≤ borrower ceiling
        uint16  maxRateBps;  // borrower's ceiling
        uint16  pullScore;   // 0..10000, attestor-set
        uint64  term;        // seconds
        uint64  start;       // funding time
        bytes32 purpose;     // hash of the stated productive purpose
        Status  status;
    }

    IERC20  public immutable value;  // settlement asset (Kocherlakota-wrapper / stablecoin / ...)
    address public governance;       // the Friedman/DialDAO governor
    address public attestor;         // sets pull-scores — the hard oracle
    uint16  public minPullScore;     // governed floor; gates out pure-push
    uint16  public maxRateBps;       // optional usury ceiling; 0 = none

    Loan[] public loans;

    event GovernanceChanged(address indexed to);
    event AttestorChanged(address indexed to);
    event PolicySet(uint16 minPullScore, uint16 maxRateBps);
    event Requested(uint256 indexed id, address indexed borrower, uint256 amount, uint16 maxRateBps, bytes32 purpose);
    event Attested(uint256 indexed id, uint16 pullScore);
    event Funded(uint256 indexed id, address indexed lender, uint16 rateBps, uint16 pullScore);
    event Repaid(uint256 indexed id, uint256 principal, uint256 interest);
    event Defaulted(uint256 indexed id, uint256 principalLost);

    modifier onlyGov() { require(msg.sender == governance, "not governance"); _; }
    modifier onlyAttestor() { require(msg.sender == attestor, "not attestor"); _; }

    constructor(IERC20 _value, address _attestor) {
        value = _value; governance = msg.sender; attestor = _attestor;
        emit GovernanceChanged(msg.sender); emit AttestorChanged(_attestor);
    }

    function setGovernance(address to) external onlyGov { governance = to; emit GovernanceChanged(to); }
    function setAttestor(address to) external onlyGov { attestor = to; emit AttestorChanged(to); }
    function setPolicy(uint16 _minPullScore, uint16 _maxRateBps) external onlyGov {
        minPullScore = _minPullScore; maxRateBps = _maxRateBps;   // 0 = no cap (the usury-law tradeoff, as a governed choice)
        emit PolicySet(_minPullScore, _maxRateBps);
    }

    function requestLoan(uint256 amount, uint64 termSeconds, uint16 borrowerMaxRateBps, bytes32 purpose)
        external returns (uint256 id)
    {
        require(amount > 0 && termSeconds > 0, "bad terms");
        id = loans.length;
        loans.push(Loan(msg.sender, address(0), amount, 0, borrowerMaxRateBps, 0, termSeconds, 0, purpose, Status.Requested));
        emit Requested(id, msg.sender, amount, borrowerMaxRateBps, purpose);
    }

    function attest(uint256 id, uint16 pullScore) external onlyAttestor {
        Loan storage l = loans[id];
        require(l.status == Status.Requested, "not open");
        require(pullScore <= 10000, "score range");
        l.pullScore = pullScore;
        emit Attested(id, pullScore);
    }

    function fund(uint256 id, uint16 rateBps) external {
        Loan storage l = loans[id];
        require(l.status == Status.Requested, "not fundable");
        require(l.pullScore >= minPullScore, "below pull floor");
        require(rateBps <= l.maxRateBps, "above borrower ceiling");
        require(maxRateBps == 0 || rateBps <= maxRateBps, "above cap");
        require(msg.sender != l.borrower, "self-loan");

        l.lender = msg.sender; l.rateBps = rateBps; l.start = uint64(block.timestamp); l.status = Status.Funded;
        require(value.transferFrom(msg.sender, l.borrower, l.principal), "disburse failed"); // lender pre-approves
        emit Funded(id, msg.sender, rateBps, l.pullScore);
    }

    function repay(uint256 id) external {
        Loan storage l = loans[id];
        require(l.status == Status.Funded, "not active");
        require(msg.sender == l.borrower, "not borrower");
        uint256 interest = _interestDue(l);
        l.status = Status.Repaid;
        require(value.transferFrom(msg.sender, l.lender, l.principal + interest), "repay failed"); // borrower pre-approves
        emit Repaid(id, l.principal, interest);   // the take, split out — naked
    }

    function markDefault(uint256 id) external {
        Loan storage l = loans[id];
        require(l.status == Status.Funded, "not active");
        require(block.timestamp > l.start + l.term, "not yet due");
        l.status = Status.Defaulted;              // no transfer: the principal is already gone
        emit Defaulted(id, l.principal);          // hook: ding borrower in Greif (reputation)
    }

    function _interestDue(Loan storage l) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - l.start;
        if (elapsed > l.term) elapsed = l.term;
        return (l.principal * l.rateBps * elapsed) / (10000 * l.term);   // pro-rata; early repay pays less
    }

    function loanCount() external view returns (uint256) { return loans.length; }
}
