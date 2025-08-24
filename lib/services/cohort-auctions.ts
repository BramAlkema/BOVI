/**
 * BOVI Cohort Engine
 * Reverse auctions with "no worse off" guarantee
 */

export interface CohortAuction {
  id: string;
  category: string; // 'groceries', 'energy', etc
  participants: number;
  currentBest: number; // Best price found
  improvement: number; // % improvement vs individual
  noWorseOffCheck: boolean; // Guarantee nobody worse off
  joinDeadline: string;
  status: "forming" | "active" | "completed";
}

/**
 * Create new cohort reverse auction
 */
export async function createCohortAuction(
  category: string,
  targetSize: number = 50
): Promise<CohortAuction> {
  const auction: CohortAuction = {
    id: `cohort_${Date.now()}`,
    category,
    participants: 1, // Creator joins automatically
    currentBest: 0, // Will be calculated as participants join
    improvement: 0,
    noWorseOffCheck: true, // BOVI guarantee
    joinDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    status: "forming",
  };

  // Store auction
  const auctions = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
  auctions.push(auction);
  localStorage.setItem("bovi.cohortAuctions", JSON.stringify(auctions));

  return auction;
}

/**
 * Join existing cohort auction with "no worse off" guarantee
 */
export async function joinCohortAuction(auctionId: string): Promise<{
  joined: boolean;
  projectedSavings: number;
  guarantee: string;
}> {
  const auctions: CohortAuction[] = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
  const auction = auctions.find(a => a.id === auctionId);

  if (!auction) {
    throw new Error(`Auction ${auctionId} not found`);
  }

  if (auction.status !== "forming") {
    throw new Error("Auction no longer accepting participants");
  }

  // Calculate if user would benefit
  const currentUserCost = 100; // Mock current cost
  const cohortCost = 95; // Mock cohort negotiated price
  const projectedSavings = currentUserCost - cohortCost;

  if (projectedSavings < 0) {
    // BOVI no-worse-off guarantee triggers
    return {
      joined: false,
      projectedSavings: 0,
      guarantee: "BOVI guarantee: You would not benefit from this cohort. No action taken.",
    };
  }

  // Join the cohort
  auction.participants += 1;
  auction.improvement = (projectedSavings / currentUserCost) * 100;

  // Update storage
  localStorage.setItem("bovi.cohortAuctions", JSON.stringify(auctions));

  return {
    joined: true,
    projectedSavings,
    guarantee:
      "BOVI guarantee: You will save at least £" +
      projectedSavings.toFixed(2) +
      " or pay nothing extra.",
  };
}

/**
 * Get all active cohort auctions
 */
export function getActiveAuctions(): CohortAuction[] {
  const auctions: CohortAuction[] = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
  return auctions.filter(a => a.status === "forming" || a.status === "active");
}
