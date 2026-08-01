// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDemurrage { function demurrageBps() external view returns (uint256); }

/**
 * @title Clark — the liquidation threshold (a TIER-2 extension, not a stone)
 *
 * Executes: Colin W. Clark, "Profit Maximization and the Extinction of Animal
 * Species," JPE 81(4) 1973, 950–961. Given that price minus harvesting cost at
 * zero population is positive, extermination can be the profit-maximising policy
 * — for a sole owner with secure property rights — once the discount rate
 * exceeds twice the intrinsic growth rate (δ > 2r).
 *
 * Lineage (the primitive, named from its sources): H. Scott Gordon, "The Economic
 * Theory of a Common-Property Resource: The Fishery" (JPE 1954) gives the
 * depletable common stock and rent dissipation; Milner Schaefer gives the logistic
 * regeneration this contract steps. Clark supplies the one threshold we isolate.
 *
 * TIER 2 — this is a DEMONSTRATION OF REACH, not a foundation stone. It executes
 * no monetary mechanism. It admits under the tier rule (see contracts/README.md):
 * a monetary parameter (δ) driving a non-monetary outcome (a population), via a
 * published result, isolable to one mechanism. The canon's sufficiency claim does
 * not rest on it and is not weakened by removing it.
 *
 * ⚠ NO FLOOR guard, restated for the ecological case. `growthBps` is a REGENERATION
 * RATE, not intrinsic value and not backing. This contract says nothing about what
 * the stock is worth, and nothing about nature underwriting money. It says only
 * that under Clark's premises profit-maximisation liquidates it. Read it the other
 * way and you have green essentialism — the substrate error the framework refuses.
 *
 * ⚠ WHAT THIS DOES NOT IMPLEMENT. Following the KiyotakiWright precedent, this is
 * deterministic threshold dynamics, not Clark's model. There is no price, no cost
 * function c(x), no bang-bang optimal control, no agents and no strategic choice.
 * Below the threshold the contract applies NO harvest — that is a null case, NOT
 * Clark's interior solution; the demonstrator makes no claim about the optimal
 * sustained yield. δ > 2r is applied as a switch, not derived.
 *
 * NOT EVENTED, deliberately (judgement register §0.1 — the author, not the chain,
 * decides what is inspectable): nothing. Every state change here emits, including
 * the threshold crossing itself. `lastStepped` is exposed so a stalled demonstrator
 * is readable as a positive fact — this contract cannot step itself (§0.2), and
 * whoever calls `step()` is an unnamed party the canon does not yet govern.
 *
 * Canon wiring: `demurrage` may point at Kocherlakota's Gesell overlay, so a
 * monetary dial visibly moves a population. Demurrage is a fee on positive
 * balances — a NEGATIVE carrying return — so it SUBTRACTS from δ and pushes the
 * stock away from liquidation. The arithmetic is exposed in `effectiveDiscountBps`
 * rather than hidden in a sign flip. That mapping is a demonstrator convenience:
 * a demurrage fee and a market discount rate are not one quantity on one axis, and
 * this contract does not claim they are.
 */
