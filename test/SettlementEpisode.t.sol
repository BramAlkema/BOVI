// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {ModePermissionGate} from "../contracts/ModePermissionGate.sol";
import {BilateralModeAgreement} from "../contracts/BilateralModeAgreement.sol";
import {SignedPositionLedger} from "../contracts/SignedPositionLedger.sol";
import {SettlementEpisode} from "../contracts/SettlementEpisode.sol";

contract SettlementEpisodeTest is Test {
    ModePermissionGate internal legacyModes;
    BilateralModeAgreement internal modes;
    SignedPositionLedger internal ledger;
    SettlementEpisode internal settlement;

    address internal payer = makeAddr("payer");
    address internal payee = makeAddr("payee");
    address internal operator = makeAddr("operator");
    address internal outsider = makeAddr("outsider");

    bytes32 internal constant DOMAIN = keccak256("market:local");
    bytes32 internal constant OTHER_DOMAIN = keccak256("market:other");
    bytes32 internal constant PURPOSE = keccak256("meal");
    bytes32 internal constant OTHER_PURPOSE = keccak256("tip");

    function setUp() public {
        legacyModes = new ModePermissionGate();
        modes = new BilateralModeAgreement();
        ledger = new SignedPositionLedger();
        settlement = new SettlementEpisode(ledger, modes);
    }

    function _agreement(BilateralModeAgreement.Mode declaredMode, bytes32 purpose) internal returns (uint256 id) {
        vm.prank(payer);
        id = modes.propose(
            payee, DOMAIN, purpose, declaredMode, uint64(block.timestamp), uint64(block.timestamp + 7 days), 0
        );
        vm.prank(payee);
        modes.accept(id);
    }

    function _grant(address owner, address grantee, uint256 maxPerPost, uint256 allowance) internal {
        vm.prank(owner);
        ledger.setPostingGrant(
            grantee, address(modes), DOMAIN, uint64(block.timestamp + 7 days), maxPerPost, allowance, true
        );
    }

    function _request(
        bytes32 postingRef,
        uint256 agreementId,
        bytes32 purpose,
        address from,
        address to,
        uint256 amount
    ) internal view returns (SignedPositionLedger.PostingRequest memory) {
        return SignedPositionLedger.PostingRequest({
            postingRef: postingRef,
            episodeId: 77,
            modeAgreementId: agreementId,
            modeRegistry: address(modes),
            domain: DOMAIN,
            purpose: purpose,
            from: from,
            to: to,
            amount: amount
        });
    }

    function _episode(uint256 agreementId, uint256 price, uint256 tolerance) internal returns (uint256 id) {
        vm.prank(payer);
        id = settlement.propose(payee, agreementId, DOMAIN, PURPOSE, price, tolerance, uint64(block.timestamp + 2 days));
        vm.prank(payee);
        settlement.activate(id);
    }

    function _offer(uint256 episodeId, uint256 amount, uint256 tip) internal returns (uint256 offerId) {
        vm.prank(payer);
        offerId = settlement.offerTender(episodeId, amount, tip);
    }

    function _accept(uint256 episodeId, uint256 offerId, uint256 amount, string memory salt) internal {
        vm.prank(payee);
        settlement.acceptTender(episodeId, offerId, amount, keccak256(bytes(salt)));
    }

    function test_legacyFiskeRemainsPairGlobalCompatibilityOnly() public {
        vm.prank(payer);
        legacyModes.declare(payee, ModePermissionGate.Mode.Immediate);
        assertTrue(legacyModes.isImmediate(payer, payee));

        vm.prank(payee);
        legacyModes.declare(payer, ModePermissionGate.Mode.Value);
        assertEq(uint256(legacyModes.mode(payer, payee)), uint256(ModePermissionGate.Mode.Value));

        vm.prank(payer);
        vm.expectRevert();
        settlement.propose(payee, 1, DOMAIN, PURPOSE, 10, 0, uint64(block.timestamp + 1 days));
    }

    function test_modeProposalNeedsCounterpartyAndSupportsConcurrentScopes() public {
        vm.prank(payer);
        uint256 meal = modes.propose(
            payee,
            DOMAIN,
            PURPOSE,
            BilateralModeAgreement.Mode.Value,
            uint64(block.timestamp),
            uint64(block.timestamp + 2 days),
            0
        );
        assertEq(uint256(modes.status(meal)), uint256(BilateralModeAgreement.Status.Proposed));

        vm.prank(outsider);
        vm.expectRevert(BilateralModeAgreement.WrongParty.selector);
        modes.accept(meal);

        vm.prank(payee);
        modes.accept(meal);

        uint256 tip = _agreement(BilateralModeAgreement.Mode.Balanced, OTHER_PURPOSE);
        assertEq(uint256(modes.status(meal)), uint256(BilateralModeAgreement.Status.Active));
        assertEq(uint256(modes.status(tip)), uint256(BilateralModeAgreement.Status.Active));
        modes.requirePostable(meal, payer, payee, DOMAIN, PURPOSE);
        modes.requirePostable(tip, payer, payee, DOMAIN, OTHER_PURPOSE);
    }

    function test_immediateAndScopeMismatchAreNotPostable() public {
        uint256 immediate = _agreement(BilateralModeAgreement.Mode.Immediate, PURPOSE);
        vm.expectRevert(BilateralModeAgreement.NotPostable.selector);
        modes.requirePostable(immediate, payer, payee, DOMAIN, PURPOSE);

        uint256 value = _agreement(BilateralModeAgreement.Mode.Value, OTHER_PURPOSE);
        vm.expectRevert(BilateralModeAgreement.WrongScope.selector);
        modes.requirePostable(value, payer, payee, DOMAIN, PURPOSE);
    }

    function test_rejectedReplacementDoesNotSupersedePredecessor() public {
        uint256 original = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);

        vm.prank(payer);
        uint256 replacement = modes.propose(
            payee,
            DOMAIN,
            PURPOSE,
            BilateralModeAgreement.Mode.Balanced,
            uint64(block.timestamp),
            uint64(block.timestamp + 3 days),
            original
        );
        vm.prank(payee);
        modes.reject(replacement);

        assertEq(uint256(modes.status(original)), uint256(BilateralModeAgreement.Status.Active));
        assertEq(uint256(modes.status(replacement)), uint256(BilateralModeAgreement.Status.Rejected));
        modes.requirePostable(original, payer, payee, DOMAIN, PURPOSE);
    }

    function test_acceptedReplacementSupersedesAndCancellationIsBilateral() public {
        uint256 original = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        vm.prank(payer);
        uint256 replacement = modes.propose(
            payee,
            DOMAIN,
            PURPOSE,
            BilateralModeAgreement.Mode.Obligated,
            uint64(block.timestamp),
            uint64(block.timestamp + 3 days),
            original
        );
        vm.prank(payee);
        modes.accept(replacement);
        assertEq(uint256(modes.status(original)), uint256(BilateralModeAgreement.Status.Superseded));

        vm.prank(payer);
        modes.requestCancellation(replacement);
        vm.prank(payer);
        vm.expectRevert(BilateralModeAgreement.WrongParty.selector);
        modes.acceptCancellation(replacement);
        vm.prank(payee);
        modes.acceptCancellation(replacement);
        assertEq(uint256(modes.status(replacement)), uint256(BilateralModeAgreement.Status.Cancelled));
    }

    function test_expiredAgreementCannotPost() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        vm.warp(block.timestamp + 8 days);
        assertEq(uint256(modes.status(agreementId)), uint256(BilateralModeAgreement.Status.Expired));
        vm.expectRevert(BilateralModeAgreement.WrongState.selector);
        modes.requirePostable(agreementId, payer, payee, DOMAIN, PURPOSE);
    }

    function test_proposedRejectedAndCancelledAgreementsCannotPost() public {
        vm.prank(payer);
        uint256 proposed = modes.propose(
            payee,
            DOMAIN,
            PURPOSE,
            BilateralModeAgreement.Mode.Value,
            uint64(block.timestamp),
            uint64(block.timestamp + 2 days),
            0
        );
        vm.expectRevert(BilateralModeAgreement.WrongState.selector);
        modes.requirePostable(proposed, payer, payee, DOMAIN, PURPOSE);

        vm.prank(payee);
        modes.reject(proposed);
        vm.expectRevert(BilateralModeAgreement.WrongState.selector);
        modes.requirePostable(proposed, payer, payee, DOMAIN, PURPOSE);

        vm.prank(payer);
        uint256 cancelled = modes.propose(
            payee,
            DOMAIN,
            PURPOSE,
            BilateralModeAgreement.Mode.Value,
            uint64(block.timestamp),
            uint64(block.timestamp + 2 days),
            0
        );
        vm.prank(payer);
        modes.cancelProposal(cancelled);
        vm.expectRevert(BilateralModeAgreement.WrongState.selector);
        modes.requirePostable(cancelled, payer, payee, DOMAIN, PURPOSE);
    }

    function test_postingConservesAndTracksKnownGrossClaims() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        _grant(payer, operator, 100, 100);

        vm.prank(operator);
        ledger.postFrom(_request(keccak256("post:1"), agreementId, PURPOSE, payer, payee, 40));

        assertEq(ledger.positionV2(payer), -40);
        assertEq(ledger.positionV2(payee), 40);
        assertEq(ledger.netPositionsV2(), 0);
        assertEq(ledger.grossClaimsV2(), 40);
        SignedPositionLedger.PostingGrant memory grant = ledger.postingGrant(payer, operator, address(modes), DOMAIN);
        assertEq(grant.remaining, 60);
    }

    function testFuzz_postingConservation(uint128 rawAmount) public {
        uint256 amount = bound(uint256(rawAmount), 1, 1e30);
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        _grant(payer, operator, amount, amount);
        vm.prank(operator);
        ledger.postFrom(_request(keccak256("fuzz"), agreementId, PURPOSE, payer, payee, amount));
        assertEq(ledger.netPositionsV2(), 0);
        assertEq(ledger.grossClaimsV2(), amount);
    }

    function test_grantScopeExpiryRevocationAndLimitsAreEnforced() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        _grant(payer, operator, 25, 30);

        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.PostingGrantExceeded.selector);
        ledger.postFrom(_request(keccak256("too-large"), agreementId, PURPOSE, payer, payee, 26));

        vm.prank(operator);
        ledger.postFrom(_request(keccak256("within"), agreementId, PURPOSE, payer, payee, 20));
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.PostingGrantExceeded.selector);
        ledger.postFrom(_request(keccak256("cumulative"), agreementId, PURPOSE, payer, payee, 11));

        vm.prank(payer);
        ledger.setPostingGrant(operator, address(modes), DOMAIN, 0, 0, 0, false);
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.PostingGrantInactive.selector);
        ledger.postFrom(_request(keccak256("revoked"), agreementId, PURPOSE, payer, payee, 1));
    }

    function test_wrongOperatorDomainExpiredAndMalformedPostingFail() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        _grant(payer, operator, 10, 10);

        vm.prank(outsider);
        vm.expectRevert(SignedPositionLedger.PostingGrantInactive.selector);
        ledger.postFrom(_request(keccak256("wrong-operator"), agreementId, PURPOSE, payer, payee, 1));

        vm.prank(payer);
        ledger.setPostingGrant(operator, address(modes), OTHER_DOMAIN, uint64(block.timestamp + 1 days), 10, 10, true);
        SignedPositionLedger.PostingRequest memory wrongDomain =
            _request(keccak256("wrong-domain"), agreementId, PURPOSE, payer, payee, 1);
        wrongDomain.domain = OTHER_DOMAIN;
        vm.prank(operator);
        vm.expectRevert(BilateralModeAgreement.WrongScope.selector);
        ledger.postFrom(wrongDomain);

        vm.warp(block.timestamp + 2 days);
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.PostingGrantInactive.selector);
        ledger.postFrom(wrongDomain);

        SignedPositionLedger.PostingRequest memory malformed =
            _request(keccak256("self"), agreementId, PURPOSE, payer, payer, 1);
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.InvalidPosting.selector);
        ledger.postFrom(malformed);
    }

    function test_failedPostConsumesNeitherReferenceNorAllowanceAndReplayFails() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        _grant(payer, operator, 50, 50);
        bytes32 postingRef = keccak256("reusable-after-failure");

        vm.prank(operator);
        vm.expectRevert(BilateralModeAgreement.WrongScope.selector);
        ledger.postFrom(_request(postingRef, agreementId, OTHER_PURPOSE, payer, payee, 10));
        assertFalse(ledger.postingRefUsed(postingRef));
        assertEq(ledger.postingGrant(payer, operator, address(modes), DOMAIN).remaining, 50);

        vm.prank(operator);
        ledger.postFrom(_request(postingRef, agreementId, PURPOSE, payer, payee, 10));
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.InvalidPosting.selector);
        ledger.postFrom(_request(postingRef, agreementId, PURPOSE, payer, payee, 1));
    }

    function test_positionAndCastBoundsRejectBeforeMutation() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 maximum = ledger.MAX_POSITION_V2();
        _grant(payer, operator, maximum, maximum);
        vm.prank(operator);
        ledger.postFrom(_request(keccak256("maximum"), agreementId, PURPOSE, payer, payee, maximum));

        _grant(payer, operator, 1, 1);
        vm.prank(operator);
        vm.expectRevert(SignedPositionLedger.PositionBoundExceeded.selector);
        ledger.postFrom(_request(keccak256("over-position"), agreementId, PURPOSE, payer, payee, 1));

        assertEq(ledger.positionV2(payee), int256(maximum));
        assertEq(ledger.netPositionsV2(), 0);
    }

    function test_legacyWritesAndOverlaysCannotMutateV2Genesis() public {
        ledger.admit(payer);
        ledger.admit(payee);
        ledger.setCreditLimit(payer, 100);
        vm.prank(payer);
        ledger.pay(payee, 25);

        assertEq(ledger.balance(payer), -25);
        assertEq(ledger.positionV2(payer), 0);
        assertEq(ledger.positionV2(payee), 0);
        assertEq(ledger.netPositionsV2(), 0);
        assertEq(ledger.grossClaimsV2(), 0);
    }

    function test_exactTenderNeedsOfferPayeeAcceptanceAndExplicitDischarge() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 2);
        _grant(payer, address(settlement), 100, 100);

        uint256 offerId = _offer(episodeId, 100, 0);
        assertEq(ledger.positionV2(payee), 0);
        _accept(episodeId, offerId, 100, "exact");

        SettlementEpisode.Episode memory item = settlement.episode(episodeId);
        assertEq(item.outstanding, 0);
        assertEq(item.changeDue, 0);
        assertEq(ledger.positionV2(payee), 100);
        assertEq(uint256(item.status), uint256(SettlementEpisode.Status.TenderAccepted));

        vm.prank(payee);
        settlement.acknowledgeDischarge(episodeId);
        assertEq(uint256(settlement.episode(episodeId).status), uint256(SettlementEpisode.Status.Discharged));
    }

    function test_episodeNeedsNamedPayeeActivation() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        vm.prank(payer);
        uint256 episodeId =
            settlement.propose(payee, agreementId, DOMAIN, PURPOSE, 100, 0, uint64(block.timestamp + 1 days));
        vm.prank(outsider);
        vm.expectRevert(SettlementEpisode.WrongParty.selector);
        settlement.activate(episodeId);
        assertEq(uint256(settlement.episode(episodeId).status), uint256(SettlementEpisode.Status.Proposed));
    }

    function test_underpaymentCannotDischargeWithoutWaiverOrRounding() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 5);
        _grant(payer, address(settlement), 100, 100);
        uint256 offerId = _offer(episodeId, 97, 0);
        _accept(episodeId, offerId, 97, "under");

        vm.prank(payee);
        vm.expectRevert(SettlementEpisode.UnresolvedResidual.selector);
        settlement.acknowledgeDischarge(episodeId);
        vm.prank(payee);
        settlement.roundOutstanding(episodeId);
        vm.prank(payee);
        settlement.acknowledgeDischarge(episodeId);
    }

    function test_payeeMayExplicitlyWaiveOutstanding() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Balanced, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 90, 90);
        uint256 offerId = _offer(episodeId, 90, 0);
        _accept(episodeId, offerId, 90, "waiver");

        vm.prank(payee);
        settlement.waiveOutstanding(episodeId, 10);
        assertEq(settlement.episode(episodeId).waivedTotal, 10);
    }

    function test_overpaymentIsChangeUnlessTipWasDeclaredBeforeAcceptance() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 120, 120);
        uint256 offerId = _offer(episodeId, 110, 0);
        _accept(episodeId, offerId, 110, "change");

        SettlementEpisode.Episode memory item = settlement.episode(episodeId);
        assertEq(item.changeDue, 10);
        assertEq(item.tippedTotal, 0);
        vm.prank(payee);
        vm.expectRevert(SettlementEpisode.UnresolvedResidual.selector);
        settlement.acknowledgeDischarge(episodeId);

        uint256 tippedEpisode = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 110, 110);
        uint256 tippedOffer = _offer(tippedEpisode, 110, 10);
        _accept(tippedEpisode, tippedOffer, 110, "tip");
        item = settlement.episode(tippedEpisode);
        assertEq(item.changeDue, 0);
        assertEq(item.tippedTotal, 10);
    }

    function test_changeReturnNeedsPayeeGrantAndCreatesReversePosting() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 110, 110);
        uint256 offerId = _offer(episodeId, 110, 0);
        _accept(episodeId, offerId, 110, "overpay");

        vm.prank(payee);
        vm.expectRevert(SignedPositionLedger.PostingGrantInactive.selector);
        settlement.returnChange(episodeId, 10, keccak256("return-fails"));
        assertEq(settlement.episode(episodeId).changeDue, 10);

        _grant(payee, address(settlement), 10, 10);
        vm.prank(payee);
        settlement.returnChange(episodeId, 10, keccak256("return"));
        assertEq(ledger.positionV2(payee), 100);
        assertEq(ledger.positionV2(payer), -100);
        assertEq(settlement.episode(episodeId).changeDue, 0);
    }

    function test_payerMayExplicitlyRoundChangeWithinActivatedTolerance() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 2);
        _grant(payer, address(settlement), 102, 102);
        uint256 offerId = _offer(episodeId, 102, 0);
        _accept(episodeId, offerId, 102, "round-change");

        vm.prank(payee);
        vm.expectRevert(SettlementEpisode.WrongParty.selector);
        settlement.roundChange(episodeId);
        vm.prank(payer);
        settlement.roundChange(episodeId);
        assertEq(settlement.episode(episodeId).changeDue, 0);
        assertEq(settlement.episode(episodeId).roundedTotal, 2);
    }

    function test_partialTendersAccumulateWithoutDoubleCounting() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Obligated, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 100, 100);
        uint256 first = _offer(episodeId, 40, 0);
        uint256 second = _offer(episodeId, 60, 0);
        _accept(episodeId, first, 40, "partial:1");
        _accept(episodeId, second, 60, "partial:2");

        SettlementEpisode.Episode memory item = settlement.episode(episodeId);
        assertEq(item.offeredTotal, 100);
        assertEq(item.acceptedTotal, 100);
        assertEq(item.outstanding, 0);
        assertEq(ledger.grossClaimsV2(), 100);
    }

    function test_cancellationAndExpiryPreservePriorPostings() public {
        uint256 agreementId = _agreement(BilateralModeAgreement.Mode.Value, PURPOSE);
        uint256 episodeId = _episode(agreementId, 100, 0);
        _grant(payer, address(settlement), 50, 50);
        uint256 offerId = _offer(episodeId, 50, 0);
        _accept(episodeId, offerId, 50, "before-cancel");

        vm.prank(payer);
        settlement.requestCancellation(episodeId);
        vm.prank(payee);
        settlement.acceptCancellation(episodeId);
        assertEq(ledger.positionV2(payee), 50);
        assertEq(uint256(settlement.episode(episodeId).status), uint256(SettlementEpisode.Status.Cancelled));

        uint256 expiring = _episode(agreementId, 20, 0);
        _grant(payer, address(settlement), 20, 20);
        uint256 expiringOffer = _offer(expiring, 20, 0);
        _accept(expiring, expiringOffer, 20, "before-expiry");
        vm.warp(block.timestamp + 3 days);
        settlement.expire(expiring);
        assertEq(ledger.positionV2(payee), 70);
        assertEq(uint256(settlement.episode(expiring).status), uint256(SettlementEpisode.Status.Expired));
    }
}
