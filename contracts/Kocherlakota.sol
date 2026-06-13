// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Kocherlakota — the memory ledger (formerly "TallyRope")
 *
 * Executes: Narayana Kocherlakota, "Money Is Memory," Journal of Economic
 * Theory 81 (1998). Money is equivalent to a public record of obligations;
 * valued because it is a record, not because it is worth anything. So we build
 * the record, not a token: a mutual-credit ledger where the balances ARE the
 * money. (The blockchain restores the very memory money was a substitute for,
 * so we use memory — credit — not the blunt second-best token.)
 *
 * Lineage (one identity, named from three sides): Kocherlakota's *money is memory*,
 * Alfred Mitchell-Innes's *money is credit* (1913/1914 — the same record seen from
 * the debt side), and Perry Mehrling's *money view* (all banking a swap of IOUs; the
 * hierarchy of money). Memory, credit, balance-sheet: one ledger, three honest names.
 *
 * Demurrage overlay executes: Silvio Gesell, "Die natürliche Wirtschaftsordnung"
 * (1916) — Freigeld / stamp scrip. A holding fee on idle positive balances, so
 * a good medium is a deliberately bad store: it circulates, it does not get
 * hoarded, and wealth is pushed off the rail into the proper store. We do NOT
 * want the currency stable.
 *
 * Design choices, each a session conclusion:
 *  - NO BASE TOKEN; signed balances sum to zero (conservation at zero).
 *  - elastic by credit limit, not by minting (no inflation tax, no mint).
 *  - interest-free (no usury, no debt-spiral, no jubilee-or-bust).
 *  - settlement is forgetting (`jubilee` socialises a default across creditors).
 *  - the steward governs the dial but cannot mint or skim — rule, not ruler.
 *    (Should be a DialDAO / Friedman contract. Residual vector: credit-limit
 *    discretion — exposed by events, defended by governance.)
 *  - Balanced/Value/Obligated only. Never put Immediate-mode (gifts, care) on
 *    an immutable public ledger.
 */
interface IKrugman {
    function elasticityFactorBps() external view returns (uint256);
}

interface IFiske {
    function requireTouchable(address a, address b) external view;
}

