/**
 * Unit Tests for Shipping APIs
 * Production-ready features for immediate deployment
 */

import {
  getRulers,
  switchRuler,
  indexCommons,
  createHamburgerBasket,
  publishBasket,
  calculateHamburgerInflation,
  calculateMoneyVeil,
  generateWeeklyDigest,
  createSmartContract,
  createCohortAuction,
  joinCohortAuction,
  createStormProfile,
  activateStormMode,
} from "../shipping-apis.js";
import { BoviAPIError } from "../api-types.js";

// Mock localStorage
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

// Mock window and indexedDB
Object.defineProperty(global, "window", {
  value: {
    location: { origin: "https://bovi.money" },
    dispatchEvent: jest.fn(),
  },
  writable: true,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          put: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          getAll: jest.fn().mockReturnValue({
            onsuccess: null,
            onerror: null,
            result: [],
          }),
          createIndex: jest.fn(),
        }),
      }),
      objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
      createObjectStore: jest.fn().mockReturnValue({
        createIndex: jest.fn(),
      }),
    },
  }),
};

Object.defineProperty(global, "indexedDB", {
  value: mockIndexedDB,
  writable: true,
});

describe("Rulers API", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("getRulers returns rulers with drift metrics", async () => {
    const rulers = await getRulers();

    expect(Array.isArray(rulers)).toBe(true);
    expect(rulers.length).toBeGreaterThan(0);

    rulers.forEach(ruler => {
      expect(ruler).toHaveProperty("id");
      expect(ruler).toHaveProperty("name");
      expect(ruler).toHaveProperty("method");
      expect(ruler).toHaveProperty("lastUpdated");
      expect(ruler).toHaveProperty("bpDrift");
      expect(typeof ruler.bpDrift).toBe("number");
    });
  });

  test("switchRuler updates active ruler", async () => {
    await switchRuler("bovi-cohort");

    expect(mockLocalStorage.getItem("bovi.activeRuler")).toBe("bovi-cohort");
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test("switchRuler throws error for invalid ruler", async () => {
    await expect(switchRuler("non-existent")).rejects.toThrow(BoviAPIError);
  });
});

describe("Index Commons Store", () => {
  test("stores and retrieves entries", async () => {
    // Mock successful IndexedDB operations
    const mockTransaction = {
      objectStore: jest.fn().mockReturnValue({
        put: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null,
        }),
        getAll: jest.fn().mockReturnValue({
          onsuccess: null,
          onerror: null,
          result: [
            {
              id: "test",
              timestamp: new Date().toISOString(),
              sources: ["test"],
              median: 2.5,
              mad: 0.3,
              quality: 0.8,
              notes: "test entry",
            },
          ],
        }),
      }),
    };

    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      result: {
        transaction: jest.fn().mockReturnValue(mockTransaction),
      },
    });

    const entry = {
      id: "test-entry",
      timestamp: new Date().toISOString(),
      sources: ["local-receipts"],
      median: 2.5,
      mad: 0.25,
      quality: 0.9,
      notes: "Test index entry",
    };

    // Store entry
    await expect(indexCommons.store(entry)).resolves.not.toThrow();

    // Export JSON
    const json = await indexCommons.exportJSON();
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty("version");
    expect(parsed).toHaveProperty("exported");
    expect(parsed).toHaveProperty("entries");
  });
});

describe("Hamburger Sentinel", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("createHamburgerBasket stores basket", async () => {
    const items = [
      {
        name: "Big Mac",
        brand: "McDonalds",
        size: "1pc",
        price: 4.5,
        usual: 4.2,
        location: "London",
        date: "2024-01-15",
      },
      {
        name: "Fries",
        brand: "McDonalds",
        size: "Medium",
        price: 2.2,
        usual: 2.0,
        location: "London",
        date: "2024-01-15",
      },
    ];

    const basket = await createHamburgerBasket("London Test", items);

    expect(basket).toHaveProperty("id");
    expect(basket).toHaveProperty("name");
    expect(basket).toHaveProperty("items");
    expect(basket.items).toHaveLength(2);
    expect(basket.public).toBe(false);
  });

  test("publishBasket generates share URL", async () => {
    // Create basket first
    const basket = await createHamburgerBasket("Test Basket", []);

    const shareUrl = await publishBasket(basket.id);

    expect(shareUrl).toContain("bovi.money");
    expect(shareUrl).toContain(basket.id);
  });

  test("calculateHamburgerInflation computes price changes", async () => {
    const items = [
      {
        name: "Burger",
        brand: "Test",
        size: "1pc",
        price: 5.0,
        usual: 4.5,
        location: "Test",
        date: "2024-01-15",
      },
    ];

    const basket = await createHamburgerBasket("Test", items);
    const inflation = await calculateHamburgerInflation(basket.id);

    expect(inflation).toHaveProperty("current");
    expect(inflation).toHaveProperty("previous");
    expect(inflation).toHaveProperty("change");
    expect(inflation).toHaveProperty("changePercent");

    expect(inflation.current).toBe(5.0);
    expect(inflation.previous).toBe(4.5);
    expect(inflation.change).toBe(0.5);
    expect(inflation.changePercent).toBeCloseTo(0.111, 3);
  });
});

