import { getActiveUIPluginId, getUIPlugin, setActiveUIPluginId } from "./registry.js";
import { Bus } from "../../core/bus.js";
import { Timers } from "../../core/timers.js";
import { getProfile } from "../../core/capabilities.js";
let current = null;
export async function mountUI(root, fallbackId) {
    const pid = getActiveUIPluginId() || fallbackId;
    await switchUI(root, pid);
}
export async function switchUI(root, pluginId) {
    if (current) {
        current.unmount();
        current = null;
    }
    const plugin = getUIPlugin(pluginId);
    if (!plugin)
        throw new Error(`UI plugin ${pluginId} not registered`);
    setActiveUIPluginId(pluginId);
    const ctx = {
        root,
        bus: Bus,
        timers: Timers,
        profile: getProfile(),
        navigate: (route) => window.dispatchEvent(new CustomEvent("nav:go", { detail: route })),
        openOverlay: (id, props) => window.dispatchEvent(new CustomEvent("overlay:open", { detail: { id, props } })),
        closeOverlay: () => window.dispatchEvent(new CustomEvent("overlay:close"))
    };
    current = await plugin.mount(ctx);
    window.addEventListener("profile:changed", (e) => current?.onProfileChange?.(e.detail));
}
//# sourceMappingURL=host.js.map