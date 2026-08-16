// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BilateralModeAgreement — bilateral, scoped relational-mode declarations
 * @notice Records party assertions and assent. It cannot establish that a social
 * relationship is correctly classified or that either party remains willing.
 */
contract BilateralModeAgreement {
    enum Mode {
        Unset,
        Immediate,
        Balanced,
        Obligated,
        Value
    }
    enum Status {
        Unset,
        Proposed,
        Active,
        Rejected,
        Cancelled,
        Superseded,
        Expired
    }

    struct Agreement {
        address proposer;
        address counterparty;
        bytes32 domain;
        bytes32 purpose;
        Mode mode;
        uint64 validFrom;
        uint64 validUntil;
        uint256 predecessor;
        Status status;
        address cancellationRequester;
    }

    error InvalidProposal();
    error InvalidPredecessor();
    error WrongState();
    error WrongParty();
    error WrongScope();
    error NotPostable();

    mapping(uint256 => Agreement) internal _agreements;
    uint256 public nextAgreementId = 1;

    event Proposed(
        uint256 indexed agreementId,
        address indexed proposer,
        address indexed counterparty,
        bytes32 domain,
        bytes32 purpose,
        Mode mode,
        uint64 validFrom,
        uint64 validUntil,
        uint256 predecessor
    );
    event Accepted(uint256 indexed agreementId, address indexed by);
    event Rejected(uint256 indexed agreementId, address indexed by);
    event CancellationRequested(uint256 indexed agreementId, address indexed by);
    event Cancelled(uint256 indexed agreementId, address indexed by);
    event Superseded(uint256 indexed agreementId, uint256 indexed successor);
    event Expired(uint256 indexed agreementId);

    function relationId(address a, address b) public pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    function propose(
        address counterparty,
        bytes32 domain,
        bytes32 purpose,
        Mode declaredMode,
        uint64 validFrom,
        uint64 validUntil,
        uint256 predecessor
    ) external returns (uint256 agreementId) {
        if (
            counterparty == address(0) || counterparty == msg.sender || domain == bytes32(0) || purpose == bytes32(0)
                || declaredMode == Mode.Unset || validUntil <= validFrom || validUntil <= block.timestamp
        ) revert InvalidProposal();

        if (predecessor != 0) {
            Agreement storage previous = _agreements[predecessor];
            if (
                _status(previous) != Status.Active
                    || relationId(previous.proposer, previous.counterparty) != relationId(msg.sender, counterparty)
                    || previous.domain != domain || previous.purpose != purpose || previous.mode == declaredMode
            ) revert InvalidPredecessor();
        }

        agreementId = nextAgreementId++;
        _agreements[agreementId] = Agreement({
            proposer: msg.sender,
            counterparty: counterparty,
            domain: domain,
            purpose: purpose,
            mode: declaredMode,
            validFrom: validFrom,
            validUntil: validUntil,
            predecessor: predecessor,
            status: Status.Proposed,
            cancellationRequester: address(0)
        });
        emit Proposed(
            agreementId, msg.sender, counterparty, domain, purpose, declaredMode, validFrom, validUntil, predecessor
        );
    }

    function accept(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (item.status != Status.Proposed || block.timestamp > item.validUntil) revert WrongState();
        if (msg.sender != item.counterparty) revert WrongParty();

        if (item.predecessor != 0) {
            Agreement storage previous = _agreements[item.predecessor];
            if (_status(previous) != Status.Active) revert InvalidPredecessor();
            previous.status = Status.Superseded;
            emit Superseded(item.predecessor, agreementId);
        }
        item.status = Status.Active;
        emit Accepted(agreementId, msg.sender);
    }

    function reject(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (item.status != Status.Proposed) revert WrongState();
        if (msg.sender != item.counterparty) revert WrongParty();
        item.status = Status.Rejected;
        emit Rejected(agreementId, msg.sender);
    }

    function cancelProposal(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (item.status != Status.Proposed) revert WrongState();
        if (msg.sender != item.proposer) revert WrongParty();
        item.status = Status.Cancelled;
        emit Cancelled(agreementId, msg.sender);
    }

    function requestCancellation(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (_status(item) != Status.Active) revert WrongState();
        if (msg.sender != item.proposer && msg.sender != item.counterparty) revert WrongParty();
        item.cancellationRequester = msg.sender;
        emit CancellationRequested(agreementId, msg.sender);
    }

    function acceptCancellation(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (_status(item) != Status.Active || item.cancellationRequester == address(0)) revert WrongState();
        if (
            msg.sender == item.cancellationRequester || (msg.sender != item.proposer && msg.sender != item.counterparty)
        ) revert WrongParty();
        item.status = Status.Cancelled;
        emit Cancelled(agreementId, msg.sender);
    }

    function expire(uint256 agreementId) external {
        Agreement storage item = _agreements[agreementId];
        if (item.status != Status.Active || block.timestamp <= item.validUntil) revert WrongState();
        item.status = Status.Expired;
        emit Expired(agreementId);
    }

    function agreement(uint256 agreementId) external view returns (Agreement memory) {
        return _agreements[agreementId];
    }

    function status(uint256 agreementId) external view returns (Status) {
        return _status(_agreements[agreementId]);
    }

    function requirePostable(uint256 agreementId, address a, address b, bytes32 domain, bytes32 purpose) external view {
        Agreement storage item = _agreements[agreementId];
        if (_status(item) != Status.Active || block.timestamp < item.validFrom) revert WrongState();
        if (relationId(item.proposer, item.counterparty) != relationId(a, b)) revert WrongParty();
        if (item.domain != domain || item.purpose != purpose) revert WrongScope();
        if (item.mode == Mode.Immediate) revert NotPostable();
    }

    function _status(Agreement storage item) internal view returns (Status) {
        if (item.status == Status.Active && block.timestamp > item.validUntil) return Status.Expired;
        return item.status;
    }
}
