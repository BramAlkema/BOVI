// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ExperimentCalibrationEvidence — the paired treatment (does the floor bind, and does it matter?)
 *
 * Executes: Maria Bigoni, Gabriele Camera & Marco Casari, "Money is More than
 * Memory" (ESI Working Paper 14-17, Chapman; Journal of Monetary Economics 110,
 * 2020). Their abstract names the gap this contract exists to keep open:
 *
 *   "money, which economic theory considers just a primitive arrangement for
 *    monitoring past conduct in society. If so, then a public record of past
 *    actions — or memory — supersedes the function performed by money. THIS
 *    INTRIGUING THEORETICAL POSTULATE REMAINS UNTESTED. In an experiment, we show
 *    that the suggested functional equality between money and memory does not
 *    translate into an empirical equivalence."
 *
 * They tested `SignedPositionLedger` and it did not survive intact. Cooperation was
 * HIGHER under money than under a visible public record; under memory some
 * subjects ran large deficits and free-riders were not disciplined; and the
 * decisive arm — Money Unconstrained, which lifts the liquidity constraint so
 * help can always be rewarded with a token — collapsed money's advantage back to
 * memory's level. The binding constraint was doing the work, not the record.
 *
 * WHY THIS CONTRACT IS IN THE BUILDING
 * Every other room here executes an argument. This one executes an EXPERIMENT,
 * and it is the only entry that found against the house: this framework prefers
 * the minimal ledger, and the result says the token's hard floor at zero is a
 * feature the signed-balance ledger gives up. `SignedPositionLedger.sol` lifts that floor
 * deliberately — signed balances, credit limits — and this is the controlled test
 * of precisely that design decision. A cast with nothing in it that can embarrass
 * the cast has not been tested.
 *
 * Precedent for the shape: `ModePermissionGate` already describes no ledger machinery and
 * guards where the record may not go. This is the second non-mechanism room, and
 * it opens the category the building lacked — contracts that MEASURE rather than
 * transact.
 *
 * THE MATHS — symbols defined in NOTATION.md#experiment
 *
 *   Cooperation rate in an arm:      p = helped / opportunities        (NOTATION.md#p)
 *   Binding frequency:               b = blocked / attempted           (NOTATION.md#b)
 *                                        — did the floor ever bite?
 *   Treatment effect:                Delta = p_constrained - p_unconstrained  (NOTATION.md#Delta)
 *   Rule-of-thumb noise band:
 *
 *   Symbols chosen to avoid collision: `b` not `beta`, `Delta` not `delta`,
 *   because Epilogue A.4 already uses beta for the discount factor and delta for
 *   the network-death hazard. See NOTATION.md#collisions.
 *
 *       se = sqrt( p1(1-p1)/n1 + p2(1-p2)/n2 )
 *
 *   reported alongside delta so a difference can be read against the sampling
 *   noise that would produce it by chance. This is DESCRIPTIVE. There is no
 *   hypothesis test on chain, no p-value, and no claim of inference: two standard
 *   errors is a rule of thumb, not a result. Anyone reporting significance from
 *   this contract is reporting something it did not compute.
 *
 * THE REFUSAL, WHICH IS THE POINT
 * `finding` reverts without BOTH arms populated and both above a declared minimum
 * sample. A single arm is an anecdote with arithmetic on it. This mirrors
 * `NominalExposureMeter`, which refuses to attribute a transfer without a counterfactual:
 * one contract will not name a beneficiary without a comparison, and this one
 * will not name an effect without a control.
 *
 * WIRING. Arms are labelled by treatment and fed from play — the demo world's
 * floor-on/floor-off switch IS their Money vs Money Unconstrained contrast, so a
 * player running it re-runs the 2014 experiment against this cast's own
 * implementation. Constrained arms should be sourced from a ledger with a live
 * credit limit (`SignedPositionLedger`); unconstrained arms from the same ledger with the
 * limit lifted. Same rules, one parameter moved. That is what makes it a test.
 */
contract ExperimentCalibrationEvidence {
    uint256 public constant WAD = 1e18;
    uint256 public constant BPS = 10_000;

    enum Arm { Constrained, Unconstrained }   // Money vs Money Unconstrained

    struct Observations {
        uint256 opportunities;   // chances to help
        uint256 helped;          // taken
        uint256 attempted;       // transfers tried
        uint256 blocked;         // refused by the credit limit
        bool    floorActive;     // was a floor in force in this arm?
    }

    address public governance;
    uint256 public minSample;                 // declared before collection, not after
    bool    public minSampleDeclared;
    mapping(uint8 => Observations) private arms;

    event MinSampleDeclared(uint256 n, string justification);
    event Recorded(Arm arm, uint256 opportunities, uint256 helped, uint256 attempted, uint256 blocked);
    event Finding(int256 deltaBps, uint256 seBps, uint256 betaConstrainedBps, bool withinNoiseBand);

    modifier onlyGovernance() { require(msg.sender == governance, "not governance"); _; }

    constructor() { governance = msg.sender; }

    /// Declared up front, with a reason, so the sample floor cannot be chosen
    /// after seeing which way the result went.
    function declareMinSample(uint256 n, string calldata justification) external onlyGovernance {
        require(!minSampleDeclared, "already declared; changing it now would be choosing the answer");
        require(n > 0 && bytes(justification).length > 0, "declare n and why");
        minSample = n;
        minSampleDeclared = true;
        emit MinSampleDeclared(n, justification);
    }

    function record(Arm arm, uint256 opportunities, uint256 helped, uint256 attempted, uint256 blocked, bool floorActive)
        external onlyGovernance
    {
        require(helped <= opportunities, "helped exceeds opportunities");
        require(blocked <= attempted, "blocked exceeds attempted");
        if (arm == Arm.Unconstrained) require(blocked == 0, "an unconstrained arm cannot block");
        Observations storage o = arms[uint8(arm)];
        o.opportunities += opportunities;
        o.helped        += helped;
        o.attempted     += attempted;
        o.blocked       += blocked;
        o.floorActive    = floorActive;
        emit Recorded(arm, opportunities, helped, attempted, blocked);
    }

    // --- statistics ---

    /// p = helped / opportunities, in basis points.
    function cooperationBps(Arm arm) public view returns (uint256) {
        Observations storage o = arms[uint8(arm)];
        if (o.opportunities == 0) return 0;
        return o.helped * BPS / o.opportunities;
    }

    /// b = blocked / attempted (NOTATION.md#b). If this is zero in the constrained
    /// arm, the floor never bit, and any difference between arms is not about the floor.
    function bindingBps(Arm arm) public view returns (uint256) {
        Observations storage o = arms[uint8(arm)];
        if (o.attempted == 0) return 0;
        return o.blocked * BPS / o.attempted;
    }

    /// se = sqrt( p1(1-p1)/n1 + p2(1-p2)/n2 ), in basis points.
    function standardErrorBps() public view returns (uint256) {
        Observations storage a = arms[uint8(Arm.Constrained)];
        Observations storage b = arms[uint8(Arm.Unconstrained)];
        if (a.opportunities == 0 || b.opportunities == 0) return 0;
        uint256 p1 = cooperationBps(Arm.Constrained);
        uint256 p2 = cooperationBps(Arm.Unconstrained);
        uint256 v1 = p1 * (BPS - p1) / a.opportunities;   // variance term, bps^2 scale
        uint256 v2 = p2 * (BPS - p2) / b.opportunities;
        return _sqrt(v1 + v2);
    }

    /// Delta = p_constrained − p_unconstrained (NOTATION.md#Delta). Their result:
    /// positive, and it collapses toward zero when the floor is lifted.
    function treatmentEffectBps() public view returns (int256) {
        return int256(cooperationBps(Arm.Constrained)) - int256(cooperationBps(Arm.Unconstrained));
    }

    /// Reverts without both arms and both above the declared minimum. A control
    /// is not optional; that is the whole method.
    function finding() external returns (int256 deltaBps, uint256 seBps, bool withinNoiseBand) {
        require(minSampleDeclared, "declare the minimum sample first");
        Observations storage a = arms[uint8(Arm.Constrained)];
        Observations storage b = arms[uint8(Arm.Unconstrained)];
        require(a.opportunities >= minSample, "constrained arm under-sampled");
        require(b.opportunities >= minSample, "control arm under-sampled");

        deltaBps = treatmentEffectBps();
        seBps    = standardErrorBps();
        uint256 mag = uint256(deltaBps >= 0 ? deltaBps : -deltaBps);
        withinNoiseBand = mag <= 2 * seBps;   // rule of thumb, NOT a test
        emit Finding(deltaBps, seBps, bindingBps(Arm.Constrained), withinNoiseBand);
    }

    function observationsOf(Arm arm) external view returns (Observations memory) { return arms[uint8(arm)]; }

    /// Babylonian integer square root.
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) { y = z; z = (x / z + z) / 2; }
    }
}
