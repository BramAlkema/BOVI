/**
 * Unit Tests for Friedman Stance APIs
 */

import {
  getRulesets,
  getRuleset,
  checkRuleCompliance,
  getMacroRefs,
  compareLTSToOfficial,
  getContractTemplates,
  createContract,
  simulateBrackets,
  quoteRails,
  executePayment,
  registerButler,
  getRegisteredButlers,
  switchButler,
} from "../friedman-apis.js";
import { BoviAPIError } from "../api-types.js";

// Mock localStorage for tests
const mockLocalStorage = {
  store: {} as { [key: string]: string },
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  },
  clear: () => {
    mockLocalStorage.store = {};
  },
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("Rules Registry", () => {
  test("getRulesets returns array of rulesets", async () => {
    const rulesets = await getRulesets();

    expect(Array.isArray(rulesets)).toBe(true);
    expect(rulesets.length).toBeGreaterThan(0);
    expect(rulesets[0]).toHaveProperty("id");
    expect(rulesets[0]).toHaveProperty("current");
    expect(rulesets[0]).toHaveProperty("history");
  });

  test("getRuleset returns specific ruleset", async () => {
    const ruleset = await getRuleset("lts-calculation");

    expect(ruleset.id).toBe("lts-calculation");
    expect(ruleset.current.semver).toMatch(/\d+\.\d+\.\d+/);
  });

  test("getRuleset throws error for non-existent rule", async () => {
    await expect(getRuleset("non-existent")).rejects.toThrow(BoviAPIError);
  });

  test("checkRuleCompliance returns compliance metrics", async () => {
    const compliance = await checkRuleCompliance();

    expect(compliance).toHaveProperty("compliance");
    expect(compliance).toHaveProperty("outdatedFlows");
    expect(compliance.compliance).toBeGreaterThan(0);
    expect(compliance.compliance).toBeLessThanOrEqual(1);
  });
});

describe("Macro Anchoring", () => {
  test("getMacroRefs returns economic indicators", async () => {
    const refs = await getMacroRefs();

    expect(refs).toHaveProperty("cpiYoY");
    expect(refs).toHaveProperty("wageYoY");
    expect(refs).toHaveProperty("policyRate");
    expect(refs).toHaveProperty("updated");

    expect(typeof refs.cpiYoY).toBe("number");
    expect(typeof refs.wageYoY).toBe("number");
    expect(typeof refs.policyRate).toBe("number");
  });

  test("compareLTSToOfficial provides deviation analysis", async () => {
    const comparison = await compareLTSToOfficial(0.035);

    expect(comparison).toHaveProperty("lts");
    expect(comparison).toHaveProperty("official");
    expect(comparison).toHaveProperty("deviation");
    expect(comparison).toHaveProperty("explanation");

    expect(comparison.lts).toBe(0.035);
    expect(typeof comparison.explanation).toBe("string");
  });
});

describe("Indexation Pack", () => {
  test("getContractTemplates returns templates", async () => {
    const templates = await getContractTemplates();

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty("id");
    expect(templates[0]).toHaveProperty("text");
    expect(templates[0]).toHaveProperty("index");
  });

  test("createContract generates valid contract", async () => {
    const result = await createContract("rent-standard", { capBp: 400 });

    expect(result).toHaveProperty("contract");
    expect(result).toHaveProperty("receipt");
    expect(typeof result.contract).toBe("string");
    expect(result.receipt.index.capBp).toBe(400);
  });

  test("createContract throws error for invalid template", async () => {
    await expect(createContract("non-existent", {})).rejects.toThrow(BoviAPIError);
  });
});

describe("Bracket Indexation Simulator", () => {
  test("simulateBrackets calculates tax effects", async () => {
    const result = await simulateBrackets(50000, 0.03);

    expect(result).toHaveProperty("taxNow");
    expect(result).toHaveProperty("taxIndexed");
    expect(result).toHaveProperty("creep");

    expect(result.taxNow).toBeGreaterThan(0);
    expect(result.taxIndexed).toBeGreaterThan(0);
    expect(result.creep).toBeGreaterThanOrEqual(0); // Bracket creep should be positive
  });

  test("simulateBrackets handles low income", async () => {
    const result = await simulateBrackets(10000, 0.03);

    expect(result.taxNow).toBe(0); // Below tax threshold
    expect(result.taxIndexed).toBe(0);
    expect(result.creep).toBe(0);
  });
});

describe("Rails Marketplace", () => {
  test("quoteRails returns sorted quotes", async () => {
    const quotes = await quoteRails(1000, "test-destination");

    expect(Array.isArray(quotes)).toBe(true);
    expect(quotes.length).toBeGreaterThan(0);

    // Should be sorted by fee (ascending)
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i].fee).toBeGreaterThanOrEqual(quotes[i - 1].fee);
    }

    quotes.forEach(quote => {
      expect(quote).toHaveProperty("rail");
      expect(quote).toHaveProperty("fee");
      expect(quote).toHaveProperty("etaSec");
      expect(quote).toHaveProperty("successP90");
    });
  });

  test("quoteRails includes crypto rail for large amounts", async () => {
    const quotes = await quoteRails(5000, "test-destination");
    const cryptoRail = quotes.find(q => q.rail === "StableL2");

    expect(cryptoRail).toBeDefined();
  });

  test("executePayment returns payment result", async () => {
    const quotes = await quoteRails(100, "test");
    const result = await executePayment(quotes[0], 100, "test");

    expect(result).toHaveProperty("txId");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("eta");
    expect(result.status).toBe("pending");
  });
});

describe("Butler Competition", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("registerButler validates manifest", async () => {
    await expect(registerButler("", { name: "", version: "", capabilities: [] })).rejects.toThrow(
      BoviAPIError
    );
  });

  test("registerButler succeeds with valid data", async () => {
    const manifest = {
      name: "Test Butler",
      version: "1.0.0",
      capabilities: ["test"],
    };

    await expect(registerButler("test-butler", manifest)).resolves.not.toThrow();
  });

  test("getRegisteredButlers returns butler list", async () => {
    const butlers = await getRegisteredButlers();

    expect(Array.isArray(butlers)).toBe(true);
    expect(butlers.length).toBeGreaterThan(0);
    expect(butlers[0]).toHaveProperty("id");
    expect(butlers[0]).toHaveProperty("name");
  });

  test("switchButler measures activation time", async () => {
    const result = await switchButler("bovi-default");

    expect(result).toHaveProperty("switched");
    expect(result).toHaveProperty("activationTime");
    expect(result.switched).toBe(true);
    expect(result.activationTime).toBeGreaterThan(0);
    expect(result.activationTime).toBeLessThan(1000); // Should be fast
  });

  test("switchButler throws error for non-existent butler", async () => {
    await expect(switchButler("non-existent")).rejects.toThrow(BoviAPIError);
  });
});
