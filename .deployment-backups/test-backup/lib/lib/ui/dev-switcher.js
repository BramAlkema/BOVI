import { listUIPlugins, getActiveUIPluginId } from "./plugins/registry.js";
export function addDevSwitcher() {
    if (process.env.NODE_ENV === "production")
        return;
    const plugins = listUIPlugins();
    if (plugins.length <= 1)
        return;
    const activeId = getActiveUIPluginId();
    const panel = document.createElement("div");
    panel.innerHTML = `
    <style>
      .bovi-dev-switcher {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 9999;
        background: rgba(14, 19, 32, 0.95);
        border: 1px solid #232a3b;
        border-radius: 8px;
        padding: 12px;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        color: #e7eef9;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        min-width: 200px;
      }
      .bovi-dev-switcher h4 {
        margin: 0 0 8px 0;
        font-size: 11px;
        text-transform: uppercase;
        opacity: 0.7;
        font-weight: 600;
      }
      .bovi-dev-switcher button {
        display: block;
        width: 100%;
        margin: 2px 0;
        padding: 6px 8px;
        background: transparent;
        border: 1px solid #232a3b;
        border-radius: 4px;
        color: #e7eef9;
        cursor: pointer;
        font-size: 11px;
        text-align: left;
      }
      .bovi-dev-switcher button:hover {
        background: rgba(76, 201, 240, 0.1);
        border-color: #4cc9f0;
      }
      .bovi-dev-switcher button.active {
        background: #4cc9f0;
        color: #041920;
        font-weight: 600;
      }
      .bovi-dev-switcher .toggle {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 20px;
        height: 20px;
        background: #4cc9f0;
        border: none;
        border-radius: 50%;
        color: #041920;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      .bovi-dev-switcher.collapsed .content {
        display: none;
      }
      .bovi-dev-switcher.collapsed {
        padding: 0;
        width: 20px;
        height: 20px;
      }
    </style>
    <div class="bovi-dev-switcher" id="devSwitcher">
      <button class="toggle" onclick="this.parentElement.classList.toggle('collapsed')">UI</button>
      <div class="content">
        <h4>UI Plugins</h4>
        <div id="pluginList"></div>
      </div>
    </div>
  `;
    document.body.appendChild(panel);
    const pluginList = panel.querySelector("#pluginList");
    plugins.forEach(plugin => {
        const btn = document.createElement("button");
        btn.textContent = `${plugin.name} (${plugin.version})`;
        btn.className = plugin.id === activeId ? "active" : "";
        btn.onclick = async () => {
            if (plugin.id === activeId)
                return;
            pluginList.querySelectorAll("button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            try {
                await window.switchUI(plugin.id);
                console.log(`Switched to ${plugin.name}`);
            }
            catch (error) {
                console.error(`Failed to switch to ${plugin.name}:`, error);
                btn.classList.remove("active");
                pluginList.querySelector(`button[data-id="${activeId}"]`)?.classList.add("active");
            }
        };
        btn.setAttribute("data-id", plugin.id);
        pluginList.appendChild(btn);
    });
    console.log("Dev UI switcher added (top-right corner)");
}
//# sourceMappingURL=dev-switcher.js.map