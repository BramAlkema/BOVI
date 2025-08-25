import { applyAllPendingDefaults } from "../../m1/safeCta.js";
import { getBillsSafe, getBestDeal, getEnergyStatus } from "../../api/tiles.js";
export const RoomsChoresPlugin = {
    manifest: {
        id: "ui-rooms-chores",
        name: "Rooms & Chores",
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
        .wrap { padding:16px; display:grid; gap:16px; min-height: 100vh; }
        .floor { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; }
        .room { background:#0e1320; border:1px solid #232a3b; border-radius:12px; padding:14px; cursor:pointer; transition: border-color 0.2s; }
        .room:hover { border-color: #4cc9f0; }
        .room h4 { margin:0 0 6px 0; font-size: 14px; font-weight: 600; }
        .chip { display:inline-block; background:#232a3b; padding:4px 8px; border-radius:999px; font-size:12px; color: #9db0d0; }
        .chip.active { background: #4cc9f0; color: #041920; }
        .cta { background:#2a7; border:none; color:#031; font-weight:700; padding:12px 16px; border-radius:10px; cursor:pointer; width: 100%; }
        .cta:hover { background:#3b8; }
        .cta:disabled { background: #232a3b; color: #9db0d0; cursor: not-allowed; }
      </style>
      <div class="wrap">
        <button class="cta" id="do-today">🏠 Do Today's Chores</button>
        <div class="floor">
          <div class="room" id="roof"><h4>🏠 Roof</h4><div class="chip" id="c-roof">Loading…</div></div>
          <div class="room" id="kitchen"><h4>🍝 Kitchen</h4><div class="chip" id="c-kitchen">Loading…</div></div>
          <div class="room" id="meter"><h4>⚡ Meter</h4><div class="chip" id="c-meter">Loading…</div></div>
          <div class="room"><h4>🚌 Commute</h4><div class="chip">Coming soon</div></div>
          <div class="room"><h4>🐷 Piggy Bank</h4><div class="chip">Coming soon</div></div>
          <div class="room"><h4>👥 Mates</h4><div class="chip">Coming soon</div></div>
        </div>
      </div>
    `;
        const choreBtn = shell.querySelector("#do-today");
        choreBtn.onclick = async () => {
            choreBtn.disabled = true;
            choreBtn.textContent = "Doing chores...";
            try {
                const applied = await applyAllPendingDefaults();
                choreBtn.textContent = applied > 0 ? `Completed ${applied} chores` : "No chores today";
                setTimeout(() => {
                    choreBtn.disabled = false;
                    choreBtn.textContent = "🏠 Do Today's Chores";
                }, 2000);
            }
            catch (error) {
                console.error("Chores failed:", error);
                choreBtn.textContent = "Error - try again";
                choreBtn.disabled = false;
            }
        };
        (async () => {
            try {
                const [roof, food, power] = await Promise.all([
                    getBillsSafe(),
                    getBestDeal(),
                    getEnergyStatus()
                ]);
                const roofChip = shell.querySelector("#c-roof");
                const kitchenChip = shell.querySelector("#c-kitchen");
                const meterChip = shell.querySelector("#c-meter");
                roofChip.textContent = roof === "OK" ? "All tidy" : "Counter rent increase";
                roofChip.className = roof === "OK" ? "chip" : "chip active";
                kitchenChip.textContent = `${food.label} (€${food.delta.toFixed(2)})`;
                kitchenChip.className = food.delta < 0 ? "chip active" : "chip";
                meterChip.textContent = power === "OK" ? "Bills OK" : power;
                meterChip.className = power === "OK" ? "chip" : "chip active";
            }
            catch (error) {
                console.error("Failed to load room status:", error);
                ["#c-roof", "#c-kitchen", "#c-meter"].forEach(id => {
                    const chip = shell.querySelector(id);
                    chip.textContent = "Error loading";
                    chip.className = "chip";
                });
            }
        })();
        const addRoomHandler = (selector, overlayId) => {
            const room = shell.querySelector(selector);
            if (room) {
                room.addEventListener("click", () => {
                    if (ctx.openOverlay) {
                        ctx.openOverlay(overlayId);
                    }
                    else {
                        console.log(`Would open overlay: ${overlayId}`);
                    }
                });
            }
        };
        addRoomHandler("#roof", "room:roof");
        addRoomHandler("#kitchen", "room:kitchen");
        addRoomHandler("#meter", "room:meter");
        return {
            unmount() { host.innerHTML = ""; },
            onProfileChange(p) { console.log("Rooms & Chores: profile changed to", p); }
        };
    }
};
//# sourceMappingURL=rooms-chores.plugin.js.map