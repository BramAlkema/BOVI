/**
 * BOVI Ruler Switcher UI
 * Interface for switching between inflation measurement rulers
 */

import { getRulers, switchRuler } from "../services/rulers.js";

export function setupRulerSwitcher(): void {
  // Add ruler switcher to all relevant views
  const addRulerSwitcher = async (container: HTMLElement) => {
    const rulers = await getRulers();
    const activeRuler = localStorage.getItem("bovi.activeRuler") || "bovi-local";

    const switcherHTML = `
      <div class="ruler-switcher">
        <label for="ruler-select">Inflation Ruler:</label>
        <select id="ruler-select" class="ruler-select">
          ${rulers
    .map(
      ruler => `
            <option value="${ruler.id}" ${ruler.id === activeRuler ? "selected" : ""}>
              ${ruler.name} (${ruler.bpDrift > 0 ? "+" : ""}${ruler.bpDrift}bp)
            </option>
          `
    )
    .join("")}
        </select>
        <div class="ruler-method">
          <small>Method: <span id="ruler-method">${rulers.find(r => r.id === activeRuler)?.method || "Unknown"}</span></small>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("afterbegin", switcherHTML);

    // Add event handler
    const select = container.querySelector("#ruler-select") as HTMLSelectElement;
    const methodInfo = container.querySelector("#ruler-method") as HTMLElement;

    select?.addEventListener("change", async e => {
      const rulerId = (e.target as HTMLSelectElement).value;
      await switchRuler(rulerId);

      const ruler = rulers.find(r => r.id === rulerId);
      if (ruler && methodInfo) {
        methodInfo.textContent = ruler.method;
      }

      // Refresh all calculations with new ruler
      window.dispatchEvent(new CustomEvent("bovi.recalculateAll"));
    });
  };

  // Add to existing containers
  const containers = [
    document.querySelector("#groceries"),
    document.querySelector("#rent"),
    document.querySelector("#energy"),
    document.querySelector(".money-veil-card"),
  ].filter(Boolean) as HTMLElement[];

  containers.forEach(container => {
    if (!container.querySelector(".ruler-switcher")) {
      addRulerSwitcher(container);
    }
  });

  // Add to new containers as they're created
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (
            element.matches &&
            element.matches(".panel, .card, .section") &&
            !element.querySelector(".ruler-switcher")
          ) {
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

export function addRulerSwitcherTo(container: HTMLElement): void {
  if (!container.querySelector(".ruler-switcher")) {
    const addRulerSwitcher = async (container: HTMLElement) => {
      const rulers = await getRulers();
      const activeRuler = localStorage.getItem("bovi.activeRuler") || "bovi-local";

      const switcherHTML = `
        <div class="ruler-switcher">
          <label for="ruler-select-${Date.now()}">Inflation Ruler:</label>
          <select id="ruler-select-${Date.now()}" class="ruler-select">
            ${rulers
    .map(
      ruler => `
              <option value="${ruler.id}" ${ruler.id === activeRuler ? "selected" : ""}>
                ${ruler.name} (${ruler.bpDrift > 0 ? "+" : ""}${ruler.bpDrift}bp)
              </option>
            `
    )
    .join("")}
          </select>
        </div>
      `;

      container.insertAdjacentHTML("afterbegin", switcherHTML);
    };

    addRulerSwitcher(container);
  }
}
