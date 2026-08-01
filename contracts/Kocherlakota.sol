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
 * (1916) — Freigeld / stamp scrip. A time-proportional fee on positive balances,
 * so a good medium can be a deliberately bad store. This demonstrator does not
 * infer whether a holder is "idle"; it charges elapsed holding time when accrued.
 *
 * Design choices, each a session conclusion:
 *  - NO BASE TOKEN; signed balances sum to zero (conservation at zero).
 *  - elastic by credit limit, not by minting. Net stays zero; gross claim
 *    allocation can still redistribute and must remain visible.
 *  - interest-free (no usury, no debt-spiral, no jubilee-or-bust).
 *  - settlement is forgetting (`jubilee` socialises a default across creditors).
 *  - the steward cannot break paired-write conservation, but can redistribute
 *    through limits, demurrage, and jubilee. Point it at Friedman so those
 *    powers are evented, voted, and delayed.
 *  - Balanced/Value/Obligated only. Never put Immediate-mode (gifts, care) on
 *    an immutable public ledger.
 *
 * NOT EVENTED, deliberately (judgement register §0.1 — the author, not the chain,
 * decides what is inspectable): demurrage that has ACCRUED but not been charged
 * emits nothing, because no transaction occurs until someone touches the holder.
 * `balance` is therefore knowably stale between touches — read `pendingDemurrage`
 * alongside it. Nothing in here can act on its own (§0.2): `poke` exists because
 * the melt needs a caller, and `setPokeReward` exists because a caller needs a
 * reason. Whoever runs that keeper is a load-bearing party the cast does not name.
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
    uint256 public pokeRewardBps;           // share of a collected fee paid to a third-party poker (0 = off)
    uint256 public demurrageBps;            // fee on any accrued positive balance per period (0 = off)
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
    event DemurrageChanged(uint256 fromBps, uint64 fromPeriod, uint256 toBps, uint64 toPeriod);
    event Demurrage(address indexed holder, uint256 fee);
    event PokeRewardSet(uint256 bps);
    event Poked(address indexed holder, address indexed poker, uint256 fee, uint256 reward);

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
        // ⚠ RETROACTIVE, and now evented as such. `_accrue` applies the CURRENT rate
        // to the whole un-accrued span, so raising the rate charges it backwards over
        // time that elapsed under the old one, and setting it to 0 makes the early
        // return in `_accrue` stamp lastAccrued without charging — erasing every
        // holder's pending liability. Two steward redistribution levers over PAST
        // periods. Not fixed here (a rate-epoch ledger is out of demonstrator scope);
        // made visible, and this is the call to point at Friedman first.
        emit DemurrageChanged(demurrageBps, demurragePeriod, bps, period);
        demurrageBps = bps;
        demurragePeriod = period;
        commons = commons_;
        emit DemurrageSet(bps, period, commons_);
    }

    /// Reward paid to a third party who pokes an idle holder, as a share of the fee
    /// collected. 0 = off. Without this nobody is paid to charge the idle, so the
    /// commons receives late and `balance` overstates the holder meanwhile (§0.2).
    function setPokeReward(uint256 bps) external onlySteward {
        require(bps <= 10000, "bps");
        pokeRewardBps = bps;
        emit PokeRewardSet(bps);
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

    // --- Gesell: charge positive balances over elapsed time; transfer to commons ---

    /// What `balance[a]` currently overstates by: the fee that would be charged if
    /// `a` were accrued right now. `balance` alone is knowably stale between touches,
    /// so never read it without this (§0.1 — the author decides what is inspectable).
    function pendingDemurrage(address a) public view returns (uint256) {
        if (demurrageBps == 0 || commons == address(0) || a == commons) return 0;
        int256 b = balance[a];
        uint64 last = lastAccrued[a];
        if (b <= 0 || last == 0) return 0;
        return (uint256(b) * demurrageBps * (block.timestamp - last)) / (10000 * demurragePeriod);
    }

    /// Anyone may charge an idle holder. With `pokeRewardBps` set, the poker keeps a
    /// share — the incentive that makes the melt land without a volunteer. Paired
    /// write commons → poker, so conservation at zero still holds.
    function poke(address holder) external {
        uint256 fee = pendingDemurrage(holder);
        _accrue(holder);
        uint256 reward;
        if (fee > 0 && pokeRewardBps > 0 && msg.sender != holder && isKnight[msg.sender] && msg.sender != commons) {
            reward = (fee * pokeRewardBps) / 10000;
            if (reward > 0) {
                balance[commons]    -= int256(reward);
                balance[msg.sender] += int256(reward);
            }
        }
        emit Poked(holder, msg.sender, fee, reward);
    }

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
