/**
 * BOVI Benchmark Panel UI
 * Provides user interface for running and viewing compute benchmarks
 */

import { computeBenchmark, benchmarkBoviOperations, type BenchmarkResult } from '../monitoring/compute-benchmarks.js';
import { performanceCollector } from '../monitoring/performance-collector.js';

export function setupBenchmarkPanel(): void {
  addBenchmarkPanelToPage();
}

function addBenchmarkPanelToPage(): void {
  // Find a suitable container (bundle or scenarios section)
  const targetContainer = document.querySelector('#bundle') || document.querySelector('#scenarios');
  
  if (targetContainer && !targetContainer.querySelector('.benchmark-panel')) {
    const panel = document.createElement('div');
    panel.className = 'panel benchmark-panel';
    panel.innerHTML = `
      <h3>⚡ Performance Benchmarks</h3>
      <div class="benchmark-controls">
        <button id="run-benchmarks" class="btn secondary">Run Compute Benchmarks</button>
        <button id="export-benchmarks" class="btn secondary">Export Results</button>
        <button id="clear-benchmarks" class="btn secondary">Clear Data</button>
      </div>
      <div id="benchmark-status" class="benchmark-status" style="display:none;">
        <p class="text-muted">Running benchmarks...</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      </div>
      <div id="benchmark-results" class="benchmark-results" style="display:none;">
        <!-- Results will be populated here -->
      </div>
    `;
    
    targetContainer.appendChild(panel);
    setupBenchmarkEventListeners(panel);
  }
}

function setupBenchmarkEventListeners(panel: Element): void {
  const runBtn = panel.querySelector('#run-benchmarks') as HTMLButtonElement;
  const exportBtn = panel.querySelector('#export-benchmarks') as HTMLButtonElement;
  const clearBtn = panel.querySelector('#clear-benchmarks') as HTMLButtonElement;
  const statusDiv = panel.querySelector('#benchmark-status') as HTMLElement;
  const resultsDiv = panel.querySelector('#benchmark-results') as HTMLElement;

  runBtn?.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    statusDiv.style.display = 'block';
    resultsDiv.style.display = 'none';

    try {
      // Simulate progress updates
      const progressFill = statusDiv.querySelector('.progress-fill') as HTMLElement;
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 20, 90);
        progressFill.style.width = `${progress}%`;
      }, 200);

      const suiteResult = await benchmarkBoviOperations();
      
      clearInterval(progressInterval);
      progressFill.style.width = '100%';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
        displayBenchmarkResults(resultsDiv, suiteResult.results);
        resultsDiv.style.display = 'block';
      }, 500);

      showNotification('Benchmarks completed successfully!', 'success');
      
    } catch (error) {
      console.error('Benchmark failed:', error);
      statusDiv.style.display = 'none';
      showNotification('Benchmark failed. Check console for details.', 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run Compute Benchmarks';
    }
  });

  exportBtn?.addEventListener('click', () => {
    const data = computeBenchmark.exportBenchmarkData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bovi-benchmarks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showNotification('Benchmark data exported!', 'info');
  });

  clearBtn?.addEventListener('click', () => {
    if (confirm('Clear all benchmark data? This cannot be undone.')) {
      computeBenchmark.clear();
      resultsDiv.style.display = 'none';
      showNotification('Benchmark data cleared', 'info');
    }
  });
}

function displayBenchmarkResults(container: HTMLElement, results: BenchmarkResult[]): void {
  const resultsHTML = results.map(result => {
    const throughputColor = getThroughputColor(result.throughput);
    const avgDurationMs = result.averagePerIteration.toFixed(2);
    
    return `
      <div class="benchmark-result-item">
        <div class="result-header">
          <h4>${result.operationName.replace(/.*_/, '').replace(/-/g, ' ')}</h4>
          <span class="throughput-badge" style="background: ${throughputColor}">
            ${result.throughput.toFixed(0)} ops/sec
          </span>
        </div>
        <div class="result-metrics">
          <div class="metric">
            <label>Avg Duration:</label>
            <span>${avgDurationMs}ms</span>
          </div>
          <div class="metric">
            <label>Min/Max:</label>
            <span>${result.minDuration.toFixed(2)}ms / ${result.maxDuration.toFixed(2)}ms</span>
          </div>
          <div class="metric">
            <label>Iterations:</label>
            <span>${result.iterations}</span>
          </div>
          <div class="metric">
            <label>P95:</label>
            <span>${result.metrics.p95.toFixed(2)}ms</span>
          </div>
          ${result.memoryUsage ? `
            <div class="metric">
              <label>Memory:</label>
              <span>${formatBytes(result.memoryUsage.peak - result.memoryUsage.before)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Calculate suite summary
  const totalOperations = results.length;
  const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / totalOperations;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  container.innerHTML = `
    <div class="benchmark-summary">
      <h4>Benchmark Results</h4>
      <div class="summary-metrics">
        <div class="summary-item">
          <label>Operations:</label>
          <span>${totalOperations}</span>
        </div>
        <div class="summary-item">
          <label>Total Time:</label>
          <span>${(totalDuration / 1000).toFixed(1)}s</span>
        </div>
        <div class="summary-item">
          <label>Avg Throughput:</label>
          <span>${avgThroughput.toFixed(0)} ops/sec</span>
        </div>
      </div>
    </div>
    <div class="benchmark-results-list">
      ${resultsHTML}
    </div>
  `;
}

function getThroughputColor(throughput: number): string {
  if (throughput > 1000) return '#22c55e'; // Green
  if (throughput > 100) return '#eab308';  // Yellow
  return '#ef4444'; // Red
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  // Position toast
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '8px';
  toast.style.color = 'white';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '1000';
  
  // Set background color based on type
  const colors = {
    info: '#3b82f6',
    success: '#22c55e',
    error: '#ef4444'
  };
  toast.style.background = colors[type];
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 3000);
}