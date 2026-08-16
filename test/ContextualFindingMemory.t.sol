// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReputationMemory} from "../contracts/ReputationMemory.sol";

contract ContextualFindingMemoryTest is Test {
    ReputationMemory internal greif;

    address internal subject = makeAddr("subject");
    address internal reporter = makeAddr("reporter");
    address internal outsider = makeAddr("outsider");
    address internal consumer = makeAddr("consumer");
    address internal rotatedSubject = makeAddr("rotated-subject");

    bytes32 internal constant DOMAIN = keccak256("housing-coop");
    bytes32 internal constant OTHER_DOMAIN = keccak256("food-coop");
    bytes32 internal constant PURPOSE = keccak256("maintenance-shift");
    bytes32 internal constant OTHER_PURPOSE = keccak256("meal-delivery");
    bytes32 internal constant EVIDENCE = keccak256("opaque-evidence");
    bytes32 internal constant CHALLENGE = keccak256("opaque-challenge");
    bytes32 internal constant REPAIR = keccak256("opaque-repair");
    bytes32 internal constant RATIONALE = keccak256("consumer-rationale");

    function setUp() public {
        vm.warp(1_000_000);
        greif = new ReputationMemory();
    }

    function test_LegacyScorePathRemainsCallableAndAdvisory() public {
        greif.register(subject);
        greif.setReporter(reporter, true);

        assertTrue(greif.inGoodStanding(subject, 0));
        vm.prank(reporter);
        greif.report(subject, -5);

        assertEq(greif.reputation(subject), -5);
        assertFalse(greif.inGoodStanding(subject, 0));
        assertEq(greif.contextualFindingCount(), 0);
    }

    function test_LegacyReporterStatusGivesNoContextualAuthority() public {
        greif.setReporter(reporter, true);

        vm.expectRevert(bytes("not context reporter"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );
    }

    function test_SubjectAuthorityIsReporterDomainPurposeAndTimeScoped() public {
        _authorize(subject, reporter, DOMAIN, PURPOSE, 30 days);

        (uint64 validUntil, bool revoked, bool active) =
            greif.contextReporterAuthority(subject, reporter, DOMAIN, PURPOSE);
        assertEq(validUntil, block.timestamp + 30 days);
        assertFalse(revoked);
        assertTrue(active);

        vm.expectRevert(bytes("not context reporter"));
        vm.prank(outsider);
        greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );

        vm.expectRevert(bytes("not context reporter"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, OTHER_DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );

        vm.expectRevert(bytes("not context reporter"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, DOMAIN, OTHER_PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );

        vm.warp(block.timestamp + 30 days + 1);
        vm.expectRevert(bytes("not context reporter"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 1 days)
        );
    }

    function test_RevocationBlocksFutureRecordsButPreservesHistory() public {
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.prank(subject);
        greif.revokeContextReporter(reporter, DOMAIN, PURPOSE);

        vm.expectRevert(bytes("not context reporter"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject,
            DOMAIN,
            PURPOSE,
            keccak256("later"),
            ReputationMemory.ContextOutcome.Performed,
            uint64(block.timestamp + 7 days)
        );

        ReputationMemory.ContextualFinding memory finding = greif.contextualFinding(findingId);
        assertEq(finding.evidenceRef, EVIDENCE);
        assertEq(uint256(finding.status), uint256(ReputationMemory.FindingStatus.Recorded));
    }

    function test_AuthorityAndFindingLifetimesAreBounded() public {
        uint64 maximumLifetime = greif.MAX_CONTEXT_LIFETIME();

        vm.expectRevert(bytes("expired authority"));
        vm.prank(subject);
        greif.authorizeContextReporter(reporter, DOMAIN, PURPOSE, uint64(block.timestamp));

        vm.expectRevert(bytes("authority too long"));
        vm.prank(subject);
        greif.authorizeContextReporter(reporter, DOMAIN, PURPOSE, uint64(block.timestamp + maximumLifetime + 1));

        _authorize(subject, reporter, DOMAIN, PURPOSE, 30 days);
        vm.expectRevert(bytes("beyond authority"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 31 days)
        );
    }

    function test_MalformedScopeEvidenceAndSelfReportingAreRejected() public {
        vm.expectRevert(bytes("bad reporter"));
        vm.prank(subject);
        greif.authorizeContextReporter(subject, DOMAIN, PURPOSE, uint64(block.timestamp + 1 days));

        vm.expectRevert(bytes("empty scope"));
        vm.prank(subject);
        greif.authorizeContextReporter(reporter, bytes32(0), PURPOSE, uint64(block.timestamp + 1 days));

        _authorize(subject, reporter, DOMAIN, PURPOSE, 30 days);

        vm.expectRevert(bytes("empty evidence"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, bytes32(0), ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );

        vm.expectRevert(bytes("bad subject"));
        vm.prank(reporter);
        greif.recordContextualFinding(
            reporter, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, uint64(block.timestamp + 7 days)
        );

        vm.expectRevert(bytes("unknown finding"));
        greif.contextualFinding(0);
    }

    function test_OnlySubjectChallengesAndChallengeBlocksConsideration() public {
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.expectRevert(bytes("not subject"));
        vm.prank(outsider);
        greif.challengeContextualFinding(findingId, CHALLENGE);

        vm.prank(subject);
        greif.challengeContextualFinding(findingId, CHALLENGE);

        assertEq(uint256(greif.contextualFindingStatus(findingId)), uint256(ReputationMemory.FindingStatus.Challenged));

        vm.expectRevert(bytes("finding unavailable"));
        vm.prank(consumer);
        greif.recordFindingUse(findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);
    }

    function test_RepairRequiresSubjectProposalAndOriginalReporterAcknowledgement() public {
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.expectRevert(bytes("not subject"));
        vm.prank(outsider);
        greif.proposeContextualRepair(findingId, REPAIR);

        vm.prank(subject);
        greif.proposeContextualRepair(findingId, REPAIR);

        vm.expectRevert(bytes("not reporter"));
        vm.prank(outsider);
        greif.acknowledgeContextualRepair(findingId);

        vm.prank(reporter);
        greif.acknowledgeContextualRepair(findingId);

        ReputationMemory.ContextualFinding memory finding = greif.contextualFinding(findingId);
        assertEq(uint256(finding.outcome), uint256(ReputationMemory.ContextOutcome.Breached));
        assertEq(finding.evidenceRef, EVIDENCE);
        assertEq(finding.repairRef, REPAIR);
        assertEq(uint256(finding.status), uint256(ReputationMemory.FindingStatus.Repaired));

        vm.expectRevert(bytes("finding unavailable"));
        vm.prank(consumer);
        greif.recordFindingUse(findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);
    }

    function test_PerformedFindingCannotBeTurnedIntoARepairClaim() public {
        _authorize(subject, reporter, DOMAIN, PURPOSE, 30 days);
        vm.prank(reporter);
        uint256 findingId = greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Performed, uint64(block.timestamp + 7 days)
        );

        vm.expectRevert(bytes("not adverse"));
        vm.prank(subject);
        greif.proposeContextualRepair(findingId, REPAIR);
    }

    function test_ExpiredFindingNeedsNoKeeperAndCannotBeConsidered() public {
        uint256 findingId = _recordBreach(30 days, 7 days);
        vm.warp(block.timestamp + 7 days);

        assertEq(uint256(greif.contextualFindingStatus(findingId)), uint256(ReputationMemory.FindingStatus.Expired));

        vm.expectRevert(bytes("finding unavailable"));
        vm.prank(consumer);
        greif.recordFindingUse(findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);
    }

    function test_CrossDomainAndPurposeUseIsRejected() public {
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.expectRevert(bytes("scope mismatch"));
        vm.prank(consumer);
        greif.recordFindingUse(findingId, OTHER_DOMAIN, PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);

        vm.expectRevert(bytes("scope mismatch"));
        vm.prank(consumer);
        greif.recordFindingUse(findingId, DOMAIN, OTHER_PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);
    }

    function test_ConsumerExplicitlyOwnsConsiderAndIgnoreDecisions() public {
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.prank(consumer);
        uint256 considerId = greif.recordFindingUse(findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Consider, RATIONALE);

        vm.prank(subject);
        greif.challengeContextualFinding(findingId, CHALLENGE);

        vm.prank(consumer);
        uint256 ignoreId = greif.recordFindingUse(
            findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Ignore, keccak256("challenge-not-resolved")
        );

        assertEq(considerId, 0);
        assertEq(ignoreId, 1);
        assertEq(greif.findingUseDecisionCount(), 2);
        ReputationMemory.FindingUseDecision memory ignored = greif.findingUseDecision(ignoreId);
        assertEq(ignored.consumer, consumer);
        assertEq(uint256(ignored.decision), uint256(ReputationMemory.UseDecision.Ignore));
    }

    function test_ConsumerMayIgnoreRepairedAndExpiredHistory() public {
        uint256 repairedFindingId = _recordBreach(30 days, 7 days);
        vm.prank(subject);
        greif.proposeContextualRepair(repairedFindingId, REPAIR);
        vm.prank(reporter);
        greif.acknowledgeContextualRepair(repairedFindingId);

        vm.prank(consumer);
        greif.recordFindingUse(repairedFindingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Ignore, RATIONALE);

        uint256 expiredFindingId = _recordBreach(30 days, 1 days);
        vm.warp(block.timestamp + 1 days);

        vm.prank(consumer);
        greif.recordFindingUse(expiredFindingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Ignore, RATIONALE);

        assertEq(greif.findingUseDecisionCount(), 2);
    }

    function test_ContextualPathNeverMutatesLegacyRegistrationOrScore() public {
        greif.register(subject);
        int256 reputationBefore = greif.reputation(subject);
        uint256 findingId = _recordBreach(30 days, 7 days);

        vm.prank(subject);
        greif.challengeContextualFinding(findingId, CHALLENGE);
        vm.prank(subject);
        greif.proposeContextualRepair(findingId, REPAIR);
        vm.prank(reporter);
        greif.acknowledgeContextualRepair(findingId);
        vm.prank(consumer);
        greif.recordFindingUse(findingId, DOMAIN, PURPOSE, ReputationMemory.UseDecision.Ignore, RATIONALE);

        assertTrue(greif.registered(subject));
        assertEq(greif.reputation(subject), reputationBefore);
        assertTrue(greif.inGoodStanding(subject, 0));
    }

    function test_FindingDoesNotFollowSubjectToFreshAddress() public {
        uint256 findingId = _recordBreach(30 days, 7 days);
        ReputationMemory.ContextualFinding memory finding = greif.contextualFinding(findingId);

        assertEq(finding.subject, subject);
        assertTrue(finding.subject != rotatedSubject);
        assertEq(greif.reputation(rotatedSubject), 0);
    }

    function testFuzz_ValidLifetimeRoundTripsWithoutBecomingPermanent(uint32 rawLifetime) public {
        uint256 lifetime = bound(uint256(rawLifetime), 1, greif.MAX_CONTEXT_LIFETIME());
        _authorize(subject, reporter, DOMAIN, PURPOSE, greif.MAX_CONTEXT_LIFETIME());

        vm.prank(reporter);
        uint256 findingId = greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Performed, _deadline(lifetime)
        );

        ReputationMemory.ContextualFinding memory finding = greif.contextualFinding(findingId);
        assertEq(finding.validUntil, block.timestamp + lifetime);
        vm.warp(block.timestamp + lifetime + 1);
        assertEq(uint256(greif.contextualFindingStatus(findingId)), uint256(ReputationMemory.FindingStatus.Expired));
    }

    function _authorize(
        address authorizedSubject,
        address authorizedReporter,
        bytes32 domain,
        bytes32 purpose,
        uint256 lifetime
    ) internal {
        vm.prank(authorizedSubject);
        greif.authorizeContextReporter(authorizedReporter, domain, purpose, _deadline(lifetime));
    }

    function _recordBreach(uint256 authorityLifetime, uint256 findingLifetime) internal returns (uint256 findingId) {
        _authorize(subject, reporter, DOMAIN, PURPOSE, authorityLifetime);
        vm.prank(reporter);
        findingId = greif.recordContextualFinding(
            subject, DOMAIN, PURPOSE, EVIDENCE, ReputationMemory.ContextOutcome.Breached, _deadline(findingLifetime)
        );
    }

    function _deadline(uint256 lifetime) internal view returns (uint64) {
        uint256 deadline = block.timestamp + lifetime;
        require(deadline <= type(uint64).max, "test deadline overflow");
        // The explicit bound above makes the narrowing cast safe.
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(deadline);
    }
}
