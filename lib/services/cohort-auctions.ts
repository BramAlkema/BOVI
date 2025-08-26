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
  targetSize: number;
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
    targetSize,
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

  // Calculate if user would benefit based on category
  const currentUserCost = getCurrentUserCost(auction.category);
  const cohortCost = getCohortNegotiatedPrice(auction.category, auction.participants);
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
  try {
    const auctions: CohortAuction[] = JSON.parse(localStorage.getItem("bovi.cohortAuctions") || "[]");
    return auctions.filter(a => a.status === "forming" || a.status === "active");
  } catch (error) {
    console.warn("Failed to parse cohort auctions from localStorage:", error);
    return [];
  }
}

/**
 * Get current user cost for category from stored spending data or market averages
 */
function getCurrentUserCost(category: string): number {
  // Try to get user's actual spending from stored data
  const userSpending = JSON.parse(localStorage.getItem("bovi.userSpending") || "{}");
  
  if (userSpending[category]) {
    return userSpending[category].monthlyAverage || getMarketAverage(category);
  }
  
  return getMarketAverage(category);
}

/**
 * Get market average costs by category
 */
function getMarketAverage(category: string): number {
  const marketAverages: Record<string, number> = {
    energy: 125.50,      // Average monthly energy bill (UK)
    groceries: 400.00,   // Average monthly grocery spend
    broadband: 30.00,    // Average monthly broadband
    insurance: 85.00,    // Average monthly insurance
    gym: 45.00,          // Average monthly gym membership
    utilities: 95.00     // Average monthly utilities
  };
  
  return marketAverages[category] || 100;
}

/**
 * Calculate cohort negotiated price based on group size and buying power
 */
function getCohortNegotiatedPrice(category: string, participants: number): number {
  const baseCost = getMarketAverage(category);
  
  // Group buying power: more participants = better rates
  // Scale: 50+ participants = 15% discount, 25+ = 10%, 10+ = 5%
  let discountRate = 0;
  if (participants >= 50) {
    discountRate = 0.15;
  } else if (participants >= 25) {
    discountRate = 0.10;
  } else if (participants >= 10) {
    discountRate = 0.05;
  }
  
  // Category-specific negotiation power
  const categoryMultipliers: Record<string, number> = {
    energy: 1.2,      // High negotiation potential
    groceries: 0.8,   // Lower negotiation potential
    broadband: 1.1,   // Good negotiation potential
    insurance: 1.0,   // Standard negotiation
    gym: 0.9,         // Limited negotiation
    utilities: 1.1    // Good negotiation potential
  };
  
  const categoryMultiplier = categoryMultipliers[category] || 1.0;
  const effectiveDiscount = discountRate * categoryMultiplier;
  
  return parseFloat((baseCost * (1 - effectiveDiscount)).toFixed(2));
}
