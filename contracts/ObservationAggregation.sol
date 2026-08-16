// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ObservationAggregation — bounded aggregation of attributed observations
 * @notice Bounded, typed median aggregation for declared provider observations.
 * @dev Named for ObservationAggregation's information-aggregation problem, not as a claim
 * that reporters are competent or independent. Outputs are evidence records,
 * not truth, policy, or automatic contract input.
 */
contract ObservationAggregation {
    uint8 public constant MAX_PROVIDERS = 16;
    uint16 public constant MAX_UNCERTAINTY_BPS = 10_000;
    uint64 public constant MAX_EPOCH_LIFETIME = 365 days;

    error BadInput();
    error WrongActor();
    error WrongState();
    error Closed();
    error TooSoon();
    error DuplicateEpoch();
    error DuplicateProvider();
    error DuplicateObservation();
    error UnknownEpoch();
    error UnknownProvider();
    error QuorumUnavailable();
    error DeadlineOverflow();

    struct EpochTerms {
        address challenger;
        bytes32 unit;
        bytes32 basket;
        bytes32 methodRef;
        bytes32 epochRef;
        bytes32 providerIncentiveRef;
        bytes32 challengerIncentiveRef;
        uint64 periodStart;
        uint64 periodEnd;
        uint64 submissionUntil;
        uint64 challengeUntil;
        uint64 finalizeUntil;
        uint64 maxStale;
        uint8 quorum;
        address[] providers;
    }

    struct Epoch {
        address consumer;
        address challenger;
        bytes32 unit;
        bytes32 basket;
        bytes32 methodRef;
        bytes32 epochRef;
        bytes32 providerIncentiveRef;
        bytes32 challengerIncentiveRef;
        uint64 periodStart;
        uint64 periodEnd;
        uint64 submissionUntil;
        uint64 challengeUntil;
        uint64 finalizeUntil;
        uint64 maxStale;
        uint8 quorum;
        bool finalized;
    }

    struct Observation {
        uint256 value;
        bytes32 provenanceRef;
        bytes32 challengeRef;
        uint64 observedAt;
        uint64 submittedAt;
        uint16 uncertaintyBps;
        bool submitted;
        bool challenged;
    }

    struct AggregateOutput {
        uint256 median;
        bytes32 includedDigest;
        uint64 finalizedAt;
        uint16 maxUncertaintyBps;
        uint8 includedCount;
    }

    Epoch[] private _epochs;
    mapping(uint256 => address[]) private _providers;
    mapping(uint256 => mapping(address => bool)) public isEpochProvider;
    mapping(uint256 => mapping(address => Observation)) private _observations;
    mapping(uint256 => AggregateOutput) private _outputs;
    mapping(bytes32 => bool) public epochKeyUsed;

    event EpochCreated(
        uint256 indexed epochId,
        bytes32 indexed epochKey,
        address indexed consumer,
        address challenger,
        bytes32 unit,
        bytes32 basket,
        bytes32 epochRef,
        uint8 providerCount,
        uint8 quorum
    );
    event ObservationSubmitted(
        uint256 indexed epochId,
        address indexed provider,
        uint256 value,
        bytes32 provenanceRef,
        uint64 observedAt,
        uint64 submittedAt,
        uint16 uncertaintyBps
    );
    event ObservationChallenged(
        uint256 indexed epochId, address indexed provider, address indexed challenger, bytes32 challengeRef
    );
    event AggregateFinalized(
        uint256 indexed epochId,
        address indexed consumer,
        uint256 median,
        uint8 includedCount,
        uint16 maxUncertaintyBps,
        bytes32 includedDigest,
        uint64 finalizedAt
    );

    function epochCount() external view returns (uint256) {
        return _epochs.length;
    }

    function epoch(uint256 epochId) external view returns (Epoch memory) {
        return _epoch(epochId);
    }

    function providerCount(uint256 epochId) external view returns (uint256) {
        _requireEpoch(epochId);
        return _providers[epochId].length;
    }

    function providerAt(uint256 epochId, uint256 index) external view returns (address) {
        _requireEpoch(epochId);
        if (index >= _providers[epochId].length) revert UnknownProvider();
        return _providers[epochId][index];
    }

    function observation(uint256 epochId, address provider) external view returns (Observation memory) {
        _requireEpoch(epochId);
        if (!isEpochProvider[epochId][provider]) revert UnknownProvider();
        return _observations[epochId][provider];
    }

    function output(uint256 epochId) external view returns (AggregateOutput memory) {
        Epoch storage item = _epoch(epochId);
        if (!item.finalized) revert WrongState();
        return _outputs[epochId];
    }

    function epochKey(
        address consumer,
        bytes32 unit,
        bytes32 basket,
        uint64 periodStart,
        uint64 periodEnd,
        bytes32 epochRef
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(consumer, unit, basket, periodStart, periodEnd, epochRef));
    }

    function createEpoch(EpochTerms calldata terms) external returns (uint256 epochId) {
        _validateTerms(terms);

        bytes32 key = epochKey(msg.sender, terms.unit, terms.basket, terms.periodStart, terms.periodEnd, terms.epochRef);
        if (epochKeyUsed[key]) revert DuplicateEpoch();
        epochKeyUsed[key] = true;

        epochId = _epochs.length;
        _epochs.push(
            Epoch({
                consumer: msg.sender,
                challenger: terms.challenger,
                unit: terms.unit,
                basket: terms.basket,
                methodRef: terms.methodRef,
                epochRef: terms.epochRef,
                providerIncentiveRef: terms.providerIncentiveRef,
                challengerIncentiveRef: terms.challengerIncentiveRef,
                periodStart: terms.periodStart,
                periodEnd: terms.periodEnd,
                submissionUntil: terms.submissionUntil,
                challengeUntil: terms.challengeUntil,
                finalizeUntil: terms.finalizeUntil,
                maxStale: terms.maxStale,
                quorum: terms.quorum,
                finalized: false
            })
        );

        uint256 length = terms.providers.length;
        for (uint256 i = 0; i < length; i++) {
            address provider = terms.providers[i];
            if (
                provider == address(0) || provider == msg.sender || provider == terms.challenger
                    || isEpochProvider[epochId][provider]
            ) {
                revert DuplicateProvider();
            }
            isEpochProvider[epochId][provider] = true;
            _providers[epochId].push(provider);
        }

        // Validation bounds the roster to MAX_PROVIDERS, so the count fits uint8.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint8 providerTotal = uint8(length);
        emit EpochCreated(
            epochId,
            key,
            msg.sender,
            terms.challenger,
            terms.unit,
            terms.basket,
            terms.epochRef,
            providerTotal,
            terms.quorum
        );
    }

    function submitObservation(
        uint256 epochId,
        uint256 value,
        bytes32 provenanceRef,
        uint64 observedAt,
        uint16 uncertaintyBps
    ) external {
        Epoch storage item = _epoch(epochId);
        if (!isEpochProvider[epochId][msg.sender]) revert WrongActor();
        if (item.finalized) revert WrongState();
        if (block.timestamp >= item.submissionUntil) revert Closed();

        Observation storage submitted = _observations[epochId][msg.sender];
        if (submitted.submitted) revert DuplicateObservation();
        if (
            value == 0 || provenanceRef == bytes32(0) || observedAt < item.periodStart || observedAt > item.periodEnd
                || observedAt > block.timestamp || uncertaintyBps > MAX_UNCERTAINTY_BPS
        ) revert BadInput();

        uint64 submittedAt = _now64();
        submitted.value = value;
        submitted.provenanceRef = provenanceRef;
        submitted.observedAt = observedAt;
        submitted.submittedAt = submittedAt;
        submitted.uncertaintyBps = uncertaintyBps;
        submitted.submitted = true;

        emit ObservationSubmitted(epochId, msg.sender, value, provenanceRef, observedAt, submittedAt, uncertaintyBps);
    }

    function challengeObservation(uint256 epochId, address provider, bytes32 challengeRef) external {
        Epoch storage item = _epoch(epochId);
        if (msg.sender != item.challenger) revert WrongActor();
        if (item.finalized) revert WrongState();
        if (block.timestamp >= item.challengeUntil) revert Closed();
        if (challengeRef == bytes32(0)) revert BadInput();

        Observation storage submitted = _observations[epochId][provider];
        if (!submitted.submitted) revert UnknownProvider();
        if (submitted.challenged) revert WrongState();
        submitted.challenged = true;
        submitted.challengeRef = challengeRef;

        emit ObservationChallenged(epochId, provider, msg.sender, challengeRef);
    }

    function finalizeAggregate(uint256 epochId) external returns (uint256 median) {
        Epoch storage item = _epoch(epochId);
        if (msg.sender != item.consumer) revert WrongActor();
        if (item.finalized) revert WrongState();
        if (block.timestamp < item.challengeUntil) revert TooSoon();
        if (block.timestamp > item.finalizeUntil) revert Closed();

        address[] storage roster = _providers[epochId];
        uint256[] memory values = new uint256[](roster.length);
        bytes32 digest;
        uint16 maximumUncertainty;
        uint8 included;

        for (uint256 i = 0; i < roster.length; i++) {
            address provider = roster[i];
            Observation storage submitted = _observations[epochId][provider];
            if (
                submitted.submitted && !submitted.challenged && block.timestamp - submitted.submittedAt <= item.maxStale
            ) {
                values[included] = submitted.value;
                if (submitted.uncertaintyBps > maximumUncertainty) {
                    maximumUncertainty = submitted.uncertaintyBps;
                }
                digest = keccak256(
                    abi.encode(
                        digest,
                        provider,
                        submitted.value,
                        submitted.provenanceRef,
                        submitted.observedAt,
                        submitted.submittedAt,
                        submitted.uncertaintyBps
                    )
                );
                included++;
            }
        }

        if (included < item.quorum) revert QuorumUnavailable();
        _sort(values, included);
        if (included % 2 == 1) {
            median = values[included / 2];
        } else {
            uint256 lower = values[included / 2 - 1];
            uint256 upper = values[included / 2];
            median = lower + (upper - lower) / 2;
        }

        uint64 finalizedAt = _now64();
        item.finalized = true;
        _outputs[epochId] = AggregateOutput({
            median: median,
            includedDigest: digest,
            finalizedAt: finalizedAt,
            maxUncertaintyBps: maximumUncertainty,
            includedCount: included
        });

        emit AggregateFinalized(epochId, msg.sender, median, included, maximumUncertainty, digest, finalizedAt);
    }

    function _validateTerms(EpochTerms calldata terms) internal view {
        uint256 length = terms.providers.length;
        if (length < 2 || length > MAX_PROVIDERS) revert BadInput();
        if (terms.challenger == address(0) || terms.challenger == msg.sender) revert BadInput();
        if (
            terms.unit == bytes32(0) || terms.basket == bytes32(0) || terms.methodRef == bytes32(0)
                || terms.epochRef == bytes32(0) || terms.providerIncentiveRef == bytes32(0)
                || terms.challengerIncentiveRef == bytes32(0)
        ) revert BadInput();
        if (terms.quorum < 2 || terms.quorum > length) revert BadInput();
        if (terms.periodStart == 0 || terms.periodStart >= terms.periodEnd || terms.periodEnd > block.timestamp) {
            revert BadInput();
        }
        if (
            terms.submissionUntil <= block.timestamp || terms.challengeUntil <= terms.submissionUntil
                || terms.finalizeUntil <= terms.challengeUntil || terms.maxStale == 0
                || terms.maxStale > MAX_EPOCH_LIFETIME
        ) revert BadInput();
        if (block.timestamp > type(uint64).max - MAX_EPOCH_LIFETIME) revert DeadlineOverflow();
        if (terms.finalizeUntil > block.timestamp + MAX_EPOCH_LIFETIME) revert BadInput();
    }

    function _sort(uint256[] memory values, uint256 length) internal pure {
        for (uint256 i = 1; i < length; i++) {
            uint256 key = values[i];
            uint256 cursor = i;
            while (cursor > 0 && values[cursor - 1] > key) {
                values[cursor] = values[cursor - 1];
                cursor--;
            }
            values[cursor] = key;
        }
    }

    function _now64() internal view returns (uint64) {
        if (block.timestamp > type(uint64).max) revert DeadlineOverflow();
        // The explicit bound above makes the narrowing cast safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }

    function _epoch(uint256 epochId) internal view returns (Epoch storage item) {
        _requireEpoch(epochId);
        item = _epochs[epochId];
    }

    function _requireEpoch(uint256 epochId) internal view {
        if (epochId >= _epochs.length) revert UnknownEpoch();
    }
}