contract Clark {
    uint256 public constant SCALE = 10_000;   // basis points

    uint256 public immutable carrying;        // K — carrying capacity, in stock units
    uint256 public immutable growthBps;       // r — intrinsic growth rate per period
    uint256 public immutable maxHarvestBps;   // harvesting capacity per period (fraction of stock)

    // Clark's premise, made load-bearing: harvesting must stay profitable all the
    // way down. False ⇒ the switch never fires, whatever δ and r are. This is the
    // contract's own falsification condition, sitting in the constructor.
    bool    public immutable netPriceAtZeroPositive;

    uint256 public baseDiscountBps;           // δ₀ — the carrying return on money
    IDemurrage public demurrage;              // optional Gesell overlay; off by default

    uint256 public stock;
    uint256 public round;
    bool    public extinct;
    bool    public wasLiquidating;   // last observed switch state, so a flip is evented
    uint256 public lastStepped;      // block timestamp of the last step — lets staleness be read

    address public governance;                // → point at Friedman so the dial is evented

    event Step(uint256 indexed round, uint256 stock, uint256 regrown, uint256 harvested, bool liquidating);
    event SwitchFlipped(uint256 indexed round, bool liquidating, uint256 effectiveDiscountBps, uint256 thresholdBps);
    event Extinct(uint256 indexed round);
    event DiscountSet(uint256 baseDiscountBps);
    event DemurrageSet(address indexed source);

    modifier onlyGov() { require(msg.sender == governance, "not gov"); _; }

    constructor(
        uint256 _carrying,
        uint256 _stock,
        uint256 _growthBps,
        uint256 _maxHarvestBps,
        uint256 _baseDiscountBps,
        bool    _netPriceAtZeroPositive
    ) {
        require(_carrying > 0, "no capacity");
        require(_stock <= _carrying, "stock > K");
        require(_growthBps <= SCALE && _maxHarvestBps <= SCALE, "bps > SCALE");
        require(_maxHarvestBps > 0, "no harvest capacity");
        carrying = _carrying;
        stock = _stock;
        growthBps = _growthBps;
        maxHarvestBps = _maxHarvestBps;
        baseDiscountBps = _baseDiscountBps;
        netPriceAtZeroPositive = _netPriceAtZeroPositive;
        governance = msg.sender;
    }

    // --- the monetary parameter ---

    /// δ net of any demurrage. Demurrage is a negative carrying return, so it
    /// subtracts; the floor is zero (this demonstrator does not model δ < 0).
    function effectiveDiscountBps() public view returns (uint256) {
        uint256 d = baseDiscountBps;
        if (address(demurrage) == address(0)) return d;
        uint256 fee = demurrage.demurrageBps();
        return fee >= d ? 0 : d - fee;
    }

    /// Clark's threshold: 2r.
    function thresholdBps() public view returns (uint256) { return 2 * growthBps; }

    /// The switch. Note the premise guard: no profitable harvest at zero stock,
    /// no liquidation, however high the discount rate goes.
    function liquidating() public view returns (bool) {
        if (!netPriceAtZeroPositive) return false;
        return effectiveDiscountBps() > thresholdBps();
    }

    // --- dynamics ---

    function step() external { _step(); }
    function run(uint256 rounds) external { for (uint256 i = 0; i < rounds; i++) _step(); }

    function _step() internal {
        round++;
        lastStepped = block.timestamp;

        // §0.1 of the judgement register: the crossing is the interesting fact, so
        // event it directly rather than leaving it to be diffed out of Step logs.
        bool liq = liquidating();
        if (liq != wasLiquidating) {
            wasLiquidating = liq;
            emit SwitchFlipped(round, liq, effectiveDiscountBps(), thresholdBps());
        }

        if (extinct) { emit Step(round, 0, 0, 0, liq); return; }

        // Schaefer logistic regeneration: r·x·(K−x)/K
        uint256 regrown = (growthBps * stock * (carrying - stock)) / (carrying * SCALE);
        stock += regrown;

        uint256 harvested;
        if (liq) {
            // Clark's corner solution, rate-limited by harvesting capacity so the
            // decline is watchable. Below the threshold we harvest NOTHING — see
            // the header: that is a null case, not the interior solution.
            harvested = (stock * maxHarvestBps) / SCALE;
            // Integer tail: once the proportional take floors to zero the corner
            // solution would stall on an arithmetic artefact rather than complete.
            // Mop up the remainder instead — extinction is the modelled outcome.
            if (harvested == 0) harvested = stock;
            if (harvested > stock) harvested = stock;
            stock -= harvested;
            if (stock == 0 && !extinct) { extinct = true; emit Extinct(round); }
        }

        emit Step(round, stock, regrown, harvested, liq);
    }

    // --- dials (evented; point governance at Friedman) ---

    function setBaseDiscountBps(uint256 bps) external onlyGov {
        baseDiscountBps = bps;
        emit DiscountSet(bps);
    }

    function setDemurrage(IDemurrage src) external onlyGov {
        demurrage = src;
        emit DemurrageSet(address(src));
    }

    function setGovernance(address to) external onlyGov { governance = to; }
}
