// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {Kocherlakota} from "../contracts/Kocherlakota.sol";
import {Hayek}        from "../contracts/Hayek.sol";
import {Fisher, IHayek, ILedger} from "../contracts/Fisher.sol";
import {Friedman}     from "../contracts/Friedman.sol";
import {Greif}        from "../contracts/Greif.sol";
import {Schumpeter, IERC20 as ICash} from "../contracts/Schumpeter.sol";
import {Krugman}     from "../contracts/Krugman.sol";

/// minimal settlement asset for the Schumpeter (credit) lesson
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 a) external { balanceOf[to] += a; }
    function approve(address s, uint256 a) external returns (bool) { allowance[msg.sender][s] = a; return true; }
    function transferFrom(address f, address t, uint256 a) external returns (bool) {
        allowance[f][msg.sender] -= a; balanceOf[f] -= a; balanceOf[t] += a; return true;
    }
}

/**
 * The bench engine, proven to turn over. Each test is one lesson; each assert is
 * one observable from the run-sheet.
 */
contract CoreE2E is Test {
    Friedman     friedman;
    Greif        greif;
    Hayek        hayek;
    Kocherlakota rope;
    Fisher       fisher;
    Krugman      krugman;

    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");
    address carol = makeAddr("carol");

    address employer = makeAddr("employer");
    address worker   = makeAddr("worker");
    address commons  = makeAddr("commons");
    address borrower = makeAddr("borrower");

    address p1 = makeAddr("p1");
    address p2 = makeAddr("p2");
    address p3 = makeAddr("p3");
    address activityOracle = makeAddr("activityOracle");

    uint256 constant ONE = 1e18;

    function setUp() public {
        address[] memory members = new address[](3);
        members[0] = alice; members[1] = bob; members[2] = carol;
        friedman = new Friedman(members, 2 days, 2);   // 1 member 1 vote, quorum 2
        greif    = new Greif();
        hayek    = new Hayek(7 days);
        rope     = new Kocherlakota();
        fisher   = new Fisher(IHayek(address(hayek)), ILedger(address(rope)));
        krugman  = new Krugman(activityOracle, 100, 10000);   // oracle, trend target, responsiveness(bps)

        // genesis (this test contract is the initial steward/gov)
        rope.admit(employer); rope.admit(worker); rope.admit(commons);
        rope.setCreditLimit(employer, 1_000_000 * ONE);
        greif.register(employer); greif.register(worker); greif.register(borrower);
        hayek.admitProvider(p1); hayek.admitProvider(p2); hayek.admitProvider(p3);

        // hand the dials to Friedman — from here, no change by fiat
        rope.setSteward(address(friedman));
        greif.setGovernance(address(friedman));
        hayek.setGovernance(address(friedman));
    }

    // a governance action, the only legitimate way: propose → vote → timelock → execute
    function _gov(address target, bytes memory data) internal {
        vm.prank(alice); uint256 id = friedman.propose(target, data);
        vm.prank(alice); friedman.vote(id);
        vm.prank(bob);   friedman.vote(id);                 // quorum 2 → queued
        vm.warp(block.timestamp + 2 days + 1);              // the exit window elapses
        friedman.execute(id);
    }

    function _publishRod(uint256 level) internal {
        vm.prank(p1); hayek.publish(level);
        vm.prank(p2); hayek.publish(level);
        vm.prank(p3); hayek.publish(level);
    }

    // ── Lesson 1: governance is a rule, not a ruler ──────────────────────────
    function test_Friedman_NoChangeByFiat() public {
        vm.expectRevert(bytes("not steward"));
        rope.setCreditLimit(employer, 5);                   // direct call now forbidden

        _gov(address(rope), abi.encodeWithSignature("setCreditLimit(address,uint256)", employer, 2_000 * ONE));
        assertEq(rope.creditLimit(employer), 2_000 * ONE);  // only the voted, timelocked path works
    }

    // ── Lessons 2+3: the rope clears; unstable currency, stable contract ─────
    function test_IndexedWage_RealValueHeldAsCurrencyMelts() public {
        vm.prank(employer); rope.approveOperator(address(fisher), true);
        vm.prank(employer); uint256 oid = fisher.create(worker, 100 * ONE, 30 days);

        // month 1 — rod at par
        vm.warp(block.timestamp + 30 days + 1);
        _publishRod(ONE);                                   // fresh: rod == 1.00
        fisher.settle(oid);                                 // due = 100 * 1.00
        assertEq(rope.balance(worker),   int256(100 * ONE));
        assertEq(rope.balance(employer), -int256(100 * ONE));
        assertEq(rope.netSupply(), int256(0));              // conserved at zero

        // month 2 — the currency has melted 10%
        vm.warp(block.timestamp + 30 days + 1);
        _publishRod(110 * ONE / 100);                       // fresh: rod == 1.10
        fisher.settle(oid);                                 // due = 100 * 1.10 = 110
        assertEq(fisher.due(oid),       110 * ONE);
        assertEq(rope.balance(worker),  int256(210 * ONE)); // +110 nominal...
        assertEq(rope.netSupply(), int256(0));
        // ...for the SAME 100 real (rod) units. The contract was stable; the currency wasn't.
    }

    // ── Lesson 4a: a good medium is a bad store (Gesell) ─────────────────────
    function test_Gesell_IdleBalanceMeltsIntoCommons() public {
        vm.prank(employer); rope.approveOperator(address(fisher), true);
        vm.prank(employer); uint256 oid = fisher.create(worker, 100 * ONE, 30 days);
        vm.warp(block.timestamp + 30 days + 1);
        _publishRod(ONE);
        fisher.settle(oid);                                 // worker now holds 100

        _gov(address(rope), abi.encodeWithSignature(
            "setDemurrage(uint256,uint64,address)", uint256(500), uint64(365 days), commons));

        int256 start = rope.balance(worker);
        vm.warp(block.timestamp + 365 days);
        rope.poke(worker);                                  // charge the idle hoard

        assertLt(rope.balance(worker), start);              // it melted...
        assertGt(rope.balance(commons), int256(0));         // ...into the commons
        assertEq(rope.netSupply(), int256(0));              // conserved throughout
    }

    // ── Lesson 4b: the record has teeth (Greif) ──────────────────────────────
    function test_Greif_TeethExcludeADefaulter() public {
        address reporter = makeAddr("reporter");
        _gov(address(greif), abi.encodeWithSignature("setReporter(address,bool)", reporter, true));

        assertTrue(greif.inGoodStanding(borrower, 0));      // starts clean
        vm.prank(reporter); greif.report(borrower, -5);     // a default dings standing
        assertFalse(greif.inGoodStanding(borrower, 0));     // excluded — punish individually
    }

    // ── Lesson 4c: priced credit allocates and exposes the take (Schumpeter) ─
    function test_Schumpeter_PricedCreditExposesInterest() public {
        address lender   = makeAddr("lender");
        address attestor = makeAddr("attestor");
        MockERC20 cash   = new MockERC20();
        Schumpeter bank  = new Schumpeter(ICash(address(cash)), attestor);

        cash.mint(lender, 1_000 * ONE);
        cash.mint(borrower, 5 * ONE);                       // borrower earns the interest from production

        vm.prank(borrower); uint256 id = bank.requestLoan(100 * ONE, 30 days, 1000, keccak256("loom"));
        vm.prank(attestor); bank.attest(id, 8000);          // scored productive (pull)
        vm.prank(lender);   cash.approve(address(bank), type(uint256).max);
        vm.prank(lender);   bank.fund(id, 500);             // lender competes to 5% ≤ borrower's 10% ceiling
        assertEq(cash.balanceOf(borrower), 105 * ONE);      // disbursed

        vm.warp(block.timestamp + 30 days);
        vm.prank(borrower); cash.approve(address(bank), type(uint256).max);
        vm.prank(borrower); bank.repay(id);

        assertEq(cash.balanceOf(lender), 1_005 * ONE);      // principal 100 + interest 5, in the open
        assertEq(cash.balanceOf(borrower), 0);
    }

    // ── Krugman: the freeze cures itself (the steering wheel) ────────────────
    function test_Krugman_FreezeAndRecovery() public {
        _gov(address(rope), abi.encodeWithSignature("setCreditLimit(address,uint256)", employer, 100 * ONE));
        _gov(address(rope), abi.encodeWithSignature("setStabiliser(address)", address(krugman)));

        vm.prank(activityOracle); krugman.report(100);      // activity at trend
        assertEq(krugman.elasticityFactorBps(), 10000);     // neutral → effective limit == base

        // FREEZE: a willing 150 trade blocked by tight credit
        vm.prank(employer);
        vm.expectRevert(bytes("exceeds credit limit"));
        rope.pay(worker, 150 * ONE);

        // the stabiliser sees the shortfall (50 < trend 100) and expands credit
        vm.prank(activityOracle); krugman.report(50);
        assertGt(krugman.elasticityFactorBps(), 10000);

        // RECOVERY: the same trade now clears
        vm.prank(employer); rope.pay(worker, 150 * ONE);
        assertEq(rope.balance(worker), int256(150 * ONE));
        assertEq(rope.netSupply(), int256(0));
    }
}
