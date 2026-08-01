// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Stigler — the PDA price-discovery checker
 *
 * Executes: George Stigler, "The Economics of Information" (1961) — price
 * dispersion exists because search is costly; a buyer who can search cheaply
 * can narrow that dispersion. The PDA (personal discovery agent) lowers search
 * cost and CHECKS a quote against a declared reference; it does not discover an
 * objective or metaphysically "true" price.
 *
 * Division of labour (on-chain rules / off-chain data):
 *   - OFF-CHAIN: the user's agent searches sellers and feeds observed prices.
 *   - ON-CHAIN (here): competing providers publish observed transaction prices
 *     per good; the reference is their MEDIAN (anti-LIBOR, robust); `check`
 *     returns how far a quote strays — the overcharge, made explicit.
 *
 * A pure observer (like Cantillon): it computes and exposes, it controls nothing.
 * Cantillon X-rays the MONETARY skim (who gets new money first); Stigler X-rays
 * the MARKET skim (are you overpaying for this good). Two channels, one X-ray.
 *
 * A ChallengeBond publishing path is a proposed extension. Unlike Hayek, this
 * contract does not currently implement one.
 *
 * NOT EVENTED, deliberately (judgement register §0.1): `check` stays a free view,
 * so asking is costless and unlogged — use `checkAndRecord` when the finding
 * should become public fact. Off-chain search by the PDA is invisible here by
 * construction; only what a provider publishes ever reaches the record, and WHICH
 * goods get published is an unrecorded editorial choice.
 */
contract Stigler {
    address public governance;
    uint64  public maxStale;

    address[] public providers;
    mapping(address => bool) public isProvider;
    mapping(address => mapping(bytes32 => uint256)) public price;     // provider → good → observed price
    mapping(address => mapping(bytes32 => uint64))  public updatedAt;

    event GovernanceChanged(address indexed to);
    event ProviderAdmitted(address indexed p);
    event ProviderRemoved(address indexed p);
    event Published(address indexed provider, bytes32 indexed good, uint256 price);
    event MaxStaleSet(uint64 maxStale);
    event Checked(address indexed by, bytes32 indexed good, uint256 quoted, uint256 refPrice, uint256 deviationBps, bool overcharge);

    modifier onlyGov() { require(msg.sender == governance, "not gov"); _; }

    constructor(uint64 _maxStale) { governance = msg.sender; maxStale = _maxStale; emit GovernanceChanged(msg.sender); }

    function setGovernance(address to) external onlyGov { governance = to; emit GovernanceChanged(to); }
    function setMaxStale(uint64 s) external onlyGov { maxStale = s; emit MaxStaleSet(s); }
    function admitProvider(address p) external onlyGov { require(!isProvider[p], "exists"); isProvider[p]=true; providers.push(p); emit ProviderAdmitted(p); }
    function removeProvider(address p) external onlyGov {
        require(isProvider[p], "unknown"); isProvider[p]=false;
        for (uint256 i=0;i<providers.length;i++){ if(providers[i]==p){ providers[i]=providers[providers.length-1]; providers.pop(); break; } }
        emit ProviderRemoved(p);
    }

    // provider publishes an OBSERVED transaction price for a good (anti-LIBOR)
    function publish(bytes32 good, uint256 p) external {
        require(isProvider[msg.sender], "not a provider");
        require(p > 0, "zero");
        price[msg.sender][good] = p; updatedAt[msg.sender][good] = uint64(block.timestamp);
        emit Published(msg.sender, good, p);
    }

    // the discovered reference: median of fresh provider prices for the good
    function referencePrice(bytes32 good) public view returns (uint256) {
        uint256[] memory fresh = _fresh(good);
        uint256 n = fresh.length;
        require(n > 0, "no fresh data");
        _sort(fresh);
        return n % 2 == 1 ? fresh[n/2] : (fresh[n/2 - 1] + fresh[n/2]) / 2;
    }

    // the check: how far a quote strays from the discovered price, and whether
    // it is an overcharge beyond a fair band (bps). The skim, made explicit.
    function check(bytes32 good, uint256 quoted, uint256 fairBandBps)
        external view returns (uint256 deviationBps, bool overcharge)
    {
        uint256 ref = referencePrice(good);
        uint256 diff = quoted > ref ? quoted - ref : ref - quoted;
        deviationBps = (diff * 10000) / ref;
        overcharge = quoted > ref && deviationBps > fairBandBps;
    }

    /// The same computation, RECORDED. `check` is a view: it tells the asker and
    /// no one else, so a contract built to X-ray the skim leaves no image when it
    /// finds one (judgement register §0.1). This path events the finding, so a
    /// pattern of overcharging accumulates as public fact rather than private
    /// knowledge. Still an observer — it computes and exposes, it controls nothing.
    function checkAndRecord(bytes32 good, uint256 quoted, uint256 fairBandBps)
        external returns (uint256 deviationBps, bool overcharge)
    {
        uint256 ref = referencePrice(good);
        uint256 diff = quoted > ref ? quoted - ref : ref - quoted;
        deviationBps = (diff * 10000) / ref;
        overcharge = quoted > ref && deviationBps > fairBandBps;
        emit Checked(msg.sender, good, quoted, ref, deviationBps, overcharge);
    }

    function _fresh(bytes32 good) internal view returns (uint256[] memory out) {
        uint256 cnt;
        for (uint256 i=0;i<providers.length;i++){ address p=providers[i]; if(price[p][good]>0 && block.timestamp-updatedAt[p][good]<=maxStale) cnt++; }
        out = new uint256[](cnt); uint256 j;
        for (uint256 i=0;i<providers.length;i++){ address p=providers[i]; if(price[p][good]>0 && block.timestamp-updatedAt[p][good]<=maxStale) out[j++]=price[p][good]; }
    }

    function _sort(uint256[] memory a) internal pure {
        for (uint256 i=1;i<a.length;i++){ uint256 k=a[i]; uint256 m=i; while(m>0 && a[m-1]>k){ a[m]=a[m-1]; m--; } a[m]=k; }
    }
}
