/**
 * KPI Dashboard UI Tests
 */

import { dashboard } from "../../monitoring/kpi-dashboard.js";
import { createKPIMetric } from "../../monitoring/kpi-definitions.js";
import { generateDemoKPIData, setupKPIDashboardUI } from "../kpi-dashboard-ui.js";

jest.mock("../../monitoring/kpi-dashboard.js", () => ({
  dashboard: {
    getMetrics: jest.fn(() => []),
    getHealthSummary: jest.fn(() => ({
      status: "healthy",
      score: 0.95,
      issues: [],
      greenCount: 5,
      amberCount: 1,
      redCount: 0,
    })),
    exportMetrics: jest.fn(() => ({})),
  },
}));

jest.mock("../../monitoring/kpi-definitions.js", () => ({
  KPI_DEFINITIONS: {
    ruler_switch_time: {
      unit: "ms",
      description: "Time to switch between rulers",
    },
    system_uptime: {
      unit: "%",
      description: "System availability",
    },
  },
  KPI_CATEGORIES: {
    Performance: ["ruler_switch_time"],
    "System Quality": ["system_uptime"],
  },
  createKPIMetric: jest.fn((name, value, trend) => ({
    name,
    value,
    threshold: value * 1.1,
    status: "green",
    trend,
  })),
}));

jest.mock("../../core/constants.js", () => ({
  BoviEvents: {
    KPI_UPDATED: "ui.kpi.updated",
  },
}));

describe("KPI Dashboard UI", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    document.body.innerHTML = "<main></main>";
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("setupKPIDashboardUI", () => {
    it("mounts the dashboard in main", () => {
      setupKPIDashboardUI();

      const panel = document.querySelector(".kpi-dashboard-panel");
      expect(panel).not.toBeNull();
      expect(panel?.textContent).toContain("System Health Dashboard");
      expect(panel?.querySelector(".kpi-summary")).not.toBeNull();
      expect(panel?.querySelector(".kpi-categories")).not.toBeNull();
    });

    it("does not crash when main is missing", () => {
      document.body.innerHTML = "";

      expect(() => setupKPIDashboardUI()).not.toThrow();
      expect(document.querySelector(".kpi-dashboard-panel")).toBeNull();
    });

    it("schedules periodic dashboard updates", () => {
      const intervalSpy = jest.spyOn(global, "setInterval");

      setupKPIDashboardUI();

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it("registers the KPI update listener", () => {
      const listenerSpy = jest.spyOn(window, "addEventListener");

      setupKPIDashboardUI();

      expect(listenerSpy).toHaveBeenCalledWith("ui.kpi.updated", expect.any(Function));
    });

    it("does not mount a duplicate panel", () => {
      setupKPIDashboardUI();
      setupKPIDashboardUI();

      expect(document.querySelectorAll(".kpi-dashboard-panel")).toHaveLength(1);
    });

    it("renders the healthy summary and empty metrics state", () => {
      setupKPIDashboardUI();

      expect(document.querySelector("#kpi-overall-status")?.textContent).toContain(
        "All Systems Operational",
      );
      expect(document.querySelector("#kpi-green-count")?.textContent).toBe("5");
      expect(document.querySelector(".kpi-empty")).not.toBeNull();
    });

    it("refreshes when the action button is clicked", () => {
      setupKPIDashboardUI();
      (dashboard.getHealthSummary as jest.Mock).mockClear();

      document.querySelector<HTMLButtonElement>("#kpi-refresh-btn")?.click();

      expect(dashboard.getHealthSummary).toHaveBeenCalled();
      expect(document.querySelector(".kpi-notification")?.textContent).toBe("Metrics refreshed");
    });
  });

  describe("generateDemoKPIData", () => {
    it("creates ten realistic metrics with varied trends", () => {
      generateDemoKPIData();

      const calls = (createKPIMetric as jest.Mock).mock.calls as Array<
        [string, number, "up" | "down" | "stable"]
      >;
      expect(calls).toHaveLength(10);
      expect(calls).toContainEqual(["ruler_switch_time", 150, "stable"]);
      expect(calls.map(call => call[2])).toEqual(
        expect.arrayContaining(["up", "down", "stable"]),
      );
      calls.forEach(([name, value]) => {
        expect(value).toBeGreaterThan(0);
        if (name.includes("time")) expect(value).toBeLessThan(10000);
        if (name.includes("rate") || name.includes("uptime")) {
          expect(value).toBeLessThanOrEqual(1);
        }
      });
    });

    it("dispatches one KPI event per metric", () => {
      const dispatchSpy = jest.spyOn(window, "dispatchEvent");

      generateDemoKPIData();

      expect(dispatchSpy).toHaveBeenCalledTimes(10);
      expect(dispatchSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ type: "ui.kpi.updated" }),
      );
    });
  });
});
