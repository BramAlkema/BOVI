// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ChallengeBond} from "../contracts/ChallengeBond.sol";
import {SharedNumeraire} from "../contracts/SharedNumeraire.sol";
import {ObservationAggregation} from "../contracts/ObservationAggregation.sol";

contract ObservationAggregationTest is Test {
    ObservationAggregation internal aggregation;

    address internal consumer = makeAddr("consumer");
    address internal challenger = makeAddr("challenger");
    address internal providerA = makeAddr("provider-a");
    address internal providerB = makeAddr("provider-b");
    address internal providerC = makeAddr("provider-c");
    address internal providerD = makeAddr("provider-d");
    address internal outsider = makeAddr("outsider");

    bytes32 internal constant UNIT = keccak256("unit-eur-2026");
    bytes32 internal constant BASKET = keccak256("basket-housing-food-energy");
    bytes32 internal constant METHOD = keccak256("declared-method");
    bytes32 internal constant EPOCH_REF = keccak256("epoch-2026-08");
    bytes32 internal constant PROVIDER_INCENTIVE = keccak256("provider-service-terms");
    bytes32 internal constant CHALLENGER_INCENTIVE = keccak256("challenger-service-terms");
    bytes32 internal constant PROVENANCE_A = keccak256("provenance-a");
    bytes32 internal constant PROVENANCE_B = keccak256("provenance-b");
    bytes32 internal constant PROVENANCE_C = keccak256("provenance-c");
    bytes32 internal constant CHALLENGE_REF = keccak256("challenge-ref");

    function setUp() public {
        vm.warp(1_000_000);
        aggregation = new ObservationAggregation();
    }

    function test_LegacyHayekMedianRemainsCallableAndIsolated() public {
        SharedNumeraire hayek = new SharedNumeraire(7 days);
        hayek.admitProvider(providerA);
        hayek.admitProvider(providerB);
        hayek.admitProvider(providerC);
        vm.prank(providerA);
        hayek.publish(90e18);
        vm.prank(providerB);
        hayek.publish(100e18);
        vm.prank(providerC);
        hayek.publish(120e18);

        assertEq(hayek.current(), 100e18);
        assertEq(aggregation.epochCount(), 0);
    }

    function test_LegacyChallengeResultReplayStillRefreshesLegacyHayekOnly() public {
        SharedNumeraire hayek = new SharedNumeraire(7 days);
        ChallengeBond legacyChallenge = new ChallengeBond(address(this), 0, 0);
        hayek.admitProvider(providerA);
        hayek.setChallenge(address(legacyChallenge));

        bytes32 topic = hayek.TOPIC();
        vm.prank(providerA);
        uint256 assertionId = legacyChallenge.assert_(topic, 100e18);
        legacyChallenge.settle(assertionId);
        hayek.finalize(providerA, assertionId);
        uint64 firstUpdate = hayek.updatedAt(providerA);

        vm.warp(block.timestamp + 1 days);
        hayek.finalize(providerA, assertionId);

        assertGt(hayek.updatedAt(providerA), firstUpdate);
        assertEq(aggregation.epochCount(), 0);
    }

    function test_EpochRejectsEmptyReferencesAndMalformedClocks() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.unit = bytes32(0);
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.providerIncentiveRef = bytes32(0);
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.periodEnd = terms.periodStart;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.challengeUntil = terms.submissionUntil;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.maxStale = 0;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.finalizeUntil = _now64() + aggregation.MAX_EPOCH_LIFETIME() + 1;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);
    }

    function test_RosterAndQuorumBoundsAreEnforced() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.providers = new address[](1);
        terms.providers[0] = providerA;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _termsWithProviderCount(17);
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.quorum = 1;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _terms3();
        terms.quorum = 4;
        _expectCreateRevert(terms, ObservationAggregation.BadInput.selector);

        terms = _termsWithProviderCount(16);
        terms.quorum = 16;
        uint256 epochId = _create(terms);
        assertEq(aggregation.providerCount(epochId), 16);
    }

    function test_ZeroDuplicateAndRoleOverlappingProvidersAreRejectedAtomically() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.providers[1] = address(0);
        _expectCreateRevert(terms, ObservationAggregation.DuplicateProvider.selector);

        terms = _terms3();
        terms.providers[1] = terms.providers[0];
        _expectCreateRevert(terms, ObservationAggregation.DuplicateProvider.selector);

        terms = _terms3();
        terms.providers[1] = consumer;
        _expectCreateRevert(terms, ObservationAggregation.DuplicateProvider.selector);

        terms = _terms3();
        terms.providers[1] = challenger;
        _expectCreateRevert(terms, ObservationAggregation.DuplicateProvider.selector);

        assertEq(aggregation.epochCount(), 0);
    }

    function test_EpochKeyCannotReplayButChangedUnitRemainsIsolated() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        uint256 firstId = _create(terms);
        _expectCreateRevert(terms, ObservationAggregation.DuplicateEpoch.selector);

        terms.unit = keccak256("other-unit");
        uint256 secondId = _create(terms);

        assertEq(firstId, 0);
        assertEq(secondId, 1);
        assertTrue(aggregation.isEpochProvider(firstId, providerA));
        assertTrue(aggregation.isEpochProvider(secondId, providerA));
        assertTrue(aggregation.epoch(firstId).unit != aggregation.epoch(secondId).unit);
    }

    function test_OnlyRosteredProviderSubmitsOnce() public {
        uint256 epochId = _create(_terms3());
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);

        vm.expectRevert(ObservationAggregation.WrongActor.selector);
        vm.prank(outsider);
        aggregation.submitObservation(epochId, 100e18, PROVENANCE_A, item.periodEnd, 100);

        _submit(epochId, providerA, 100e18, PROVENANCE_A, 100);

        vm.expectRevert(ObservationAggregation.DuplicateObservation.selector);
        vm.prank(providerA);
        aggregation.submitObservation(epochId, 101e18, PROVENANCE_A, item.periodEnd, 100);
    }

    function test_InvalidObservationFieldsRevertWithoutConsumingProviderSlot() public {
        uint256 epochId = _create(_terms3());
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);

        _expectSubmitRevert(epochId, 0, PROVENANCE_A, item.periodEnd, 100);
        _expectSubmitRevert(epochId, 100e18, bytes32(0), item.periodEnd, 100);
        _expectSubmitRevert(epochId, 100e18, PROVENANCE_A, item.periodStart - 1, 100);
        _expectSubmitRevert(epochId, 100e18, PROVENANCE_A, item.periodEnd + 1, 100);
        _expectSubmitRevert(epochId, 100e18, PROVENANCE_A, item.periodEnd, 10_001);

        _submit(epochId, providerA, 100e18, PROVENANCE_A, 100);
        assertTrue(aggregation.observation(epochId, providerA).submitted);
    }

    function test_SubmissionAtExactDeadlineFails() public {
        uint256 epochId = _create(_terms3());
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);
        vm.warp(item.submissionUntil);

        vm.expectRevert(ObservationAggregation.Closed.selector);
        vm.prank(providerA);
        aggregation.submitObservation(epochId, 100e18, PROVENANCE_A, item.periodEnd, 100);
    }

    function test_ChallengeAuthorityClockAndHistoryAreExplicit() public {
        uint256 epochId = _create(_terms3());
        _submit(epochId, providerA, 100e18, PROVENANCE_A, 100);

        vm.expectRevert(ObservationAggregation.WrongActor.selector);
        vm.prank(outsider);
        aggregation.challengeObservation(epochId, providerA, CHALLENGE_REF);

        vm.prank(challenger);
        aggregation.challengeObservation(epochId, providerA, CHALLENGE_REF);
        ObservationAggregation.Observation memory submitted = aggregation.observation(epochId, providerA);
        assertTrue(submitted.challenged);
        assertEq(submitted.challengeRef, CHALLENGE_REF);
        assertEq(submitted.value, 100e18);

        vm.expectRevert(ObservationAggregation.WrongState.selector);
        vm.prank(challenger);
        aggregation.challengeObservation(epochId, providerA, CHALLENGE_REF);
    }

    function test_ChallengeAtExactDeadlineFails() public {
        uint256 epochId = _create(_terms3());
        _submit(epochId, providerA, 100e18, PROVENANCE_A, 100);
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);
        vm.warp(item.challengeUntil);

        vm.expectRevert(ObservationAggregation.Closed.selector);
        vm.prank(challenger);
        aggregation.challengeObservation(epochId, providerA, CHALLENGE_REF);
    }

    function test_FinalizationRequiresConsumerAndClosedChallengeWindow() public {
        uint256 epochId = _create(_terms3());
        _submitThree(epochId, 90e18, 100e18, 120e18);

        vm.expectRevert(ObservationAggregation.WrongActor.selector);
        vm.prank(outsider);
        aggregation.finalizeAggregate(epochId);

        vm.expectRevert(ObservationAggregation.TooSoon.selector);
        vm.prank(consumer);
        aggregation.finalizeAggregate(epochId);

        _warpToChallengeEnd(epochId);
        vm.prank(consumer);
        assertEq(aggregation.finalizeAggregate(epochId), 100e18);
    }

    function test_MissingChallengedAndStaleQuorumEachHalt() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.quorum = 3;
        uint256 missingEpoch = _create(terms);
        _submit(missingEpoch, providerA, 90e18, PROVENANCE_A, 100);
        _submit(missingEpoch, providerB, 100e18, PROVENANCE_B, 100);
        _warpToChallengeEnd(missingEpoch);
        _expectQuorumHalt(missingEpoch);

        terms = _terms3();
        terms.quorum = 3;
        terms.epochRef = keccak256("challenged-epoch");
        uint256 challengedEpoch = _create(terms);
        _submitThree(challengedEpoch, 90e18, 100e18, 120e18);
        vm.prank(challenger);
        aggregation.challengeObservation(challengedEpoch, providerC, CHALLENGE_REF);
        _warpToChallengeEnd(challengedEpoch);
        _expectQuorumHalt(challengedEpoch);

        terms = _terms3();
        terms.epochRef = keccak256("stale-epoch");
        terms.maxStale = 1 days;
        uint256 staleEpoch = _create(terms);
        _submitThree(staleEpoch, 90e18, 100e18, 120e18);
        _warpToChallengeEnd(staleEpoch);
        _expectQuorumHalt(staleEpoch);
    }

    function test_OddMedianOutputUncertaintyAndDigestMatchIncludedSet() public {
        uint256 epochId = _create(_terms3());
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);
        _submit(epochId, providerA, 120e18, PROVENANCE_A, 100);
        _submit(epochId, providerB, 90e18, PROVENANCE_B, 300);
        _submit(epochId, providerC, 100e18, PROVENANCE_C, 200);
        _warpToChallengeEnd(epochId);

        vm.prank(consumer);
        aggregation.finalizeAggregate(epochId);
        ObservationAggregation.AggregateOutput memory result = aggregation.output(epochId);

        bytes32 digest;
        digest = _digest(digest, providerA, aggregation.observation(epochId, providerA));
        digest = _digest(digest, providerB, aggregation.observation(epochId, providerB));
        digest = _digest(digest, providerC, aggregation.observation(epochId, providerC));
        assertEq(result.median, 100e18);
        assertEq(result.includedCount, 3);
        assertEq(result.maxUncertaintyBps, 300);
        assertEq(result.includedDigest, digest);
        assertEq(result.finalizedAt, item.challengeUntil);
    }

    function test_EvenMedianAvoidsOverflowAtMaximumValues() public {
        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.providers = new address[](2);
        terms.providers[0] = providerA;
        terms.providers[1] = providerB;
        terms.quorum = 2;
        uint256 epochId = _create(terms);
        _submit(epochId, providerA, type(uint256).max - 2, PROVENANCE_A, 100);
        _submit(epochId, providerB, type(uint256).max, PROVENANCE_B, 100);
        _warpToChallengeEnd(epochId);

        vm.prank(consumer);
        uint256 median = aggregation.finalizeAggregate(epochId);
        assertEq(median, type(uint256).max - 1);
    }

    function test_FinalizationAtDeadlineSucceedsButCannotReplayOrRunAfterExpiry() public {
        uint256 epochId = _create(_terms3());
        _submitThree(epochId, 90e18, 100e18, 120e18);
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);
        vm.warp(item.finalizeUntil);
        vm.prank(consumer);
        aggregation.finalizeAggregate(epochId);

        vm.expectRevert(ObservationAggregation.WrongState.selector);
        vm.prank(consumer);
        aggregation.finalizeAggregate(epochId);

        ObservationAggregation.EpochTerms memory terms = _terms3();
        terms.epochRef = keccak256("expired-finalization");
        uint256 expiredEpoch = _create(terms);
        _submitThree(expiredEpoch, 90e18, 100e18, 120e18);
        item = aggregation.epoch(expiredEpoch);
        vm.warp(item.finalizeUntil + 1);
        vm.expectRevert(ObservationAggregation.Closed.selector);
        vm.prank(consumer);
        aggregation.finalizeAggregate(expiredEpoch);
    }

    function test_ProviderMajorityCollusionCanMoveMedian() public {
        uint256 epochId = _create(_terms3());
        _submitThree(epochId, 100e18, 1_000e18, 1_000e18);
        _warpToChallengeEnd(epochId);

        vm.prank(consumer);
        assertEq(aggregation.finalizeAggregate(epochId), 1_000e18);
    }

    function testFuzz_BoundedRosterMedianMatchesIndependentSort(uint8 rawCount, bytes32 seed) public {
        uint8 count = uint8(bound(rawCount, 2, 8));
        ObservationAggregation.EpochTerms memory terms = _termsWithProviderCount(count);
        terms.quorum = count;
        uint256 epochId = _create(terms);
        uint256[] memory expected = new uint256[](count);
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);

        for (uint8 i = 0; i < count; i++) {
            uint256 value = uint256(keccak256(abi.encode(seed, i)));
            if (value == 0) value = 1;
            expected[i] = value;
            vm.prank(terms.providers[i]);
            aggregation.submitObservation(
                epochId, value, keccak256(abi.encode("provenance", i)), item.periodEnd, uint16(i) * 10
            );
        }
        _sort(expected);
        _warpToChallengeEnd(epochId);
        vm.prank(consumer);
        uint256 actual = aggregation.finalizeAggregate(epochId);
        uint256 wanted;
        if (count % 2 == 1) {
            wanted = expected[count / 2];
        } else {
            uint256 lower = expected[count / 2 - 1];
            uint256 upper = expected[count / 2];
            wanted = lower + (upper - lower) / 2;
        }
        assertEq(actual, wanted);
    }

    function _terms3() internal view returns (ObservationAggregation.EpochTerms memory terms) {
        address[] memory providers = new address[](3);
        providers[0] = providerA;
        providers[1] = providerB;
        providers[2] = providerC;
        terms = _baseTerms(providers);
        terms.quorum = 2;
    }

    function _termsWithProviderCount(uint8 count) internal view returns (ObservationAggregation.EpochTerms memory terms) {
        address[] memory providers = new address[](count);
        for (uint8 i = 0; i < count; i++) {
            providers[i] = _providerAddress(i);
        }
        terms = _baseTerms(providers);
        terms.quorum = count;
    }

    function _baseTerms(address[] memory providers) internal view returns (ObservationAggregation.EpochTerms memory terms) {
        uint64 now64 = _now64();
        terms = ObservationAggregation.EpochTerms({
            challenger: challenger,
            unit: UNIT,
            basket: BASKET,
            methodRef: METHOD,
            epochRef: EPOCH_REF,
            providerIncentiveRef: PROVIDER_INCENTIVE,
            challengerIncentiveRef: CHALLENGER_INCENTIVE,
            periodStart: now64 - 2 days,
            periodEnd: now64 - 1 days,
            submissionUntil: now64 + 1 days,
            challengeUntil: now64 + 2 days,
            finalizeUntil: now64 + 3 days,
            maxStale: 10 days,
            quorum: 2,
            providers: providers
        });
    }

    function _create(ObservationAggregation.EpochTerms memory terms) internal returns (uint256 epochId) {
        vm.prank(consumer);
        epochId = aggregation.createEpoch(terms);
    }

    function _submit(uint256 epochId, address provider, uint256 value, bytes32 provenanceRef, uint16 uncertaintyBps)
        internal
    {
        ObservationAggregation.Epoch memory item = aggregation.epoch(epochId);
        vm.prank(provider);
        aggregation.submitObservation(epochId, value, provenanceRef, item.periodEnd, uncertaintyBps);
    }

    function _submitThree(uint256 epochId, uint256 a, uint256 b, uint256 c) internal {
        _submit(epochId, providerA, a, PROVENANCE_A, 100);
        _submit(epochId, providerB, b, PROVENANCE_B, 100);
        _submit(epochId, providerC, c, PROVENANCE_C, 100);
    }

    function _expectCreateRevert(ObservationAggregation.EpochTerms memory terms, bytes4 selector) internal {
        vm.expectRevert(selector);
        vm.prank(consumer);
        aggregation.createEpoch(terms);
    }

    function _expectSubmitRevert(
        uint256 epochId,
        uint256 value,
        bytes32 provenanceRef,
        uint64 observedAt,
        uint16 uncertaintyBps
    ) internal {
        vm.expectRevert(ObservationAggregation.BadInput.selector);
        vm.prank(providerA);
        aggregation.submitObservation(epochId, value, provenanceRef, observedAt, uncertaintyBps);
    }

    function _expectQuorumHalt(uint256 epochId) internal {
        vm.expectRevert(ObservationAggregation.QuorumUnavailable.selector);
        vm.prank(consumer);
        aggregation.finalizeAggregate(epochId);
    }

    function _warpToChallengeEnd(uint256 epochId) internal {
        vm.warp(aggregation.epoch(epochId).challengeUntil);
    }

    function _digest(bytes32 previous, address provider, ObservationAggregation.Observation memory submitted)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                previous,
                provider,
                submitted.value,
                submitted.provenanceRef,
                submitted.observedAt,
                submitted.submittedAt,
                submitted.uncertaintyBps
            )
        );
    }

    function _providerAddress(uint8 index) internal pure returns (address) {
        uint256 raw = uint256(index) + 1_000;
        require(raw <= type(uint160).max, "test provider overflow");
        // The explicit bound above makes the narrowing cast safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return address(uint160(raw));
    }

    function _now64() internal view returns (uint64) {
        require(block.timestamp <= type(uint64).max, "test timestamp overflow");
        // The explicit bound above makes the narrowing cast safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }

    function _sort(uint256[] memory values) internal pure {
        for (uint256 i = 1; i < values.length; i++) {
            uint256 key = values[i];
            uint256 cursor = i;
            while (cursor > 0 && values[cursor - 1] > key) {
                values[cursor] = values[cursor - 1];
                cursor--;
            }
            values[cursor] = key;
        }
    }
}
