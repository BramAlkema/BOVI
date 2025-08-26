/**
 * Rulers Service Tests
 */

import { getRulers, switchRuler, getActiveRuler, getActiveRulerId, type Ruler } from '../rulers.js';

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

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent
});

describe('Rulers Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockDispatchEvent.mockClear();
  });

  describe('getRulers', () => {
    it('returns array of ruler objects', async () => {
      const rulers = await getRulers();

      expect(Array.isArray(rulers)).toBe(true);
      expect(rulers.length).toBeGreaterThan(0);
    });

    it('returns rulers with required properties', async () => {
      const rulers = await getRulers();

      rulers.forEach(ruler => {
        expect(ruler).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          method: expect.any(String),
          lastUpdated: expect.any(String),
          bpDrift: expect.any(Number)
        });
      });
    });

    it('includes expected ruler types', async () => {
      const rulers = await getRulers();
      const rulerIds = rulers.map(r => r.id);

      expect(rulerIds).toContain('bovi-local');
      expect(rulerIds).toContain('bovi-cohort');
      expect(rulerIds).toContain('ons-cpi');
      expect(rulerIds).toContain('truflation');
    });

    it('calculates drift in basis points', async () => {
      const rulers = await getRulers();

      rulers.forEach(ruler => {
        expect(typeof ruler.bpDrift).toBe('number');
        expect(ruler.bpDrift).toBeGreaterThan(-1000); // Reasonable range
        expect(ruler.bpDrift).toBeLessThan(1000);
      });
    });

    it('includes timestamps in ISO format', async () => {
      const rulers = await getRulers();

      rulers.forEach(ruler => {
        expect(() => new Date(ruler.lastUpdated)).not.toThrow();
        
        // Dynamic timestamps should be recent
        if (ruler.id !== 'ons-cpi') { // ONS has fixed timestamp
          const updateTime = new Date(ruler.lastUpdated).getTime();
          const now = Date.now();
          expect(now - updateTime).toBeLessThan(5000); // Within 5 seconds
        }
      });
    });

    it('performs consistently across calls', async () => {
      const rulers1 = await getRulers();
      const rulers2 = await getRulers();

      expect(rulers1.length).toBe(rulers2.length);
      
      // IDs should be consistent
      const ids1 = rulers1.map(r => r.id).sort();
      const ids2 = rulers2.map(r => r.id).sort();
      expect(ids1).toEqual(ids2);
    });
  });

  describe('switchRuler', () => {
    it('switches to valid ruler successfully', async () => {
      await switchRuler('bovi-local');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('bovi.activeRuler', 'bovi-local');
      expect(getActiveRulerId()).toBe('bovi-local');
    });

    it('emits ruler changed event', async () => {
      await switchRuler('bovi-cohort');

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ruler:changed',
          detail: expect.objectContaining({
            rulerId: 'bovi-cohort',
            ruler: expect.any(Object)
          })
        })
      );
    });

    it('throws error for invalid ruler', async () => {
      await expect(switchRuler('invalid-ruler')).rejects.toThrow('Unknown ruler: invalid-ruler');
    });

    it('includes ruler object in event detail', async () => {
      await switchRuler('ons-cpi');

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            ruler: expect.objectContaining({
              id: 'ons-cpi',
              name: expect.any(String),
              method: expect.any(String)
            })
          })
        })
      );
    });
  });

  describe('getActiveRuler', () => {
    it('returns default ruler initially', async () => {
      const activeRuler = await getActiveRuler();

      expect(activeRuler).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        method: expect.any(String),
        lastUpdated: expect.any(String),
        bpDrift: expect.any(Number)
      });
    });

    it('returns switched ruler after switchRuler call', async () => {
      await switchRuler('truflation');
      const activeRuler = await getActiveRuler();

      expect(activeRuler.id).toBe('truflation');
      expect(activeRuler.name).toBe('Truflation Real-time');
    });

    it('persists ruler selection across service calls', async () => {
      await switchRuler('bovi-cohort');
      
      // Simulate service restart by getting active ruler without switch
      const activeRuler = await getActiveRuler();
      expect(activeRuler.id).toBe('bovi-cohort');
    });

    it('falls back to first ruler if stored ruler not found', async () => {
      // Simulate localStorage with invalid ruler
      localStorageMock.setItem('bovi.activeRuler', 'non-existent-ruler');
      
      const activeRuler = await getActiveRuler();
      const allRulers = await getRulers();
      
      expect(activeRuler).toEqual(allRulers[0]);
    });
  });

  describe('getActiveRulerId', () => {
    it('returns string ruler ID', () => {
      const rulerId = getActiveRulerId();
      expect(typeof rulerId).toBe('string');
    });

    it('returns updated ID after switch', async () => {
      await switchRuler('ons-cpi');
      expect(getActiveRulerId()).toBe('ons-cpi');
    });
  });

  describe('integration', () => {
    it('maintains consistency between getActiveRulerId and getActiveRuler', async () => {
      await switchRuler('bovi-local');
      
      const rulerId = getActiveRulerId();
      const ruler = await getActiveRuler();
      
      expect(ruler.id).toBe(rulerId);
    });

    it('handles rapid ruler switching', async () => {
      await switchRuler('bovi-local');
      await switchRuler('truflation');
      await switchRuler('ons-cpi');
      
      const activeRuler = await getActiveRuler();
      expect(activeRuler.id).toBe('ons-cpi');
    });
  });

  describe('performance', () => {
    it('getRulers completes within performance target', async () => {
      const start = performance.now();
      await getRulers();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // <200ms target
    });

    it('switchRuler completes within performance target', async () => {
      const start = performance.now();
      await switchRuler('bovi-local');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200); // <200ms target
    });
  });
});