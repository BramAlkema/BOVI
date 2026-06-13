// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Hayek — the competing-basket numeraire (formerly "SharedNumeraire")
 *
 * Executes: Friedrich Hayek, "Denationalisation of Money" (1976) — competing
 * private issuers, disciplined by competition and exit. Aimed, deliberately, at
 * the UNIT OF ACCOUNT rather than the medium: per Brunnermeier the power and
 * stickiness live in the unit, so that is where competition is most needed.
 * More-Hayekian-than-Hayek: competition trained on the layer where the chokepoint
 * actually forms.
 *
 * This is the SHARED ROD that long contracts denominate in (Schumpeter loans,
 * Fisher indexed obligations) so prices stay comparable — Brunnermeier's warning:
 * you cannot fully privatise the unit without killing coordination. Zelizer
 * (PrivateBasket) rides on top as a personal overlay, not a replacement.
 *
 *  ANTI-LIBOR        providers COMPUTE from the clearing system's OBSERVABLE
 *                    settlements and publish a number anyone can re-derive — not
 *                    self-reported estimates (how LIBOR was gamed). Observable
 *                    inputs → lies detectable.
 *  ROBUST            the numeraire is the MEDIAN of fresh provider values, so a
 *                    minority of gamed providers cannot move it.
 *  DISCIPLINED BOTH  top-down: `deviationBps` exposes strays; bottom-up: Zelizer
 *  ENDS              overlays compare lived inflation to the rod — a crowd alarm.
 *  GOV = MEMBERSHIP  governance only admits/removes providers; it does not set
 *                    the value. Rule, not ruler. Fight convergence onto one
 *                    dominant provider — the LIBOR gravity never sleeps.
 *
 *  TWO PATHS: `publish` is the TRUSTING path (what most oracles and flatcoins
 *  do — gameable, the LIBOR risk). `finalize` is the TEETH path: it only admits
 *  a value that survived a ChallengeBond assertion (bond + dispute window), so a
 *  lie costs the liar its bond. Production uses `finalize`; `publish` is kept to
 *  show the contrast.
 */
interface IChallengeBond {
    function result(uint256 id) external view returns (bool truthful, address asserter, bytes32 topic, uint256 value);
}

contract Hayek {
    uint256 public constant BASE = 1e18;     // 1e18 == genesis price level

    address public governance;               // the Friedman/DialDAO governor
    uint64  public maxStale;                 // values older than this are ignored
    IChallengeBond public challenge;         // the teeth (optimistic oracle)
    bytes32 public constant TOPIC = keccak256("HAYEK_INDEX");

    address[] public providers;
    mapping(address => bool)    public isProvider;
    mapping(address => uint256) public subIndex;   // provider's latest level (1e18-based)
    mapping(address => uint64)  public updatedAt;

    event GovernanceChanged(address indexed to);
    event MaxStaleSet(uint64 maxStale);
    event ProviderAdmitted(address indexed provider);
    event ProviderRemoved(address indexed provider);
    event Published(address indexed provider, uint256 value, uint64 at);
    event ChallengeSet(address indexed challenge);

    modifier onlyGov() { require(msg.sender == governance, "not governance"); _; }

    constructor(uint64 _maxStale) {
        governance = msg.sender; maxStale = _maxStale;
        emit GovernanceChanged(msg.sender); emit MaxStaleSet(_maxStale);
    }

    function setGovernance(address to) external onlyGov { governance = to; emit GovernanceChanged(to); }
    function setMaxStale(uint64 s) external onlyGov { maxStale = s; emit MaxStaleSet(s); }
    function setChallenge(address c) external onlyGov { challenge = IChallengeBond(c); emit ChallengeSet(c); }

    // TEETH PATH: admit a value only after it survived a ChallengeBond assertion
    function finalize(address provider, uint256 assertionId) external {
        require(address(challenge) != address(0), "no challenge");
        require(isProvider[provider], "not a provider");
        (bool truthful, address asserter, bytes32 topic, uint256 value) = challenge.result(assertionId);
        require(truthful, "not truthful");
        require(asserter == provider, "asserter mismatch");
        require(topic == TOPIC, "wrong topic");
        require(value > 0, "zero");
        subIndex[provider] = value;
        updatedAt[provider] = uint64(block.timestamp);
        emit Published(provider, value, uint64(block.timestamp));   // same effect, but earned
    }

    function admitProvider(address p) external onlyGov {
        require(!isProvider[p], "exists");
        isProvider[p] = true; providers.push(p);
        emit ProviderAdmitted(p);
    }

    function removeProvider(address p) external onlyGov {
        require(isProvider[p], "unknown");
        isProvider[p] = false;
        for (uint256 i = 0; i < providers.length; i++) {
            if (providers[i] == p) { providers[i] = providers[providers.length - 1]; providers.pop(); break; }
        }
        delete subIndex[p]; delete updatedAt[p];
        emit ProviderRemoved(p);
    }

    // providers publish a value COMPUTED from observable settlements
    function publish(uint256 value) external {
        require(isProvider[msg.sender], "not a provider");
        require(value > 0, "zero");
        subIndex[msg.sender] = value; updatedAt[msg.sender] = uint64(block.timestamp);
        emit Published(msg.sender, value, uint64(block.timestamp));
    }

    // the numeraire: median of fresh provider values
    function current() public view returns (uint256) {
        uint256[] memory fresh = _freshValues();
        uint256 n = fresh.length;
        require(n > 0, "no fresh data");
        _sort(fresh);
        return n % 2 == 1 ? fresh[n / 2] : (fresh[n / 2 - 1] + fresh[n / 2]) / 2;
    }

    // a single provider's value: max-Hayekian choice for those who want it
    function valueOf(address p) external view returns (uint256) {
        require(isProvider[p], "unknown");
        return subIndex[p];
    }

    // the audit signal: how far a provider strays from the basket
    function deviationBps(address p) external view returns (uint256) {
        require(isProvider[p], "unknown");
        uint256 med = current();
        uint256 v = subIndex[p];
        uint256 diff = v > med ? v - med : med - v;
        return (diff * 10000) / med;
    }

    function _freshValues() internal view returns (uint256[] memory out) {
        uint256 cnt;
        for (uint256 i = 0; i < providers.length; i++) {
            address p = providers[i];
            if (subIndex[p] > 0 && block.timestamp - updatedAt[p] <= maxStale) cnt++;
        }
        out = new uint256[](cnt);
        uint256 j;
        for (uint256 i = 0; i < providers.length; i++) {
            address p = providers[i];
            if (subIndex[p] > 0 && block.timestamp - updatedAt[p] <= maxStale) out[j++] = subIndex[p];
        }
    }

    function _sort(uint256[] memory a) internal pure {
        for (uint256 i = 1; i < a.length; i++) {
            uint256 key = a[i]; uint256 k = i;
            while (k > 0 && a[k - 1] > key) { a[k] = a[k - 1]; k--; }
            a[k] = key;
        }
    }

    function providerCount() external view returns (uint256) { return providers.length; }
}
