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
export declare function createHamburgerBasket(name: string, items: HamburgerBasket["items"]): Promise<HamburgerBasket>;
export declare function publishBasket(basketId: string): Promise<string>;
export declare function calculateHamburgerInflation(basketId: string): Promise<{
    current: number;
    previous: number;
    change: number;
    changePercent: number;
}>;
export declare function getStoredBaskets(): HamburgerBasket[];
//# sourceMappingURL=hamburger.d.ts.map