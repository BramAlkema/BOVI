// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BilateralTermsSchedule — futurity, bilateral schedules and accepted index observations
 * @dev Executes John R. Commons's institutional-economic emphasis on futurity:
 * present negotiation structures reciprocal expectations about future action.
 * @notice Records party assertions only. It neither transfers value nor proves an
 * external index, acceptable performance, legal rights, discharge, or enforceability.
 */
contract BilateralTermsSchedule {
    uint256 public constant BASE = 1e18;
    uint32 public constant MAX_PERIODS = 120;
    uint64 public constant MAX_PERIOD = 365 days;
    uint64 public constant MAX_GRACE = 365 days;
    uint64 public constant MAX_ACTION_LIFETIME = 90 days;
    uint64 public constant MAX_CURE_EXTENSION = 365 days;

    enum ObligationStatus {
        Unset,
        Proposed,
        Active,
        Rejected,
        Cancelled,
        Terminated
    }

    enum ProposalStatus {
        Unset,
        Proposed,
        Accepted,
        Rejected
    }

    struct Terms {
        address creditor;
        bytes32 termsKey;
        bytes32 domain;
        bytes32 purpose;
        bytes32 unit;
        bytes32 basket;
        bytes32 termsRef;
        bytes32 performanceMethodRef;
        uint128 referenceAmount;
        uint64 startAt;
        uint64 period;
        uint64 maxObservationAge;
        uint64 gracePeriod;
        uint64 proposalValidUntil;
        uint32 periodCount;
    }

    struct Obligation {
        address debtor;
        address creditor;
        bytes32 termsKey;
        bytes32 domain;
        bytes32 purpose;
        bytes32 unit;
        bytes32 basket;
        bytes32 termsRef;
        bytes32 performanceMethodRef;
        uint128 referenceAmount;
        uint64 startAt;
        uint64 period;
        uint64 maxObservationAge;
        uint64 gracePeriod;
        uint64 proposalValidUntil;
        uint64 activatedAt;
        uint64 terminatedAt;
        uint32 periodCount;
        ObligationStatus status;
    }

    struct PeriodEpisode {
        uint256 obligationId;
        uint32 periodNumber;
        uint64 dueAt;
        uint64 cureUntil;
        uint256 dueAmount;
        uint256 roundingRemainder;
        uint256 acknowledgedAmount;
        uint256 forgivenAmount;
        uint256 acceptedSnapshotId;
    }

    struct SnapshotProposal {
        uint256 episodeId;
        address proposer;
        bytes32 unit;
        bytes32 basket;
        bytes32 observationRef;
        bytes32 provenanceRef;
        uint128 indexLevel;
        uint64 observedAt;
        uint64 validUntil;
        ProposalStatus status;
    }

    struct TenderProposal {
        uint256 episodeId;
        bytes32 instrumentRef;
        bytes32 performanceRef;
        uint256 amount;
        uint64 validUntil;
        ProposalStatus status;
    }

    struct CureProposal {
        uint256 episodeId;
        bytes32 cureRef;
        uint64 extensionUntil;
        uint64 validUntil;
        ProposalStatus status;
    }

    struct TerminationProposal {
        uint256 obligationId;
        address proposer;
        bytes32 terminationRef;
        uint64 validUntil;
        ProposalStatus status;
    }

    error InvalidTerms();
    error WrongParty();
    error WrongState();
    error TooEarly();
    error Expired();
    error Duplicate();
    error InvalidObservation();
    error InvalidAmount();

    uint256 public nextObligationId = 1;
    uint256 public nextEpisodeId = 1;
    uint256 public nextSnapshotId = 1;
    uint256 public nextTenderId = 1;
    uint256 public nextCureId = 1;
    uint256 public nextTerminationId = 1;

    mapping(bytes32 => bool) public consumedTermsKeys;
    mapping(uint256 => Obligation) internal _obligations;
    mapping(uint256 => PeriodEpisode) internal _episodes;
    mapping(uint256 => mapping(uint32 => uint256)) public episodeForPeriod;
    mapping(uint256 => SnapshotProposal) internal _snapshots;
    mapping(uint256 => TenderProposal) internal _tenders;
    mapping(uint256 => CureProposal) internal _cures;
    mapping(uint256 => TerminationProposal) internal _terminations;

    event ObligationProposed(
        uint256 indexed obligationId, address indexed debtor, address indexed creditor, bytes32 termsKey
    );
    event ObligationAccepted(uint256 indexed obligationId, address indexed creditor);
    event ObligationRejected(uint256 indexed obligationId, address indexed creditor);
    event ObligationCancelled(uint256 indexed obligationId, address indexed debtor);
    event PeriodOpened(
        uint256 indexed episodeId, uint256 indexed obligationId, uint32 indexed periodNumber, uint64 dueAt
    );
    event SnapshotProposed(uint256 indexed snapshotId, uint256 indexed episodeId, address indexed proposer);
    event SnapshotAccepted(
        uint256 indexed snapshotId, uint256 indexed episodeId, uint256 dueAmount, uint256 roundingRemainder
    );
    event SnapshotRejected(uint256 indexed snapshotId, uint256 indexed episodeId);
    event TenderProposed(uint256 indexed tenderId, uint256 indexed episodeId, uint256 amount);
    event PerformanceAcknowledged(uint256 indexed tenderId, uint256 indexed episodeId, uint256 amount);
    event TenderRejected(uint256 indexed tenderId, uint256 indexed episodeId);
    event ResidualForgiven(uint256 indexed episodeId, uint256 amount, bytes32 indexed forgivenessRef);
    event CureProposed(uint256 indexed cureId, uint256 indexed episodeId, uint64 extensionUntil);
    event CureAccepted(uint256 indexed cureId, uint256 indexed episodeId, uint64 extensionUntil);
    event CureRejected(uint256 indexed cureId, uint256 indexed episodeId);
    event TerminationProposed(uint256 indexed proposalId, uint256 indexed obligationId, address indexed proposer);
    event TerminationAccepted(uint256 indexed proposalId, uint256 indexed obligationId, uint64 terminatedAt);
    event TerminationRejected(uint256 indexed proposalId, uint256 indexed obligationId);
    event ArrearsObserved(uint256 indexed episodeId, uint256 indexed obligationId, uint256 residual, uint64 since);

    function propose(Terms calldata terms) external returns (uint256 obligationId) {
        if (
            terms.creditor == address(0) || terms.creditor == msg.sender || terms.termsKey == bytes32(0)
                || terms.domain == bytes32(0) || terms.purpose == bytes32(0) || terms.unit == bytes32(0)
                || terms.basket == bytes32(0) || terms.termsRef == bytes32(0)
                || terms.performanceMethodRef == bytes32(0) || terms.referenceAmount == 0 || terms.period == 0
                || terms.period > MAX_PERIOD || terms.periodCount == 0 || terms.periodCount > MAX_PERIODS
                || terms.maxObservationAge == 0 || terms.maxObservationAge > MAX_PERIOD || terms.gracePeriod > MAX_GRACE
                || terms.startAt <= block.timestamp || terms.proposalValidUntil < block.timestamp
                || terms.proposalValidUntil > terms.startAt
        ) revert InvalidTerms();
        uint256 finalDueAt = uint256(terms.startAt) + uint256(terms.period) * uint256(terms.periodCount - 1);
        if (finalDueAt > type(uint64).max) revert InvalidTerms();
        if (consumedTermsKeys[terms.termsKey]) revert Duplicate();

        consumedTermsKeys[terms.termsKey] = true;
        obligationId = nextObligationId++;
        Obligation storage item = _obligations[obligationId];
        item.debtor = msg.sender;
        item.creditor = terms.creditor;
        item.termsKey = terms.termsKey;
        item.domain = terms.domain;
        item.purpose = terms.purpose;
        item.unit = terms.unit;
        item.basket = terms.basket;
        item.termsRef = terms.termsRef;
        item.performanceMethodRef = terms.performanceMethodRef;
        item.referenceAmount = terms.referenceAmount;
        item.startAt = terms.startAt;
        item.period = terms.period;
        item.maxObservationAge = terms.maxObservationAge;
        item.gracePeriod = terms.gracePeriod;
        item.proposalValidUntil = terms.proposalValidUntil;
        item.periodCount = terms.periodCount;
        item.status = ObligationStatus.Proposed;
        emit ObligationProposed(obligationId, msg.sender, terms.creditor, terms.termsKey);
    }

    function acceptObligation(uint256 obligationId) external {
        Obligation storage item = _obligations[obligationId];
        if (item.status != ObligationStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        if (block.timestamp > item.proposalValidUntil || block.timestamp >= item.startAt) revert Expired();
        item.status = ObligationStatus.Active;
        item.activatedAt = _timestamp();
        emit ObligationAccepted(obligationId, msg.sender);
    }

    function rejectObligation(uint256 obligationId) external {
        Obligation storage item = _obligations[obligationId];
        if (item.status != ObligationStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        item.status = ObligationStatus.Rejected;
        emit ObligationRejected(obligationId, msg.sender);
    }

    function cancelProposal(uint256 obligationId) external {
        Obligation storage item = _obligations[obligationId];
        if (item.status != ObligationStatus.Proposed) revert WrongState();
        if (msg.sender != item.debtor) revert WrongParty();
        item.status = ObligationStatus.Cancelled;
        emit ObligationCancelled(obligationId, msg.sender);
    }

    function openPeriod(uint256 obligationId, uint32 periodNumber) external returns (uint256 episodeId) {
        Obligation storage item = _obligations[obligationId];
        if (item.status != ObligationStatus.Active && item.status != ObligationStatus.Terminated) revert WrongState();
        _requireParty(item, msg.sender);
        if (periodNumber >= item.periodCount) revert InvalidTerms();
        if (episodeForPeriod[obligationId][periodNumber] != 0) revert Duplicate();

        uint64 dueAt = _dueAt(item, periodNumber);
        if (block.timestamp < dueAt) revert TooEarly();
        if (item.status == ObligationStatus.Terminated && dueAt > item.terminatedAt) revert WrongState();

        episodeId = nextEpisodeId++;
        _episodes[episodeId] = PeriodEpisode({
            obligationId: obligationId,
            periodNumber: periodNumber,
            dueAt: dueAt,
            cureUntil: 0,
            dueAmount: 0,
            roundingRemainder: 0,
            acknowledgedAmount: 0,
            forgivenAmount: 0,
            acceptedSnapshotId: 0
        });
        episodeForPeriod[obligationId][periodNumber] = episodeId;
        emit PeriodOpened(episodeId, obligationId, periodNumber, dueAt);
    }

    function proposeSnapshot(
        uint256 episodeId,
        bytes32 unit,
        bytes32 basket,
        uint128 indexLevel,
        uint64 observedAt,
        uint64 validUntil,
        bytes32 observationRef,
        bytes32 provenanceRef
    ) external returns (uint256 snapshotId) {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        _requireOpenEpisode(episode, item);
        _requireParty(item, msg.sender);
        if (episode.acceptedSnapshotId != 0) revert WrongState();
        if (
            unit != item.unit || basket != item.basket || indexLevel == 0 || observationRef == bytes32(0)
                || provenanceRef == bytes32(0)
        ) {
            revert InvalidObservation();
        }
        _requireFresh(item.maxObservationAge, observedAt, validUntil);

        snapshotId = nextSnapshotId++;
        _snapshots[snapshotId] = SnapshotProposal({
            episodeId: episodeId,
            proposer: msg.sender,
            unit: unit,
            basket: basket,
            observationRef: observationRef,
            provenanceRef: provenanceRef,
            indexLevel: indexLevel,
            observedAt: observedAt,
            validUntil: validUntil,
            status: ProposalStatus.Proposed
        });
        emit SnapshotProposed(snapshotId, episodeId, msg.sender);
    }

    function acceptSnapshot(uint256 snapshotId) external {
        SnapshotProposal storage proposal = _snapshots[snapshotId];
        PeriodEpisode storage episode = _episodes[proposal.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (proposal.status != ProposalStatus.Proposed || episode.acceptedSnapshotId != 0) revert WrongState();
        _requireCounterparty(item, proposal.proposer, msg.sender);
        _requireFresh(item.maxObservationAge, proposal.observedAt, proposal.validUntil);

        uint256 product = uint256(item.referenceAmount) * uint256(proposal.indexLevel);
        episode.dueAmount = product / BASE;
        episode.roundingRemainder = product % BASE;
        if (episode.dueAmount == 0) revert InvalidAmount();
        episode.acceptedSnapshotId = snapshotId;
        proposal.status = ProposalStatus.Accepted;
        emit SnapshotAccepted(snapshotId, proposal.episodeId, episode.dueAmount, episode.roundingRemainder);
    }

    function rejectSnapshot(uint256 snapshotId) external {
        SnapshotProposal storage proposal = _snapshots[snapshotId];
        PeriodEpisode storage episode = _episodes[proposal.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (proposal.status != ProposalStatus.Proposed) revert WrongState();
        _requireCounterparty(item, proposal.proposer, msg.sender);
        proposal.status = ProposalStatus.Rejected;
        emit SnapshotRejected(snapshotId, proposal.episodeId);
    }

    function proposeTender(
        uint256 episodeId,
        uint256 amount,
        uint64 validUntil,
        bytes32 instrumentRef,
        bytes32 performanceRef
    ) external returns (uint256 tenderId) {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        _requireOpenEpisode(episode, item);
        if (msg.sender != item.debtor) revert WrongParty();
        if (episode.acceptedSnapshotId == 0 || amount == 0 || amount > residual(episodeId)) revert InvalidAmount();
        _requireActionDeadline(validUntil);

        tenderId = nextTenderId++;
        _tenders[tenderId] = TenderProposal({
            episodeId: episodeId,
            instrumentRef: instrumentRef,
            performanceRef: performanceRef,
            amount: amount,
            validUntil: validUntil,
            status: ProposalStatus.Proposed
        });
        if (instrumentRef == bytes32(0) || performanceRef == bytes32(0)) revert InvalidTerms();
        emit TenderProposed(tenderId, episodeId, amount);
    }

    function acknowledgePerformance(uint256 tenderId) external {
        TenderProposal storage tender = _tenders[tenderId];
        PeriodEpisode storage episode = _episodes[tender.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (tender.status != ProposalStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        if (block.timestamp > tender.validUntil) revert Expired();
        if (tender.amount > residual(tender.episodeId)) revert InvalidAmount();
        tender.status = ProposalStatus.Accepted;
        episode.acknowledgedAmount += tender.amount;
        emit PerformanceAcknowledged(tenderId, tender.episodeId, tender.amount);
    }

    function rejectTender(uint256 tenderId) external {
        TenderProposal storage tender = _tenders[tenderId];
        PeriodEpisode storage episode = _episodes[tender.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (tender.status != ProposalStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        tender.status = ProposalStatus.Rejected;
        emit TenderRejected(tenderId, tender.episodeId);
    }

    function forgive(uint256 episodeId, uint256 amount, bytes32 forgivenessRef) external {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        _requireOpenEpisode(episode, item);
        if (msg.sender != item.creditor) revert WrongParty();
        if (amount == 0 || amount > residual(episodeId) || forgivenessRef == bytes32(0)) revert InvalidAmount();
        episode.forgivenAmount += amount;
        emit ResidualForgiven(episodeId, amount, forgivenessRef);
    }

    function proposeCure(uint256 episodeId, uint64 extensionUntil, uint64 validUntil, bytes32 cureRef)
        external
        returns (uint256 cureId)
    {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        _requireOpenEpisode(episode, item);
        if (msg.sender != item.debtor) revert WrongParty();
        if (episode.acceptedSnapshotId == 0 || residual(episodeId) == 0 || cureRef == bytes32(0)) {
            revert InvalidTerms();
        }
        uint64 currentClock = arrearsAt(episodeId);
        uint256 maximumExtension = uint256(episode.dueAt) + uint256(item.gracePeriod) + MAX_CURE_EXTENSION;
        if (extensionUntil <= currentClock || uint256(extensionUntil) > maximumExtension) revert InvalidTerms();
        _requireActionDeadline(validUntil);

        cureId = nextCureId++;
        _cures[cureId] = CureProposal({
            episodeId: episodeId,
            cureRef: cureRef,
            extensionUntil: extensionUntil,
            validUntil: validUntil,
            status: ProposalStatus.Proposed
        });
        emit CureProposed(cureId, episodeId, extensionUntil);
    }

    function acceptCure(uint256 cureId) external {
        CureProposal storage cure = _cures[cureId];
        PeriodEpisode storage episode = _episodes[cure.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (cure.status != ProposalStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        if (block.timestamp > cure.validUntil || cure.extensionUntil <= arrearsAt(cure.episodeId)) revert Expired();
        cure.status = ProposalStatus.Accepted;
        episode.cureUntil = cure.extensionUntil;
        emit CureAccepted(cureId, cure.episodeId, cure.extensionUntil);
    }

    function rejectCure(uint256 cureId) external {
        CureProposal storage cure = _cures[cureId];
        PeriodEpisode storage episode = _episodes[cure.episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        if (cure.status != ProposalStatus.Proposed) revert WrongState();
        if (msg.sender != item.creditor) revert WrongParty();
        cure.status = ProposalStatus.Rejected;
        emit CureRejected(cureId, cure.episodeId);
    }

    function proposeTermination(uint256 obligationId, uint64 validUntil, bytes32 terminationRef)
        external
        returns (uint256 proposalId)
    {
        Obligation storage item = _obligations[obligationId];
        if (item.status != ObligationStatus.Active) revert WrongState();
        _requireParty(item, msg.sender);
        if (terminationRef == bytes32(0)) revert InvalidTerms();
        _requireActionDeadline(validUntil);
        proposalId = nextTerminationId++;
        _terminations[proposalId] = TerminationProposal({
            obligationId: obligationId,
            proposer: msg.sender,
            terminationRef: terminationRef,
            validUntil: validUntil,
            status: ProposalStatus.Proposed
        });
        emit TerminationProposed(proposalId, obligationId, msg.sender);
    }

    function acceptTermination(uint256 proposalId) external {
        TerminationProposal storage proposal = _terminations[proposalId];
        Obligation storage item = _obligations[proposal.obligationId];
        if (proposal.status != ProposalStatus.Proposed || item.status != ObligationStatus.Active) revert WrongState();
        _requireCounterparty(item, proposal.proposer, msg.sender);
        if (block.timestamp > proposal.validUntil) revert Expired();
        proposal.status = ProposalStatus.Accepted;
        item.status = ObligationStatus.Terminated;
        item.terminatedAt = _timestamp();
        emit TerminationAccepted(proposalId, proposal.obligationId, item.terminatedAt);
    }

    function rejectTermination(uint256 proposalId) external {
        TerminationProposal storage proposal = _terminations[proposalId];
        Obligation storage item = _obligations[proposal.obligationId];
        if (proposal.status != ProposalStatus.Proposed || item.status != ObligationStatus.Active) revert WrongState();
        _requireCounterparty(item, proposal.proposer, msg.sender);
        proposal.status = ProposalStatus.Rejected;
        emit TerminationRejected(proposalId, proposal.obligationId);
    }

    function reportArrears(uint256 episodeId) external returns (uint256 remaining) {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        _requireParty(item, msg.sender);
        remaining = residual(episodeId);
        uint64 since = arrearsAt(episodeId);
        if (episode.acceptedSnapshotId == 0 || remaining == 0 || block.timestamp <= since) revert WrongState();
        emit ArrearsObserved(episodeId, episode.obligationId, remaining, since);
    }

    function residual(uint256 episodeId) public view returns (uint256) {
        PeriodEpisode storage episode = _episodes[episodeId];
        return episode.dueAmount - episode.acknowledgedAmount - episode.forgivenAmount;
    }

    function arrearsAt(uint256 episodeId) public view returns (uint64) {
        PeriodEpisode storage episode = _episodes[episodeId];
        Obligation storage item = _obligations[episode.obligationId];
        uint64 ordinary = episode.dueAt + item.gracePeriod;
        return episode.cureUntil > ordinary ? episode.cureUntil : ordinary;
    }

    function isArrears(uint256 episodeId) external view returns (bool) {
        PeriodEpisode storage episode = _episodes[episodeId];
        return episode.acceptedSnapshotId != 0 && residual(episodeId) != 0 && block.timestamp > arrearsAt(episodeId);
    }

    function scheduledDueAt(uint256 obligationId, uint32 periodNumber) external view returns (uint64) {
        Obligation storage item = _obligations[obligationId];
        if (periodNumber >= item.periodCount) revert InvalidTerms();
        return _dueAt(item, periodNumber);
    }

    function obligationStatus(uint256 obligationId) external view returns (ObligationStatus) {
        return _obligations[obligationId].status;
    }

    function periodAccounting(uint256 episodeId)
        external
        view
        returns (
            uint256 dueAmount,
            uint256 roundingRemainder,
            uint256 acknowledgedAmount,
            uint256 forgivenAmount,
            uint256 acceptedSnapshotId,
            uint64 cureUntil
        )
    {
        PeriodEpisode storage item = _episodes[episodeId];
        return (
            item.dueAmount,
            item.roundingRemainder,
            item.acknowledgedAmount,
            item.forgivenAmount,
            item.acceptedSnapshotId,
            item.cureUntil
        );
    }

    function snapshotStatus(uint256 snapshotId) external view returns (ProposalStatus) {
        return _snapshots[snapshotId].status;
    }

    function tenderStatus(uint256 tenderId) external view returns (ProposalStatus) {
        return _tenders[tenderId].status;
    }

    function cureStatus(uint256 cureId) external view returns (ProposalStatus) {
        return _cures[cureId].status;
    }

    function terminationStatus(uint256 proposalId) external view returns (ProposalStatus) {
        return _terminations[proposalId].status;
    }

    function _requireOpenEpisode(PeriodEpisode storage episode, Obligation storage item) internal view {
        if (episode.obligationId == 0) revert WrongState();
        if (item.status != ObligationStatus.Active && item.status != ObligationStatus.Terminated) revert WrongState();
    }

    function _requireParty(Obligation storage item, address actor) internal view {
        if (actor != item.debtor && actor != item.creditor) revert WrongParty();
    }

    function _requireCounterparty(Obligation storage item, address proposer, address actor) internal view {
        if (
            (proposer != item.debtor && proposer != item.creditor) || actor == proposer
                || (actor != item.debtor && actor != item.creditor)
        ) revert WrongParty();
    }

    function _requireFresh(uint64 maxAge, uint64 observedAt, uint64 validUntil) internal view {
        if (
            observedAt > block.timestamp || block.timestamp - observedAt > maxAge || validUntil < block.timestamp
                || validUntil > block.timestamp + MAX_ACTION_LIFETIME
        ) revert InvalidObservation();
    }

    function _requireActionDeadline(uint64 validUntil) internal view {
        if (validUntil < block.timestamp || validUntil > block.timestamp + MAX_ACTION_LIFETIME) revert InvalidTerms();
    }

    function _dueAt(Obligation storage item, uint32 periodNumber) internal view returns (uint64) {
        uint256 value = uint256(item.startAt) + uint256(item.period) * uint256(periodNumber);
        if (value > type(uint64).max) revert InvalidTerms();
        // The explicit bound above proves this conversion cannot truncate.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(value);
    }

    function _timestamp() internal view returns (uint64) {
        if (block.timestamp > type(uint64).max) revert InvalidTerms();
        return uint64(block.timestamp);
    }
}
