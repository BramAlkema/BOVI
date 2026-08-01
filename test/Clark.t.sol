// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {Clark, IDemurrage} from "../contracts/Clark.sol";

/// Stands in for Kocherlakota's Gesell overlay — only the one getter Clark reads.
/// Structural, not nominal: Kocherlakota already exposes `demurrageBps()` without
/// declaring the interface, and Clark casts an address, so the mock matches it.
contract MockDemurrage {
    uint256 public demurrageBps;
    constructor(uint256 bps) { demurrageBps = bps; }
    function set(uint256 bps) external { demurrageBps = bps; }
}

/**
 * Four lessons for the Tier-2 threshold. Each assertion is one observable.
 * Figures match an integer-exact reference simulation of the same arithmetic.
 *
 * Fixture: K = 1,000,000; x₀ = 500,000; r = 1000bps; harvest capacity = 3000bps.
 * Clark's threshold is therefore 2r = 2000bps.
 */
contract ClarkTest is Test {
    uint256 constant K      = 1_000_000;
    uint256 constant X0     =   500_000;
    uint256 constant R_BPS  =     1_000;   // r = 10% per period
    uint256 constant H_BPS  =     3_000;   // harvesting capacity
    uint256 constant ROUNDS =        60;

    function _clark(uint256 discountBps, bool netPricePositive) internal returns (Clark) {
        return new Clark(K, X0, R_BPS, H_BPS, discountBps, netPricePositive);
    }

    /// Lesson 1 — below the threshold the switch is off and the stock recovers.
    function test_belowThreshold_stockRecovers() public {
        Clark c = _clark(1_500, true);          // δ = 1500 < 2r = 2000
        assertEq(c.thresholdBps(), 2_000);
        assertFalse(c.liquidating());
        c.run(ROUNDS);
        assertFalse(c.extinct());
        assertEq(c.stock(), 998_060);           // regrown toward K
    }

    /// Lesson 2 — above it, profit-maximising liquidation runs the stock to zero.
    function test_aboveThreshold_liquidatesToExtinction() public {
        Clark c = _clark(2_500, true);          // δ = 2500 > 2r = 2000
        assertTrue(c.liquidating());
        c.run(ROUNDS);
        assertTrue(c.extinct());
        assertEq(c.stock(), 0);
    }

    /// Lesson 3 — the monetary dial moves the population. Demurrage is a NEGATIVE
    /// carrying return, so it subtracts from δ and pulls back under the threshold.
    /// (Demonstrator convenience: a demurrage fee and a market discount rate are
    /// not one quantity on one axis. See the contract header.)
    function test_demurrageSubtracts_andSpares_theStock() public {
        Clark c = _clark(2_500, true);
        assertTrue(c.liquidating());

        // NB: no step() runs before the setter, so the trajectory is Lesson 1's.
        // If you add one here, the expected stock below changes — see Lesson 4.
        c.setDemurrage(IDemurrage(address(new MockDemurrage(800))));
        assertEq(c.effectiveDiscountBps(), 1_700);   // 2500 − 800
        assertFalse(c.liquidating());

        c.run(ROUNDS);
        assertFalse(c.extinct());
        assertEq(c.stock(), 998_060);
    }

    /// Lesson 4 — the dial rescues a stock already in decline. Twenty rounds of
    /// liquidation take it to 0.4% of where it started, on a path to extinction
    /// at round 46; the demurrage overlay reverses it. This is the demonstration
    /// the tier exists for: a monetary parameter, moved, changes a population.
    function test_demurrageMidDecline_reversesTheTrajectory() public {
        Clark c = _clark(2_500, true);
        c.run(20);
        assertTrue(c.liquidating());
        assertFalse(c.extinct());
        assertEq(c.stock(), 2_234);              // 500,000 → 2,234

        c.setDemurrage(IDemurrage(address(new MockDemurrage(800))));
        assertFalse(c.liquidating());
        c.run(40);

        assertFalse(c.extinct());
        assertEq(c.stock(), 92_548);             // recovering, not gone
    }

    /// Lesson 5 — the premise is load-bearing. Clark needs harvesting to stay
    /// profitable all the way down; without it the switch never fires, however
    /// far above the threshold the discount rate goes. This is the contract's
    /// own falsification condition, sitting in the constructor.
    function test_premiseFalse_blocksLiquidation_atAnyRate() public {
        Clark c = _clark(9_000, false);         // 4.5× the threshold
        assertFalse(c.liquidating());
        c.run(ROUNDS);
        assertFalse(c.extinct());
        assertEq(c.stock(), 998_060);
    }
}
