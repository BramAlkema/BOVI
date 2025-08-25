/**
 * BOVI KPI Dashboard UI
 * Visual dashboard for monitoring system health and performance metrics
 */

import { dashboard } from "../monitoring/kpi-dashboard.js";
import { KPI_DEFINITIONS, KPI_CATEGORIES, createKPIMetric } from "../monitoring/kpi-definitions.js";
import { KPIMetric } from "../api-types.js";
import { BoviEvents } from "../core/constants.js";

/**
 * Setup and render the KPI dashboard UI
 */
export function setupKPIDashboardUI(): void {
  const dashboardContainer = createKPIDashboardContainer();
  
  // Add to main dashboard if it doesn't exist
  const main = document.querySelector("main");
  if (main && !main.querySelector(".kpi-dashboard-panel")) {
    main.appendChild(dashboardContainer);
  }
  
  // Initial render
  renderKPIDashboard();
  
  // Update dashboard every 30 seconds
  setInterval(renderKPIDashboard, 30000);
  
  // Listen for KPI updates
  window.addEventListener(BoviEvents.KPI_UPDATED, renderKPIDashboard);
}

/**
 * Create the KPI dashboard container HTML structure
 */
function createKPIDashboardContainer(): HTMLElement {
  const container = document.createElement("div");
  container.className = "kpi-dashboard-panel panel";
  container.innerHTML = `
    <div class="kpi-header">
      <h3>📊 System Health Dashboard</h3>
      <div class="kpi-overall-status" id="kpi-overall-status">
        <span class="status-indicator loading"></span>
        <span class="status-text">Loading...</span>
      </div>
    </div>
    <p class="text-muted">Real-time monitoring of BOVI Framework performance and user engagement</p>
    
    <div class="kpi-summary" id="kpi-summary">
      <div class="kpi-summary-card green">
        <div class="kpi-count" id="kpi-green-count">0</div>
        <div class="kpi-label">Healthy</div>
      </div>
      <div class="kpi-summary-card amber">
        <div class="kpi-count" id="kpi-amber-count">0</div>
        <div class="kpi-label">Warning</div>
      </div>
      <div class="kpi-summary-card red">
        <div class="kpi-count" id="kpi-red-count">0</div>
        <div class="kpi-label">Critical</div>
      </div>
    </div>
    
    <div class="kpi-categories" id="kpi-categories">
      <!-- KPI categories will be rendered here -->
    </div>
    
    <div class="kpi-actions">
      <button class="btn secondary" id="kpi-refresh-btn">Refresh Metrics</button>
      <button class="btn ghost" id="kpi-export-btn">Export Data</button>
    </div>
  `;
  
  // Add event listeners
  setupKPIDashboardEventListeners(container);
  
  return container;
}

/**
 * Setup event listeners for the KPI dashboard
 */
function setupKPIDashboardEventListeners(container: HTMLElement): void {
  const refreshBtn = container.querySelector("#kpi-refresh-btn");
  const exportBtn = container.querySelector("#kpi-export-btn");
  
  refreshBtn?.addEventListener("click", () => {
    renderKPIDashboard();
    showKPINotification("Metrics refreshed", "info");
  });
  
  exportBtn?.addEventListener("click", () => {
    exportKPIData();
  });
}

/**
 * Render the complete KPI dashboard
 */
function renderKPIDashboard(): void {
  renderOverallStatus();
  renderKPISummary();
  renderKPICategories();
}

/**
 * Render the overall system status
 */
function renderOverallStatus(): void {
  const statusEl = document.querySelector("#kpi-overall-status");
  if (!statusEl) return;
  
  const summary = dashboard.getHealthSummary();
  const statusIndicator = statusEl.querySelector(".status-indicator");
  const statusText = statusEl.querySelector(".status-text");
  
  if (statusIndicator && statusText) {
    // Update indicator class
    statusIndicator.className = `status-indicator ${summary.status}`;
    
    // Update status text
    const statusTexts = {
      healthy: "All Systems Operational",
      degraded: "Some Issues Detected", 
      unhealthy: "Critical Issues Present"
    };
    
    statusText.textContent = statusTexts[summary.status];
    
    // Add score tooltip
    statusEl.setAttribute("title", `Health Score: ${(summary.score * 100).toFixed(1)}%`);
  }
}

/**
 * Render the KPI summary cards
 */
function renderKPISummary(): void {
  const summary = dashboard.getHealthSummary();
  
  const updateCount = (id: string, count: number) => {
    const element = document.querySelector(id);
    if (element) element.textContent = count.toString();
  };
  
  updateCount("#kpi-green-count", summary.greenCount);
  updateCount("#kpi-amber-count", summary.amberCount);
  updateCount("#kpi-red-count", summary.redCount);
}

