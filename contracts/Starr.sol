// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Starr — the capacity condition (is the sink big enough to do the work claimed?)
 *
 * Executes: Ross M. Starr, "The Price of Money in a Pure Exchange Monetary
 * Economy with Taxation" (Econometrica, 1974), Theorems 2 & 3 — the size problem
 * stated as an impossibility result. A future obligation denominated in the unit
 * supplies a modelled future sink, conditional on realised acceptance and
 * collection. But it has a *capacity condition*: the take must cover the stock.
 * An undersized or unenforced sink supports nothing under this model.
 *
 * This contract exists because "the state can just demand it in tax" is asserted
 * far more often than it is checked. Here it is a function call with a threshold,
 * and it can return NO.
 *
 * TWO SIZE CONDITIONS, WHICH ARE NOT THE SAME CONDITION — symbols: NOTATION.md#capacity
 *   kappa NOTATION.md#kappa · M NOTATION.md#M · O_t NOTATION.md#Ot
 *   H NOTATION.md#H · gamma NOTATION.md#gamma · gammaStar NOTATION.md#gammastar
 * The literature this cast draws on contains two, and conflating them is the
 * usual error — they fail independently and they failed separately in history.
 *
 *   A. COVERAGE (Starr). Can the obligation stream absorb the outstanding stock?
 *
 *          kappa  =  ( sum over t of O_t )  /  M
 *
 *      with O_t the obligation falling due in period t over the horizon H, and M
 *      the outstanding stock. Require kappa >= 1. Below that, some units reach the
 *      horizon with no terminal use, and backward induction takes their value to
 *      zero. Note this is an ABSORPTION condition and is therefore computed
 *      undiscounted: discounting changes what the sink is *worth*, not whether it
 *      can *swallow* the stock. `presentValue` is exposed separately for pricing,
 *      and deliberately not used in the verdict.
 *
 *   B. PARTICIPATION (Li & Wright 1998; Aiyagari & Wallace 1997). Is the obligated
 *      acceptor a large enough share of trade for its acceptance to select the
 *      monetary equilibrium?
 *
 *          gamma  >=  gammaStar
 *
 *      with gamma the issuer's share of trading encounters. Their theorems have
 *      the form "if and only if gamma exceeds a threshold": below it, the policy
 *      does not eliminate the non-monetary equilibrium. gammaStar is model-
 *      dependent and this contract will NOT invent one — it must be declared, and
 *      `verdict` reverts until it is. An undeclared threshold is an assumption
 *      hiding as a default.
 *
 * AND A THIRD QUANTITY THE THEORY DOES NOT SUPPLY: REALISED PERFORMANCE.
 * A decree is not a collection. Taiwan under Japanese administration, c. 1895,
 * made taxes payable only in Japanese money precisely to install the currency;
 * people deferred paying, revenue collapsed, and the policy was abandoned. The
 * decreed sink was never the realised one. So this contract tracks both, and the
 * shortfall is not its business to explain. Contextual memory, contest, response,
 * and keeper topology are separate layers; `Greif` does not own the residual.
 * Realised collection, not the statute, is what enters condition A.
 *
 * WHAT IT REFUSES TO REPORT
 * A price. What travels backward from a sink is ACCEPTANCE, not a level — Starr's
 * own theorems block the unravelling; they do not set the worth. A contract that
 * returned "therefore the currency is worth X" would be making exactly the error
 * this cast files under the value/selection distinction. `verdict` returns a
 * capacity finding and nothing else.
 *
 * WIRING. Stock and obligations may be supplied directly or read from a ledger.
 * A performance finding may be recorded contextually; the selection reading pairs with
 * `KiyotakiWright` (the acceptance-feedback threshold, which is the same
 * if-and-only-if in a different dress).
 */
