// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputationMemory — V1 identity and reputation memory (advisory)
 *
 * Executes: Avner ReputationMemory — reputation institutions that let strangers trade
 * (the Maghribi coalition). That reading of the Geniza documents is contested:
 * Edwards and Ogilvie (Economic History Review, 2012) argue the Maghribis used the
 * legal system alongside reputation, and ReputationMemory's reply in the same volume rejects
 * their claims. The debate is live, and this contract executes one side of it.
 * This demonstrator stores one global attributed
 * score. Authorized reporters adjust reputation; another system may use
 * `inGoodStanding` as an exclusion gate. The current ProductiveCredit contract does
 * not report defaults here. Governance can be transferred to GovernedDials; this is
 * done for ReputationMemory in CoreE2E but is not enforced by ReputationMemory itself.
 *
 * REPUTATION HERE IS ADVISORY, AND THAT IS A RULING (2026-08, stock-and-flow audit).
 * `inGoodStanding` is a view and nothing in the cast consumes it. The obvious repair —
 * read it inside `SignedPositionLedger._limitOf`, so a default automatically shrinks the
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
 * WHAT WOULD HAVE TO EXIST FIRST, if a contextual gate is ever wired: a typed
 * claim → challenge → finding lifecycle with a stated reason and evidence
 * (`ChallengeBond` is only one possible contest topology), a floor the gate cannot
 * cut capacity below, and a route back up.
 * Without a terminus the reinforcing arm in (3) has no bottom, and a reputation system
 * with no bottom is a debt trap with a clean interface. Until then: advisory, said
 * plainly, and callers who choose to read `inGoodStanding` do so as a named decision.
 *
 * ⚠ Two residuals, deliberately out of scope here (flagged, not solved):
 *   - PRIVACY: a public reputation registry is a panopticon. A real version
 *     uses ZK selective disclosure — prove "standing ≥ X" without revealing who
 *     you are or your history.
 *   - SYBIL-RESISTANCE: persistent reputation needs defensible identities; decentralized
 *     proof-of-personhood is the open problem. Genesis registration is a
 *     stand-in for the demonstrator.
 */
