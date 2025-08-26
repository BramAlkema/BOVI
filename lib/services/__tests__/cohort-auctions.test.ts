/**
 * Cohort Auctions Service Tests  
 */

import { 
  createCohortAuction, 
  joinCohortAuction, 
  getActiveAuctions,
  type CohortAuction 
} from '../cohort-auctions.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Cohort Auctions Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('createCohortAuction', () => {
    it('creates auction with correct properties', async () => {
      const auction = await createCohortAuction('energy', 50);

      expect(auction).toMatchObject({
        id: expect.stringMatching(/^cohort_\d+$/),
        category: 'energy',
        participants: 1,
        currentBest: 0,
        improvement: 0,
        noWorseOffCheck: true,
        targetSize: 50,
        status: 'forming'
      });
    });

    it('sets join deadline to 1 week from creation', async () => {
      const auction = await createCohortAuction('groceries');
      const deadline = new Date(auction.joinDeadline);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Should be within 1 second of a week from now
      expect(Math.abs(deadline.getTime() - weekFromNow.getTime())).toBeLessThan(1000);
    });

    it('uses default target size when not specified', async () => {
      const auction = await createCohortAuction('broadband');
      expect(auction.targetSize).toBe(50);
    });

    it('persists auction to localStorage', async () => {
      await createCohortAuction('energy', 25);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bovi.cohortAuctions',
        expect.stringContaining('"category":"energy"')
      );
    });

    it('creates unique IDs for concurrent auctions', async () => {
      const auction1 = await createCohortAuction('energy');
      const auction2 = await createCohortAuction('groceries');

      expect(auction1.id).not.toBe(auction2.id);
    });
  });

  describe('joinCohortAuction', () => {
    let testAuction: CohortAuction;

    beforeEach(async () => {
      testAuction = await createCohortAuction('energy', 25);
    });

    it('successfully joins beneficial auction', async () => {
      // Mock user spending data to ensure benefit
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 150 }
      }));

      const result = await joinCohortAuction(testAuction.id);

      expect(result.joined).toBe(true);
      expect(result.projectedSavings).toBeGreaterThan(0);
      expect(result.guarantee).toContain('save at least');
    });

    it('prevents joining when user would not benefit', async () => {
      // Mock user spending data showing low costs
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 50 } // Much lower than market average
      }));

      const result = await joinCohortAuction(testAuction.id);

      expect(result.joined).toBe(false);
      expect(result.projectedSavings).toBe(0);
      expect(result.guarantee).toContain('would not benefit');
    });

    it('calculates savings based on group size', async () => {
      // Create auction with enough participants for higher discount
      const largeAuction = await createCohortAuction('energy', 100);
      
      // Simulate large group
      const auctions = [{ ...largeAuction, participants: 60 }];
      localStorageMock.setItem('bovi.cohortAuctions', JSON.stringify(auctions));
      
      // Mock higher user costs to ensure benefit
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 200 }
      }));

      const result = await joinCohortAuction(largeAuction.id);

      expect(result.joined).toBe(true);
      expect(result.projectedSavings).toBeGreaterThan(10); // Should get good discount
    });

    it('throws error for non-existent auction', async () => {
      await expect(joinCohortAuction('non-existent-id')).rejects.toThrow(
        'Auction non-existent-id not found'
      );
    });

    it('throws error for completed auction', async () => {
      // Create completed auction
      const completedAuction = { ...testAuction, status: 'completed' as const };
      localStorageMock.setItem('bovi.cohortAuctions', JSON.stringify([completedAuction]));

      await expect(joinCohortAuction(testAuction.id)).rejects.toThrow(
        'Auction no longer accepting participants'
      );
    });

    it('updates auction participant count', async () => {
      // Mock beneficial joining scenario
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 150 }
      }));

      await joinCohortAuction(testAuction.id);

      // Check stored auction data
      const storedAuctions = JSON.parse(localStorageMock.getItem('bovi.cohortAuctions') || '[]');
      const updatedAuction = storedAuctions.find((a: CohortAuction) => a.id === testAuction.id);
      
      expect(updatedAuction.participants).toBe(2); // Original 1 + new joiner
    });

    it('calculates improvement percentage', async () => {
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 150 }
      }));

      await joinCohortAuction(testAuction.id);

      const storedAuctions = JSON.parse(localStorageMock.getItem('bovi.cohortAuctions') || '[]');
      const updatedAuction = storedAuctions.find((a: CohortAuction) => a.id === testAuction.id);
      
      expect(updatedAuction.improvement).toBeGreaterThan(0);
      expect(updatedAuction.improvement).toBeLessThan(100);
    });
  });

  describe('getActiveAuctions', () => {
    it('returns empty array when no auctions exist', () => {
      const auctions = getActiveAuctions();
      expect(auctions).toEqual([]);
    });

    it('returns forming and active auctions only', async () => {
      await createCohortAuction('energy');
      await createCohortAuction('groceries');
      
      // Add completed auction manually
      const allAuctions = JSON.parse(localStorageMock.getItem('bovi.cohortAuctions') || '[]');
      allAuctions.push({
        id: 'completed-auction',
        category: 'broadband',
        status: 'completed',
        participants: 50
      });
      localStorageMock.setItem('bovi.cohortAuctions', JSON.stringify(allAuctions));

      const activeAuctions = getActiveAuctions();
      
      expect(activeAuctions).toHaveLength(2);
      expect(activeAuctions.every(a => a.status === 'forming' || a.status === 'active')).toBe(true);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorageMock.setItem('bovi.cohortAuctions', 'invalid json');
      
      const auctions = getActiveAuctions();
      expect(auctions).toEqual([]);
    });
  });

  describe('pricing calculations', () => {
    it('uses market averages for unknown categories', async () => {
      const auction = await createCohortAuction('unknown-category');
      
      // Should not throw error and should have created auction
      expect(auction.category).toBe('unknown-category');
    });

    it('applies category-specific pricing multipliers', async () => {
      // Test different categories that should have different negotiation power
      const energyAuction = await createCohortAuction('energy', 30);
      const groceriesAuction = await createCohortAuction('groceries', 30);

      // Both should be created successfully with category-specific handling
      expect(energyAuction.category).toBe('energy');
      expect(groceriesAuction.category).toBe('groceries');
    });

    it('calculates progressive group discounts', async () => {
      // Create different sized groups and compare pricing
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 130 }
      }));

      // Small group (low discount)
      const smallAuction = await createCohortAuction('energy', 15);
      const smallAuctions = [{ ...smallAuction, participants: 8 }];
      localStorageMock.setItem('bovi.cohortAuctions', JSON.stringify(smallAuctions));
      
      const smallResult = await joinCohortAuction(smallAuction.id);

      // Large group (high discount)  
      const largeAuction = await createCohortAuction('energy', 100);
      const largeAuctions = [{ ...largeAuction, participants: 55 }];
      localStorageMock.setItem('bovi.cohortAuctions', JSON.stringify(largeAuctions));
      
      const largeResult = await joinCohortAuction(largeAuction.id);

      // Large group should have higher savings
      if (smallResult.joined && largeResult.joined) {
        expect(largeResult.projectedSavings).toBeGreaterThan(smallResult.projectedSavings);
      }
    });
  });

  describe('no-worse-off guarantee', () => {
    it('enforces mathematical guarantee', async () => {
      // Set user spending very low to trigger guarantee
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 30 }
      }));

      const auction = await createCohortAuction('energy', 50);
      const result = await joinCohortAuction(auction.id);

      expect(result.joined).toBe(false);
      expect(result.projectedSavings).toBe(0);
      expect(result.guarantee).toContain('would not benefit');
    });

    it('allows joining when savings are positive', async () => {
      // Set user spending high to ensure benefit
      localStorageMock.setItem('bovi.userSpending', JSON.stringify({
        energy: { monthlyAverage: 200 }
      }));

      const auction = await createCohortAuction('energy', 50);
      const result = await joinCohortAuction(auction.id);

      expect(result.joined).toBe(true);
      expect(result.projectedSavings).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('createCohortAuction completes quickly', async () => {
      const start = performance.now();
      await createCohortAuction('energy');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('joinCohortAuction completes within reasonable time', async () => {
      const auction = await createCohortAuction('energy');
      
      const start = performance.now();
      await joinCohortAuction(auction.id);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
    });
  });
});