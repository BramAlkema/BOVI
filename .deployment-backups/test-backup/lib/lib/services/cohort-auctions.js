export async function createCohortAuction(category, targetSize = 50) {
    const auction = {
        id: `cohort_${Date.now()}`,
        category,
        participants: 1,
        currentBest: 0,
        improvement: 0,
        noWorseOffCheck: true,
        joinDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        targetSize,
        status: "forming",
    };
    const auctions = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
    auctions.push(auction);
    localStorage.setItem("bovi.cohortAuctions", JSON.stringify(auctions));
    return auction;
}
export async function joinCohortAuction(auctionId) {
    const auctions = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) {
        throw new Error(`Auction ${auctionId} not found`);
    }
    if (auction.status !== "forming") {
        throw new Error("Auction no longer accepting participants");
    }
    const currentUserCost = 100;
    const cohortCost = 95;
    const projectedSavings = currentUserCost - cohortCost;
    if (projectedSavings < 0) {
        return {
            joined: false,
            projectedSavings: 0,
            guarantee: "BOVI guarantee: You would not benefit from this cohort. No action taken.",
        };
    }
    auction.participants += 1;
    auction.improvement = (projectedSavings / currentUserCost) * 100;
    localStorage.setItem("bovi.cohortAuctions", JSON.stringify(auctions));
    return {
        joined: true,
        projectedSavings,
        guarantee: "BOVI guarantee: You will save at least £" +
            projectedSavings.toFixed(2) +
            " or pay nothing extra.",
    };
}
export function getActiveAuctions() {
    const auctions = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
    return auctions.filter(a => a.status === "forming" || a.status === "active");
}
//# sourceMappingURL=cohort-auctions.js.map