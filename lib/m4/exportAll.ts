// One-click export (JSON bundle)
import { getRules } from "./rulesRegistry.js";
import { listTrials } from "./trials.js";
import { getDist } from "./distribution.js";
import { getChosenProvider, listIndexProviders } from "./providers.js";

export async function exportAll(): Promise<Blob> {
  const payload = {
    exportedAt: new Date().toISOString(),
    rules: getRules(),
    trials: listTrials(),
    distribution: getDist(),
    indexProviders: await listIndexProviders(),
    chosenProvider: getChosenProvider()
    // add: flows, receipts, contracts if you expose their stores
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
}