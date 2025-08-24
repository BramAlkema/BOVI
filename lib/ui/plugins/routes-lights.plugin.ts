import type { UIComponentPlugin, UIContext, UIInstance } from "./types.js";
import { applyAllPendingDefaults } from "../../m1/safeCta.js";
import { getBillsSafe, getBestDeal, getEnergyStatus } from "../../api/tiles.js";
import { nextEpisodes, markPlayed } from "../../api/episodes.js";

export const RoutesLightsPlugin: UIComponentPlugin = {
  manifest: {
    id: "ui-routes-lights",
    name: "Routes & Lights",
    version: "1.0.0",
    targets: ["L1","L2"],
    provides: ["appShell","home"],
    cssScoped: true
  },
  async mount(ctx: UIContext): Promise<UIInstance> {
    const host = ctx.root.attachShadow ? ctx.root.attachShadow({ mode: "open" }) : ctx.root;
    const shell = document.createElement("div");
    host.innerHTML = ""; 
    host.appendChild(shell);
    
    shell.innerHTML = `
      <style>
        :host, .wrap { font-family: system-ui, sans-serif; color:#e7eef9; background: #0a0e1a; }
        .wrap { padding:16px; display:grid; gap:12px; min-height: 100vh; }
        .lights { font-size:18px; font-weight:700; }
        .routes { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; }
        .card { background:#0e1320; border:1px solid #232a3b; border-radius:12px; padding:14px; }
        .card h4 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; }
        .cta { background:#2a7; border:none; color:#031; font-weight:700; padding:12px 16px; border-radius:10px; cursor:pointer; margin-top: 12px; }
        .cta:hover { background:#3b8; }
        .light { display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:8px; vertical-align:middle; }
        .g{background:#21d07a}.y{background:#ffd166}.r{background:#ef476f}
        .episode { display: flex; align-items: center; justify-content: space-between; }
        .episode button { background: #4cc9f0; border: none; color: #041920; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }
      </style>
      <div class="wrap">
        <div class="card">
          <div class="lights" id="overall"><span class="light y"></span>Checking routes…</div>
          <button class="cta" id="auto">🚗 Auto-drive</button>
        </div>
        <div class="routes">
          <div class="card"><h4>Route: Shelter</h4><div id="r-shelter">Scanning…</div></div>
          <div class="card"><h4>Route: Food</h4><div id="r-food">Scanning…</div></div>
          <div class="card"><h4>Route: Power</h4><div id="r-power">Scanning…</div></div>
        </div>
        <div class="card episode" id="episode">Episode: Loading…</div>
      </div>
    `;
    
    const autoBtn = shell.querySelector<HTMLButtonElement>("#auto")!;
    autoBtn.onclick = async () => {
      autoBtn.disabled = true;
      autoBtn.textContent = "Driving...";
      try {
        await applyAllPendingDefaults();
        autoBtn.textContent = "Routes updated";
        setTimeout(() => {
          autoBtn.disabled = false;
          autoBtn.textContent = "🚗 Auto-drive";
        }, 2000);
      } catch (error) {
        console.error("Auto-drive failed:", error);
        autoBtn.textContent = "Error - try again";
        autoBtn.disabled = false;
      }
    };

    // Load route status
    (async () => {
      try {
        const [roof, food, power] = await Promise.all([
          getBillsSafe(),
          getBestDeal(), 
          getEnergyStatus()
        ]);

        const overall = roof === "OK" ? ["g","✅ All routes clear"] : ["y","⚠️ Route changes needed"];
        shell.querySelector("#overall")!.innerHTML = `<span class="light ${overall[0]}"></span>${overall[1]}`;

        shell.querySelector("#r-shelter")!.innerHTML =
          roof === "OK" ? `<span class="light g"></span>Route clear` :
                          `<span class="light y"></span>Next: counter rent increase`;

        shell.querySelector("#r-food")!.innerHTML =
          `<span class="light ${food.delta < 0 ? "g":"y"}"></span>${food.label}: €${food.delta.toFixed(2)}`;

        shell.querySelector("#r-power")!.innerHTML =
          `<span class="light ${power==="OK"?"g":(power==="Switching"?"y":"r")}"></span>${power}`;
      } catch (error) {
        console.error("Failed to load route status:", error);
        shell.querySelector("#overall")!.innerHTML = `<span class="light r"></span>⚠️ Route data error`;
      }
    })();

    // Load episode
    (async () => {
      try {
        const [ep] = await nextEpisodes(1);
        const episodeEl = shell.querySelector("#episode")!;
        
        if (!ep) { 
          episodeEl.textContent = "Episode: All episodes completed"; 
          return; 
        }
        
        episodeEl.innerHTML = `
          <div>Episode: ${ep.title} • ${ep.lengthMin}m</div>
          <button id="play">Play</button>
        `;
        
        const playBtn = episodeEl.querySelector<HTMLButtonElement>("#play")!;
        playBtn.onclick = async () => { 
          playBtn.disabled = true;
          playBtn.textContent = "Playing...";
          
          try {
            await markPlayed(ep.id);
            ctx.bus.emit("ui.toast", { kind: "info", msg: `Played: ${ep.title}` });
            episodeEl.innerHTML = `<div>Episode played: ${ep.title}</div><div>✓ Complete</div>`;
          } catch (error) {
            console.error("Failed to mark episode played:", error);
            playBtn.textContent = "Error";
            playBtn.disabled = false;
          }
        };
      } catch (error) {
        console.error("Failed to load episode:", error);
        shell.querySelector("#episode")!.textContent = "Episode: Error loading";
      }
    })();

    return { 
      unmount() { host.innerHTML = ""; },
      onProfileChange(p) { console.log("Routes & Lights: profile changed to", p); }
    };
  }
};