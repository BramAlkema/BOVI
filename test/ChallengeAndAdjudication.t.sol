// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ChallengeBond} from "../contracts/ChallengeBond.sol";
import {ContestableAssertion} from "../contracts/ContestableAssertion.sol";

contract CreditReceiver {
    ContestableAssertion internal immutable contestable;
    bool internal rejectReceipt = true;
    bool internal attemptReentry;

    constructor(ContestableAssertion _contestable) {
        contestable = _contestable;
    }

    function create(ContestableAssertion.Terms calldata terms) external payable returns (uint256) {
        return contestable.createContest{value: msg.value}(terms);
    }

    function configureReceipt(bool reject, bool reenter) external {
        rejectReceipt = reject;
        attemptReentry = reenter;
    }

    function withdraw() external {
        contestable.withdrawCredit();
    }

    receive() external payable {
        require(!rejectReceipt, "receiver rejects");
        if (attemptReentry) {
            attemptReentry = false;
            try contestable.withdrawCredit() {} catch {}
        }
    }
}

contract ChallengeAndAdjudicationTest is Test {
    ContestableAssertion internal contestable;

    address internal claimant = makeAddr("claimant");
    address internal challenger = makeAddr("challenger");
    address internal primaryResolver = makeAddr("primary-resolver");
    address internal fallbackResolver = makeAddr("fallback-resolver");
    address internal consumer = makeAddr("consumer");
    address internal outsider = makeAddr("outsider");

    bytes32 internal constant DOMAIN = keccak256("housing");
    bytes32 internal constant PURPOSE = keccak256("maintenance");
    bytes32 internal constant CLAIM = keccak256("claim");
    bytes32 internal constant PROVENANCE = keccak256("provenance");
    bytes32 internal constant CHALLENGE = keccak256("challenge");
    bytes32 internal constant PRIMARY_FINDING = keccak256("primary-finding");
    bytes32 internal constant APPEAL = keccak256("appeal");
    bytes32 internal constant FINAL_FINDING = keccak256("final-finding");

    uint128 internal constant STAKE = 1 ether;
    uint128 internal constant PRIMARY_FEE = 0.1 ether;
    uint128 internal constant FALLBACK_FEE = 0.2 ether;

    function setUp() public {
        vm.warp(1_000_000);
        contestable = new ContestableAssertion();
        vm.deal(claimant, 100 ether);
        vm.deal(challenger, 100 ether);
        vm.deal(outsider, 100 ether);
    }

    function test_LegacyTullockTraceRemainsCallableAndIsolated() public {
        ChallengeBond legacy = new ChallengeBond(primaryResolver, 1 ether, 1 days);

        vm.prank(claimant);
        uint256 assertionId = legacy.assert_{value: 1 ether}(CLAIM, 42);
        vm.prank(challenger);
        legacy.dispute{value: 1 ether}(assertionId);
        vm.prank(primaryResolver);
        legacy.resolve(assertionId, true);

        (bool truthful, address asserter, bytes32 topic, uint256 value) = legacy.result(assertionId);
        assertTrue(truthful);
        assertEq(asserter, claimant);
        assertEq(topic, CLAIM);
        assertEq(value, 42);
        assertEq(contestable.contestCount(), 0);
    }

    function test_NewPathRejectsMalformedTermsAndOverlappingRoles() public {
        ContestableAssertion.Terms memory terms = _terms();
        terms.domain = bytes32(0);
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);

        terms = _terms();
        terms.claimRef = bytes32(0);
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);

        terms = _terms();
        terms.stake = 0;
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);

        terms = _terms();
        terms.appealDuration = 0;
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);

        terms = _terms();
        terms.challengeDuration = contestable.MAX_CONTEST_DURATION() + 1;
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);

        terms = _terms();
        terms.consumer = terms.challenger;
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.BadInput.selector);
    }

    function test_DepositAndDuplicateClaimKeyRevertAtomically() public {
        ContestableAssertion.Terms memory terms = _terms();
        _expectCreateRevert(terms, _deposit(terms) - 1, ContestableAssertion.DepositMismatch.selector);
        assertEq(contestable.contestCount(), 0);

        _create(terms);
        uint256 claimantBalance = claimant.balance;
        _expectCreateRevert(terms, _deposit(terms), ContestableAssertion.DuplicateClaim.selector);

        assertEq(contestable.contestCount(), 1);
        assertEq(claimant.balance, claimantBalance);
    }

    function test_UnchallengedIsNotUpheldAndCreditsClaimantAtExactDeadline() public {
        uint256 contestId = _create(_terms());
        ContestableAssertion.Contest memory item = contestable.contest(contestId);

        vm.warp(item.challengeUntil);
        contestable.finalizeUnchallenged(contestId);

        item = contestable.contest(contestId);
        assertEq(uint256(item.status), uint256(ContestableAssertion.Status.Unchallenged));
        assertEq(uint256(item.outcome), uint256(ContestableAssertion.Outcome.Unchallenged));
        assertEq(uint256(item.primaryFinding), uint256(ContestableAssertion.Finding.None));
        assertEq(contestable.credits(claimant), _deposit(_terms()));
    }

    function test_OnlyNamedChallengerMayChallengeBeforeDeadline() public {
        uint256 contestId = _create(_terms());

        vm.expectRevert(ContestableAssertion.WrongActor.selector);
        vm.prank(outsider);
        contestable.challengeContest{value: _deposit(_terms())}(contestId, CHALLENGE);

        vm.expectRevert(ContestableAssertion.DepositMismatch.selector);
        vm.prank(challenger);
        contestable.challengeContest{value: _deposit(_terms()) - 1}(contestId, CHALLENGE);
        assertEq(uint256(contestable.contest(contestId).status), uint256(ContestableAssertion.Status.Open));

        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.challengeUntil);
        vm.expectRevert(ContestableAssertion.Closed.selector);
        vm.prank(challenger);
        contestable.challengeContest{value: _deposit(_terms())}(contestId, CHALLENGE);

        contestable.finalizeUnchallenged(contestId);
    }

    function test_PrimaryUpheldFinalizesAfterAppealWindowAndConservesEscrow() public {
        uint256 contestId = _createAndChallenge(_terms());
        _resolvePrimary(contestId, ContestableAssertion.Finding.Upheld);

        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.appealUntil);
        contestable.finalizePrimary(contestId);

        assertEq(contestable.credits(primaryResolver), uint256(PRIMARY_FEE) * 2);
        assertEq(contestable.credits(claimant), uint256(STAKE) * 2 + FALLBACK_FEE);
        assertEq(contestable.credits(challenger), FALLBACK_FEE);
        assertEq(_allCredits(), _deposit(_terms()) * 2);
    }

    function test_PrimaryRejectedMakesClaimantTheOnlyEligibleAppellant() public {
        uint256 contestId = _createAndChallenge(_terms());
        _resolvePrimary(contestId, ContestableAssertion.Finding.Rejected);

        vm.expectRevert(ContestableAssertion.WrongActor.selector);
        vm.prank(challenger);
        contestable.appealContest(contestId, APPEAL);

        vm.prank(claimant);
        contestable.appealContest(contestId, APPEAL);

        vm.expectRevert(ContestableAssertion.WrongState.selector);
        vm.prank(claimant);
        contestable.appealContest(contestId, APPEAL);

        assertEq(uint256(contestable.contest(contestId).status), uint256(ContestableAssertion.Status.Appealed));
    }

    function test_AppealMayReversePrimaryFindingWithoutErasingIt() public {
        uint256 contestId = _createAndChallenge(_terms());
        _resolvePrimary(contestId, ContestableAssertion.Finding.Upheld);
        vm.prank(challenger);
        contestable.appealContest(contestId, APPEAL);

        vm.prank(fallbackResolver);
        contestable.resolveAppeal(contestId, ContestableAssertion.Finding.Rejected, FINAL_FINDING);

        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        assertEq(uint256(item.primaryFinding), uint256(ContestableAssertion.Finding.Upheld));
        assertEq(item.primaryFindingRef, PRIMARY_FINDING);
        assertEq(uint256(item.outcome), uint256(ContestableAssertion.Outcome.Rejected));
        assertEq(item.finalFindingRef, FINAL_FINDING);
        assertEq(contestable.credits(challenger), uint256(STAKE) * 2);
        assertEq(contestable.credits(primaryResolver), uint256(PRIMARY_FEE) * 2);
        assertEq(contestable.credits(fallbackResolver), uint256(FALLBACK_FEE) * 2);
        assertEq(_allCredits(), _deposit(_terms()) * 2);
    }

    function test_SilentPrimaryOpensPaidFallbackAtExactBoundary() public {
        uint256 contestId = _createAndChallenge(_terms());
        ContestableAssertion.Contest memory item = contestable.contest(contestId);

        vm.warp(item.primaryResolveUntil);
        vm.expectRevert(ContestableAssertion.Closed.selector);
        vm.prank(primaryResolver);
        contestable.resolvePrimary(contestId, ContestableAssertion.Finding.Upheld, PRIMARY_FINDING);

        vm.expectRevert(ContestableAssertion.WrongActor.selector);
        vm.prank(outsider);
        contestable.resolveFallback(contestId, ContestableAssertion.Finding.Upheld, FINAL_FINDING);

        vm.prank(fallbackResolver);
        contestable.resolveFallback(contestId, ContestableAssertion.Finding.Upheld, FINAL_FINDING);

        assertEq(contestable.credits(fallbackResolver), uint256(PRIMARY_FEE + FALLBACK_FEE) * 2);
        assertEq(contestable.credits(claimant), uint256(STAKE) * 2);
        assertEq(_allCredits(), _deposit(_terms()) * 2);
    }

    function test_SilentPrimaryAndFallbackBecomeInconclusiveAndRefundBoth() public {
        uint256 contestId = _createAndChallenge(_terms());
        ContestableAssertion.Contest memory item = contestable.contest(contestId);

        vm.warp(item.fallbackResolveUntil);
        contestable.finalizeInconclusive(contestId);

        item = contestable.contest(contestId);
        assertEq(uint256(item.outcome), uint256(ContestableAssertion.Outcome.Inconclusive));
        assertEq(contestable.credits(claimant), _deposit(_terms()));
        assertEq(contestable.credits(challenger), _deposit(_terms()));
        assertEq(_allCredits(), _deposit(_terms()) * 2);

        vm.expectRevert(ContestableAssertion.OutcomeUnavailable.selector);
        vm.prank(consumer);
        contestable.consumeContestOutcome(contestId, DOMAIN, PURPOSE);
    }

    function test_SilentAppealRefundsRemainingEscrow() public {
        uint256 contestId = _createAndChallenge(_terms());
        _resolvePrimary(contestId, ContestableAssertion.Finding.Upheld);
        vm.prank(challenger);
        contestable.appealContest(contestId, APPEAL);
        ContestableAssertion.Contest memory item = contestable.contest(contestId);

        vm.warp(item.fallbackResolveUntil);
        contestable.finalizeInconclusive(contestId);

        assertEq(contestable.credits(primaryResolver), uint256(PRIMARY_FEE) * 2);
        assertEq(contestable.credits(claimant), uint256(STAKE) + FALLBACK_FEE);
        assertEq(contestable.credits(challenger), uint256(STAKE) + FALLBACK_FEE);
        assertEq(_allCredits(), _deposit(_terms()) * 2);
    }

    function test_ResolverRolesFindingValuesAndReferencesAreChecked() public {
        uint256 contestId = _createAndChallenge(_terms());

        vm.expectRevert(ContestableAssertion.WrongActor.selector);
        vm.prank(outsider);
        contestable.resolvePrimary(contestId, ContestableAssertion.Finding.Upheld, PRIMARY_FINDING);

        vm.expectRevert(ContestableAssertion.BadInput.selector);
        vm.prank(primaryResolver);
        contestable.resolvePrimary(contestId, ContestableAssertion.Finding.None, PRIMARY_FINDING);

        vm.expectRevert(ContestableAssertion.BadInput.selector);
        vm.prank(primaryResolver);
        contestable.resolvePrimary(contestId, ContestableAssertion.Finding.Upheld, bytes32(0));

        _resolvePrimary(contestId, ContestableAssertion.Finding.Upheld);
    }

    function test_OnlyNamedConsumerMayConsumeMatchingOutcomeOnce() public {
        uint256 contestId = _create(_terms());
        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.challengeUntil);
        contestable.finalizeUnchallenged(contestId);

        vm.expectRevert(ContestableAssertion.WrongActor.selector);
        vm.prank(outsider);
        contestable.consumeContestOutcome(contestId, DOMAIN, PURPOSE);

        vm.expectRevert(ContestableAssertion.ScopeMismatch.selector);
        vm.prank(consumer);
        contestable.consumeContestOutcome(contestId, keccak256("other-domain"), PURPOSE);

        vm.prank(consumer);
        ContestableAssertion.Outcome outcome = contestable.consumeContestOutcome(contestId, DOMAIN, PURPOSE);
        assertEq(uint256(outcome), uint256(ContestableAssertion.Outcome.Unchallenged));

        vm.expectRevert(ContestableAssertion.AlreadyConsumed.selector);
        vm.prank(consumer);
        contestable.consumeContestOutcome(contestId, DOMAIN, PURPOSE);
    }

    function test_TerminalContestCannotReopenOrPayTwice() public {
        uint256 contestId = _create(_terms());
        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.challengeUntil);
        contestable.finalizeUnchallenged(contestId);
        uint256 creditBefore = contestable.credits(claimant);

        vm.expectRevert(ContestableAssertion.WrongState.selector);
        contestable.finalizeUnchallenged(contestId);
        vm.expectRevert(ContestableAssertion.WrongState.selector);
        vm.prank(challenger);
        contestable.challengeContest{value: _deposit(_terms())}(contestId, CHALLENGE);

        assertEq(contestable.credits(claimant), creditBefore);
    }

    function test_FailedWithdrawalPreservesCreditAndReentryCannotDuplicateIt() public {
        CreditReceiver receiver = new CreditReceiver(contestable);
        vm.deal(address(receiver), 10 ether);
        ContestableAssertion.Terms memory terms = _terms();
        terms.claimRef = keccak256("receiver-claim");

        vm.prank(address(receiver));
        uint256 contestId = receiver.create{value: _deposit(terms)}(terms);
        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.challengeUntil);
        contestable.finalizeUnchallenged(contestId);

        vm.expectRevert(ContestableAssertion.WithdrawalFailed.selector);
        receiver.withdraw();
        assertEq(contestable.credits(address(receiver)), _deposit(terms));

        receiver.configureReceipt(false, true);
        uint256 balanceBefore = address(receiver).balance;
        receiver.withdraw();

        assertEq(address(receiver).balance, balanceBefore + _deposit(terms));
        assertEq(contestable.credits(address(receiver)), 0);
    }

    function testFuzz_BoundedPrimaryPathConservesAllEscrow(
        uint32 rawChallenge,
        uint32 rawPrimary,
        uint32 rawAppeal,
        uint32 rawFallback,
        uint96 rawStake,
        uint96 rawPrimaryFee,
        uint96 rawFallbackFee
    ) public {
        uint64 maximum = contestable.MAX_CONTEST_DURATION();
        ContestableAssertion.Terms memory terms = _terms();
        terms.challengeDuration = uint64(bound(rawChallenge, 1, maximum));
        terms.primaryDuration = uint64(bound(rawPrimary, 1, maximum));
        terms.appealDuration = uint64(bound(rawAppeal, 1, maximum));
        terms.fallbackDuration = uint64(bound(rawFallback, 1, maximum));
        terms.stake = uint128(bound(rawStake, 1, 10 ether));
        terms.primaryFee = uint128(bound(rawPrimaryFee, 1, 1 ether));
        terms.fallbackFee = uint128(bound(rawFallbackFee, 1, 1 ether));

        uint256 deposit = _deposit(terms);
        vm.deal(claimant, deposit);
        vm.deal(challenger, deposit);
        uint256 contestId = _createAndChallenge(terms);
        _resolvePrimary(contestId, ContestableAssertion.Finding.Upheld);
        ContestableAssertion.Contest memory item = contestable.contest(contestId);
        vm.warp(item.appealUntil);
        contestable.finalizePrimary(contestId);

        assertEq(_allCredits(), deposit * 2);
        assertEq(address(contestable).balance, deposit * 2);
    }

    function _terms() internal view returns (ContestableAssertion.Terms memory terms) {
        terms = ContestableAssertion.Terms({
            challenger: challenger,
            primaryResolver: primaryResolver,
            fallbackResolver: fallbackResolver,
            consumer: consumer,
            domain: DOMAIN,
            purpose: PURPOSE,
            claimRef: CLAIM,
            provenanceRef: PROVENANCE,
            stake: STAKE,
            primaryFee: PRIMARY_FEE,
            fallbackFee: FALLBACK_FEE,
            challengeDuration: 2 days,
            primaryDuration: 3 days,
            appealDuration: 2 days,
            fallbackDuration: 3 days
        });
    }

    function _create(ContestableAssertion.Terms memory terms) internal returns (uint256 contestId) {
        vm.prank(claimant);
        contestId = contestable.createContest{value: _deposit(terms)}(terms);
    }

    function _createAndChallenge(ContestableAssertion.Terms memory terms) internal returns (uint256 contestId) {
        contestId = _create(terms);
        vm.prank(challenger);
        contestable.challengeContest{value: _deposit(terms)}(contestId, CHALLENGE);
    }

    function _resolvePrimary(uint256 contestId, ContestableAssertion.Finding finding) internal {
        vm.prank(primaryResolver);
        contestable.resolvePrimary(contestId, finding, PRIMARY_FINDING);
    }

    function _expectCreateRevert(ContestableAssertion.Terms memory terms, uint256 value, bytes4 selector) internal {
        vm.expectRevert(selector);
        vm.prank(claimant);
        contestable.createContest{value: value}(terms);
    }

    function _deposit(ContestableAssertion.Terms memory terms) internal pure returns (uint256) {
        return uint256(terms.stake) + terms.primaryFee + terms.fallbackFee;
    }

    function _allCredits() internal view returns (uint256) {
        return contestable.credits(claimant) + contestable.credits(challenger) + contestable.credits(primaryResolver)
            + contestable.credits(fallbackResolver);
    }
}
