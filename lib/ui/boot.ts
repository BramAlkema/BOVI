// UI Boot System
import { registerUIPlugin } from "./plugins/registry.js";
import { mountUI, switchUI } from "./plugins/host.js";
import { SatnavPlugin } from "./plugins/m0-satnav.plugin.js";
import { RoutesLightsPlugin } from "./plugins/routes-lights.plugin.js";
import { RoomsChoresPlugin } from "./plugins/rooms-chores.plugin.js";
import { MissionDeckPlugin } from "./plugins/mission-deck.plugin.js";

// Register all available UI plugins
registerUIPlugin(SatnavPlugin);
registerUIPlugin(RoutesLightsPlugin);
registerUIPlugin(RoomsChoresPlugin);
registerUIPlugin(MissionDeckPlugin);

// Boot function
export async function bootUI(appElementId = "app", fallbackPluginId = "ui-satnav") {
  const appElement = document.getElementById(appElementId);
  if (!appElement) {
    throw new Error(`App element with id '${appElementId}' not found`);
  }
  
  try {
    await mountUI(appElement, fallbackPluginId);
    console.log("BOVI UI booted successfully");
  } catch (error) {
    console.error("Failed to boot BOVI UI:", error);
    appElement.innerHTML = `
      <div style="padding: 20px; color: #e7eef9; background: #0a0e1a; font-family: system-ui, sans-serif;">
        <h1>BOVI UI Boot Error</h1>
        <p>Failed to load UI plugin: ${error instanceof Error ? error.message : String(error)}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
    throw error;
  }
}

// Optional: expose switcher globally for development
if (typeof window !== "undefined") {
  (window as any).switchUI = (id: string) => {
    const appElement = document.getElementById("app");
    if (appElement) {
      return switchUI(appElement, id);
    } else {
      console.error("App element not found for UI switching");
    }
  };
  
  (window as any).listUIs = () => {
    console.table(["ui-satnav", "ui-routes-lights", "ui-rooms-chores", "ui-mission-deck"]);
  };
}