contract Kocherlakota {
    address public steward;                 // → replace with the Friedman/DialDAO governor
    address public stabiliser;              // optional Krugman steering wheel; off by default
    IFiske  public fiske;                   // optional mode guard; off by default

    address[] public knights;               // membership (for iteration in jubilee)
    mapping(address => bool)    public isKnight;
    mapping(address => int256)  public balance;       // signed peg position
    mapping(address => uint256) public creditLimit;   // max allowed debt — the dial
    mapping(address => mapping(address => bool)) public operatorApproved; // owner → operator → ok

    // --- Gesell demurrage overlay ---
    uint256 public demurrageBps;            // fee on idle positive balance per period (0 = off)
    uint64  public demurragePeriod;         // e.g. 365 days
    address public commons;                 // where demurrage flows (a knight; e.g. the jubilee pool)
    mapping(address => uint64) public lastAccrued;

    event StewardChanged(address indexed from, address indexed to);
    event Admitted(address indexed knight);
    event CreditLimitSet(address indexed knight, uint256 limit);
    event Settled(address indexed from, address indexed to, uint256 amount);
    event OperatorSet(address indexed owner, address indexed operator, bool approved);
    event StabiliserSet(address indexed stabiliser);
    event FiskeSet(address indexed fiske);
    event Jubilee(address indexed debtor, uint256 forgiven);
    event DemurrageSet(uint256 bps, uint64 period, address commons);
    event Demurrage(address indexed holder, uint256 fee);

    modifier onlySteward() { require(msg.sender == steward, "not steward"); _; }

    constructor() {
        steward = msg.sender;
        emit StewardChanged(address(0), msg.sender);
    }

    // --- governance of the dial (transparent, evented) ---
    function setSteward(address to) external onlySteward { emit StewardChanged(steward, to); steward = to; }

    function admit(address knight) external onlySteward {
        require(!isKnight[knight], "already a knight");
        isKnight[knight] = true;
        knights.push(knight);
        lastAccrued[knight] = uint64(block.timestamp);
        emit Admitted(knight);
    }

    function setCreditLimit(address knight, uint256 limit) external onlySteward {
        require(isKnight[knight], "not a knight");
        creditLimit[knight] = limit;
        emit CreditLimitSet(knight, limit);
    }

    // optional steering wheel (Krugman): off by default. When set, the rule-bound
    // stance loosens/tightens every credit limit countercyclically — QUANTITY only,
    // never a peg on value. address(0) ⇒ no effect (pure base limits).
    function setStabiliser(address k) external onlySteward { stabiliser = k; emit StabiliserSet(k); }
    function setFiske(address f) external onlySteward { fiske = IFiske(f); emit FiskeSet(f); }

    function _limitOf(address k) internal view returns (uint256) {
        uint256 base = creditLimit[k];
        if (stabiliser == address(0)) return base;
        return (base * IKrugman(stabiliser).elasticityFactorBps()) / 10000;
    }

    function setDemurrage(uint256 bps, uint64 period, address commons_) external onlySteward {
        require(period > 0, "period");
        require(isKnight[commons_], "commons not a knight");
        demurrageBps = bps;
        demurragePeriod = period;
        commons = commons_;
        emit DemurrageSet(bps, period, commons_);
    }

    // --- the wire: a payment slides pegs, conserved at zero ---
    function pay(address to, uint256 amount) external {
        require(isKnight[msg.sender], "payer not a knight");
        require(isKnight[to], "payee not a knight");
        require(to != msg.sender, "self-payment");
        require(amount > 0, "zero");
        if (address(fiske) != address(0)) fiske.requireTouchable(msg.sender, to);  // never record an Immediate bond

        _accrue(msg.sender);
        _accrue(to);

        int256 newPayerBalance = balance[msg.sender] - int256(amount);
        require(newPayerBalance >= -int256(_limitOf(msg.sender)), "exceeds credit limit");

        // ── the whole of money, here: one mark down, one mark up, on a record we
        //    both trust, summing to zero. a stone-age band could weave it in an
        //    evening — everything else in this repository is the calculus. ──
        balance[msg.sender] = newPayerBalance;   // one mark down
        balance[to]        += int256(amount);    // one mark up
        emit Settled(msg.sender, to, amount);
    }

    // --- operator: let an approved agent (Fisher, Baumol) settle on your behalf ---
    function approveOperator(address operator, bool ok) external {
        require(isKnight[msg.sender], "not a knight");
        operatorApproved[msg.sender][operator] = ok;
        emit OperatorSet(msg.sender, operator, ok);
    }

    function payFrom(address from, address to, uint256 amount) external {
        require(operatorApproved[from][msg.sender], "not operator");
        require(isKnight[from] && isKnight[to], "not knights");
        require(to != from, "self-payment");
        require(amount > 0, "zero");
        if (address(fiske) != address(0)) fiske.requireTouchable(from, to);  // never record an Immediate bond
        _accrue(from);
        _accrue(to);
        int256 nb = balance[from] - int256(amount);
        require(nb >= -int256(_limitOf(from)), "exceeds credit limit");
        balance[from] = nb;
        balance[to] += int256(amount);
        emit Settled(from, to, amount);
    }

    // --- Gesell: charge idle positive balances; fee flows to the commons (net preserved) ---
    function poke(address holder) external { _accrue(holder); }

    function _accrue(address a) internal {
        if (demurrageBps == 0 || commons == address(0) || a == commons) { lastAccrued[a] = uint64(block.timestamp); return; }
        int256 b = balance[a];
        uint64 last = lastAccrued[a];
        lastAccrued[a] = uint64(block.timestamp);
        if (b <= 0 || last == 0) return;
        uint256 elapsed = block.timestamp - last;
        uint256 fee = (uint256(b) * demurrageBps * elapsed) / (10000 * demurragePeriod);
        if (fee == 0) return;
        balance[a] = b - int256(fee);
        balance[commons] += int256(fee);   // a down, commons up → net stays zero
        emit Demurrage(a, fee);
    }

    // --- settlement is forgetting: clear a debtor, socialise the loss ---
    function jubilee(address debtor) external onlySteward {
        require(balance[debtor] < 0, "no debt");
        uint256 debt = uint256(-balance[debtor]);

        uint256 totalCredit;
        for (uint256 i = 0; i < knights.length; i++) {
            int256 b = balance[knights[i]];
            if (b > 0) totalCredit += uint256(b);
        }
        require(totalCredit > 0, "no creditors to absorb");
        uint256 forgiven = debt <= totalCredit ? debt : totalCredit;

        uint256 absorbed;
        for (uint256 i = 0; i < knights.length; i++) {
            int256 b = balance[knights[i]];
            if (b > 0) {
                uint256 cut = (uint256(b) * forgiven) / totalCredit;
                balance[knights[i]] = b - int256(cut);
                absorbed += cut;
            }
        }
        balance[debtor] += int256(absorbed);   // forgive exactly what was absorbed → net stays zero
        emit Jubilee(debtor, absorbed);
    }

    // --- transparency: verify the invariants ---
    function netSupply() external view returns (int256 net) {
        for (uint256 i = 0; i < knights.length; i++) net += balance[knights[i]];   // MUST be 0
    }
    function grossInCirculation() external view returns (uint256 gross) {
        for (uint256 i = 0; i < knights.length; i++) { int256 b = balance[knights[i]]; if (b > 0) gross += uint256(b); }
    }
}
