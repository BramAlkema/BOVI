// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {BilateralTermsSchedule} from "../contracts/BilateralTermsSchedule.sol";

contract BilateralTermsScheduleTest is Test {
    BilateralTermsSchedule internal lifecycle;

    address internal debtor = makeAddr("debtor");
    address internal creditor = makeAddr("creditor");
    address internal outsider = makeAddr("outsider");

    bytes32 internal constant DOMAIN = keccak256("housing:lease");
    bytes32 internal constant PURPOSE = keccak256("scheduled-use");
    bytes32 internal constant UNIT = keccak256("nominal:euro");
    bytes32 internal constant BASKET = keccak256("basket:local-cpi");

    function setUp() public {
        vm.warp(1_000_000);
        lifecycle = new BilateralTermsSchedule();
    }

    function _terms(bytes32 key) internal view returns (BilateralTermsSchedule.Terms memory terms) {
        terms = BilateralTermsSchedule.Terms({
            creditor: creditor,
            termsKey: key,
            domain: DOMAIN,
            purpose: PURPOSE,
            unit: UNIT,
            basket: BASKET,
            termsRef: keccak256("terms:v1"),
            performanceMethodRef: keccak256("performance:bank-transfer"),
            referenceAmount: uint128(100e18),
            startAt: uint64(block.timestamp + 2 days),
            period: uint64(30 days),
            maxObservationAge: uint64(7 days),
            gracePeriod: uint64(5 days),
            proposalValidUntil: uint64(block.timestamp + 1 days),
            periodCount: 12
        });
    }

    function _propose(bytes32 key) internal returns (uint256 id) {
        BilateralTermsSchedule.Terms memory terms = _terms(key);
        vm.prank(debtor);
        id = lifecycle.propose(terms);
    }

    function _active(bytes32 key) internal returns (uint256 id) {
        id = _propose(key);
        vm.prank(creditor);
        lifecycle.acceptObligation(id);
    }

    function _open(uint256 obligationId, uint32 periodNumber) internal returns (uint256 episodeId) {
        uint64 dueAt = lifecycle.scheduledDueAt(obligationId, periodNumber);
        vm.warp(dueAt);
        vm.prank(debtor);
        episodeId = lifecycle.openPeriod(obligationId, periodNumber);
    }

    function _acceptedSnapshot(uint256 episodeId, uint128 level) internal returns (uint256 snapshotId) {
        vm.prank(debtor);
        snapshotId = lifecycle.proposeSnapshot(
            episodeId,
            UNIT,
            BASKET,
            level,
            uint64(block.timestamp),
            uint64(block.timestamp + 1 days),
            keccak256(abi.encode("observation", episodeId, level)),
            keccak256("provenance:publisher-record")
        );
        vm.prank(creditor);
        lifecycle.acceptSnapshot(snapshotId);
    }

    function test_proposalRequiresTypedTermsDistinctRolesAndUniqueKey() public {
        BilateralTermsSchedule.Terms memory terms = _terms(keccak256("terms-key"));
        terms.creditor = debtor;
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidTerms.selector);
        lifecycle.propose(terms);

        terms = _terms(keccak256("terms-key"));
        vm.prank(debtor);
        lifecycle.propose(terms);
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.Duplicate.selector);
        lifecycle.propose(terms);

        terms = _terms(keccak256("expired"));
        terms.proposalValidUntil = uint64(block.timestamp - 1);
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidTerms.selector);
        lifecycle.propose(terms);

        terms = _terms(keccak256("schedule-overflow"));
        terms.startAt = type(uint64).max - 1 days;
        terms.proposalValidUntil = uint64(block.timestamp + 1 days);
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidTerms.selector);
        lifecycle.propose(terms);
    }

    function test_onlyCreditorActivatesOrRejectsAndDebtorOnlyCancelsBeforeActivation() public {
        uint256 proposed = _propose(keccak256("activate"));
        vm.prank(outsider);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.acceptObligation(proposed);

        vm.prank(creditor);
        lifecycle.acceptObligation(proposed);
        assertEq(uint256(lifecycle.obligationStatus(proposed)), uint256(BilateralTermsSchedule.ObligationStatus.Active));
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.WrongState.selector);
        lifecycle.cancelProposal(proposed);

        uint256 rejected = _propose(keccak256("reject"));
        vm.prank(creditor);
        lifecycle.rejectObligation(rejected);
        assertEq(uint256(lifecycle.obligationStatus(rejected)), uint256(BilateralTermsSchedule.ObligationStatus.Rejected));

        uint256 cancelled = _propose(keccak256("cancel"));
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.cancelProposal(cancelled);
        vm.prank(debtor);
        lifecycle.cancelProposal(cancelled);
    }

    function test_acceptanceExpiresAndCannotOccurAtFirstDueDate() public {
        uint256 id = _propose(keccak256("late-acceptance"));
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.Expired.selector);
        lifecycle.acceptObligation(id);
    }

    function test_missedPeriodsOpenIndependentlyWithoutErasure() public {
        uint256 id = _active(keccak256("calendar"));
        vm.warp(lifecycle.scheduledDueAt(id, 3));

        vm.prank(creditor);
        uint256 third = lifecycle.openPeriod(id, 3);
        vm.prank(debtor);
        uint256 first = lifecycle.openPeriod(id, 0);
        assertTrue(first != third);
        assertEq(lifecycle.episodeForPeriod(id, 0), first);
        assertEq(lifecycle.episodeForPeriod(id, 3), third);
        assertEq(lifecycle.episodeForPeriod(id, 1), 0);

        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.Duplicate.selector);
        lifecycle.openPeriod(id, 3);
    }

    function test_periodCannotOpenEarlyOutsideScheduleOrByOutsider() public {
        uint256 id = _active(keccak256("period-guards"));
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.TooEarly.selector);
        lifecycle.openPeriod(id, 0);

        vm.warp(lifecycle.scheduledDueAt(id, 0));
        vm.prank(outsider);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.openPeriod(id, 0);

        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidTerms.selector);
        lifecycle.openPeriod(id, 12);
    }

    function test_snapshotNeedsMatchingTypeFreshnessAndCounterparty() public {
        uint256 episodeId = _open(_active(keccak256("snapshot-guards")), 0);
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidObservation.selector);
        lifecycle.proposeSnapshot(
            episodeId,
            keccak256("wrong-unit"),
            BASKET,
            uint128(1e18),
            uint64(block.timestamp),
            uint64(block.timestamp + 1 days),
            keccak256("observation"),
            keccak256("provenance")
        );

        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidObservation.selector);
        lifecycle.proposeSnapshot(
            episodeId,
            UNIT,
            BASKET,
            uint128(1e18),
            uint64(block.timestamp - 8 days),
            uint64(block.timestamp + 1 days),
            keccak256("stale-observation"),
            keccak256("provenance")
        );

        vm.prank(creditor);
        uint256 snapshotId = lifecycle.proposeSnapshot(
            episodeId,
            UNIT,
            BASKET,
            uint128(12e17),
            uint64(block.timestamp),
            uint64(block.timestamp + 1 days),
            keccak256("fresh-observation"),
            keccak256("provenance")
        );
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.acceptSnapshot(snapshotId);
        vm.prank(debtor);
        lifecycle.acceptSnapshot(snapshotId);
    }

    function test_snapshotAcceptanceRechecksExpiryAndPreservesRejectedHistory() public {
        uint256 episodeId = _open(_active(keccak256("snapshot-history")), 0);
        vm.prank(debtor);
        uint256 rejected = lifecycle.proposeSnapshot(
            episodeId,
            UNIT,
            BASKET,
            uint128(1e18),
            uint64(block.timestamp),
            uint64(block.timestamp + 1 days),
            keccak256("rejected-observation"),
            keccak256("provenance")
        );
        vm.prank(creditor);
        lifecycle.rejectSnapshot(rejected);
        assertEq(uint256(lifecycle.snapshotStatus(rejected)), uint256(BilateralTermsSchedule.ProposalStatus.Rejected));

        vm.prank(debtor);
        uint256 expired = lifecycle.proposeSnapshot(
            episodeId,
            UNIT,
            BASKET,
            uint128(1e18),
            uint64(block.timestamp),
            uint64(block.timestamp),
            keccak256("expiring-observation"),
            keccak256("provenance")
        );
        vm.warp(block.timestamp + 1);
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.InvalidObservation.selector);
        lifecycle.acceptSnapshot(expired);
    }

    function test_maximumWidthIndexMathAndRoundingAreDeterministic() public {
        BilateralTermsSchedule.Terms memory terms = _terms(keccak256("maximum-math"));
        terms.referenceAmount = type(uint128).max;
        vm.prank(debtor);
        uint256 id = lifecycle.propose(terms);
        vm.prank(creditor);
        lifecycle.acceptObligation(id);
        uint256 episodeId = _open(id, 0);
        _acceptedSnapshot(episodeId, type(uint128).max);

        uint256 product = uint256(type(uint128).max) * uint256(type(uint128).max);
        (uint256 dueAmount, uint256 remainder,,,,) = lifecycle.periodAccounting(episodeId);
        assertEq(dueAmount, product / 1e18);
        assertEq(remainder, product % 1e18);
    }

    function test_tenderDoesNotReduceResidualUntilCreditorAcknowledges() public {
        uint256 episodeId = _open(_active(keccak256("partial-tender")), 0);
        _acceptedSnapshot(episodeId, uint128(1e18));
        assertEq(lifecycle.residual(episodeId), 100e18);

        vm.prank(debtor);
        uint256 tenderId = lifecycle.proposeTender(
            episodeId,
            40e18,
            uint64(block.timestamp + 1 days),
            keccak256("instrument"),
            keccak256("claimed-performance")
        );
        assertEq(lifecycle.residual(episodeId), 100e18);
        vm.prank(creditor);
        lifecycle.acknowledgePerformance(tenderId);
        assertEq(lifecycle.residual(episodeId), 60e18);
    }

    function test_rejectedAndConcurrentTendersCannotEraseResidual() public {
        uint256 episodeId = _open(_active(keccak256("tender-history")), 0);
        _acceptedSnapshot(episodeId, uint128(1e18));

        vm.startPrank(debtor);
        uint256 first = lifecycle.proposeTender(
            episodeId, 70e18, uint64(block.timestamp + 1 days), keccak256("instrument:a"), keccak256("performance:a")
        );
        uint256 second = lifecycle.proposeTender(
            episodeId, 70e18, uint64(block.timestamp + 1 days), keccak256("instrument:b"), keccak256("performance:b")
        );
        vm.stopPrank();

        vm.prank(creditor);
        lifecycle.acknowledgePerformance(first);
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.InvalidAmount.selector);
        lifecycle.acknowledgePerformance(second);
        assertEq(lifecycle.residual(episodeId), 30e18);

        vm.prank(creditor);
        lifecycle.rejectTender(second);
        assertEq(uint256(lifecycle.tenderStatus(second)), uint256(BilateralTermsSchedule.ProposalStatus.Rejected));
        assertEq(lifecycle.residual(episodeId), 30e18);
    }

    function test_onlyCreditorExplicitlyForgivesResidual() public {
        uint256 episodeId = _open(_active(keccak256("forgiveness")), 0);
        _acceptedSnapshot(episodeId, uint128(1e18));
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.forgive(episodeId, 10e18, keccak256("forgiveness"));

        vm.prank(creditor);
        lifecycle.forgive(episodeId, 10e18, keccak256("forgiveness"));
        assertEq(lifecycle.residual(episodeId), 90e18);
    }

    function test_cureIsBoundedBilateralAndDoesNotReduceResidual() public {
        uint256 episodeId = _open(_active(keccak256("cure")), 0);
        _acceptedSnapshot(episodeId, uint128(1e18));
        uint64 ordinary = lifecycle.arrearsAt(episodeId);

        vm.prank(debtor);
        uint256 cureId = lifecycle.proposeCure(
            episodeId, ordinary + 30 days, uint64(block.timestamp + 1 days), keccak256("cure:extension")
        );
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.acceptCure(cureId);
        vm.prank(creditor);
        lifecycle.acceptCure(cureId);

        assertEq(lifecycle.arrearsAt(episodeId), ordinary + 30 days);
        assertEq(lifecycle.residual(episodeId), 100e18);
        assertEq(uint256(lifecycle.cureStatus(cureId)), uint256(BilateralTermsSchedule.ProposalStatus.Accepted));

        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.InvalidTerms.selector);
        lifecycle.proposeCure(
            episodeId, ordinary + 366 days, uint64(block.timestamp + 1 days), keccak256("cure:too-long")
        );
    }

    function test_arrearsNeedsSnapshotResidualAndExpiredGraceOrCureClock() public {
        uint256 episodeId = _open(_active(keccak256("arrears")), 0);
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.WrongState.selector);
        lifecycle.reportArrears(episodeId);

        _acceptedSnapshot(episodeId, uint128(1e18));
        vm.prank(creditor);
        vm.expectRevert(BilateralTermsSchedule.WrongState.selector);
        lifecycle.reportArrears(episodeId);

        vm.warp(lifecycle.arrearsAt(episodeId) + 1);
        assertTrue(lifecycle.isArrears(episodeId));
        vm.prank(debtor);
        assertEq(lifecycle.reportArrears(episodeId), 100e18);

        vm.prank(creditor);
        lifecycle.forgive(episodeId, 100e18, keccak256("full-forgiveness"));
        assertFalse(lifecycle.isArrears(episodeId));
    }

    function test_terminationIsBilateralBlocksFuturePeriodsAndPreservesDuePeriods() public {
        uint256 id = _active(keccak256("termination"));
        uint64 firstDue = lifecycle.scheduledDueAt(id, 0);
        vm.warp(firstDue + 1 hours);
        vm.prank(debtor);
        uint256 proposalId =
            lifecycle.proposeTermination(id, uint64(block.timestamp + 1 days), keccak256("termination:mutual"));
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.WrongParty.selector);
        lifecycle.acceptTermination(proposalId);
        vm.prank(creditor);
        lifecycle.acceptTermination(proposalId);

        assertEq(uint256(lifecycle.obligationStatus(id)), uint256(BilateralTermsSchedule.ObligationStatus.Terminated));
        vm.prank(creditor);
        uint256 historical = lifecycle.openPeriod(id, 0);
        assertTrue(historical != 0);

        vm.warp(lifecycle.scheduledDueAt(id, 1));
        vm.prank(debtor);
        vm.expectRevert(BilateralTermsSchedule.WrongState.selector);
        lifecycle.openPeriod(id, 1);
    }

    function testFuzz_referenceAndIndexMultiplicationStayExact(uint128 referenceAmount, uint128 indexLevel) public {
        referenceAmount = uint128(bound(referenceAmount, 1e18, type(uint128).max));
        indexLevel = uint128(bound(indexLevel, 1e18, type(uint128).max));
        BilateralTermsSchedule.Terms memory terms = _terms(keccak256(abi.encode(referenceAmount, indexLevel)));
        terms.referenceAmount = referenceAmount;
        vm.prank(debtor);
        uint256 id = lifecycle.propose(terms);
        vm.prank(creditor);
        lifecycle.acceptObligation(id);
        uint256 episodeId = _open(id, 0);
        _acceptedSnapshot(episodeId, indexLevel);

        uint256 product = uint256(referenceAmount) * uint256(indexLevel);
        (uint256 dueAmount, uint256 remainder,,,,) = lifecycle.periodAccounting(episodeId);
        assertEq(dueAmount, product / 1e18);
        assertEq(remainder, product % 1e18);
    }
}