contract ReputationMemory {
    address public governance;
    mapping(address => bool) public registered;
    mapping(address => int256) public reputation;
    mapping(address => bool) public isReporter;

    // Contextual memory is an isolated V1 amendment. It neither reads nor
    // mutates the legacy global score path above.
    uint64 public constant MAX_CONTEXT_LIFETIME = 365 days;

    enum ContextOutcome {
        None,
        Performed,
        Breached
    }
    enum FindingStatus {
        None,
        Recorded,
        Challenged,
        RepairProposed,
        Repaired,
        Expired
    }
    enum UseDecision {
        None,
        Ignore,
        Consider
    }

    struct ContextReporterAuthority {
        uint64 validUntil;
        bool revoked;
    }

    struct ContextualFinding {
        address subject;
        address reporter;
        bytes32 domain;
        bytes32 purpose;
        bytes32 evidenceRef;
        ContextOutcome outcome;
        uint64 recordedAt;
        uint64 validUntil;
        FindingStatus status;
        bytes32 challengeRef;
        bytes32 repairRef;
    }

    struct FindingUseDecision {
        uint256 findingId;
        address consumer;
        UseDecision decision;
        bytes32 rationaleRef;
        uint64 decidedAt;
    }

    mapping(bytes32 => ContextReporterAuthority) private _contextReporterAuthorities;
    ContextualFinding[] private _contextualFindings;
    FindingUseDecision[] private _findingUseDecisions;

    event GovernanceChanged(address indexed to);
    event Registered(address indexed who);
    event Deregistered(address indexed who);
    event ReporterSet(address indexed who, bool ok);
    event Reported(address indexed who, int256 delta, int256 total);
    event ContextReporterAuthorized(
        bytes32 indexed authorityKey,
        address indexed subject,
        address indexed reporter,
        bytes32 domain,
        bytes32 purpose,
        uint64 validUntil
    );
    event ContextReporterRevoked(bytes32 indexed authorityKey, address indexed subject, address indexed reporter);
    event ContextualFindingRecorded(
        uint256 indexed findingId,
        address indexed subject,
        address indexed reporter,
        bytes32 domain,
        bytes32 purpose,
        bytes32 evidenceRef,
        ContextOutcome outcome,
        uint64 validUntil
    );
    event ContextualFindingChallenged(uint256 indexed findingId, address indexed subject, bytes32 challengeRef);
    event ContextualRepairProposed(uint256 indexed findingId, address indexed subject, bytes32 repairRef);
    event ContextualRepairAcknowledged(uint256 indexed findingId, address indexed reporter, bytes32 repairRef);
    event FindingUseRecorded(
        uint256 indexed decisionId,
        uint256 indexed findingId,
        address indexed consumer,
        UseDecision decision,
        bytes32 rationaleRef
    );

    modifier onlyGov() {
        require(msg.sender == governance, "not gov");
        _;
    }

    constructor() {
        governance = msg.sender;
        emit GovernanceChanged(msg.sender);
    }

    function setGovernance(address to) external onlyGov {
        governance = to;
        emit GovernanceChanged(to);
    }

    function register(address who) external onlyGov {
        if (!registered[who]) {
            registered[who] = true;
            emit Registered(who);
        }
    }

    function deregister(address who) external onlyGov {
        registered[who] = false;
        emit Deregistered(who);
    }

    function setReporter(address who, bool ok) external onlyGov {
        isReporter[who] = ok;
        emit ReporterSet(who, ok);
    }

    // V1 memory primitive: an authorized reporter adjusts a global score without evidence or appeal
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

    // --- Contextual, expiring and advisory memory ---

    function contextReporterKey(address subject, address reporter, bytes32 domain, bytes32 purpose)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(subject, reporter, domain, purpose));
    }

    function authorizeContextReporter(address reporter, bytes32 domain, bytes32 purpose, uint64 validUntil) external {
        require(reporter != address(0) && reporter != msg.sender, "bad reporter");
        require(domain != bytes32(0) && purpose != bytes32(0), "empty scope");
        require(validUntil > block.timestamp, "expired authority");
        require(validUntil <= block.timestamp + MAX_CONTEXT_LIFETIME, "authority too long");

        bytes32 key = contextReporterKey(msg.sender, reporter, domain, purpose);
        _contextReporterAuthorities[key] = ContextReporterAuthority({validUntil: validUntil, revoked: false});
        emit ContextReporterAuthorized(key, msg.sender, reporter, domain, purpose, validUntil);
    }

    function revokeContextReporter(address reporter, bytes32 domain, bytes32 purpose) external {
        bytes32 key = contextReporterKey(msg.sender, reporter, domain, purpose);
        ContextReporterAuthority storage authority = _contextReporterAuthorities[key];
        require(authority.validUntil != 0 && !authority.revoked, "no active authority");
        authority.revoked = true;
        emit ContextReporterRevoked(key, msg.sender, reporter);
    }

    function contextReporterAuthority(address subject, address reporter, bytes32 domain, bytes32 purpose)
        external
        view
        returns (uint64 validUntil, bool revoked, bool active)
    {
        ContextReporterAuthority storage authority =
            _contextReporterAuthorities[contextReporterKey(subject, reporter, domain, purpose)];
        return (authority.validUntil, authority.revoked, authority.validUntil > block.timestamp && !authority.revoked);
    }

    function recordContextualFinding(
        address subject,
        bytes32 domain,
        bytes32 purpose,
        bytes32 evidenceRef,
        ContextOutcome outcome,
        uint64 validUntil
    ) external returns (uint256 findingId) {
        require(subject != address(0) && subject != msg.sender, "bad subject");
        require(domain != bytes32(0) && purpose != bytes32(0), "empty scope");
        require(evidenceRef != bytes32(0), "empty evidence");
        require(outcome == ContextOutcome.Performed || outcome == ContextOutcome.Breached, "bad outcome");

        ContextReporterAuthority storage authority =
            _contextReporterAuthorities[contextReporterKey(subject, msg.sender, domain, purpose)];
        require(!authority.revoked && authority.validUntil > block.timestamp, "not context reporter");
        require(validUntil > block.timestamp, "expired finding");
        require(validUntil <= authority.validUntil, "beyond authority");
        require(validUntil <= block.timestamp + MAX_CONTEXT_LIFETIME, "finding too long");

        findingId = _contextualFindings.length;
        _contextualFindings.push(
            ContextualFinding({
                subject: subject,
                reporter: msg.sender,
                domain: domain,
                purpose: purpose,
                evidenceRef: evidenceRef,
                outcome: outcome,
                recordedAt: uint64(block.timestamp),
                validUntil: validUntil,
                status: FindingStatus.Recorded,
                challengeRef: bytes32(0),
                repairRef: bytes32(0)
            })
        );
        emit ContextualFindingRecorded(
            findingId, subject, msg.sender, domain, purpose, evidenceRef, outcome, validUntil
        );
    }

    function challengeContextualFinding(uint256 findingId, bytes32 challengeRef) external {
        ContextualFinding storage finding = _finding(findingId);
        require(msg.sender == finding.subject, "not subject");
        require(challengeRef != bytes32(0), "empty challenge");
        require(_effectiveStatus(finding) == FindingStatus.Recorded, "not challengeable");
        finding.status = FindingStatus.Challenged;
        finding.challengeRef = challengeRef;
        emit ContextualFindingChallenged(findingId, msg.sender, challengeRef);
    }

    function proposeContextualRepair(uint256 findingId, bytes32 repairRef) external {
        ContextualFinding storage finding = _finding(findingId);
        require(msg.sender == finding.subject, "not subject");
        require(repairRef != bytes32(0), "empty repair");
        require(finding.outcome == ContextOutcome.Breached, "not adverse");
        FindingStatus status = _effectiveStatus(finding);
        require(status == FindingStatus.Recorded || status == FindingStatus.Challenged, "not repairable");
        finding.status = FindingStatus.RepairProposed;
        finding.repairRef = repairRef;
        emit ContextualRepairProposed(findingId, msg.sender, repairRef);
    }

    function acknowledgeContextualRepair(uint256 findingId) external {
        ContextualFinding storage finding = _finding(findingId);
        require(msg.sender == finding.reporter, "not reporter");
        require(_effectiveStatus(finding) == FindingStatus.RepairProposed, "no repair proposed");
        finding.status = FindingStatus.Repaired;
        emit ContextualRepairAcknowledged(findingId, msg.sender, finding.repairRef);
    }

    function recordFindingUse(
        uint256 findingId,
        bytes32 expectedDomain,
        bytes32 expectedPurpose,
        UseDecision decision,
        bytes32 rationaleRef
    ) external returns (uint256 decisionId) {
        ContextualFinding storage finding = _finding(findingId);
        require(expectedDomain == finding.domain && expectedPurpose == finding.purpose, "scope mismatch");
        require(decision == UseDecision.Ignore || decision == UseDecision.Consider, "bad decision");
        require(rationaleRef != bytes32(0), "empty rationale");
        if (decision == UseDecision.Consider) {
            require(_effectiveStatus(finding) == FindingStatus.Recorded, "finding unavailable");
        }

        decisionId = _findingUseDecisions.length;
        _findingUseDecisions.push(
            FindingUseDecision({
                findingId: findingId,
                consumer: msg.sender,
                decision: decision,
                rationaleRef: rationaleRef,
                decidedAt: uint64(block.timestamp)
            })
        );
        emit FindingUseRecorded(decisionId, findingId, msg.sender, decision, rationaleRef);
    }

    function contextualFindingCount() external view returns (uint256) {
        return _contextualFindings.length;
    }

    function findingUseDecisionCount() external view returns (uint256) {
        return _findingUseDecisions.length;
    }

    function contextualFinding(uint256 findingId) external view returns (ContextualFinding memory finding) {
        finding = _finding(findingId);
    }

    function findingUseDecision(uint256 decisionId) external view returns (FindingUseDecision memory) {
        require(decisionId < _findingUseDecisions.length, "unknown decision");
        return _findingUseDecisions[decisionId];
    }

    function contextualFindingStatus(uint256 findingId) external view returns (FindingStatus) {
        return _effectiveStatus(_finding(findingId));
    }

    function _finding(uint256 findingId) internal view returns (ContextualFinding storage finding) {
        require(findingId < _contextualFindings.length, "unknown finding");
        return _contextualFindings[findingId];
    }

    function _effectiveStatus(ContextualFinding storage finding) internal view returns (FindingStatus) {
        if (
            finding.status != FindingStatus.Repaired && finding.status != FindingStatus.None
                && block.timestamp >= finding.validUntil
        ) {
            return FindingStatus.Expired;
        }
        return finding.status;
    }
}
