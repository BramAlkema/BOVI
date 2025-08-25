export async function createHamburgerBasket(name, items) {
    const basket = {
        id: `hamburger_${Date.now()}`,
        name,
        items,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        public: false,
    };
    const baskets = getStoredBaskets();
    baskets.push(basket);
    localStorage.setItem("bovi.hamburgerBaskets", JSON.stringify(baskets));
    return basket;
}
export async function publishBasket(basketId) {
    const baskets = getStoredBaskets();
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) {
        throw new Error(`Basket ${basketId} not found`);
    }
    basket.public = true;
    basket.shareUrl = `${window.location.origin}/basket/${basketId}`;
    localStorage.setItem("bovi.hamburgerBaskets", JSON.stringify(baskets));
    return basket.shareUrl;
}
export async function calculateHamburgerInflation(basketId) {
    const baskets = getStoredBaskets();
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) {
        throw new Error(`Basket ${basketId} not found`);
    }
    const current = basket.items.reduce((sum, item) => sum + item.price, 0);
    const previous = basket.items.reduce((sum, item) => sum + item.usual, 0);
    const change = current - previous;
    const changePercent = change / previous;
    return { current, previous, change, changePercent };
}
export function getStoredBaskets() {
    return JSON.parse(localStorage.getItem("bovi.hamburgerBaskets") || "[]");
}
//# sourceMappingURL=hamburger.js.map