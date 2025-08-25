/**
 * Performance Collector Tests
 */

import { performanceCollector } from '../performance-collector.js';

describe('Performance Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset collector state
    performanceCollector.reset();
  });

  describe('KPI tracking', () => {
    it('tracks numeric KPI values', () => {
      performanceCollector.trackKPI('response_time', 150);
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.response_time).toBeDefined();
      expect(metrics.response_time.current).toBe(150);
      expect(metrics.response_time.samples).toBe(1);
    });

    it('calculates averages for multiple samples', () => {
      performanceCollector.trackKPI('response_time', 100);
      performanceCollector.trackKPI('response_time', 200);
      performanceCollector.trackKPI('response_time', 300);
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.response_time.current).toBe(300); // Last value
      expect(metrics.response_time.average).toBe(200); // (100+200+300)/3
      expect(metrics.response_time.samples).toBe(3);
    });

    it('tracks min and max values', () => {
      performanceCollector.trackKPI('response_time', 150);
      performanceCollector.trackKPI('response_time', 50);
      performanceCollector.trackKPI('response_time', 250);
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.response_time.min).toBe(50);
      expect(metrics.response_time.max).toBe(250);
    });

    it('handles string KPI values', () => {
      performanceCollector.trackKPI('status', 'healthy');
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.status).toBeDefined();
      expect(metrics.status.current).toBe('healthy');
      expect(metrics.status.samples).toBe(1);
    });
  });

  describe('system monitoring', () => {
    it('starts system monitoring', () => {
      const setInterval = jest.spyOn(global, 'setInterval').mockImplementation();
      
      performanceCollector.startSystemMonitoring();
      
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        5000 // 5 second interval
      );
    });

    it('stops system monitoring', () => {
      const clearInterval = jest.spyOn(global, 'clearInterval').mockImplementation();
      const mockIntervalId = 123;
      jest.spyOn(global, 'setInterval').mockReturnValue(mockIntervalId as any);
      
      performanceCollector.startSystemMonitoring();
      performanceCollector.stopSystemMonitoring();
      
      expect(clearInterval).toHaveBeenCalledWith(mockIntervalId);
    });

    it('collects memory usage when available', () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1024000,
          totalJSHeapSize: 2048000,
          jsHeapSizeLimit: 4096000
        },
        configurable: true
      });

      performanceCollector.collectSystemMetrics();
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.memory_used).toBeDefined();
      expect(metrics.memory_used.current).toBe(1024000);
    });

    it('handles missing performance.memory gracefully', () => {
      // Remove performance.memory
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true
      });

      performanceCollector.collectSystemMetrics();
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.memory_used).toBeUndefined();
    });

    it('tracks navigation timing when available', () => {
      // Mock performance.getEntriesByType
      jest.spyOn(performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'navigation',
          loadEventEnd: 1500,
          navigationStart: 1000,
          domContentLoadedEventEnd: 1300,
          responseEnd: 1200
        } as PerformanceNavigationTiming
      ]);

      performanceCollector.collectSystemMetrics();
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.page_load_time).toBeDefined();
      expect(metrics.page_load_time.current).toBe(500); // 1500 - 1000
    });
  });

  describe('performance timing', () => {
    it('measures operation duration', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');
      
      const result = await performanceCollector.measureOperation('test_op', mockOperation);
      
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalled();
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.test_op_duration).toBeDefined();
      expect(typeof metrics.test_op_duration.current).toBe('number');
    });

    it('handles operation errors and still records timing', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        performanceCollector.measureOperation('test_op', mockOperation)
      ).rejects.toThrow('Test error');
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.test_op_duration).toBeDefined();
    });

    it('provides timing utilities', () => {
      const startTime = performanceCollector.startTimer('manual_test');
      expect(typeof startTime).toBe('number');
      
      // Simulate some delay
      const endTime = performanceCollector.endTimer('manual_test', startTime);
      expect(typeof endTime).toBe('number');
      expect(endTime).toBeGreaterThanOrEqual(0);
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.manual_test_duration).toBeDefined();
    });
  });

  describe('thresholds and alerts', () => {
    it('detects threshold violations', () => {
      performanceCollector.setThreshold('response_time', { red: 1000, amber: 500 });
      
      performanceCollector.trackKPI('response_time', 300); // Green
      expect(performanceCollector.getThresholdStatus('response_time')).toBe('green');
      
      performanceCollector.trackKPI('response_time', 700); // Amber
      expect(performanceCollector.getThresholdStatus('response_time')).toBe('amber');
      
      performanceCollector.trackKPI('response_time', 1200); // Red
      expect(performanceCollector.getThresholdStatus('response_time')).toBe('red');
    });

    it('handles missing thresholds gracefully', () => {
      performanceCollector.trackKPI('unknown_metric', 100);
      expect(performanceCollector.getThresholdStatus('unknown_metric')).toBe('green');
    });

    it('emits alerts for threshold violations', () => {
      const alertSpy = jest.fn();
      performanceCollector.onAlert(alertSpy);
      
      performanceCollector.setThreshold('response_time', { red: 1000, amber: 500 });
      performanceCollector.trackKPI('response_time', 1200);
      
      expect(alertSpy).toHaveBeenCalledWith({
        metric: 'response_time',
        value: 1200,
        threshold: 'red',
        message: expect.stringContaining('exceeded')
      });
    });
  });

  describe('data export and reset', () => {
    beforeEach(() => {
      performanceCollector.trackKPI('test_metric', 100);
      performanceCollector.trackKPI('test_metric', 200);
    });

    it('exports all metrics data', () => {
      const exported = performanceCollector.exportData();
      
      expect(exported.metrics).toBeDefined();
      expect(exported.metrics.test_metric).toBeDefined();
      expect(exported.timestamp).toBeDefined();
      expect(exported.metadata).toBeDefined();
    });

    it('resets all collected data', () => {
      expect(performanceCollector.getMetrics().test_metric).toBeDefined();
      
      performanceCollector.reset();
      
      expect(performanceCollector.getMetrics().test_metric).toBeUndefined();
    });

    it('includes sample count and timing in export', () => {
      const exported = performanceCollector.exportData();
      
      expect(exported.metrics.test_metric.samples).toBe(2);
      expect(exported.metrics.test_metric.average).toBe(150);
    });
  });

  describe('resource monitoring', () => {
    it('tracks resource load times', () => {
      // Mock performance.getEntriesByType for resources
      jest.spyOn(performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://example.com/script.js',
          loadEventEnd: 1500,
          startTime: 1000,
          duration: 500
        } as PerformanceResourceTiming
      ]);

      performanceCollector.collectResourceMetrics();
      
      const metrics = performanceCollector.getMetrics();
      expect(metrics.resource_load_time).toBeDefined();
    });

    it('identifies slow resources', () => {
      jest.spyOn(performance, 'getEntriesByType').mockReturnValue([
        {
          name: 'https://example.com/slow.js',
          loadEventEnd: 3000,
          startTime: 1000,
          duration: 2000
        } as PerformanceResourceTiming
      ]);

      const slowResources = performanceCollector.getSlowResources(1000);
      
      expect(slowResources).toHaveLength(1);
      expect(slowResources[0].name).toBe('https://example.com/slow.js');
      expect(slowResources[0].duration).toBe(2000);
    });
  });
});