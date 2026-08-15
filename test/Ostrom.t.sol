// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {Ostrom} from "../contracts/Ostrom.sol";

/**
 * The office, on the bench. Each test is one clause of the claim that a duty
 * with no bearer is unfinished — not one that binds harder.
 */
contract OstromTest is Test {
    Ostrom o;

    address gov    = makeAddr("gov");
    address keeper = makeAddr("keeper");
    address anyone = makeAddr("anyone");

    uint64 constant WEEK = 7 days;

    function setUp() public {
        vm.prank(gov);
        o = new Ostrom();
    }

    function _office() internal returns (uint256 id) {
        vm.prank(gov);
        id = o.createOffice("poke idle holders so the melt lands", address(0xBEEF), WEEK);
    }

    // ── an office cannot be created without the two things that make it one ──
    function test_ADutyNeedsWordsAndAClock() public {
        vm.prank(gov);
        vm.expectRevert(bytes("state the duty"));
        o.createOffice("", address(0xBEEF), WEEK);

        vm.prank(gov);
        vm.expectRevert(bytes("a duty with no clock is not a duty"));
        o.createOffice("poke idle holders", address(0xBEEF), 0);
    }

    // ── a new office is vacant, and vacancy is a finding, not a neutral state ──
    function test_AnUnheldDutyIsVisibleAsSuch() public {
        uint256 id = _office();
        assertTrue(o.isVacant(id));
        assertEq(o.vacancies(), 1);

        vm.prank(gov);
        o.appoint(id, keeper, "elected at the June meeting");
        assertFalse(o.isVacant(id));
        assertEq(o.vacancies(), 0);

        vm.prank(gov);
        o.vacate(id, "resigned");
        assertTrue(o.isVacant(id));       // the duty did not go away with the holder
        assertEq(o.vacancies(), 1);
    }

    // ── appointment is not silent ──
    function test_AppointmentCarriesAMandate() public {
        uint256 id = _office();
        vm.prank(gov);
        vm.expectRevert(bytes("state the mandate"));
        o.appoint(id, keeper, "");
    }

    // ── only the holder discharges; nobody else can claim to have done the work ──
    function test_OnlyTheHolderDischarges() public {
        uint256 id = _office();
        vm.prank(gov);
        o.appoint(id, keeper, "elected at the June meeting");

        vm.prank(anyone);
        vm.expectRevert(bytes("not the holder"));
        o.discharge(id);

        vm.prank(keeper);
        o.discharge(id);
        assertFalse(o.isOverdue(id));
    }

    // ── THE POINT: a thing that did not happen now leaves a mark ─────────────
    // Before this contract, a missed clearing was an absence — the ledger simply
    // did not move, and nothing anywhere recorded that it should have. Silence
    // and compliance were the same observation.
    function test_SilenceBecomesAPositiveFact() public {
        uint256 id = _office();
        vm.prank(gov);
        o.appoint(id, keeper, "elected at the June meeting");

        assertFalse(o.isOverdue(id));
        assertFalse(o.flagOverdue(id));            // nothing to report yet
        assertEq(o.missedCount(id), 0);

        vm.warp(block.timestamp + WEEK + 1);       // the keeper does nothing at all
        assertTrue(o.isOverdue(id));

        vm.prank(anyone);                          // anyone may say so
        assertTrue(o.flagOverdue(id));
        assertEq(o.missedCount(id), 1);

        // one flag per elapsed period — a crowd cannot inflate the record
        vm.prank(anyone);
        assertFalse(o.flagOverdue(id));
        assertEq(o.missedCount(id), 1);

        vm.warp(block.timestamp + WEEK + 1);
        vm.prank(anyone);
        assertTrue(o.flagOverdue(id));
        assertEq(o.missedCount(id), 2);            // and it accumulates
    }

    // ── it records; it does not punish. The sanction is referred, by ruling. ──
    function test_NoSanctionFires() public {
        uint256 id = _office();
        vm.prank(gov);
        o.appoint(id, keeper, "elected at the June meeting");

        for (uint256 i = 0; i < 5; i++) {
            vm.warp(block.timestamp + WEEK + 1);
            o.flagOverdue(id);
        }
        assertEq(o.missedCount(id), 5);

        (, , address holder, , , ,) = o.offices(id);
        assertEq(holder, keeper);                  // still in post after five misses
        assertFalse(o.isVacant(id));
        // Removing them is a normative call. It belongs to governance, which must
        // now state a reason on the record — and `missed` is available as that reason.
    }
}
