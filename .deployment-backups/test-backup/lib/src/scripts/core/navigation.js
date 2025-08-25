import { $$, events, dom } from "./utils.js";
class NavigationManager {
    constructor() {
        this.currentTab = "overview";
        this.tabButtons = $$(".tab");
        this.sections = $$("main > section");
        this.init();
    }
    init() {
        this.tabButtons.forEach(button => {
            events.on(button, "click", (e) => {
                e.preventDefault();
                const tabId = button.dataset.tab;
                if (tabId) {
                    this.navigateToTab(tabId);
                }
            });
        });
        events.on(window, "popstate", (e) => {
            const tabId = e.state?.tab || "overview";
            this.navigateToTab(tabId, false);
        });
        this.updateActiveTab();
        this.showSection(this.currentTab);
    }
    navigateToTab(tabId, pushState = true) {
        if (tabId === this.currentTab)
            return;
        this.currentTab = tabId;
        this.updateActiveTab();
        this.showSection(tabId);
        if (pushState) {
            history.pushState({ tab: tabId }, "", `#${tabId}`);
        }
        window.dispatchEvent(new CustomEvent("bovi:navigate", {
            detail: { tab: tabId }
        }));
    }
    updateActiveTab() {
        this.tabButtons.forEach(button => {
            const htmlButton = button;
            if (htmlButton.dataset.tab === this.currentTab) {
                htmlButton.setAttribute("aria-current", "page");
                dom.addClass(htmlButton, "active");
            }
            else {
                htmlButton.removeAttribute("aria-current");
                dom.removeClass(htmlButton, "active");
            }
        });
    }
    showSection(tabId) {
        this.sections.forEach(section => {
            const htmlSection = section;
            if (htmlSection.id === tabId) {
                dom.show(htmlSection);
                htmlSection.setAttribute("aria-hidden", "false");
            }
            else {
                dom.hide(htmlSection);
                htmlSection.setAttribute("aria-hidden", "true");
            }
        });
    }
    getCurrentTab() {
        return this.currentTab;
    }
    goTo(tabId) {
        this.navigateToTab(tabId);
    }
}
let navigationManager = null;
export const initNavigation = () => {
    if (!navigationManager) {
        navigationManager = new NavigationManager();
    }
    return navigationManager;
};
export const getNavigation = () => navigationManager;
//# sourceMappingURL=navigation.js.map