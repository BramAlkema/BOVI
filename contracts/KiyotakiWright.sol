// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KiyotakiWright — an acceptance-feedback threshold demonstrator
 *
 * Inspired by Kiyotaki & Wright, "On Money as a Medium of Exchange" (JPE 1989):
 * expected re-tradeability can make speculative acceptance self-reinforcing.
 * This contract isolates that feedback. It does NOT implement their search
 * economy: there are no agents, types, production, consumption, inventories,
 * meetings, trades, or matching probabilities.
 *
 * Setup: three candidate goods, each represented only by an externally supplied
 * ledger-likeness score and current marketability score. When marketability is
 * above the candidate's derived holding-cost threshold, the score rises by a
 * fixed increment; otherwise it falls. Reaching SCALE sets a sticky `isMoney`
 * flag. This is deterministic threshold dynamics, not strategic choice by
 * simulated people.
 *
 * Framework use: ledger-likeness lowers the threshold for acceptance, while
 * initial expectations can let another candidate climb first. The scalar is a
 * toy input standing in for resolution and integrity. The canon keeps those
 * properties—and known supply versus divisibility—distinct.
 *
 * NO FLOOR guard: `ledger[g]` is a transaction-cost input, not value or backing.
 * The state can illustrate selection feedback; it says nothing about the
 * candidate's marginal worth. Constructor domains are not currently validated,
 * so callers must keep ledger and seed scores within SCALE and increments within
 * safe arithmetic bounds.
 */
contract KiyotakiWright {
    uint256 public constant SCALE = 10_000;   // basis points
    uint8   public constant G = 3;

    uint256[3] public ledger;          // toy resolution+integrity score; higher ⇒ lower holding threshold
    uint256[3] public marketability;   // current acceptance probability per good (0..SCALE)
    bool[3]    public isMoney;          // has score g ever reached SCALE?
    uint256    public round;

    uint256 public adopt;              // how fast acceptance climbs when speculatively held
    uint256 public decay;              // how fast it falls back when not

    event Step(uint256 indexed round, uint256 m0, uint256 m1, uint256 m2);
    event MoneyEmerged(uint8 indexed good, uint256 round);

    // ledger0..2 = ledger-likeness of each good; seed0..2 = initial marketability (expectations)
    constructor(
        uint256 ledger0, uint256 ledger1, uint256 ledger2,
        uint256 seed0,   uint256 seed1,   uint256 seed2,
        uint256 _adopt,  uint256 _decay
    ) {
        ledger = [ledger0, ledger1, ledger2];
        marketability = [seed0, seed1, seed2];
        adopt = _adopt; decay = _decay;
    }

    function holdingCost(uint8 g) public view returns (uint256) {
        return SCALE - ledger[g];        // less ledger-like ⇒ costlier to hold/re-trade
    }

    function step() external { _step(); }
    function run(uint256 rounds) external { for (uint256 i = 0; i < rounds; i++) _step(); }

    // one round of best-response + self-fulfilling feedback
    function _step() internal {
        round++;
        for (uint8 g = 0; g < G; g++) {
            uint256 cost = SCALE - ledger[g];
            uint256 m = marketability[g];
            if (m > cost) {
                // speculative value positive → accepted as money → marketability climbs (the feedback)
                uint256 nm = m + adopt;
                marketability[g] = nm > SCALE ? SCALE : nm;
            } else {
                // not worth holding speculatively → acceptance falls back toward consumption-only
                marketability[g] = m > decay ? m - decay : 0;
            }
            if (!isMoney[g] && marketability[g] >= SCALE) {
                isMoney[g] = true;
                emit MoneyEmerged(g, round);
            }
        }
        emit Step(round, marketability[0], marketability[1], marketability[2]);
    }

    // which good is emerging / has emerged as money (the most accepted)
    function emergedMoney() external view returns (uint8 best) {
        uint256 top;
        for (uint8 g = 0; g < G; g++) {
            if (marketability[g] > top) { top = marketability[g]; best = g; }
        }
    }
}
