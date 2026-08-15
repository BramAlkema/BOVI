// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHayekIndex { function current() external view returns (uint256); }

/**
 * @title Cantillon — the nominal-exposure meter (who the level moves against)
 *
 * Executes: Richard Cantillon, *Essai sur la Nature du Commerce en Général*
 * (c. 1730, pub. 1755), Part II ch. VI — on the mechanism he actually described,
 * which is NOT the one later attributed to him.
 *
 * Read his losers. They are not the ill-informed:
 *
 *   "Ceux donc, qui souffriront de cette cherté, & de l'augmentation de
 *    consommation, seront d'abord les Propriétaires des terres, PENDANT LE TERME
 *    DE LEURS BAUX, puis leurs domestiques, & tous les ouvriers ou gens À GAGES
 *    FIXES qui en entretiennent leur famille."
 *
 * Landowners *during the term of their leases*; workers on *fixed wages*. The
 * discriminating variable is a claim fixed in nominal terms, with a remaining
 * term, while the level moves. Not proximity to the issuer, not privileged
 * information — his own worked example, the Spanish American silver, was public
 * knowledge, and the modern instance is louder still: quantitative easing was
 * pre-announced in size, pace and asset class, and redistributed anyway.
 *
 * He also notes the recovery, which the maths below reproduces:
 *   "à l'expiration de leurs Baux, augmenteront considérablement leurs Rentes."
 * Exposure decays to zero as the remaining term does. Renewal is the cure.
 *
 * WHAT THIS CONTRACT REFUSES, BY CONSTRUCTION
 * There is no order-of-receipt input. None. The "whoever gets the new money
 * first robs whoever gets it last" story is a later gloss, it is not what the
 * Essai argues, and where the mainstream has tested it (as the *financial
 * segmentation channel*) it came back small and of the opposite sign. The
 * absence of that parameter is the contract's argument. Cf. the executable-canon
 * spec: this must not call a transfer an implicit tax "without identifying the
 * payer, beneficiary, and defensible counterfactual" — so `attribute` requires
 * all three, and reverts without them.
 *
 * THE MATHS (both channels, both zero-sum) — symbols: NOTATION.md#level
 *   pi NOTATION.md#pi · NNP NOTATION.md#nnp · F NOTATION.md#F
 *   T NOTATION.md#T · r NOTATION.md#r · d_t NOTATION.md#dt · f_t NOTATION.md#ft
 *
 *  1. STOCK — the Fisher channel (Doepke & Schneider; Auclert's decomposition).
 *     A net nominal position NNP revalues when the level moves by π:
 *
 *         realGain_i = − NNP_i · π / (1 + π)
 *
 *     Net nominal creditors lose, net nominal debtors gain, and over a closed
 *     set of contracts Σ NNP = 0 (every nominal asset is someone's nominal
 *     liability), hence Σ realGain = 0.
 *
 *  2. FLOW — Cantillon's own, and what distinguishes him from the stock story.
 *     A nominal flow F, fixed for T remaining periods, discounted at r, against
 *     the counterfactual of the same flow indexed (which is exactly what the
 *     `Fisher` contract in this cast provides):
 *
 *         loss = Σ_{t=1..T}  F · (1+r)^−t · ( 1 − (1+π)^−t )
 *
 *     Each term is the period's real shortfall against the indexed alternative.
 *     The sum rises with π and with T, and → 0 as T → 0: the lease runs out and
 *     the landlord re-prices. That is Cantillon's sentence, in arithmetic.
 *     The payer of the fixed flow gains precisely what the receiver loses.
 *
 * WHAT IT IS NOT. Not a claim about the *net* welfare effect of a monetary
 * expansion — the identified literature on that is genuinely mixed and in places
 * runs opposite to the folk story, and this contract takes no position on it. It
 * measures ONE well-evidenced channel: the incidence of a level change on claims
 * fixed in nominal terms. Cantillon's own conclusion, worth recording because
 * the tradition drops it, is that the whole episode is transitional and ends in
 * the injecting state's impoverishment ("Voilà à-peu-près ce qui est arrivé à
 * l'Espagne"), not in a standing rent for anyone.
 *
 * WIRING. The level π comes from `Hayek` (the competing-basket numeraire) or is
 * supplied explicitly. The counterfactual is `Fisher`: this meter measures the
 * loss taken by NOT being indexed, which is the harm that contract exists to
 * prevent. Defence and meter, named separately, in the same building.
 *
 * PRECISION. Fixed-point WAD (1e18) with iterated division; the flow loop loses
 * a little accuracy per period and is capped at MAX_TERMS. A demonstrator, not
 * an actuarial engine — read the direction and the order of magnitude, and do
 * not settle a dispute on the last digit.
 */
