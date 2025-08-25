import { getRulers, switchRuler } from "../services/rulers.js";
export function setupRulerSwitcher() {
    const addRulerSwitcher = async (container) => {
        const rulers = await getRulers();
        const activeRuler = localStorage.getItem("bovi.activeRuler") || "bovi-local";
        const switcherHTML = `
      <div class="ruler-switcher">
        <label for="ruler-select">Inflation Ruler:</label>
        <select id="ruler-select" class="ruler-select">
          ${rulers
            .map(ruler => `
            <option value="${ruler.id}" ${ruler.id === activeRuler ? "selected" : ""}>
              ${ruler.name} (${ruler.bpDrift > 0 ? "+" : ""}${ruler.bpDrift}bp)
            </option>
          `)
            .join("")}
        </select>
        <div class="ruler-method">
          <small>Method: <span id="ruler-method">${rulers.find(r => r.id === activeRuler)?.method || "Unknown"}</span></small>
        </div>
      </div>
    `;
        container.insertAdjacentHTML("afterbegin", switcherHTML);
        const select = container.querySelector("#ruler-select");
        const methodInfo = container.querySelector("#ruler-method");
        select?.addEventListener("change", async (e) => {
            const rulerId = e.target.value;
            await switchRuler(rulerId);
            const ruler = rulers.find(r => r.id === rulerId);
            if (ruler && methodInfo) {
                methodInfo.textContent = ruler.method;
            }
            window.dispatchEvent(new CustomEvent("bovi.recalculateAll"));
        });
    };
    const containers = [
        document.querySelector("#groceries"),
        document.querySelector("#rent"),
        document.querySelector("#energy"),
        document.querySelector(".money-veil-card"),
    ].filter(Boolean);
    containers.forEach(container => {
        if (!container.querySelector(".ruler-switcher")) {
            addRulerSwitcher(container);
        }
    });
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node;
                    if (element.matches &&
                        element.matches(".panel, .card, .section") &&
                        !element.querySelector(".ruler-switcher")) {
                        addRulerSwitcher(element);
                    }
                }
            });
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
export function addRulerSwitcherTo(container) {
    if (!container.querySelector(".ruler-switcher")) {
        const addRulerSwitcher = async (container) => {
            const rulers = await getRulers();
            const activeRuler = localStorage.getItem("bovi.activeRuler") || "bovi-local";
            const switcherHTML = `
        <div class="ruler-switcher">
          <label for="ruler-select-${Date.now()}">Inflation Ruler:</label>
          <select id="ruler-select-${Date.now()}" class="ruler-select">
            ${rulers
                .map(ruler => `
              <option value="${ruler.id}" ${ruler.id === activeRuler ? "selected" : ""}>
                ${ruler.name} (${ruler.bpDrift > 0 ? "+" : ""}${ruler.bpDrift}bp)
              </option>
            `)
                .join("")}
          </select>
        </div>
      `;
            container.insertAdjacentHTML("afterbegin", switcherHTML);
        };
        addRulerSwitcher(container);
    }
}
//# sourceMappingURL=ruler-switcher.js.map