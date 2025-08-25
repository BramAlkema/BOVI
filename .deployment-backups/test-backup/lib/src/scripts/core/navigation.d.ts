export interface Navigation {
    getCurrentTab(): string;
    goTo(tabId: string): void;
}
export declare const initNavigation: () => Navigation;
export declare const getNavigation: () => Navigation | null;
//# sourceMappingURL=navigation.d.ts.map