contract Starr {
    uint256 public constant WAD = 1e18;
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_HORIZON = 240;

    enum Finding { Undeclared, Sufficient, UnderCovered, UnderParticipating, UnderBoth }

    struct Sink {
        string  label;
        uint256 stock;              // M — outstanding units
        uint256[] decreed;          // O_t as legislated, per period
        uint256[] realised;         // O_t as actually collected — what counts
        uint256 gammaBps;           // issuer share of trading encounters
        uint256 gammaStarBps;       // declared threshold; 0 = undeclared
        bool    thresholdDeclared;
    }

    address public governance;
    Sink[] public sinks;

    event SinkRegistered(uint256 indexed id, string label, uint256 stock, uint256 horizon);
    event ThresholdDeclared(uint256 indexed id, uint256 gammaStarBps, string justification);
    event Verdict(uint256 indexed id, Finding finding, uint256 coverageBps, uint256 gammaBps, uint256 gammaStarBps);

    modifier onlyGovernance() { require(msg.sender == governance, "not governance"); _; }

    constructor() { governance = msg.sender; }

    function registerSink(
        string calldata label,
        uint256 stock,
        uint256[] calldata decreed,
        uint256[] calldata realised,
        uint256 gammaBps
    ) external onlyGovernance returns (uint256 id) {
        require(stock > 0, "no stock: nothing to support");
        require(decreed.length == realised.length, "series length mismatch");
        require(decreed.length > 0 && decreed.length <= MAX_HORIZON, "horizon");
        require(gammaBps <= BPS, "gamma is a share");
        for (uint256 t = 0; t < decreed.length; t++) {
            require(realised[t] <= decreed[t], "collected more than decreed");
        }
        sinks.push();
        Sink storage s = sinks[sinks.length - 1];
        s.label = label;
        s.stock = stock;
        s.decreed = decreed;
        s.realised = realised;
        s.gammaBps = gammaBps;
        id = sinks.length - 1;
        emit SinkRegistered(id, label, stock, decreed.length);
    }

    /// The threshold must be declared, with a reason, before any verdict is available.
    function declareThreshold(uint256 id, uint256 gammaStarBps, string calldata justification)
        external onlyGovernance
    {
        require(gammaStarBps > 0 && gammaStarBps <= BPS, "threshold range");
        require(bytes(justification).length > 0, "justify the threshold");
        Sink storage s = sinks[id];
        s.gammaStarBps = gammaStarBps;
        s.thresholdDeclared = true;
        emit ThresholdDeclared(id, gammaStarBps, justification);
    }

    // --- condition A: coverage ---

    function totalDecreed(uint256 id) public view returns (uint256 sum) {
        uint256[] storage d = sinks[id].decreed;
        for (uint256 t = 0; t < d.length; t++) sum += d[t];
    }

    function totalRealised(uint256 id) public view returns (uint256 sum) {
        uint256[] storage r = sinks[id].realised;
        for (uint256 t = 0; t < r.length; t++) sum += r[t];
    }

    /// kappa in basis points, on REALISED collection. 10000 = exactly covered.
    function coverageBps(uint256 id) public view returns (uint256) {
        return totalRealised(id) * BPS / sinks[id].stock;
    }

    /// The gap between statute and collection. Not explained here — see `Greif`.
    function enforcementShortfallBps(uint256 id) public view returns (uint256) {
        uint256 d = totalDecreed(id);
        if (d == 0) return 0;
        return (d - totalRealised(id)) * BPS / d;
    }

    /// Exposed for pricing only, and deliberately NOT used in the verdict:
    /// discounting changes what the sink is worth, not whether it absorbs the stock.
    function presentValue(uint256 id, uint256 discountBps) external view returns (uint256 pv) {
        uint256[] storage r = sinks[id].realised;
        uint256 onePlusR = WAD + discountBps * WAD / BPS;
        uint256 d = WAD;
        for (uint256 t = 0; t < r.length; t++) {
            d = d * WAD / onePlusR;
            pv += r[t] * d / WAD;
        }
    }

    // --- the verdict ---

    function verdict(uint256 id) public view returns (Finding f, uint256 kappaBps) {
        Sink storage s = sinks[id];
        if (!s.thresholdDeclared) return (Finding.Undeclared, 0);
        kappaBps = coverageBps(id);
        bool covered = kappaBps >= BPS;
        bool participating = s.gammaBps >= s.gammaStarBps;
        if (covered && participating)      f = Finding.Sufficient;
        else if (!covered && !participating) f = Finding.UnderBoth;
        else if (!covered)                 f = Finding.UnderCovered;
        else                               f = Finding.UnderParticipating;
    }

    function recordVerdict(uint256 id) external onlyGovernance returns (Finding f) {
        uint256 kappaBps;
        (f, kappaBps) = verdict(id);
        require(f != Finding.Undeclared, "declare the threshold first");
        Sink storage s = sinks[id];
        emit Verdict(id, f, kappaBps, s.gammaBps, s.gammaStarBps);
    }

    function horizonOf(uint256 id) external view returns (uint256) { return sinks[id].decreed.length; }
    function sinkCount() external view returns (uint256) { return sinks.length; }
}
