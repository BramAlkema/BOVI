/**
 * Capabilities System Tests
 */

import { getProfile, setProfile, hasCapability } from '../capabilities.js';

describe('Capabilities System', () => {
  beforeEach(() => {
    // Reset profile before each test
    localStorage.clear();
  });

  describe('profile management', () => {
    it('returns default profile when none set', () => {
      const profile = getProfile();
      expect(profile).toMatchObject({
        level: expect.any(String),
        features: expect.any(Array)
      });
    });

    it('sets and retrieves profile', () => {
      const testProfile = {
        level: 'L2',
        features: ['advanced', 'experimental']
      };

      setProfile(testProfile);
      const retrieved = getProfile();
      
      expect(retrieved).toEqual(testProfile);
    });

    it('persists profile in localStorage', () => {
      const testProfile = {
        level: 'L1',
        features: ['basic']
      };

      setProfile(testProfile);
      
      // Verify localStorage was updated
      const stored = localStorage.getItem('bovi.profile');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored)).toEqual(testProfile);
    });

    it('loads profile from localStorage on startup', () => {
      const testProfile = {
        level: 'L3',
        features: ['expert', 'debug']
      };

      localStorage.setItem('bovi.profile', JSON.stringify(testProfile));
      
      const profile = getProfile();
      expect(profile).toEqual(testProfile);
    });
  });

  describe('capability checking', () => {
    beforeEach(() => {
      setProfile({
        level: 'L2',
        features: ['advanced', 'charts']
      });
    });

    it('checks feature capabilities', () => {
      expect(hasCapability('advanced')).toBe(true);
      expect(hasCapability('charts')).toBe(true);
      expect(hasCapability('nonexistent')).toBe(false);
    });

    it('checks level capabilities', () => {
      expect(hasCapability('L1')).toBe(true);  // L2 includes L1
      expect(hasCapability('L2')).toBe(true);
      expect(hasCapability('L3')).toBe(false); // L2 doesn't include L3
    });

    it('handles empty features gracefully', () => {
      setProfile({
        level: 'L1',
        features: []
      });

      expect(hasCapability('advanced')).toBe(false);
      expect(hasCapability('L1')).toBe(true);
    });
  });

  describe('profile validation', () => {
    it('validates profile levels', () => {
      const validLevels = ['L0', 'L1', 'L2', 'L3'];
      
      validLevels.forEach(level => {
        setProfile({ level, features: [] });
        expect(getProfile().level).toBe(level);
      });
    });

    it('handles invalid profile gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('bovi.profile', 'invalid json');
      
      const profile = getProfile();
      expect(profile).toMatchObject({
        level: expect.any(String),
        features: expect.any(Array)
      });
    });

    it('normalizes feature names', () => {
      setProfile({
        level: 'L1',
        features: ['ADVANCED', 'charts', 'Debug']
      });

      expect(hasCapability('advanced')).toBe(true);
      expect(hasCapability('CHARTS')).toBe(true);
      expect(hasCapability('debug')).toBe(true);
    });
  });

  describe('profile transitions', () => {
    it('handles profile upgrades', () => {
      setProfile({ level: 'L1', features: ['basic'] });
      
      setProfile({ level: 'L2', features: ['basic', 'advanced'] });
      
      const profile = getProfile();
      expect(profile.level).toBe('L2');
      expect(profile.features).toContain('advanced');
    });

    it('handles profile downgrades', () => {
      setProfile({ level: 'L3', features: ['expert', 'debug'] });
      
      setProfile({ level: 'L1', features: ['basic'] });
      
      const profile = getProfile();
      expect(profile.level).toBe('L1');
      expect(hasCapability('expert')).toBe(false);
    });

    it('emits profile change events', () => {
      const eventSpy = jest.spyOn(window, 'dispatchEvent');
      
      setProfile({ level: 'L2', features: ['advanced'] });
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'profile:changed',
          detail: expect.objectContaining({
            level: 'L2',
            features: ['advanced']
          })
        })
      );
      
      eventSpy.mockRestore();
    });
  });
});