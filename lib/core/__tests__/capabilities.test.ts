/**
 * Capabilities System Tests
 */

import { can, getProfile, PROFILES, setProfile } from "../capabilities.js";

describe("Capabilities System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setProfile("L1");
  });

  describe("profile management", () => {
    it("uses a valid default profile", () => {
      expect(PROFILES).toHaveProperty(getProfile());
    });

    it("sets and retrieves a profile", () => {
      setProfile("L2");

      expect(getProfile()).toBe("L2");
    });

    it("persists the profile identifier", () => {
      setProfile("L3R");

      expect(localStorage.getItem("profile")).toBe("L3R");
    });
  });

  describe("capability checking", () => {
    it("checks direct profile capabilities", () => {
      expect(can("SAFE_CTA", "L0")).toBe(true);
      expect(can("PDA", "L1")).toBe(false);
      expect(can("PDA", "L2")).toBe(true);
      expect(can("RULES", "L5")).toBe(true);
    });

    it("allows L3R to inherit L2 capabilities", () => {
      expect(can("PDA", "L3R")).toBe(true);
      expect(can("STUDIO", "L3R")).toBe(true);
      expect(can("RULES", "L3R")).toBe(false);
    });

    it("uses the current profile when none is supplied", () => {
      setProfile("L5");

      expect(can("EXPORT")).toBe(true);
      expect(can("PDA")).toBe(false);
    });
  });

  describe("profile transitions", () => {
    it("supports upgrades and downgrades", () => {
      setProfile("L2");
      expect(can("COHORT")).toBe(true);

      setProfile("L1");
      expect(getProfile()).toBe("L1");
      expect(can("COHORT")).toBe(false);
    });

    it("emits the changed profile identifier", () => {
      const eventSpy = jest.spyOn(window, "dispatchEvent");

      setProfile("L2");

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "profile:changed",
          detail: "L2",
        }),
      );
    });
  });
});
