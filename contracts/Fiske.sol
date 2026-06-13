// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Fiske — the modes, as a permission layer (the soul's manners)
 *
 * Executes: Alan Fiske, Relational Models Theory — the four fairness logics.
 * What is contractable: a relationship's mode TAG, a GATE other contracts honour,
 * and a taboo FLAG when extraction wears the wrong mode (Fiske–Tetlock).
 *
 * Modes on MONEY — the ancestors Fiske's general models meet here: Paul Bohannan's
 * spheres of exchange (cross-sphere conversion is a moral violation; general-purpose
 * money collapses the spheres — the bundling critique's root) and Viviana Zelizer's
 * earmarking / *special monies* (money carries relational meaning; never the neutral
 * solvent it pretends to be). The mode TAG here is their insight, made a gate.
 *
 * What is NOT: the *assignment* of the mode (human judgment — an oracle input,
 * gameable → wrap it in ChallengeBond) and the *moral force* (the contract flags;
 * humans care). The contract SERVES the modes; it cannot BE them.
 *
 * The irony, handled: recording even the Immediate TAG brushes against the mode
 * it protects (Immediate wants no record). So the Immediate tag is a minimal
 * EXCLUSION marker — "hands off this pair" — not a description of the bond.
 * Better still, keep Immediate relationships off-chain entirely; use the tag
 * only as a defensive opt-out.
 */
contract Fiske {
    enum Mode { Unset, Immediate, Balanced, Obligated, Value }

    mapping(bytes32 => Mode) internal _mode;   // relationship → declared mode (an oracle input)

    event ModeDeclared(bytes32 indexed rel, Mode mode, address by);
    event Taboo(bytes32 indexed rel, string violation);   // the disguise, detected

    function relId(address a, address b) public pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    // declare a relationship's mode (demonstrator: either party; production: mutual + ChallengeBond)
    function declare(address counterparty, Mode m) external {
        bytes32 r = relId(msg.sender, counterparty);
        _mode[r] = m;
        emit ModeDeclared(r, m, msg.sender);
    }

    function mode(address a, address b) public view returns (Mode) { return _mode[relId(a, b)]; }
    function isImmediate(address a, address b) public view returns (bool) { return _mode[relId(a, b)] == Mode.Immediate; }

    // the GATE: other contracts call this before recording / pricing / charging
    function requireTouchable(address a, address b) external view {
        require(_mode[relId(a, b)] != Mode.Immediate, "Immediate: keep it off-chain");
    }

    // the DISGUISE X-ray: extraction flowing in an Immediate relationship is a taboo
    function flagIfTaboo(address a, address b, string calldata kind) external {
        if (_mode[relId(a, b)] == Mode.Immediate) emit Taboo(relId(a, b), kind);  // e.g. "interest","price","fee"
    }
}
