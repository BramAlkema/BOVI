// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BilateralModeAgreement} from "./BilateralModeAgreement.sol";
import {SignedPositionLedger} from "./SignedPositionLedger.sol";

/**
 * @title SettlementEpisode — contractual governance of tender and residual adaptation
 * @notice Composes a bilateral mode declaration with bounded ledger postings.
 * @dev Named for Oliver E. SettlementEpisode's governance of contractual relations and
 * ex-post adaptation. Its events are party assertions, not proof of delivery or
 * legal discharge, and it does not reproduce transaction-cost optimisation.
 */
contract SettlementEpisode {
    enum Status {
        Unset,
        Proposed,
        Active,
        TenderOffered,
        TenderAccepted,
        Discharged,
        Cancelled,
        Expired
    }

    struct Episode {
        address payer;
        address payee;
        bytes32 domain;
        bytes32 purpose;
        uint256 modeAgreementId;
        uint256 price;
        uint256 outstanding;
        uint256 changeDue;
        uint256 offeredTotal;
        uint256 acceptedTotal;
        uint256 tippedTotal;
        uint256 waivedTotal;
        uint256 roundedTotal;
        uint256 returnedChangeTotal;
        uint256 nextOfferId;
        uint256 roundingTolerance;
        uint64 expiry;
        Status status;
        address cancellationRequester;
    }

    struct TenderOffer {
        uint256 offered;
        uint256 remaining;
        uint256 declaredTip;
        uint256 remainingTip;
    }

    error InvalidTerms();
    error WrongParty();
    error WrongState();
    error InvalidAmount();
    error UnresolvedResidual();

    SignedPositionLedger public immutable ledger;
    BilateralModeAgreement public immutable modes;
    uint256 public nextEpisodeId = 1;

    mapping(uint256 => Episode) internal _episodes;
    mapping(uint256 => mapping(uint256 => TenderOffer)) internal _offers;

    event EpisodeProposed(
        uint256 indexed episodeId,
        address indexed payer,
        address indexed payee,
        uint256 modeAgreementId,
        bytes32 domain,
        bytes32 purpose,
        uint256 price,
        uint256 roundingTolerance,
        uint64 expiry
    );
    event EpisodeActivated(uint256 indexed episodeId, address indexed payee);
    event TenderOffered(uint256 indexed episodeId, uint256 indexed offerId, uint256 amount, uint256 declaredTip);
    event TenderAccepted(
        uint256 indexed episodeId,
        uint256 indexed offerId,
        bytes32 indexed postingRef,
        uint256 amount,
        uint256 appliedToPrice,
        uint256 appliedAsTip,
        uint256 changeCreated
    );
    event PriceWaived(uint256 indexed episodeId, uint256 amount, address indexed payee);
    event ResidualRounded(uint256 indexed episodeId, bool changeResidual, uint256 amount, address indexed by);
    event ChangeReturned(uint256 indexed episodeId, bytes32 indexed postingRef, uint256 amount);
    event CancellationRequested(uint256 indexed episodeId, address indexed by);
    event EpisodeCancelled(uint256 indexed episodeId, address indexed by);
    event EpisodeExpired(uint256 indexed episodeId);
    event DischargeAcknowledged(uint256 indexed episodeId, address indexed payee);

    constructor(SignedPositionLedger ledger_, BilateralModeAgreement modes_) {
        if (address(ledger_) == address(0) || address(modes_) == address(0)) revert InvalidTerms();
        ledger = ledger_;
        modes = modes_;
    }

    function propose(
        address payee,
        uint256 modeAgreementId,
        bytes32 domain,
        bytes32 purpose,
        uint256 price,
        uint256 roundingTolerance,
        uint64 expiry
    ) external returns (uint256 episodeId) {
        if (
            payee == address(0) || payee == msg.sender || domain == bytes32(0) || purpose == bytes32(0) || price == 0
                || roundingTolerance > price || expiry <= block.timestamp
        ) revert InvalidTerms();
        modes.requirePostable(modeAgreementId, msg.sender, payee, domain, purpose);

        episodeId = nextEpisodeId++;
        Episode storage item = _episodes[episodeId];
        item.payer = msg.sender;
        item.payee = payee;
        item.domain = domain;
        item.purpose = purpose;
        item.modeAgreementId = modeAgreementId;
        item.price = price;
        item.outstanding = price;
        item.nextOfferId = 1;
        item.roundingTolerance = roundingTolerance;
        item.expiry = expiry;
        item.status = Status.Proposed;

        emit EpisodeProposed(
            episodeId, msg.sender, payee, modeAgreementId, domain, purpose, price, roundingTolerance, expiry
        );
    }

    function activate(uint256 episodeId) external {
        Episode storage item = _episodes[episodeId];
        if (item.status != Status.Proposed || block.timestamp > item.expiry) revert WrongState();
        if (msg.sender != item.payee) revert WrongParty();
        modes.requirePostable(item.modeAgreementId, item.payer, item.payee, item.domain, item.purpose);
        item.status = Status.Active;
        emit EpisodeActivated(episodeId, msg.sender);
    }

    function offerTender(uint256 episodeId, uint256 amount, uint256 declaredTip) external returns (uint256 offerId) {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payer) revert WrongParty();
        if (amount == 0 || declaredTip > amount) revert InvalidAmount();

        offerId = item.nextOfferId++;
        _offers[episodeId][offerId] =
            TenderOffer({offered: amount, remaining: amount, declaredTip: declaredTip, remainingTip: declaredTip});
        item.offeredTotal += amount;
        item.status = Status.TenderOffered;
        emit TenderOffered(episodeId, offerId, amount, declaredTip);
    }

    function acceptTender(uint256 episodeId, uint256 offerId, uint256 amount, bytes32 postingRef) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payee) revert WrongParty();
        TenderOffer storage offered = _offers[episodeId][offerId];
        if (amount == 0 || amount > offered.remaining) revert InvalidAmount();

        uint256 appliedToPrice = amount < item.outstanding ? amount : item.outstanding;
        uint256 excess = amount - appliedToPrice;
        uint256 appliedAsTip = excess < offered.remainingTip ? excess : offered.remainingTip;
        uint256 changeCreated = excess - appliedAsTip;

        offered.remaining -= amount;
        offered.remainingTip -= appliedAsTip;
        item.outstanding -= appliedToPrice;
        item.changeDue += changeCreated;
        item.acceptedTotal += amount;
        item.tippedTotal += appliedAsTip;
        item.status = Status.TenderAccepted;

        ledger.postFrom(
            SignedPositionLedger.PostingRequest({
                postingRef: postingRef,
                episodeId: episodeId,
                modeAgreementId: item.modeAgreementId,
                modeRegistry: address(modes),
                domain: item.domain,
                purpose: item.purpose,
                from: item.payer,
                to: item.payee,
                amount: amount
            })
        );
        emit TenderAccepted(episodeId, offerId, postingRef, amount, appliedToPrice, appliedAsTip, changeCreated);
    }

    function waiveOutstanding(uint256 episodeId, uint256 amount) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payee) revert WrongParty();
        if (amount == 0 || amount > item.outstanding) revert InvalidAmount();
        item.outstanding -= amount;
        item.waivedTotal += amount;
        emit PriceWaived(episodeId, amount, msg.sender);
    }

    function roundOutstanding(uint256 episodeId) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payee) revert WrongParty();
        uint256 amount = item.outstanding;
        if (amount == 0 || amount > item.roundingTolerance) revert InvalidAmount();
        item.outstanding = 0;
        item.roundedTotal += amount;
        emit ResidualRounded(episodeId, false, amount, msg.sender);
    }

    function roundChange(uint256 episodeId) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payer) revert WrongParty();
        uint256 amount = item.changeDue;
        if (amount == 0 || amount > item.roundingTolerance) revert InvalidAmount();
        item.changeDue = 0;
        item.roundedTotal += amount;
        emit ResidualRounded(episodeId, true, amount, msg.sender);
    }

    function returnChange(uint256 episodeId, uint256 amount, bytes32 postingRef) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payee) revert WrongParty();
        if (amount == 0 || amount > item.changeDue) revert InvalidAmount();
        item.changeDue -= amount;
        item.returnedChangeTotal += amount;

        ledger.postFrom(
            SignedPositionLedger.PostingRequest({
                postingRef: postingRef,
                episodeId: episodeId,
                modeAgreementId: item.modeAgreementId,
                modeRegistry: address(modes),
                domain: item.domain,
                purpose: item.purpose,
                from: item.payee,
                to: item.payer,
                amount: amount
            })
        );
        emit ChangeReturned(episodeId, postingRef, amount);
    }

    function acknowledgeDischarge(uint256 episodeId) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payee) revert WrongParty();
        if (item.outstanding != 0 || item.changeDue != 0) revert UnresolvedResidual();
        item.status = Status.Discharged;
        emit DischargeAcknowledged(episodeId, msg.sender);
    }

    function cancelProposal(uint256 episodeId) external {
        Episode storage item = _episodes[episodeId];
        if (item.status != Status.Proposed) revert WrongState();
        if (msg.sender != item.payer) revert WrongParty();
        item.status = Status.Cancelled;
        emit EpisodeCancelled(episodeId, msg.sender);
    }

    function requestCancellation(uint256 episodeId) external {
        Episode storage item = _openEpisode(episodeId);
        if (msg.sender != item.payer && msg.sender != item.payee) revert WrongParty();
        item.cancellationRequester = msg.sender;
        emit CancellationRequested(episodeId, msg.sender);
    }

    function acceptCancellation(uint256 episodeId) external {
        Episode storage item = _openEpisode(episodeId);
        if (item.cancellationRequester == address(0)) revert WrongState();
        if (msg.sender == item.cancellationRequester || (msg.sender != item.payer && msg.sender != item.payee)) {
            revert WrongParty();
        }
        item.status = Status.Cancelled;
        emit EpisodeCancelled(episodeId, msg.sender);
    }

    function expire(uint256 episodeId) external {
        Episode storage item = _episodes[episodeId];
        if ((item.status != Status.Proposed && !_isOpen(item.status)) || block.timestamp <= item.expiry) {
            revert WrongState();
        }
        item.status = Status.Expired;
        emit EpisodeExpired(episodeId);
    }

    function episode(uint256 episodeId) external view returns (Episode memory) {
        return _episodes[episodeId];
    }

    function tenderOffer(uint256 episodeId, uint256 offerId) external view returns (TenderOffer memory) {
        return _offers[episodeId][offerId];
    }

    function _openEpisode(uint256 episodeId) internal view returns (Episode storage item) {
        item = _episodes[episodeId];
        if (!_isOpen(item.status) || block.timestamp > item.expiry) revert WrongState();
    }

    function _isOpen(Status status_) internal pure returns (bool) {
        return status_ == Status.Active || status_ == Status.TenderOffered || status_ == Status.TenderAccepted;
    }
}
