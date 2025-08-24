// M0 Satnav as a plugin (example)
import type { UIComponentPlugin, UIContext, UIInstance } from "./types.js";
import { applyAllPendingDefaults } from "../../m1/safeCta.js";
import { getBillsSafe, getBestDeal, getEnergyStatus } from "../../api/tiles.js";
import { nextEpisodes, markPlayed } from "../../api/episodes.js";

export const SatnavPlugin: UIComponentPlugin = {
  manifest: {
    id: "ui-satnav",
    name: "Satnav (M0/M1)",
    version: "1.0.0",
    targets: ["L0","L1","L2"],
    provides: ["appShell","home"],
    cssScoped: true
  },
  async mount(ctx: UIContext): Promise<UIInstance> {
    // Shadow root for CSS isolation if desired
    const shell = document.createElement("div");
    const shadow = ctx.root.attachShadow ? ctx.root.attachShadow({ mode: "open" }) : null;
    const host = shadow ?? ctx.root;
    host.innerHTML = ""; 
    host.appendChild(shell);

    // Simple shell
    shell.innerHTML = `
      <style>
        :host, .wrap { font-family: system-ui, sans-serif; color: #e7eef9; background: #0a0e1a; }
        .wrap { display: grid; gap: 12px; padding: 16px; min-height: 100vh; }
        .row { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        .card { background: #0e1320; border: 1px solid #232a3b; border-radius: 12px; padding: 14px; }
        .card h3, .card h4 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; }
        .cta { background: #2a7; border: none; color: #031; font-weight: 700; padding: 12px 16px; border-radius: 10px; cursor: pointer; margin-top: 12px; }
        .cta:hover { background: #3b8; }
        .episode { display: flex; align-items: center; justify-content: space-between; }
        .episode button { background: #4cc9f0; border: none; color: #041920; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .episode button:hover { background: #5dd3ff; }
        .status { font-size: 12px; opacity: 0.8; margin-top: 4px; }
      </style>
      <div class="wrap">
        <div class="card">
          <h3>Overall Status</h3>
          <div id="overall">Loading…</div>
          <button class="cta" id="safe">🚗 Auto-drive: Keep me safe</button>
        </div>
        <div class="row">
          <div class="card">
            <h4>💰 Bills</h4>
            <div id="tile-roof">Loading…</div>
          </div>
          <div class="card">
            <h4>🛒 Deals</h4>
            <div id="tile-food">Loading…</div>
          </div>
          <div class="card">
            <h4>⚡ Energy</h4>
            <div id="tile-power">Loading…</div>
          </div>
        </div>
        <div class="card episode">
          <div>
            <div id="ep">Episode: —</div>
            <div class="status" id="ep-mode"></div>
          </div>
          <button id="play" disabled>Play</button>
        </div>
      </div>
    `;

    // Wire CTA
    const safeBtn = shell.querySelector<HTMLButtonElement>("#safe")!;
    safeBtn.onclick = async () => {
      safeBtn.disabled = true;
      safeBtn.textContent = "Applying...";
      try {
        const applied = await applyAllPendingDefaults();
        safeBtn.textContent = applied > 0 ? `Applied ${applied} defaults` : "No defaults to apply";
        setTimeout(() => {
          safeBtn.disabled = false;
          safeBtn.textContent = "🚗 Auto-drive: Keep me safe";
        }, 2000);
      } catch (error) {
        safeBtn.textContent = "Error - try again";
        safeBtn.disabled = false;
        console.error("Safe CTA failed:", error);
      }
    };

    // Load tiles
    (async () => {
      try {
        const [roof, food, power] = await Promise.all([
          getBillsSafe(),
          getBestDeal(), 
          getEnergyStatus()
        ]);
        
        shell.querySelector("#overall")!.textContent = roof === "OK" ? "✅ All systems clear" : "⚠️ Attention needed";
        shell.querySelector("#tile-roof")!.textContent = roof === "OK" ? "Bills covered" : "Bills need attention";
        shell.querySelector("#tile-food")!.textContent = `${food.label}: €${food.delta.toFixed(2)}`;
        shell.querySelector("#tile-power")!.textContent = power === "OK" ? "Contract OK" : power;
      } catch (error) {
        console.error("Failed to load tiles:", error);
        shell.querySelector("#overall")!.textContent = "⚠️ Error loading status";
      }
    })();

    // Load episodes
    (async () => {
      try {
        const episodes = await nextEpisodes(1);
        const ep = episodes[0];
        
        if (!ep) { 
          shell.querySelector("#ep")!.textContent = "All episodes played"; 
          return; 
        }
        
        shell.querySelector("#ep")!.textContent = ep.title;
        shell.querySelector("#ep-mode")!.textContent = `${ep.mode} mode • ${ep.lengthMin} min`;
        
        const playBtn = shell.querySelector<HTMLButtonElement>("#play")!;
        playBtn.disabled = false;
        playBtn.onclick = async () => { 
          playBtn.disabled = true;
          playBtn.textContent = "Playing...";
          
          try {
            await markPlayed(ep.id); 
            ctx.bus.emit("ui.toast", { kind: "info", msg: `Played: ${ep.title}` });
            playBtn.textContent = "Played ✓";
            
            // Refresh episode list
            setTimeout(async () => {
              const nextEps = await nextEpisodes(1);
              if (nextEps[0]) {
                const nextEp = nextEps[0];
                shell.querySelector("#ep")!.textContent = nextEp.title;
                shell.querySelector("#ep-mode")!.textContent = `${nextEp.mode} mode • ${nextEp.lengthMin} min`;
                playBtn.textContent = "Play";
                playBtn.disabled = false;
                playBtn.onclick = async () => { await markPlayed(nextEp.id); };
              } else {
                shell.querySelector("#ep")!.textContent = "All episodes played";
                shell.querySelector("#ep-mode")!.textContent = "Check back later";
              }
            }, 1000);
          } catch (error) {
            console.error("Failed to mark episode played:", error);
            playBtn.textContent = "Error";
            playBtn.disabled = false;
          }
        };
      } catch (error) {
        console.error("Failed to load episodes:", error);
        shell.querySelector("#ep")!.textContent = "Error loading episode";
      }
    })();

    return {
      unmount() { 
        if (shadow) { 
          shadow.innerHTML = ""; 
        } else { 
          ctx.root.innerHTML = ""; 
        } 
      },
      onProfileChange(p) { 
        // Could simplify UI for L0 vs L2 if needed
        console.log("Profile changed to:", p);
      }
    };
  }
};