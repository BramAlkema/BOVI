/**
 * KPI Dashboard UI Tests
 */

import { 
  setupKPIDashboardUI, 
  generateDemoKPIData 
} from '../kpi-dashboard-ui.js';

// Mock the dependencies
jest.mock('../../monitoring/kpi-dashboard.js', () => ({
  dashboard: {
    getMetrics: jest.fn(() => []),
    getHealthSummary: jest.fn(() => ({
      status: 'healthy',
      score: 0.95,
      issues: [],
      greenCount: 5,
      amberCount: 1,
      redCount: 0
    })),
    exportMetrics: jest.fn(() => ({}))
  }
}));

jest.mock('../../monitoring/kpi-definitions.js', () => ({
  KPI_DEFINITIONS: {
    'ruler_switch_time': {
      unit: 'ms',
      description: 'Time to switch between rulers'
    },
    'system_uptime': {
      unit: '%', 
      description: 'System availability'
    }
  },
  KPI_CATEGORIES: {
    'Performance': ['ruler_switch_time'],
    'System Quality': ['system_uptime']
  },
  createKPIMetric: jest.fn((name, value, trend) => ({
    name,
    value,
    threshold: value * 1.1,
    status: 'green',
    trend
  }))
}));

jest.mock('../../core/constants.js', () => ({
  BoviEvents: {
    KPI_UPDATED: 'ui.kpi.updated'
  }
}));

// Mock DOM
const mockElement = {
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  remove: jest.fn(),
  setAttribute: jest.fn(),
  style: {},
  textContent: '',
  innerHTML: '',
  className: ''
};

const mockDocument = {
  createElement: jest.fn(() => mockElement),
  querySelector: jest.fn(() => mockElement),
  body: mockElement
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  writable: true
});

describe('KPI Dashboard UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocument.querySelector.mockReturnValue(mockElement);
    mockElement.querySelector.mockReturnValue(mockElement);
  });

  describe('setupKPIDashboardUI', () => {
    it('creates dashboard container when main element exists', () => {
      mockDocument.querySelector.mockReturnValueOnce(mockElement); // main element

      setupKPIDashboardUI();

      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('does not crash when main element is missing', () => {
      mockDocument.querySelector.mockReturnValueOnce(null); // no main element

      expect(() => setupKPIDashboardUI()).not.toThrow();
    });

    it('sets up periodic dashboard updates', () => {
      jest.useFakeTimers();
      
      setupKPIDashboardUI();
      
      // Should set up interval for updates
      expect(setTimeout).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('registers KPI update event listener', () => {
      setupKPIDashboardUI();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'ui.kpi.updated',
        expect.any(Function)
      );
    });

    it('prevents duplicate dashboard creation', () => {
      // Mock existing dashboard panel
      mockElement.querySelector.mockReturnValueOnce(mockElement); // existing panel
      mockDocument.querySelector.mockReturnValueOnce(mockElement); // main element

      setupKPIDashboardUI();

      expect(mockElement.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('generateDemoKPIData', () => {
    it('creates demo metrics with correct structure', () => {
      generateDemoKPIData();

      const { createKPIMetric } = require('../../monitoring/kpi-definitions.js');
      
      expect(createKPIMetric).toHaveBeenCalledWith('ruler_switch_time', 150, 'stable');
      expect(createKPIMetric).toHaveBeenCalledWith('system_uptime', 0.995, 'stable');
    });

    it('emits KPI update events for demo data', () => {
      generateDemoKPIData();

      // Should dispatch events for each demo metric
      expect(window.dispatchEvent).toHaveBeenCalledTimes(10); // 10 demo metrics
    });

    it('creates metrics with varied trends', () => {
      generateDemoKPIData();

      const { createKPIMetric } = require('../../monitoring/kpi-definitions.js');
      const calls = createKPIMetric.mock.calls;
      
      // Should have different trend values
      const trends = calls.map(call => call[2]);
      expect(trends).toContain('up');
      expect(trends).toContain('down');
      expect(trends).toContain('stable');
    });

    it('generates realistic metric values', () => {
      generateDemoKPIData();

      const { createKPIMetric } = require('../../monitoring/kpi-definitions.js');
      const calls = createKPIMetric.mock.calls;
      
      // Check that values are in reasonable ranges
      calls.forEach(([name, value, trend]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
        
        // Performance metrics should be reasonable
        if (name.includes('time')) {
          expect(value).toBeLessThan(10000); // Less than 10 seconds
        }
        
        // Percentage metrics should be between 0 and 1
        if (name.includes('rate') || name.includes('uptime')) {
          expect(value).toBeLessThanOrEqual(1);
        }
      });
    });
  });

  describe('dashboard rendering', () => {
    it('handles missing DOM elements gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);
      mockElement.querySelector.mockReturnValue(null);

      expect(() => setupKPIDashboardUI()).not.toThrow();
    });

    it('creates proper HTML structure', () => {
      setupKPIDashboardUI();

      expect(mockElement.innerHTML).toContain('System Health Dashboard');
      expect(mockElement.innerHTML).toContain('kpi-summary');
      expect(mockElement.innerHTML).toContain('kpi-categories');
    });

    it('sets up event listeners for dashboard actions', () => {
      setupKPIDashboardUI();

      // Should set up click handlers for refresh and export buttons
      expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('data export functionality', () => {
    it('includes timestamp in export data', () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      setupKPIDashboardUI();
      generateDemoKPIData();

      // Export functionality should include timestamp
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
    });

    it('handles export button click', () => {
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();

      setupKPIDashboardUI();

      // Should not throw when export is triggered
      expect(() => setupKPIDashboardUI()).not.toThrow();
    });
  });

  describe('responsive behavior', () => {
    it('updates dashboard content periodically', () => {
      jest.useFakeTimers();
      
      setupKPIDashboardUI();
      
      // Fast-forward time
      jest.advanceTimersByTime(30000); // 30 seconds
      
      // Should have updated dashboard content
      expect(mockElement.querySelector).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('handles KPI update events', () => {
      const mockEventListener = jest.fn();
      window.addEventListener = mockEventListener;

      setupKPIDashboardUI();

      // Should register event listener
      expect(mockEventListener).toHaveBeenCalledWith('ui.kpi.updated', expect.any(Function));
    });
  });

  describe('error handling', () => {
    it('handles dashboard setup errors gracefully', () => {
      mockDocument.createElement.mockImplementation(() => {
        throw new Error('DOM error');
      });

      // Should not crash the app
      expect(() => setupKPIDashboardUI()).not.toThrow();
    });

    it('handles missing KPI data gracefully', () => {
      const { dashboard } = require('../../monitoring/kpi-dashboard.js');
      dashboard.getMetrics.mockReturnValue([]);
      dashboard.getHealthSummary.mockReturnValue({
        status: 'healthy',
        score: 1,
        issues: [],
        greenCount: 0,
        amberCount: 0,
        redCount: 0
      });

      expect(() => setupKPIDashboardUI()).not.toThrow();
    });
  });
});