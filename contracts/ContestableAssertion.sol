// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ContestableAssertion — bounded private adjudication and appeal
 * @notice A bounded V1 claim-contest and escrow-allocation mechanism.
 * @dev Named for Steven ContestableAssertion's economic analysis of litigation, private
 * adjudication and appeal. Outcomes remain attributed records. Unchallenged is
 * not upheld, findings are not world truth, and consumption calls no target.
 */
contract ContestableAssertion {
    uint64 public constant MAX_CONTEST_DURATION = 30 days;

    error WrongState();
    error WrongActor();
    error Closed();
    error TooSoon();
    error BadInput();
    error DepositMismatch();
    error DuplicateClaim();
    error ScopeMismatch();
    error OutcomeUnavailable();
    error AlreadyConsumed();
    error DeadlineOverflow();
    error Reentrant();
    error NoCredit();
    error WithdrawalFailed();
    error UnknownContest();

    enum Status {
        None,
        Open,
        Challenged,
        PrimaryFound,
        Appealed,
        Unchallenged,
        Final,
        Inconclusive
    }

    enum Finding {
        None,
        Upheld,
        Rejected
    }

    enum Outcome {
        None,
        Unchallenged,
        Upheld,
        Rejected,
        Inconclusive
    }

    struct Terms {
        address challenger;
        address primaryResolver;
        address fallbackResolver;
        address consumer;
        bytes32 domain;
        bytes32 purpose;
        bytes32 claimRef;
        bytes32 provenanceRef;
        uint128 stake;
        uint128 primaryFee;
        uint128 fallbackFee;
        uint64 challengeDuration;
        uint64 primaryDuration;
        uint64 appealDuration;
        uint64 fallbackDuration;
    }

    struct Contest {
        address claimant;
        address challenger;
        address primaryResolver;
        address fallbackResolver;
        address consumer;
        bytes32 domain;
        bytes32 purpose;
        bytes32 claimRef;
        bytes32 provenanceRef;
        bytes32 challengeRef;
        bytes32 primaryFindingRef;
        bytes32 appealRef;
        bytes32 finalFindingRef;
        uint128 stake;
        uint128 primaryFee;
        uint128 fallbackFee;
        uint64 challengeUntil;
        uint64 primaryResolveUntil;
        uint64 appealUntil;
        uint64 fallbackResolveUntil;
        uint64 primaryDuration;
        uint64 appealDuration;
        uint64 fallbackDuration;
        Status status;
        Finding primaryFinding;
        Outcome outcome;
        bool consumed;
    }

    Contest[] private _contests;
    mapping(bytes32 => bool) public contestKeyUsed;
    mapping(address => uint256) public credits;
    bool private _withdrawing;

    event ContestCreated(
        uint256 indexed contestId,
        bytes32 indexed contestKey,
        address indexed claimant,
        address challenger,
        address consumer,
        bytes32 domain,
        bytes32 purpose,
        bytes32 claimRef,
        uint64 challengeUntil
    );
    event ContestChallenged(uint256 indexed contestId, address indexed challenger, bytes32 challengeRef);
    event PrimaryFindingRecorded(
        uint256 indexed contestId, address indexed resolver, Finding finding, bytes32 findingRef, uint64 appealUntil
    );
    event ContestAppealed(uint256 indexed contestId, address indexed appellant, bytes32 appealRef);
    event FinalFindingRecorded(
        uint256 indexed contestId, address indexed resolver, Outcome outcome, bytes32 findingRef
    );
    event ContestFinalized(uint256 indexed contestId, Outcome outcome);
    event ContestOutcomeConsumed(
        uint256 indexed contestId, address indexed consumer, Outcome outcome, bytes32 domain, bytes32 purpose
    );
    event CreditWithdrawn(address indexed account, uint256 amount);

    function contestCount() external view returns (uint256) {
        return _contests.length;
    }

    function contest(uint256 contestId) external view returns (Contest memory) {
        return _contest(contestId);
    }

    function contestKey(address claimant, address consumer, bytes32 domain, bytes32 purpose, bytes32 claimRef)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(claimant, consumer, domain, purpose, claimRef));
    }

    function createContest(Terms calldata terms) external payable returns (uint256 contestId) {
        _validateTerms(terms);
        uint256 requiredDeposit = _participantDeposit(terms.stake, terms.primaryFee, terms.fallbackFee);
        if (msg.value != requiredDeposit) revert DepositMismatch();

        bytes32 key = contestKey(msg.sender, terms.consumer, terms.domain, terms.purpose, terms.claimRef);
        if (contestKeyUsed[key]) revert DuplicateClaim();
        contestKeyUsed[key] = true;

        uint64 challengeUntil = _deadline(terms.challengeDuration);
        contestId = _contests.length;
        _contests.push(
            Contest({
                claimant: msg.sender,
                challenger: terms.challenger,
                primaryResolver: terms.primaryResolver,
                fallbackResolver: terms.fallbackResolver,
                consumer: terms.consumer,
                domain: terms.domain,
                purpose: terms.purpose,
                claimRef: terms.claimRef,
                provenanceRef: terms.provenanceRef,
                challengeRef: bytes32(0),
                primaryFindingRef: bytes32(0),
                appealRef: bytes32(0),
                finalFindingRef: bytes32(0),
                stake: terms.stake,
                primaryFee: terms.primaryFee,
                fallbackFee: terms.fallbackFee,
                challengeUntil: challengeUntil,
                primaryResolveUntil: 0,
                appealUntil: 0,
                fallbackResolveUntil: 0,
                primaryDuration: terms.primaryDuration,
                appealDuration: terms.appealDuration,
                fallbackDuration: terms.fallbackDuration,
                status: Status.Open,
                primaryFinding: Finding.None,
                outcome: Outcome.None,
                consumed: false
            })
        );

        emit ContestCreated(
            contestId,
            key,
            msg.sender,
            terms.challenger,
            terms.consumer,
            terms.domain,
            terms.purpose,
            terms.claimRef,
            challengeUntil
        );
    }

    function challengeContest(uint256 contestId, bytes32 challengeRef) external payable {
        Contest storage item = _contest(contestId);
        if (item.status != Status.Open) revert WrongState();
        if (msg.sender != item.challenger) revert WrongActor();
        if (block.timestamp >= item.challengeUntil) revert Closed();
        if (challengeRef == bytes32(0)) revert BadInput();
        if (msg.value != _participantDeposit(item.stake, item.primaryFee, item.fallbackFee)) {
            revert DepositMismatch();
        }

        item.challengeRef = challengeRef;
        item.status = Status.Challenged;
        item.primaryResolveUntil = _deadline(item.primaryDuration);
        item.fallbackResolveUntil = _addDuration(item.primaryResolveUntil, item.fallbackDuration);

        emit ContestChallenged(contestId, msg.sender, challengeRef);
    }

    function finalizeUnchallenged(uint256 contestId) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.Open) revert WrongState();
        if (block.timestamp < item.challengeUntil) revert TooSoon();

        item.status = Status.Unchallenged;
        item.outcome = Outcome.Unchallenged;
        _credit(item.claimant, _participantDeposit(item.stake, item.primaryFee, item.fallbackFee));

        emit ContestFinalized(contestId, item.outcome);
    }

    function resolvePrimary(uint256 contestId, Finding finding, bytes32 findingRef) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.Challenged) revert WrongState();
        if (msg.sender != item.primaryResolver) revert WrongActor();
        if (block.timestamp >= item.primaryResolveUntil) revert Closed();
        _requireFinding(finding, findingRef);

        item.primaryFinding = finding;
        item.primaryFindingRef = findingRef;
        item.status = Status.PrimaryFound;
        item.appealUntil = _deadline(item.appealDuration);
        _credit(item.primaryResolver, uint256(item.primaryFee) * 2);

        emit PrimaryFindingRecorded(contestId, msg.sender, finding, findingRef, item.appealUntil);
    }

    function appealContest(uint256 contestId, bytes32 appealRef) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.PrimaryFound) revert WrongState();
        if (block.timestamp >= item.appealUntil) revert Closed();
        if (msg.sender != _loser(item, item.primaryFinding)) revert WrongActor();
        if (appealRef == bytes32(0)) revert BadInput();

        item.appealRef = appealRef;
        item.status = Status.Appealed;
        item.fallbackResolveUntil = _deadline(item.fallbackDuration);

        emit ContestAppealed(contestId, msg.sender, appealRef);
    }

    function resolveAppeal(uint256 contestId, Finding finding, bytes32 findingRef) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.Appealed) revert WrongState();
        if (msg.sender != item.fallbackResolver) revert WrongActor();
        if (block.timestamp >= item.fallbackResolveUntil) revert Closed();
        _requireFinding(finding, findingRef);

        item.finalFindingRef = findingRef;
        _finalizeFinding(item, finding);
        _credit(item.fallbackResolver, uint256(item.fallbackFee) * 2);
        _credit(_winner(item, finding), uint256(item.stake) * 2);

        emit FinalFindingRecorded(contestId, msg.sender, item.outcome, findingRef);
    }

    function resolveFallback(uint256 contestId, Finding finding, bytes32 findingRef) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.Challenged) revert WrongState();
        if (msg.sender != item.fallbackResolver) revert WrongActor();
        if (block.timestamp < item.primaryResolveUntil) revert TooSoon();
        if (block.timestamp >= item.fallbackResolveUntil) revert Closed();
        _requireFinding(finding, findingRef);

        item.finalFindingRef = findingRef;
        _finalizeFinding(item, finding);
        _credit(item.fallbackResolver, (uint256(item.primaryFee) + item.fallbackFee) * 2);
        _credit(_winner(item, finding), uint256(item.stake) * 2);

        emit FinalFindingRecorded(contestId, msg.sender, item.outcome, findingRef);
    }

    function finalizePrimary(uint256 contestId) external {
        Contest storage item = _contest(contestId);
        if (item.status != Status.PrimaryFound) revert WrongState();
        if (block.timestamp < item.appealUntil) revert TooSoon();

        Finding finding = item.primaryFinding;
        item.finalFindingRef = item.primaryFindingRef;
        _finalizeFinding(item, finding);
        _credit(_winner(item, finding), uint256(item.stake) * 2);
        _credit(item.claimant, item.fallbackFee);
        _credit(item.challenger, item.fallbackFee);

        emit ContestFinalized(contestId, item.outcome);
    }

    function finalizeInconclusive(uint256 contestId) external {
        Contest storage item = _contest(contestId);
        uint256 refund;
        if (item.status == Status.Challenged) {
            if (block.timestamp < item.fallbackResolveUntil) revert TooSoon();
            refund = _participantDeposit(item.stake, item.primaryFee, item.fallbackFee);
        } else if (item.status == Status.Appealed) {
            if (block.timestamp < item.fallbackResolveUntil) revert TooSoon();
            refund = uint256(item.stake) + item.fallbackFee;
        } else {
            revert WrongState();
        }

        item.status = Status.Inconclusive;
        item.outcome = Outcome.Inconclusive;
        _credit(item.claimant, refund);
        _credit(item.challenger, refund);

        emit ContestFinalized(contestId, item.outcome);
    }

    function consumeContestOutcome(uint256 contestId, bytes32 domain, bytes32 purpose)
        external
        returns (Outcome outcome)
    {
        Contest storage item = _contest(contestId);
        if (msg.sender != item.consumer) revert WrongActor();
        if (domain != item.domain || purpose != item.purpose) revert ScopeMismatch();
        if (item.status != Status.Unchallenged && item.status != Status.Final) revert OutcomeUnavailable();
        if (item.consumed) revert AlreadyConsumed();

        item.consumed = true;
        outcome = item.outcome;
        emit ContestOutcomeConsumed(contestId, msg.sender, outcome, domain, purpose);
    }

    function withdrawCredit() external {
        if (_withdrawing) revert Reentrant();
        uint256 amount = credits[msg.sender];
        if (amount == 0) revert NoCredit();

        _withdrawing = true;
        credits[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert WithdrawalFailed();
        _withdrawing = false;

        emit CreditWithdrawn(msg.sender, amount);
    }

    function _validateTerms(Terms calldata terms) internal view {
        if (
            terms.challenger == address(0) || terms.primaryResolver == address(0)
                || terms.fallbackResolver == address(0) || terms.consumer == address(0)
        ) revert BadInput();
        if (
            msg.sender == terms.challenger || msg.sender == terms.primaryResolver
                || msg.sender == terms.fallbackResolver || msg.sender == terms.consumer
                || terms.challenger == terms.primaryResolver || terms.challenger == terms.fallbackResolver
                || terms.challenger == terms.consumer || terms.primaryResolver == terms.fallbackResolver
                || terms.primaryResolver == terms.consumer || terms.fallbackResolver == terms.consumer
        ) revert BadInput();
        if (terms.domain == bytes32(0) || terms.purpose == bytes32(0)) revert BadInput();
        if (terms.claimRef == bytes32(0) || terms.provenanceRef == bytes32(0)) revert BadInput();
        if (terms.stake == 0 || terms.primaryFee == 0 || terms.fallbackFee == 0) revert BadInput();
        _requireDuration(terms.challengeDuration);
        _requireDuration(terms.primaryDuration);
        _requireDuration(terms.appealDuration);
        _requireDuration(terms.fallbackDuration);
    }

    function _requireDuration(uint64 duration) internal pure {
        if (duration == 0 || duration > MAX_CONTEST_DURATION) revert BadInput();
    }

    function _deadline(uint64 duration) internal view returns (uint64) {
        if (block.timestamp > type(uint64).max - duration) revert DeadlineOverflow();
        // The explicit bound above makes the narrowing cast safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp) + duration;
    }

    function _addDuration(uint64 timestamp, uint64 duration) internal pure returns (uint64) {
        if (timestamp > type(uint64).max - duration) revert DeadlineOverflow();
        return timestamp + duration;
    }

    function _participantDeposit(uint128 stake, uint128 primaryFee, uint128 fallbackFee)
        internal
        pure
        returns (uint256)
    {
        return uint256(stake) + primaryFee + fallbackFee;
    }

    function _requireFinding(Finding finding, bytes32 findingRef) internal pure {
        if (finding != Finding.Upheld && finding != Finding.Rejected) revert BadInput();
        if (findingRef == bytes32(0)) revert BadInput();
    }

    function _winner(Contest storage item, Finding finding) internal view returns (address) {
        return finding == Finding.Upheld ? item.claimant : item.challenger;
    }

    function _loser(Contest storage item, Finding finding) internal view returns (address) {
        return finding == Finding.Upheld ? item.challenger : item.claimant;
    }

    function _finalizeFinding(Contest storage item, Finding finding) internal {
        item.status = Status.Final;
        item.outcome = finding == Finding.Upheld ? Outcome.Upheld : Outcome.Rejected;
    }

    function _credit(address account, uint256 amount) internal {
        credits[account] += amount;
    }

    function _contest(uint256 contestId) internal view returns (Contest storage item) {
        if (contestId >= _contests.length) revert UnknownContest();
        item = _contests[contestId];
    }
}
