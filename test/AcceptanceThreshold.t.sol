// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AcceptanceThreshold} from "../contracts/AcceptanceThreshold.sol";

contract AcceptanceThresholdTest is Test {
    AcceptanceThreshold internal kw;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA401);
    address internal sponsor = address(0x5A0B);

    function setUp() public {
        // Good 0 begins with the weakest legacy ledger score. The amendment can
        // still select it when it is the best declared route to future opportunity.
        kw = new AcceptanceThreshold(1_000, 9_000, 5_000, 9_500, 0, 0, 500, 100);
        _register(alice);
        _register(bob);
        _register(carol);
    }

    function test_LegacyThresholdTraceRemainsCallable() public {
        kw.step();
        assertEq(kw.marketability(0), 10_000);
        assertTrue(kw.isMoney(0));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.Candidate));
        assertEq(kw.emergedMoney(), 0);
    }

    function test_StickyLegacyFlagCannotInstallScopedLifecycle() public {
        kw.run(20);
        assertTrue(kw.isMoney(0));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.Candidate));
        AcceptanceThreshold.InstrumentRuntime memory runtime = kw.runtimeOf(0);
        assertEq(runtime.completedUses, 0);
    }

    function test_NoPositiveMarginMeansNoUnprimedUse() public {
        _declareNegative(alice, 0, AcceptanceThreshold.Action.Acquire);
        vm.expectRevert(AcceptanceThreshold.NoViableMotive.selector);
        vm.prank(alice);
        kw.offerUse(_episode("no-motive"), 0, bob);
    }

    function test_ComparativeFitnessCanSelectLowerLegacyScore() public {
        _declareCircuit(0);
        _completeSelfMaintaining(0, "low-score");

        assertLt(kw.ledger(0), kw.ledger(1));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSelfMaintaining));
        assertFalse(kw.isMoney(1));
    }

    function test_SomeoneElsesSurplusCannotMotivateCounterparty() public {
        _declarePositive(alice, 0, AcceptanceThreshold.Action.Acquire);
        _declarePositive(alice, 0, AcceptanceThreshold.Action.Accept);
        _declareNegative(bob, 0, AcceptanceThreshold.Action.Accept);

        bytes32 id = _episode("not-bobs-surplus");
        vm.prank(alice);
        kw.offerUse(id, 0, bob);

        vm.expectRevert(AcceptanceThreshold.NoViableMotive.selector);
        vm.prank(bob);
        kw.acceptUse(id);
    }

    function test_PrimingStartsUseButCannotProveSelfMaintenance() public {
        _configurePriming(alice, 0, 10, 1, 2);
        _configurePriming(bob, 0, 10, 1, 2);

        _completeEpisode(0, _episode("primed-1"));
        vm.roll(block.number + 1);
        _completeEpisode(0, _episode("primed-2"));

        AcceptanceThreshold.InstrumentRuntime memory runtime = kw.runtimeOf(0);
        assertEq(runtime.completedUses, 2);
        assertEq(runtime.postPrimingUses, 0);
        assertEq(runtime.activePrimingAllowances, 0);
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSupported));
    }

    function test_UnacceptedSponsorCannotImposePriming() public {
        vm.expectRevert(AcceptanceThreshold.Unauthorized.selector);
        vm.prank(sponsor);
        kw.configurePriming(alice, 0, 10, 1, 2);
    }

    function test_UnusedPrimingAllowanceCannotSupportOrBlockCircuit() public {
        vm.prank(carol);
        kw.configurePriming(carol, 0, 100, 1, 100);

        _declareCircuit(0);
        _completeSelfMaintaining(0, "unused-priming");

        AcceptanceThreshold.PrimingAllowance memory allowance = kw.primingOf(carol, 0);
        AcceptanceThreshold.InstrumentRuntime memory runtime = kw.runtimeOf(0);
        assertTrue(allowance.active);
        assertFalse(allowance.engaged);
        assertEq(runtime.activePrimingAllowances, 0);
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSelfMaintaining));
    }

    function test_RemovedPrimingRequiresFreshCompletedUseWindow() public {
        _configurePriming(alice, 0, 10, 1, 2);
        _configurePriming(bob, 0, 10, 1, 2);
        _completeEpisode(0, _episode("seed-1"));
        vm.roll(block.number + 1);
        _completeEpisode(0, _episode("seed-2"));

        _declareCircuit(0);
        _assumeAndAssertProtection(0, 10);

        vm.roll(block.number + 1);
        _completeEpisode(0, _episode("fresh-1"));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSupported));

        vm.roll(block.number + 1);
        _completeEpisode(0, _episode("fresh-2"));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSelfMaintaining));
    }

    function test_OneAddressCannotAssertBothSides() public {
        _declarePositive(alice, 0, AcceptanceThreshold.Action.Acquire);

        vm.expectRevert(AcceptanceThreshold.InvalidInput.selector);
        vm.prank(alice);
        kw.offerUse(_episode("self-dealing"), 0, alice);

        bytes32 id = _episode("wrong-acceptor");
        vm.prank(alice);
        kw.offerUse(id, 0, bob);
        vm.expectRevert(AcceptanceThreshold.Unauthorized.selector);
        vm.prank(alice);
        kw.acceptUse(id);
    }

    function test_AcceptanceWithoutRenewalDoesNotCompleteCircuit() public {
        _declarePositive(alice, 0, AcceptanceThreshold.Action.Acquire);
        _declarePositive(bob, 0, AcceptanceThreshold.Action.Accept);

        bytes32 id = _episode("no-renewal");
        vm.prank(alice);
        kw.offerUse(id, 0, bob);
        vm.prank(bob);
        kw.acceptUse(id);

        AcceptanceThreshold.InstrumentRuntime memory runtime = kw.runtimeOf(0);
        assertEq(runtime.completedUses, 0);
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.Candidate));
    }

    function test_MissingWillingProtectionMakesInstalledInstrumentFragile() public {
        _declareCircuit(0);
        _completeSelfMaintaining(0, "fragility");

        _declareNegative(alice, 0, AcceptanceThreshold.Action.Protect);
        vm.roll(block.number + 11);
        kw.evaluateLifecycle(0);

        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.Fragile));
    }

    function test_DistinctScopesPermitCoexistingInstalledInstruments() public {
        _declareCircuit(0);
        _completeSelfMaintaining(0, "coexist-a");
        _declareCircuit(1);
        _completeSelfMaintaining(1, "coexist-b");

        assertTrue(kw.acceptanceScope(0) != kw.acceptanceScope(1));
        assertEq(uint8(kw.lifecycle(0)), uint8(AcceptanceThreshold.Lifecycle.InstalledSelfMaintaining));
        assertEq(uint8(kw.lifecycle(1)), uint8(AcceptanceThreshold.Lifecycle.InstalledSelfMaintaining));
    }

    function test_InputBoundsRejectInvalidProbabilitiesAndClocks() public {
        AcceptanceThreshold.OpportunityDeclaration memory invalid = _positiveDeclaration();
        invalid.credibilityBps = 10_001;
        vm.expectRevert(AcceptanceThreshold.InvalidInput.selector);
        vm.prank(alice);
        kw.declareOpportunity(0, AcceptanceThreshold.Action.Acquire, invalid);

        invalid = _positiveDeclaration();
        invalid.horizon = 0;
        vm.expectRevert(AcceptanceThreshold.InvalidInput.selector);
        vm.prank(alice);
        kw.declareOpportunity(0, AcceptanceThreshold.Action.Acquire, invalid);

        vm.expectRevert(AcceptanceThreshold.InvalidInput.selector);
        vm.prank(alice);
        kw.configurePriming(alice, 0, 10, 11, 1);

        vm.expectRevert(AcceptanceThreshold.InvalidInput.selector);
        vm.prank(alice);
        kw.assumeProtection(0, 0);
    }

    function test_DeclaredAlternativeCanDefeatOtherwisePositiveInstrument() public {
        AcceptanceThreshold.OpportunityDeclaration memory declaration = _positiveDeclaration();
        declaration.alternativeFitness = 2_000;
        vm.prank(alice);
        kw.declareOpportunity(0, AcceptanceThreshold.Action.Acquire, declaration);

        (,, int256 margin, bool viable) = kw.instrumentalFitness(alice, 0, AcceptanceThreshold.Action.Acquire);
        assertLt(margin, 0);
        assertFalse(viable);
    }

    function _completeSelfMaintaining(uint8 good, string memory prefix) internal {
        vm.roll(block.number + 1);
        _completeEpisode(good, keccak256(abi.encode(prefix, uint256(1))));
        vm.roll(block.number + 1);
        _completeEpisode(good, keccak256(abi.encode(prefix, uint256(2))));
        _assumeAndAssertProtection(good, 10);
    }

    function _completeEpisode(uint8 good, bytes32 id) internal {
        vm.prank(alice);
        kw.offerUse(id, good, bob);
        vm.prank(bob);
        kw.acceptUse(id);
        vm.prank(alice);
        kw.renewUse(id);
    }

    function _assumeAndAssertProtection(uint8 good, uint64 period) internal {
        vm.prank(alice);
        kw.assumeProtection(good, period);
        vm.prank(alice);
        kw.assertProtection(good);
    }

    function _declareCircuit(uint8 good) internal {
        _declarePositive(alice, good, AcceptanceThreshold.Action.Acquire);
        _declarePositive(alice, good, AcceptanceThreshold.Action.Renew);
        _declarePositive(alice, good, AcceptanceThreshold.Action.Protect);
        _declarePositive(bob, good, AcceptanceThreshold.Action.Accept);
    }

    function _declarePositive(address actor, uint8 good, AcceptanceThreshold.Action action) internal {
        AcceptanceThreshold.OpportunityDeclaration memory declaration = _positiveDeclaration();
        vm.prank(actor);
        kw.declareOpportunity(good, action, declaration);
    }

    function _declareNegative(address actor, uint8 good, AcceptanceThreshold.Action action) internal {
        AcceptanceThreshold.OpportunityDeclaration memory declaration;
        declaration.horizon = 1;
        declaration.credibilityBps = 10_000;
        declaration.presentValueFactorBps = 10_000;
        declaration.participationCost = 1;
        declaration.active = true;
        vm.prank(actor);
        kw.declareOpportunity(good, action, declaration);
    }

    function _positiveDeclaration() internal pure returns (AcceptanceThreshold.OpportunityDeclaration memory declaration) {
        declaration.accessibleSurplusPerPeriod = 100;
        declaration.outsideOption = 10;
        declaration.defectionGain = 5;
        declaration.participationCost = 5;
        declaration.holdingCost = 5;
        declaration.protectionCost = 5;
        declaration.alternativeFitness = 10;
        declaration.horizon = 10;
        declaration.credibilityBps = 10_000;
        declaration.presentValueFactorBps = 10_000;
        declaration.active = true;
    }

    function _configurePriming(address actor, uint8 good, uint128 budget, uint128 cost, uint64 stopAfterUses) internal {
        vm.prank(actor);
        kw.setPrimingSponsor(sponsor, true);
        vm.prank(sponsor);
        kw.configurePriming(actor, good, budget, cost, stopAfterUses);
    }

    function _register(address actor) internal {
        vm.prank(actor);
        kw.registerActor();
    }

    function _episode(string memory label) internal pure returns (bytes32) {
        return keccak256(bytes(label));
    }
}