contract Cantillon {
    uint256 public constant WAD = 1e18;
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_TERMS = 240;

    address public governance;
    IHayekIndex public index;          // optional level source; 0 = supply π explicitly
    uint256 public baselineIndex;      // the level this meter measures movement from

    struct FixedClaim {
        address receiver;              // holds the claim fixed in nominal terms (the lessor, the wage-earner)
        address payer;                 // owes it (the tenant, the employer) — gains exactly what the receiver loses
        uint256 flowPerPeriod;         // F, nominal
        uint256 remainingTerms;        // T
        uint256 discountBps;           // r
        bool    indexed;               // true = on Fisher; exposure is zero by construction
    }

    FixedClaim[] public claims;
    mapping(address => int256) public netNominalPosition;   // NNP, signed; + = net nominal creditor

    event LevelSourceSet(address index, uint256 baseline);
    event NominalPositionSet(address indexed who, int256 nnp);
    event ClaimRegistered(uint256 indexed id, address indexed receiver, address indexed payer, uint256 flow, uint256 terms, bool isIndexed);
    event Attributed(uint256 indexed id, address payer, address beneficiary, int256 realTransfer, string counterfactual);

    modifier onlyGovernance() { require(msg.sender == governance, "not governance"); _; }

    constructor() { governance = msg.sender; }

    function setLevelSource(address hayek, uint256 baseline) external onlyGovernance {
        require(baseline > 0, "baseline");
        index = IHayekIndex(hayek);
        baselineIndex = baseline;
        emit LevelSourceSet(hayek, baseline);
    }

    /// π in basis points, from the index if one is wired. Reverts rather than guessing.
    function inflationBps() public view returns (uint256) {
        require(address(index) != address(0) && baselineIndex > 0, "no level source");
        uint256 now_ = index.current();
        if (now_ <= baselineIndex) return 0;                       // deflation out of scope for this meter
        return (now_ - baselineIndex) * BPS / baselineIndex;
    }

    function setNominalPosition(address who, int256 nnp) external onlyGovernance {
        netNominalPosition[who] = nnp;
        emit NominalPositionSet(who, nnp);
    }

    function registerClaim(
        address receiver, address payer, uint256 flowPerPeriod,
        uint256 remainingTerms, uint256 discountBps, bool isIndexed
    ) external onlyGovernance returns (uint256 id) {
        require(receiver != address(0) && payer != address(0), "parties");
        require(receiver != payer, "self-claim");
        require(remainingTerms <= MAX_TERMS, "term too long for this demonstrator");
        claims.push(FixedClaim(receiver, payer, flowPerPeriod, remainingTerms, discountBps, isIndexed));
        id = claims.length - 1;
        emit ClaimRegistered(id, receiver, payer, flowPerPeriod, remainingTerms, isIndexed);
    }

    // --- channel 1: the stock ---

    /// realGain = −NNP · π/(1+π). Creditors lose, debtors gain, sum is zero.
    function stockRevaluation(address who, uint256 piBps) public view returns (int256) {
        int256 nnp = netNominalPosition[who];
        if (nnp == 0 || piBps == 0) return 0;
        uint256 mag = uint256(nnp >= 0 ? nnp : -nnp);
        uint256 loss = mag * piBps / (BPS + piBps);
        return nnp >= 0 ? -int256(loss) : int256(loss);
    }

    // --- channel 2: the flow, with duration — Cantillon's own ---

    /// Σ_{t=1..T} F·(1+r)^−t·(1 − (1+π)^−t). Zero if the claim is indexed, or if T = 0.
    function flowExposure(uint256 id, uint256 piBps) public view returns (uint256 loss) {
        FixedClaim memory c = claims[id];
        if (c.indexed || c.remainingTerms == 0 || piBps == 0 || c.flowPerPeriod == 0) return 0;

        uint256 onePlusR  = WAD + c.discountBps * WAD / BPS;
        uint256 onePlusPi = WAD + piBps * WAD / BPS;

        uint256 d = WAD;   // (1+r)^−t
        uint256 f = WAD;   // (1+π)^−t
        for (uint256 t = 0; t < c.remainingTerms; t++) {
            d = d * WAD / onePlusR;
            f = f * WAD / onePlusPi;
            loss += c.flowPerPeriod * d / WAD * (WAD - f) / WAD;
        }
    }

    /// The invariant that makes this a transfer and not a destruction: what the
    /// receiver loses on a fixed claim, the payer gains, exactly.
    function flowTransfer(uint256 id, uint256 piBps)
        external view returns (address loser, address gainer, uint256 amount)
    {
        FixedClaim memory c = claims[id];
        return (c.receiver, c.payer, flowExposure(id, piBps));
    }

    // --- attribution, which must be earned ---

    /// Records an incidence finding. Refuses to name a payer and a beneficiary
    /// without a stated counterfactual, per the executable-canon spec. The
    /// counterfactual for a fixed claim is the indexed alternative — `Fisher`.
    function attribute(uint256 id, string calldata counterfactual, uint256 piBps)
        external onlyGovernance returns (int256 realTransfer)
    {
        require(bytes(counterfactual).length > 0, "counterfactual required");
        FixedClaim memory c = claims[id];
        require(!c.indexed, "indexed claim bears no nominal exposure");
        uint256 amt = flowExposure(id, piBps);
        require(amt > 0, "no measurable transfer");
        realTransfer = int256(amt);
        emit Attributed(id, c.payer, c.receiver, realTransfer, counterfactual);
    }

    /// Σ over registered parties of the stock revaluation. MUST read 0 across a
    /// closed set — every nominal asset is someone's nominal liability. The
    /// analogue of `Kocherlakota.netSupply()`: redistribution conserves.
    function stockRevaluationSum(address[] calldata parties, uint256 piBps)
        external view returns (int256 net)
    {
        for (uint256 i = 0; i < parties.length; i++) net += stockRevaluation(parties[i], piBps);
    }

    function claimCount() external view returns (uint256) { return claims.length; }
}
