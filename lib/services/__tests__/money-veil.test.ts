/**
 * Money-Veil Service Tests
 */

import { calculateMoneyVeil, type MoneyVeilData } from '../money-veil.js';

describe('Money-Veil Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMoneyVeil', () => {
    it('calculates money-veil effects for typical user', async () => {
      const result = await calculateMoneyVeil(50000, 10000, 0.04);

      expect(result).toMatchObject({
        userId: 'current-user',
        inflationDrift: expect.any(Number),
        bracketCreep: expect.any(Number),
        realRate: expect.any(Number),
        netImpact: expect.any(Number),
        lastCalculated: expect.any(String)
      });

      // Validate timestamp is recent
      const calculatedTime = new Date(result.lastCalculated).getTime();
      const now = Date.now();
      expect(now - calculatedTime).toBeLessThan(1000); // Within 1 second
    });

    it('handles zero income correctly', async () => {
      const result = await calculateMoneyVeil(0, 5000, 0.03);

      expect(result.bracketCreep).toBe(0); // No bracket creep with no income
      expect(result.realRate).toBeLessThan(0); // Real rate should be negative
    });

    it('handles zero savings correctly', async () => {
      const result = await calculateMoneyVeil(40000, 0, 0.02);

      expect(result.realRate).toBe(-0); // No real rate impact with no savings
      expect(result.bracketCreep).toBeGreaterThan(0); // Should have bracket creep
    });

    it('calculates inflation drift correctly', async () => {
      const result = await calculateMoneyVeil(30000, 5000, 0.025);

      // Personal inflation should be different from official rate
      expect(typeof result.inflationDrift).toBe('number');
      expect(result.inflationDrift).not.toBe(0);
    });

    it('calculates bracket creep impact', async () => {
      const income = 60000;
      const result = await calculateMoneyVeil(income, 8000, 0.035);

      // Bracket creep should be related to income and inflation drift
      expect(result.bracketCreep).toBeGreaterThanOrEqual(0);
      
      // Higher income should generally lead to higher bracket creep
      const highIncomeResult = await calculateMoneyVeil(100000, 8000, 0.035);
      expect(highIncomeResult.bracketCreep).toBeGreaterThan(result.bracketCreep);
    });

    it('calculates real rate impact on savings', async () => {
      const savings = 15000;
      const interestRate = 0.04;
      const result = await calculateMoneyVeil(45000, savings, interestRate);

      // Real rate should account for inflation eating into returns
      expect(typeof result.realRate).toBe('number');
      
      // With typical inflation above interest rates, real rate should be negative
      expect(result.realRate).toBeLessThan(0);
    });

    it('combines impacts into net impact', async () => {
      const result = await calculateMoneyVeil(55000, 12000, 0.03);

      // Net impact should be sum of bracket creep and real rate
      const expectedNet = result.bracketCreep + result.realRate;
      expect(result.netImpact).toBeCloseTo(expectedNet, 2);
    });

    it('handles edge case with very high interest rate', async () => {
      // Test with unusually high interest rate
      const result = await calculateMoneyVeil(40000, 10000, 0.15);

      // Should still calculate without errors
      expect(result.realRate).toBeLessThan(0); // Still negative due to high personal inflation
      expect(result.netImpact).toBeDefined();
    });

    it('performance test - completes within time limit', async () => {
      const start = performance.now();
      
      await calculateMoneyVeil(50000, 10000, 0.04);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('data validation', () => {
    it('returns consistent results for same inputs', async () => {
      const result1 = await calculateMoneyVeil(45000, 8000, 0.035);
      const result2 = await calculateMoneyVeil(45000, 8000, 0.035);

      // Results should be consistent (excluding timestamp)
      expect(result1.inflationDrift).toBe(result2.inflationDrift);
      expect(result1.bracketCreep).toBe(result2.bracketCreep);
      expect(result1.realRate).toBe(result2.realRate);
      expect(result1.netImpact).toBe(result2.netImpact);
    });

    it('validates number precision', async () => {
      const result = await calculateMoneyVeil(33333.33, 7777.77, 0.0333);

      // Should handle decimal precision correctly
      expect(result.inflationDrift).not.toBeNaN();
      expect(result.bracketCreep).not.toBeNaN();
      expect(result.realRate).not.toBeNaN();
      expect(result.netImpact).not.toBeNaN();
    });
  });
});