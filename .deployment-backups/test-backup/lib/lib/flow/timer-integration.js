import { Bus } from "../bus.js";
import { startTimer, cancelTimer } from "../timer.js";
export class FlowTimerService {
    constructor(contextManager) {
        this.contextManager = contextManager;
    }
    startNodeTimeout(node, flowId, onComplete) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        const [mode] = node.type.split(".");
        const timerConfig = {
            flow: flowId,
            node: node.id,
            timeout_s: node.config.timeout_s,
            action: node.config.action,
            mode: mode,
        };
        const timerId = startTimer(timerConfig);
        this.contextManager.addActiveTimer(context, timerId);
        this.setupTimerEventHandlers(mode, flowId, node.id, timerId, onComplete);
    }
    cancelNodeTimeout(flowId, nodeId, reason = "user_action") {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        const activeTimer = Array.from(context.activeTimers)[0];
        if (activeTimer) {
            cancelTimer(activeTimer, reason);
            this.contextManager.removeActiveTimer(context, activeTimer);
        }
    }
    cancelAllTimers(flowId, reason) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        this.contextManager.clearActiveTimers(context, timerId => {
            cancelTimer(timerId, reason);
        });
    }
    setupTimerEventHandlers(mode, flowId, nodeId, timerId, onComplete) {
        const context = this.contextManager.getContext(flowId);
        if (!context)
            return;
        const createHandlers = (eventPrefix) => {
            Bus.on(`${eventPrefix}.applied`, (event) => {
                if (event.detail?.flow === flowId && event.detail?.node === nodeId) {
                    const output = {
                        action_applied: true,
                        result: event.detail?.result || {},
                        type: "timeout",
                    };
                    this.contextManager.removeActiveTimer(context, timerId);
                    onComplete(nodeId, output);
                }
            });
            Bus.on(`${eventPrefix}.cancelled`, (event) => {
                if (event.detail?.flow === flowId && event.detail?.node === nodeId) {
                    this.contextManager.removeActiveTimer(context, timerId);
                    this.contextManager.setUserOverride(context, nodeId);
                }
            });
        };
        switch (mode) {
            case "I":
                createHandlers("I.default");
                break;
            case "B":
                createHandlers("B.default");
                break;
            case "O":
                createHandlers("O.default");
                break;
            case "V":
                createHandlers("V.default");
                break;
        }
    }
}
//# sourceMappingURL=timer-integration.js.map