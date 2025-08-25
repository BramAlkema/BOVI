import { applyAllPendingDefaults } from "../../m1/safeCta.js";
import { getBillsSafe, getBestDeal, getEnergyStatus } from "../../api/tiles.js";
export const MissionDeckPlugin = {
    manifest: {
        id: "ui-mission-deck",
        name: "Mission Deck",
        version: "1.0.0",
        targets: ["L1", "L2"],
        provides: ["appShell", "home"],
        cssScoped: true
    },
    async mount(ctx) {
        const host = ctx.root.attachShadow ? ctx.root.attachShadow({ mode: "open" }) : ctx.root;
        const shell = document.createElement("div");
        host.innerHTML = "";
        host.appendChild(shell);
        shell.innerHTML = `
      <style>
        :host, .wrap { font-family: system-ui, sans-serif; color:#e7eef9; background: #0a0e1a; }
        .wrap { padding:16px; max-width:760px; margin:0 auto; min-height: 100vh; }
        .stack { display:grid; gap:12px; margin-bottom: 16px; }
        .card { background:#0e1320; border:1px solid #232a3b; border-radius:12px; padding:16px; }
        .title { font-weight:700; margin-bottom:6px; font-size: 16px; }
        .why { color:#9db0d0; font-size:13px; margin:6px 0 12px; line-height: 1.4; }
        .status { font-size: 14px; margin-bottom: 12px; color: #4cc9f0; }
        .actions { display:flex; gap:8px; flex-wrap: wrap; }
        .btn { border:1px solid #3a4563; background:#141a2a; color:#e7eef9; border-radius:10px; padding:10px 14px; cursor:pointer; font-size: 13px; }
        .btn:hover { background:#1a2030; border-color: #4cc9f0; }
        .btn.primary { background:#2a7; color:#031; border-color:#2a7; font-weight: 600; }
        .btn.primary:hover { background:#3b8; }
        .btn:disabled { background:#232a3b; color:#9db0d0; cursor: not-allowed; border-color: #232a3b; }
        .global-actions { margin-top: 16px; }
      </style>
      <div class="wrap">
        <div class="stack" id="stack">
          <div class="card">Loading mission briefings…</div>
        </div>
        <div class="global-actions">
          <button class="btn primary" id="runall">🚀 Let all missions run</button>
        </div>
      </div>
    `;
        const runAllBtn = shell.querySelector("#runall");
        runAllBtn.onclick = async () => {
            runAllBtn.disabled = true;
            runAllBtn.textContent = "Running missions...";
            try {
                const applied = await applyAllPendingDefaults();
                runAllBtn.textContent = applied > 0 ? `${applied} missions completed` : "No missions to run";
                setTimeout(() => {
                    runAllBtn.disabled = false;
                    runAllBtn.textContent = "🚀 Let all missions run";
                }, 2500);
            }
            catch (error) {
                console.error("Mission execution failed:", error);
                runAllBtn.textContent = "Mission failed - retry";
                runAllBtn.disabled = false;
            }
        };
        (async () => {
            try {
                const [roof, food, power] = await Promise.all([
                    getBillsSafe(),
                    getBestDeal(),
                    getEnergyStatus()
                ]);
                const stack = shell.querySelector("#stack");
                stack.innerHTML = [
                    missionCard("Keep Roof Fair", roof === "OK" ? "Mission complete - standing down" : "Counter rent increase - auto engage in 10s", why("roof"), roof !== "OK"),
                    missionCard("Fix Food Price", `Swap opportunity: ${food.label} (€${food.delta.toFixed(2)} impact)`, why("kitchen"), food.delta < 0),
                    missionCard("Lower Power Bill", power === "OK" ? "Mission complete - standing down" : `Action required: ${power}`, why("meter"), power !== "OK")
                ].join("");
                stack.querySelectorAll(".btn.primary").forEach((btn, i) => {
                    btn.addEventListener("click", async () => {
                        btn.disabled = true;
                        const originalText = btn.textContent;
                        btn.textContent = "Running...";
                        try {
                            await applyAllPendingDefaults();
                            btn.textContent = "Mission complete";
                            setTimeout(() => {
                                btn.disabled = false;
                                btn.textContent = originalText;
                            }, 2000);
                        }
                        catch (error) {
                            console.error(`Mission ${i} failed:`, error);
                            btn.textContent = "Failed";
                            btn.disabled = false;
                        }
                    });
                });
                stack.querySelectorAll(".btn:not(.primary)").forEach((btn, i) => {
                    btn.addEventListener("click", () => {
                        const missionIds = ["mission:roof", "mission:kitchen", "mission:meter"];
                        if (ctx.openOverlay) {
                            ctx.openOverlay(missionIds[i]);
                        }
                        else {
                            console.log(`Would open overlay: ${missionIds[i]}`);
                        }
                    });
                });
            }
            catch (error) {
                console.error("Failed to load missions:", error);
                const stack = shell.querySelector("#stack");
                stack.innerHTML = `
          <div class="card">
            <div class="title">Mission Briefing Error</div>
            <div class="why">Unable to load current missions. Please check connection and try again.</div>
          </div>
        `;
            }
        })();
        function missionCard(title, status, whyText, actionRequired) {
            return `
        <div class="card">
          <div class="title">${title}</div>
          <div class="why">${whyText}</div>
          <div class="status">${status}</div>
          <div class="actions">
            <button class="btn primary" ${!actionRequired ? 'disabled' : ''}>
              ${actionRequired ? 'Let it run' : 'Standing by'}
            </button>
            <button class="btn">Change parameters</button>
          </div>
        </div>
      `;
        }
        function why(domain) {
            switch (domain) {
                case "roof":
                    return "Your personal inflation basket rose faster than official CPI. The counter keeps your housing purchasing power stable by proposing fair rent adjustments.";
                case "kitchen":
                    return "Unit price analysis shows this swap beats your usual choice after normalizing for shrinkflation. The PDA system ensures you get genuine value.";
                case "meter":
                    return "Cohort buying power secured a rate below your baseline. The no-worse-off guarantee ensures you save money while supporting group negotiation.";
                default:
                    return "We protect fairness using your configured rules and the BOVI framework principles.";
            }
        }
        return {
            unmount() { host.innerHTML = ""; },
            onProfileChange(p) { console.log("Mission Deck: profile changed to", p); }
        };
    }
};
//# sourceMappingURL=mission-deck.plugin.js.map