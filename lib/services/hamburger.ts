/**
 * BOVI Hamburger Sentinel
 * Fixed basket tracking for viral inflation measurement
 */

export interface HamburgerBasket {
  id: string;
  name: string;
  items: Array<{
    name: string;
    brand: string;
    size: string;
    price: number;
    usual: number;
    location: string;
    date: string;
  }>;
  created: string;
  lastUpdated: string;
  public: boolean;
  shareUrl?: string;
}

/**
 * Create a fixed hamburger basket for tracking
 */
export async function createHamburgerBasket(name: string, items: HamburgerBasket['items']): Promise<HamburgerBasket> {
  const basket: HamburgerBasket = {
    id: `hamburger_${Date.now()}`,
    name,
    items,
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    public: false
  };
  
  // Store locally
  const baskets = getStoredBaskets();
  baskets.push(basket);
  localStorage.setItem('bovi.hamburgerBaskets', JSON.stringify(baskets));
  
  return basket;
}

/**
 * Make basket public and generate share link
 */
export async function publishBasket(basketId: string): Promise<string> {
  const baskets = getStoredBaskets();
  const basket = baskets.find(b => b.id === basketId);
  
  if (!basket) {
    throw new Error(`Basket ${basketId} not found`);
  }
  
  basket.public = true;
  basket.shareUrl = `${window.location.origin}/basket/${basketId}`;
  
  // Store updated basket
  localStorage.setItem('bovi.hamburgerBaskets', JSON.stringify(baskets));
  
  // In production, would sync to server for public sharing
  return basket.shareUrl;
}

/**
 * Calculate hamburger inflation for basket
 */
export async function calculateHamburgerInflation(basketId: string): Promise<{
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}> {
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

/**
 * Get all stored baskets
 */
export function getStoredBaskets(): HamburgerBasket[] {
  return JSON.parse(localStorage.getItem('bovi.hamburgerBaskets') || '[]');
}