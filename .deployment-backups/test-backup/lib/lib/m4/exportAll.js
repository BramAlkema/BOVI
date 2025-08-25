import { getRules } from "./rulesRegistry.js";
import { listTrials } from "./trials.js";
import { getDist } from "./distribution.js";
import { getChosenProvider, listIndexProviders } from "./providers.js";
export async function exportAll() {
    const payload = {
        exportedAt: new Date().toISOString(),
        rules: getRules(),
        trials: listTrials(),
        distribution: getDist(),
        indexProviders: await listIndexProviders(),
        chosenProvider: getChosenProvider(),
    };
    return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}
//# sourceMappingURL=exportAll.js.map