/**
 * Render KPI categories with individual metrics
 */
function renderKPICategories(): void {
  const categoriesContainer = document.querySelector("#kpi-categories");
  if (!categoriesContainer) return;
  
  const allMetrics = dashboard.getMetrics();
  const metricsByName = new Map(allMetrics.map(m => [m.name, m]));
  
  let categoriesHTML = "";
  
  Object.entries(KPI_CATEGORIES).forEach(([categoryName, kpiNames]) => {
    const categoryMetrics = kpiNames
      .map(name => metricsByName.get(name))
      .filter((metric): metric is KPIMetric => metric !== undefined);
    
    if (categoryMetrics.length === 0) return;
    
    categoriesHTML += `
      <div class="kpi-category">
        <h4 class="kpi-category-title">${categoryName}</h4>
        <div class="kpi-metrics-grid">
          ${categoryMetrics.map(metric => renderKPIMetricCard(metric)).join("")}
        </div>
      </div>
    `;
  });
  
  categoriesContainer.innerHTML = categoriesHTML || `
    <div class="kpi-empty">
      <p class="text-muted">No metrics available. System is initializing...</p>
    </div>
  `;
}

/**
 * Render individual KPI metric card
 */
function renderKPIMetricCard(metric: KPIMetric): string {
  const definition = KPI_DEFINITIONS[metric.name];
  const unit = definition?.unit || "";
  const description = definition?.description || metric.name;
  
  const displayValue = formatKPIValue(metric.value, unit);
  const trendIcon = getTrendIcon(metric.trend);
  
  return `
    <div class="kpi-metric-card ${metric.status}" title="${description}">
      <div class="kpi-metric-header">
        <span class="kpi-metric-name">${formatKPIName(metric.name)}</span>
        <span class="kpi-trend-icon">${trendIcon}</span>
      </div>
      <div class="kpi-metric-value">${displayValue}</div>
      <div class="kpi-metric-status ${metric.status}">
        ${metric.status.toUpperCase()}
      </div>
    </div>
  `;
}

/**
 * Format KPI value for display
 */
function formatKPIValue(value: number, unit: string): string {
  switch (unit) {
  case "%":
    return `${(value * 100).toFixed(1)}%`;
  case "ms":
    return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`;
  case "ratio":
    return value.toFixed(2);
  case "per 1k":
    return value.toFixed(1);
  default:
    return value.toFixed(2);
  }
}

/**
 * Format KPI name for display
 */
function formatKPIName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Get trend icon for metric
 */
function getTrendIcon(trend: "up" | "down" | "stable"): string {
  switch (trend) {
  case "up": return "📈";
  case "down": return "📉";
  case "stable": return "➡️";
  }
}

/**
 * Export KPI data to JSON
 */
function exportKPIData(): void {
  const data = {
    timestamp: new Date().toISOString(),
    summary: dashboard.getHealthSummary(),
    metrics: dashboard.exportMetrics(),
    definitions: KPI_DEFINITIONS
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `bovi-kpi-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showKPINotification("KPI data exported successfully", "info");
}

/**
 * Show KPI notification
 */
function showKPINotification(message: string, type: "info" | "success" | "error" = "info"): void {
  const notification = document.createElement("div");
  notification.className = `kpi-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

/**
 * Generate demo KPI data for testing
 */
export function generateDemoKPIData(): void {
  const demoMetrics = [
    createKPIMetric("ruler_switch_time", 150, "stable"),
    createKPIMetric("ruler_adoption_rate", 0.65, "up"),
    createKPIMetric("money_veil_calculation_time", 350, "stable"),
    createKPIMetric("money_veil_engagement", 0.42, "up"),
    createKPIMetric("hamburger_viral_coefficient", 0.28, "down"),
    createKPIMetric("contract_completion_rate", 0.92, "stable"),
    createKPIMetric("cohort_satisfaction_rate", 0.96, "up"),
    createKPIMetric("storm_mode_activation_time", 4200, "stable"),
    createKPIMetric("system_uptime", 0.995, "stable"),
    createKPIMetric("failed_payment_rate", 0.003, "down")
  ];
  
  // Emit KPI updates
  demoMetrics.forEach(metric => {
    window.dispatchEvent(new CustomEvent(BoviEvents.KPI_UPDATED, {
      detail: { kpi: metric.name, value: metric }
    }));
  });
}