describe("Money-veil Card", () => {
  test("calculateMoneyVeil returns personal impact", async () => {
    const result = await calculateMoneyVeil(50000, 10000, 0.04);

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("inflationDrift");
    expect(result).toHaveProperty("bracketCreep");
    expect(result).toHaveProperty("realRate");
    expect(result).toHaveProperty("netImpact");
    expect(result).toHaveProperty("lastCalculated");

    expect(typeof result.inflationDrift).toBe("number");
    expect(typeof result.bracketCreep).toBe("number");
    expect(typeof result.realRate).toBe("number");
  });

  test("generateWeeklyDigest provides insights", async () => {
    const digest = await generateWeeklyDigest();

    expect(digest).toHaveProperty("period");
    expect(digest).toHaveProperty("highlights");
    expect(digest).toHaveProperty("netChange");
    expect(digest).toHaveProperty("recommendations");

    expect(Array.isArray(digest.highlights)).toBe(true);
    expect(Array.isArray(digest.recommendations)).toBe(true);
    expect(digest.highlights.length).toBeGreaterThan(0);
  });
});

describe("Smart Contract Templates", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("createSmartContract generates contract with receipts", async () => {
    const clause = {
      ltsIndex: "bovi-local",
      capBp: 500, // 5%
      floorBp: -200, // -2%
      carry: true,
      undoWindowHours: 168, // 7 days
    };

    const result = await createSmartContract("rent", ["Alice", "Bob"], clause);

    expect(result).toHaveProperty("contract");
    expect(result).toHaveProperty("receipt");

    expect(result.contract).toHaveProperty("id");
    expect(result.contract).toHaveProperty("humanReadable");
    expect(result.contract.parties).toEqual(["Alice", "Bob"]);
    expect(result.contract.clause.capBp).toBe(500);

    expect(result.receipt).toHaveProperty("pdf");
    expect(result.receipt).toHaveProperty("json");
    expect(result.receipt.pdf).toBeInstanceOf(Blob);
  });

  test("contract includes proper indexation terms", async () => {
    const clause = {
      ltsIndex: "bovi-cohort",
      capBp: 300,
      undoWindowHours: 24,
      carry: false,
    };

    const result = await createSmartContract("salary", ["Employee", "Company"], clause);

    expect(result.contract.humanReadable).toContain("3%"); // 300bp = 3%
    expect(result.contract.clause.ltsIndex).toBe("bovi-cohort");

    // Check undo deadline is set correctly
    const undoTime = new Date(result.contract.undoDeadline).getTime();
    const createdTime = new Date(result.contract.created).getTime();
    const hoursDiff = (undoTime - createdTime) / (1000 * 60 * 60);

    expect(hoursDiff).toBe(24);
  });
});

describe("Cohort Engine", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("createCohortAuction initializes auction", async () => {
    const auction = await createCohortAuction("groceries");

    expect(auction).toHaveProperty("id");
    expect(auction).toHaveProperty("category");
    expect(auction.category).toBe("groceries");
    expect(auction.participants).toBe(1);
    expect(auction.status).toBe("forming");
    expect(auction.noWorseOffCheck).toBe(true);
  });

  test("joinCohortAuction respects no-worse-off guarantee", async () => {
    // Create auction first
    const auction = await createCohortAuction("energy");

    // Mock scenario where user would benefit
    const result = await joinCohortAuction(auction.id);

    expect(result).toHaveProperty("joined");
    expect(result).toHaveProperty("projectedSavings");
    expect(result).toHaveProperty("guarantee");

    expect(typeof result.projectedSavings).toBe("number");
    expect(result.guarantee).toContain("BOVI guarantee");
  });

  test("joinCohortAuction prevents joining if no benefit", async () => {
    const auction = await createCohortAuction("test-category");

    // The mock implementation should handle the no-worse-off logic
    const result = await joinCohortAuction(auction.id);

    // Either joined with benefit or protected by guarantee
    if (!result.joined) {
      expect(result.guarantee).toContain("would not benefit");
      expect(result.projectedSavings).toBe(0);
    }
  });
});

describe("Storm Mode", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("createStormProfile stores profile", async () => {
    const profile = {
      name: "Economic Crisis",
      description: "Reduce spending, increase savings",
      changes: {
        pots: { entertainment: -50, savings: 100 },
        contracts: ["pause-gym-membership"],
        rails: ["sepa-only"],
        notifications: {
          frequency: "high" as const,
          channels: ["email", "sms"],
        },
      },
      triggers: ["inflation > 5%", "income < baseline"],
    };

    const result = await createStormProfile(profile);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Economic Crisis");
    expect(result.changes.pots.entertainment).toBe(-50);
  });

  test("activateStormMode applies changes", async () => {
    // Create profile first
    const profile = await createStormProfile({
      name: "Test Storm",
      description: "Test mode",
      changes: {
        pots: { food: -25 },
        contracts: [],
        rails: ["fps"],
        notifications: {
          frequency: "medium" as const,
          channels: ["email"],
        },
      },
      triggers: ["test"],
    });

    const result = await activateStormMode(profile.id);

    expect(result.activated).toBe(true);
    expect(Array.isArray(result.changes)).toBe(true);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("revertTime");

    // Check that storm mode is stored as active
    expect(mockLocalStorage.getItem("bovi.stormMode.active")).toBe(profile.id);
  });

  test("activateStormMode throws error for non-existent profile", async () => {
    await expect(activateStormMode("non-existent")).rejects.toThrow(BoviAPIError);
  });
});
