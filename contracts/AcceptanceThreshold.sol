// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AcceptanceThreshold — V1 threshold trace plus a scoped continuation amendment
 *
 * The original three-score engine remains callable as a compatibility trace: an
 * externally supplied marketability score rises above a holding-cost threshold
 * and eventually sets a sticky `isMoney` flag. That path still does not implement
 * the Kiyotaki-Wright search economy and cannot install the amended lifecycle.
 *
 * The amendment starts one causal step earlier. Wants are exogenous. Registered
 * actors declare, for each action and candidate instrument, the future opportunity
 * they believe is accessible and the costs and alternatives they face. A candidate
 * is instrumentally fit for that actor/action only when the declared comparative
 * continuation margin is positive. Bounded priming may temporarily carry an
 * otherwise unmotivated action, but only fresh post-priming use and participant-
 * carried protection can qualify a scoped instrument as self-maintaining.
 *
 * This contract records declarations and compatible assertions by addresses. It
 * does not prove physical delivery, genuine desire, consent, truth, reacceptance,
 * production, welfare, or continued performance. It cannot give anyone a claim on
 * another person's body. Solidity constrains this demonstration's state changes;
 * it does not manufacture the world-side opportunities that make money useful.
 */
contract AcceptanceThreshold {
    error InvalidInput();
    error InvalidState();
    error Unauthorized();
    error UnknownInstrument();
    error UnregisteredActor();
    error NoViableMotive();

    uint256 public constant SCALE = 10_000;
    uint8 public constant G = 3;

    uint256 public constant MAX_ACTORS = 64;
    uint256 public constant MAX_AMOUNT = 1e30;
    uint32 public constant MAX_HORIZON = 3_650;
    uint64 public constant MIN_COMPLETED_USES = 2;
    uint64 public constant MIN_POST_PRIMING_USES = 2;

    // --- V1 compatibility trace ---

    uint256[3] public ledger;
    uint256[3] public marketability;
    bool[3] public isMoney;
    uint256 public round;
    uint256 public adopt;
    uint256 public decay;

    event Step(uint256 indexed round, uint256 m0, uint256 m1, uint256 m2);
    event MoneyEmerged(uint8 indexed good, uint256 round);

    // --- Scoped amendment ---

    enum Action {
        Acquire,
        Accept,
        Renew,
        Protect
    }

    enum Lifecycle {
        Candidate,
        Priming,
        Propagating,
        InstalledSupported,
        InstalledSelfMaintaining,
        Fragile
    }

    enum PrimingStopCause {
        PayerStopped,
        BudgetExhausted,
        UseConditionMet
    }

    enum LifecycleCause {
        PrimedAcquisition,
        RenewedUse,
        ContinuationFailure,
        PrimingContinues,
        PostPrimingPassed,
        EvidenceMaturing
    }

    struct OpportunityDeclaration {
        uint128 accessibleSurplusPerPeriod;
        uint128 immediateReward;
        uint128 outsideOption;
        uint128 defectionGain;
        uint128 participationCost;
        uint128 holdingCost;
        uint128 protectionCost;
        uint128 alternativeFitness;
        uint32 horizon;
        uint16 credibilityBps;
        uint16 presentValueFactorBps;
        bool active;
    }

    struct PrimingAllowance {
        address payer;
        uint128 remainingBudget;
        uint128 costPerAction;
        uint64 stopAfterCompletedUses;
        bool active;
        bool engaged;
    }

    struct UseEpisode {
        uint8 good;
        address offeror;
        address counterparty;
        bool accepted;
        bool completed;
    }

    struct InstrumentRuntime {
        uint64 completedUses;
        uint64 postPrimingUses;
        uint64 activePrimingAllowances;
        uint64 supportRemovedAtBlock;
        uint64 lastPostPrimingUseBlock;
        address protectionActor;
        uint64 protectionPeriodBlocks;
        uint64 protectionDueBlock;
        uint64 lastProtectedBlock;
    }

    address[] private actors;
    mapping(address => bool) public registeredActor;
    mapping(address => mapping(uint8 => mapping(Action => OpportunityDeclaration))) private opportunityDeclarations;
    mapping(address => mapping(uint8 => uint8)) private requiredActionMask;
    mapping(address => mapping(address => bool)) public approvedPrimingSponsor;
    mapping(address => mapping(uint8 => PrimingAllowance)) private primingAllowances;
    mapping(bytes32 => UseEpisode) private useEpisodes;

    bytes32[3] public acceptanceScope;
    Lifecycle[3] public lifecycle;
    InstrumentRuntime[3] private instrumentRuntime;

    event ActorRegistered(address indexed actor);
    event PrimingSponsorSet(address indexed actor, address indexed sponsor, bool approved);
    event OpportunityDeclared(
        address indexed actor, uint8 indexed good, Action indexed action, int256 comparativeMargin, bool active
    );
    event PrimingConfigured(
        address indexed payer,
        address indexed actor,
        uint8 indexed good,
        uint128 budget,
        uint128 costPerAction,
        uint64 stopAfterCompletedUses
    );
    event PrimingSpent(
        address indexed payer,
        address indexed actor,
        uint8 indexed good,
        Action action,
        uint128 amount,
        uint128 remainingBudget
    );
    event PrimingStopped(
        address indexed payer, address indexed actor, uint8 indexed good, PrimingStopCause cause, uint64 observedAtBlock
    );
    event UseOffered(
        bytes32 indexed episodeId, uint8 indexed good, address indexed offeror, address counterparty, bool primed
    );
    event UseAccepted(bytes32 indexed episodeId, address indexed counterparty, bool primed);
    event UseRenewed(bytes32 indexed episodeId, address indexed offeror, uint64 completedUses, bool primed);
    event ProtectionAssumed(uint8 indexed good, address indexed actor, uint64 periodBlocks, uint64 dueBlock);
    event ProtectionAsserted(
        uint8 indexed good, address indexed actor, uint64 assertedAtBlock, uint64 nextDueBlock, bool primed
    );
    event LifecycleChanged(uint8 indexed good, Lifecycle from, Lifecycle to, LifecycleCause cause);

    constructor(
        uint256 ledger0,
        uint256 ledger1,
        uint256 ledger2,
        uint256 seed0,
        uint256 seed1,
        uint256 seed2,
        uint256 _adopt,
        uint256 _decay
    ) {
        if (ledger0 > SCALE || ledger1 > SCALE || ledger2 > SCALE) revert InvalidInput();
        if (seed0 > SCALE || seed1 > SCALE || seed2 > SCALE) revert InvalidInput();
        if (_adopt > SCALE || _decay > SCALE) revert InvalidInput();

        ledger = [ledger0, ledger1, ledger2];
        marketability = [seed0, seed1, seed2];
        adopt = _adopt;
        decay = _decay;

        for (uint8 good = 0; good < G; good++) {
            acceptanceScope[good] = keccak256(abi.encode(address(this), good));
        }
    }

    // --- V1 compatibility behavior ---

    function holdingCost(uint8 good) public view returns (uint256) {
        return SCALE - ledger[good];
    }

    function step() external {
        _step();
    }

    function run(uint256 rounds) external {
        for (uint256 i = 0; i < rounds; i++) {
            _step();
        }
    }

    function _step() internal {
        round++;
        for (uint8 good = 0; good < G; good++) {
            uint256 cost = SCALE - ledger[good];
            uint256 current = marketability[good];
            if (current > cost) {
                uint256 next = current + adopt;
                marketability[good] = next > SCALE ? SCALE : next;
            } else {
                marketability[good] = current > decay ? current - decay : 0;
            }
            if (!isMoney[good] && marketability[good] >= SCALE) {
                isMoney[good] = true;
                emit MoneyEmerged(good, round);
            }
        }
        emit Step(round, marketability[0], marketability[1], marketability[2]);
    }

    function emergedMoney() external view returns (uint8 best) {
        uint256 top;
        for (uint8 good = 0; good < G; good++) {
            if (marketability[good] > top) {
                top = marketability[good];
                best = good;
            }
        }
    }

    // --- Actor declarations and comparative fitness ---

    function registerActor() external {
        if (registeredActor[msg.sender]) revert InvalidState();
        if (msg.sender == address(0) || actors.length >= MAX_ACTORS) revert InvalidInput();
        registeredActor[msg.sender] = true;
        actors.push(msg.sender);
        emit ActorRegistered(msg.sender);
    }

    function setPrimingSponsor(address sponsor, bool approved) external {
        if (!registeredActor[msg.sender] || sponsor == address(0)) revert InvalidInput();
        approvedPrimingSponsor[msg.sender][sponsor] = approved;
        emit PrimingSponsorSet(msg.sender, sponsor, approved);
    }

    function declareOpportunity(uint8 good, Action action, OpportunityDeclaration calldata declaration) external {
        _requireGood(good);
        if (!registeredActor[msg.sender]) revert UnregisteredActor();
        _validateDeclaration(declaration);
        opportunityDeclarations[msg.sender][good][action] = declaration;
        (,, int256 margin,) = instrumentalFitness(msg.sender, good, action);
        emit OpportunityDeclared(msg.sender, good, action, margin, declaration.active);
    }

    function opportunityOf(address actor, uint8 good, Action action)
        external
        view
        returns (OpportunityDeclaration memory)
    {
        _requireGood(good);
        return opportunityDeclarations[actor][good][action];
    }

    function instrumentalFitness(address actor, uint8 good, Action action)
        public
        view
        returns (uint256 expectedBenefit, uint256 totalCosts, int256 margin, bool viable)
    {
        _requireGood(good);
        OpportunityDeclaration storage declaration = opportunityDeclarations[actor][good][action];
        if (!declaration.active) return (0, 0, 0, false);

        expectedBenefit = uint256(declaration.accessibleSurplusPerPeriod) * declaration.horizon;
        expectedBenefit = (expectedBenefit * declaration.credibilityBps) / SCALE;
        expectedBenefit = (expectedBenefit * declaration.presentValueFactorBps) / SCALE;
        expectedBenefit += declaration.immediateReward;

        totalCosts = uint256(declaration.outsideOption) + declaration.defectionGain + declaration.participationCost
            + declaration.holdingCost + declaration.protectionCost + declaration.alternativeFitness;

        if (expectedBenefit >= totalCosts) {
            uint256 difference = expectedBenefit - totalCosts;
            // Safe: validated amounts and horizon cap both sides far below int256.max.
            // forge-lint: disable-next-line(unsafe-typecast)
            margin = int256(difference);
            viable = difference > 0;
        } else {
            // Safe: validated amounts and horizon cap both sides far below int256.max.
            // forge-lint: disable-next-line(unsafe-typecast)
            margin = -int256(totalCosts - expectedBenefit);
        }
    }

    // --- Bounded first-mover priming ---

    function configurePriming(
        address actor,
        uint8 good,
        uint128 budget,
        uint128 costPerAction,
        uint64 stopAfterCompletedUses
    ) external {
        _requireGood(good);
        if (!registeredActor[actor]) revert UnregisteredActor();
        if (msg.sender != actor && !approvedPrimingSponsor[actor][msg.sender]) revert Unauthorized();
        if (budget == 0 || budget > MAX_AMOUNT) revert InvalidInput();
        if (costPerAction == 0 || costPerAction > budget) revert InvalidInput();
        if (stopAfterCompletedUses == 0) revert InvalidInput();

        PrimingAllowance storage current = primingAllowances[actor][good];
        if (current.active) revert InvalidState();

        primingAllowances[actor][good] = PrimingAllowance({
            payer: msg.sender,
            remainingBudget: budget,
            costPerAction: costPerAction,
            stopAfterCompletedUses: stopAfterCompletedUses,
            active: true,
            engaged: false
        });

        emit PrimingConfigured(msg.sender, actor, good, budget, costPerAction, stopAfterCompletedUses);
    }

    function stopPriming(address actor, uint8 good) external {
        _requireGood(good);
        PrimingAllowance storage allowance = primingAllowances[actor][good];
        if (!allowance.active) revert InvalidState();
        if (msg.sender != allowance.payer) revert Unauthorized();
        _endPriming(actor, good, PrimingStopCause.PayerStopped);
        _evaluateLifecycle(good);
    }

    function primingOf(address actor, uint8 good) external view returns (PrimingAllowance memory) {
        _requireGood(good);
        return primingAllowances[actor][good];
    }

    // --- Compatible multi-party use assertions ---

    function offerUse(bytes32 episodeId, uint8 good, address counterparty) external {
        _requireGood(good);
        if (episodeId == bytes32(0)) revert InvalidInput();
        if (!registeredActor[msg.sender] || !registeredActor[counterparty]) {
            revert UnregisteredActor();
        }
        if (counterparty == msg.sender) revert InvalidInput();
        if (useEpisodes[episodeId].offeror != address(0)) revert InvalidState();

        bool primed = _requireMotive(msg.sender, good, Action.Acquire);
        _markRequired(msg.sender, good, Action.Acquire);
        useEpisodes[episodeId] = UseEpisode({
            good: good, offeror: msg.sender, counterparty: counterparty, accepted: false, completed: false
        });
        if (primed && lifecycle[good] == Lifecycle.Candidate) {
            _setLifecycle(good, Lifecycle.Priming, LifecycleCause.PrimedAcquisition);
        }
        emit UseOffered(episodeId, good, msg.sender, counterparty, primed);
    }

    function acceptUse(bytes32 episodeId) external {
        UseEpisode storage episode = useEpisodes[episodeId];
        if (episode.offeror == address(0)) revert InvalidState();
        if (msg.sender != episode.counterparty) revert Unauthorized();
        if (episode.accepted) revert InvalidState();

        bool primed = _requireMotive(msg.sender, episode.good, Action.Accept);
        _markRequired(msg.sender, episode.good, Action.Accept);
        episode.accepted = true;
        emit UseAccepted(episodeId, msg.sender, primed);
    }

    function renewUse(bytes32 episodeId) external {
        UseEpisode storage episode = useEpisodes[episodeId];
        if (episode.offeror == address(0)) revert InvalidState();
        if (msg.sender != episode.offeror) revert Unauthorized();
        if (!episode.accepted || episode.completed) revert InvalidState();

        bool primed = _requireMotive(msg.sender, episode.good, Action.Renew);
        _markRequired(msg.sender, episode.good, Action.Renew);
        episode.completed = true;

        InstrumentRuntime storage runtime = instrumentRuntime[episode.good];
        runtime.completedUses++;
        _stopPrimingAtDeclaredCondition(episode.good);
        if (
            runtime.activePrimingAllowances == 0 && block.number > runtime.supportRemovedAtBlock
                && block.number > runtime.lastPostPrimingUseBlock
        ) {
            runtime.postPrimingUses++;
            runtime.lastPostPrimingUseBlock = uint64(block.number);
        }

        emit UseRenewed(episodeId, msg.sender, runtime.completedUses, primed);
        _evaluateLifecycle(episode.good);
    }

    // --- Participant-carried protection ---

    function assumeProtection(uint8 good, uint64 periodBlocks) external {
        _requireGood(good);
        if (!registeredActor[msg.sender]) revert UnregisteredActor();
        if (periodBlocks == 0) revert InvalidInput();
        InstrumentRuntime storage runtime = instrumentRuntime[good];
        if (runtime.protectionActor != address(0) && runtime.protectionActor != msg.sender) {
            revert InvalidState();
        }
        runtime.protectionActor = msg.sender;
        runtime.protectionPeriodBlocks = periodBlocks;
        runtime.protectionDueBlock = uint64(block.number) + periodBlocks;
        emit ProtectionAssumed(good, msg.sender, periodBlocks, runtime.protectionDueBlock);
    }

    function assertProtection(uint8 good) external {
        _requireGood(good);
        InstrumentRuntime storage runtime = instrumentRuntime[good];
        if (msg.sender != runtime.protectionActor) revert Unauthorized();
        bool primed = _requireMotive(msg.sender, good, Action.Protect);
        _markRequired(msg.sender, good, Action.Protect);
        runtime.lastProtectedBlock = uint64(block.number);
        runtime.protectionDueBlock = uint64(block.number) + runtime.protectionPeriodBlocks;
        emit ProtectionAsserted(good, msg.sender, runtime.lastProtectedBlock, runtime.protectionDueBlock, primed);
        _evaluateLifecycle(good);
    }

    function evaluateLifecycle(uint8 good) external returns (Lifecycle) {
        _requireGood(good);
        _evaluateLifecycle(good);
        return lifecycle[good];
    }

    function runtimeOf(uint8 good) external view returns (InstrumentRuntime memory) {
        _requireGood(good);
        return instrumentRuntime[good];
    }

    // --- Internal guards ---

    function _validateDeclaration(OpportunityDeclaration calldata declaration) internal pure {
        if (declaration.horizon == 0 || declaration.horizon > MAX_HORIZON) revert InvalidInput();
        if (declaration.credibilityBps > SCALE || declaration.presentValueFactorBps > SCALE) {
            revert InvalidInput();
        }
        if (
            declaration.accessibleSurplusPerPeriod > MAX_AMOUNT || declaration.immediateReward > MAX_AMOUNT
                || declaration.outsideOption > MAX_AMOUNT || declaration.defectionGain > MAX_AMOUNT
                || declaration.participationCost > MAX_AMOUNT || declaration.holdingCost > MAX_AMOUNT
                || declaration.protectionCost > MAX_AMOUNT || declaration.alternativeFitness > MAX_AMOUNT
        ) revert InvalidInput();
    }

    function _requireMotive(address actor, uint8 good, Action action) internal returns (bool primed) {
        (,,, bool viable) = instrumentalFitness(actor, good, action);
        if (viable) return false;

        PrimingAllowance storage allowance = primingAllowances[actor][good];
        if (!allowance.active || allowance.remainingBudget < allowance.costPerAction) {
            revert NoViableMotive();
        }
        if (!allowance.engaged) {
            InstrumentRuntime storage runtime = instrumentRuntime[good];
            if (runtime.activePrimingAllowances == 0) {
                runtime.postPrimingUses = 0;
                runtime.lastPostPrimingUseBlock = 0;
            }
            runtime.activePrimingAllowances++;
            allowance.engaged = true;
        }
        uint128 cost = allowance.costPerAction;
        allowance.remainingBudget -= cost;
        emit PrimingSpent(allowance.payer, actor, good, action, cost, allowance.remainingBudget);
        if (allowance.remainingBudget < allowance.costPerAction) {
            _endPriming(actor, good, PrimingStopCause.BudgetExhausted);
        }
        return true;
    }

    function _endPriming(address actor, uint8 good, PrimingStopCause cause) internal {
        PrimingAllowance storage allowance = primingAllowances[actor][good];
        if (!allowance.active) return;
        address payer = allowance.payer;
        allowance.active = false;
        InstrumentRuntime storage runtime = instrumentRuntime[good];
        if (allowance.engaged) {
            runtime.activePrimingAllowances--;
            if (runtime.activePrimingAllowances == 0) {
                runtime.supportRemovedAtBlock = uint64(block.number);
                runtime.postPrimingUses = 0;
                runtime.lastPostPrimingUseBlock = 0;
            }
        }
        emit PrimingStopped(payer, actor, good, cause, uint64(block.number));
    }

    function _stopPrimingAtDeclaredCondition(uint8 good) internal {
        uint64 completed = instrumentRuntime[good].completedUses;
        for (uint256 i = 0; i < actors.length; i++) {
            address actor = actors[i];
            PrimingAllowance storage allowance = primingAllowances[actor][good];
            if (allowance.active && completed >= allowance.stopAfterCompletedUses) {
                _endPriming(actor, good, PrimingStopCause.UseConditionMet);
            }
        }
    }

    function _markRequired(address actor, uint8 good, Action action) internal {
        requiredActionMask[actor][good] |= uint8(2 ** uint8(action));
    }

    function _allRequiredMarginsPositive(uint8 good) internal view returns (bool) {
        bool foundRequiredAction;
        for (uint256 i = 0; i < actors.length; i++) {
            address actor = actors[i];
            uint8 mask = requiredActionMask[actor][good];
            if (mask == 0) continue;
            foundRequiredAction = true;
            for (uint8 rawAction = 0; rawAction <= uint8(Action.Protect); rawAction++) {
                if ((mask & uint8(2 ** rawAction)) == 0) continue;
                (,,, bool viable) = instrumentalFitness(actor, good, Action(rawAction));
                if (!viable) return false;
            }
        }
        return foundRequiredAction;
    }

    function _protectionHealthy(uint8 good) internal view returns (bool) {
        InstrumentRuntime storage runtime = instrumentRuntime[good];
        return runtime.protectionActor != address(0) && runtime.lastProtectedBlock > 0
            && block.number <= runtime.protectionDueBlock;
    }

    function _evaluateLifecycle(uint8 good) internal {
        InstrumentRuntime storage runtime = instrumentRuntime[good];
        Lifecycle current = lifecycle[good];

        if (
            (current == Lifecycle.InstalledSupported
                    || current == Lifecycle.InstalledSelfMaintaining
                    || current == Lifecycle.Fragile)
                && (!_allRequiredMarginsPositive(good) || !_protectionHealthy(good))
                && runtime.completedUses >= MIN_COMPLETED_USES
        ) {
            _setLifecycle(good, Lifecycle.Fragile, LifecycleCause.ContinuationFailure);
            return;
        }

        if (runtime.completedUses == 0) return;
        if (runtime.completedUses < MIN_COMPLETED_USES) {
            _setLifecycle(good, Lifecycle.Propagating, LifecycleCause.RenewedUse);
            return;
        }

        if (runtime.activePrimingAllowances > 0) {
            _setLifecycle(good, Lifecycle.InstalledSupported, LifecycleCause.PrimingContinues);
            return;
        }

        if (
            runtime.postPrimingUses >= MIN_POST_PRIMING_USES && _allRequiredMarginsPositive(good)
                && _protectionHealthy(good)
        ) {
            _setLifecycle(good, Lifecycle.InstalledSelfMaintaining, LifecycleCause.PostPrimingPassed);
            return;
        }

        _setLifecycle(good, Lifecycle.InstalledSupported, LifecycleCause.EvidenceMaturing);
    }

    function _setLifecycle(uint8 good, Lifecycle next, LifecycleCause cause) internal {
        Lifecycle previous = lifecycle[good];
        if (previous == next) return;
        lifecycle[good] = next;
        emit LifecycleChanged(good, previous, next, cause);
    }

    function _requireGood(uint8 good) internal pure {
        if (good >= G) revert UnknownInstrument();
    }
}
