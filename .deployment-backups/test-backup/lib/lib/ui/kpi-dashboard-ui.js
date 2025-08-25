import { dashboard } from "../monitoring/kpi-dashboard.js";
import { KPI_DEFINITIONS, KPI_CATEGORIES, createKPIMetric } from "../monitoring/kpi-definitions.js";
import { BoviEvents } from "../core/constants.js";
export function setupKPIDashboardUI() {
    const dashboardContainer = createKPIDashboardContainer();
    const main = document.querySelector("main");
    if (main && !main.querySelector(".kpi-dashboard-panel")) {
        main.appendChild(dashboardContainer);
    }
    renderKPIDashboard();
    setInterval(renderKPIDashboard, 30000);
    window.addEventListener(BoviEvents.KPI_UPDATED, renderKPIDashboard);
}
function createKPIDashboardContainer() {
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
    setupKPIDashboardEventListeners(container);
    return container;
}
function setupKPIDashboardEventListeners(container) {
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
function renderKPIDashboard() {
    renderOverallStatus();
    renderKPISummary();
    renderKPICategories();
}
function renderOverallStatus() {
    const statusEl = document.querySelector("#kpi-overall-status");
    if (!statusEl)
        return;
    const summary = dashboard.getHealthSummary();
    const statusIndicator = statusEl.querySelector(".status-indicator");
    const statusText = statusEl.querySelector(".status-text");
    if (statusIndicator && statusText) {
        statusIndicator.className = `status-indicator ${summary.status}`;
        const statusTexts = {
            healthy: "All Systems Operational",
            degraded: "Some Issues Detected",
            unhealthy: "Critical Issues Present"
        };
        statusText.textContent = statusTexts[summary.status];
        statusEl.setAttribute("title", `Health Score: ${(summary.score * 100).toFixed(1)}%`);
    }
}
function renderKPISummary() {
    const summary = dashboard.getHealthSummary();
    const updateCount = (id, count) => {
        const element = document.querySelector(id);
        if (element)
            element.textContent = count.toString();
    };
    updateCount("#kpi-green-count", summary.greenCount);
    updateCount("#kpi-amber-count", summary.amberCount);
    updateCount("#kpi-red-count", summary.redCount);
}
function renderKPICategories() {
    const categoriesContainer = document.querySelector("#kpi-categories");
    if (!categoriesContainer)
        return;
    const allMetrics = dashboard.getMetrics();
    const metricsByName = new Map(allMetrics.map(m => [m.name, m]));
    let categoriesHTML = "";
    Object.entries(KPI_CATEGORIES).forEach(([categoryName, kpiNames]) => {
        const categoryMetrics = kpiNames
            .map(name => metricsByName.get(name))
            .filter((metric) => metric !== undefined);
        if (categoryMetrics.length === 0)
            return;
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
function renderKPIMetricCard(metric) {
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
function formatKPIValue(value, unit) {
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
function formatKPIName(name) {
    return name
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}
function getTrendIcon(trend) {
    switch (trend) {
        case "up": return "📈";
        case "down": return "📉";
        case "stable": return "➡️";
    }
}
function exportKPIData() {
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
function showKPINotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `kpi-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
export function generateDemoKPIData() {
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
    demoMetrics.forEach(metric => {
        window.dispatchEvent(new CustomEvent(BoviEvents.KPI_UPDATED, {
            detail: { kpi: metric.name, value: metric }
        }));
    });
}
//# sourceMappingURL=kpi-dashboard-ui.js.map