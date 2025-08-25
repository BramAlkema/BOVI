/**
 * Compute Benchmarking Tests
 */

import {
  ComputeBenchmark,
  computeBenchmark,
  benchmark,
  benchmarkBoviOperations,
  type BenchmarkResult,
  type BenchmarkSuite,
  type ComparativeBenchmark
} from '../compute-benchmarks.js';

describe('Compute Benchmarking', () => {
  let benchmarkEngine: ComputeBenchmark;

  beforeEach(() => {
    benchmarkEngine = new ComputeBenchmark();
  });

  afterEach(() => {
    benchmarkEngine.clear();
    jest.clearAllMocks();
  });

  describe('single operation benchmarking', () => {
    it('benchmarks synchronous operations', async () => {
      const operation = jest.fn(() => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 100; i++) {
          sum += i;
        }
        return sum;
      });

      const result = await benchmarkEngine.benchmarkOperation('sync-test', operation, {
        iterations: 10,
        warmupIterations: 2
      });

      expect(operation).toHaveBeenCalledTimes(12); // 10 + 2 warmup
      expect(result.operationName).toBe('sync-test');
      expect(result.iterations).toBe(10);
      expect(result.averagePerIteration).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
      expect(result.minDuration).toBeLessThanOrEqual(result.maxDuration);
      expect(result.metrics.mean).toBeCloseTo(result.averagePerIteration);
      expect(result.metrics.median).toBeGreaterThan(0);
    });

    it('benchmarks asynchronous operations', async () => {
      const operation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });

      const result = await benchmarkEngine.benchmarkOperation('async-test', operation, {
        iterations: 5,
        warmupIterations: 1
      });

      expect(operation).toHaveBeenCalledTimes(6); // 5 + 1 warmup
      expect(result.operationName).toBe('async-test');
      expect(result.iterations).toBe(5);
      expect(result.averagePerIteration).toBeGreaterThanOrEqual(10); // At least 10ms delay
    });

    it('handles operation errors gracefully', async () => {
      const operation = jest.fn(() => {
        throw new Error('Test error');
      });

      await expect(
        benchmarkEngine.benchmarkOperation('error-test', operation, {
          iterations: 3,
          warmupIterations: 0
        })
      ).rejects.toThrow('Test error');

      expect(operation).toHaveBeenCalledTimes(1); // Should stop at first error
    });

    it('respects timeout configuration', async () => {
      const operation = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow-operation';
      });

      const result = await benchmarkEngine.benchmarkOperation('timeout-test', operation, {
        iterations: 100,
        timeout: 300, // 300ms timeout
        warmupIterations: 0
      });

      expect(result.iterations).toBeLessThan(100); // Should timeout before completing all iterations
      expect(result.duration).toBeLessThanOrEqual(350); // Some tolerance for timing
    });

    it('calculates accurate statistical metrics', async () => {
      // Create operation with predictable timing variance
      let counter = 0;
      const operation = jest.fn(() => {
        const delay = [10, 20, 30, 40, 50][counter % 5];
        counter++;
        
        const start = performance.now();
        while (performance.now() - start < delay) {
          // Busy wait to create consistent delays
        }
        return counter;
      });

      const result = await benchmarkEngine.benchmarkOperation('stats-test', operation, {
        iterations: 15, // 3 cycles of the 5 different delays
        warmupIterations: 0
      });

      expect(result.metrics.mean).toBeGreaterThan(0);
      expect(result.metrics.median).toBeGreaterThan(0);
      expect(result.metrics.p95).toBeGreaterThanOrEqual(result.metrics.median);
      expect(result.metrics.p99).toBeGreaterThanOrEqual(result.metrics.p95);
      expect(result.metrics.stdDev).toBeGreaterThan(0);
    });
  });

  describe('benchmark suites', () => {
    it('benchmarks multiple operations', async () => {
      const operations = {
        'fast-op': jest.fn(() => 42),
        'medium-op': jest.fn(() => {
          let sum = 0;
          for (let i = 0; i < 50; i++) sum += i;
          return sum;
        }),
        'slow-op': jest.fn(() => {
          let sum = 0;
          for (let i = 0; i < 200; i++) sum += i;
          return sum;
        })
      };

      const suite = await benchmarkEngine.benchmarkSuite('test-suite', operations, {
        iterations: 5,
        warmupIterations: 1
      });

      expect(suite.name).toBe('test-suite');
      expect(suite.results).toHaveLength(3);
      expect(suite.totalDuration).toBeGreaterThan(0);
      
      expect(suite.summary.fastestOperation).toContain('fast-op');
      expect(suite.summary.slowestOperation).toContain('slow-op');
      expect(suite.summary.averageThroughput).toBeGreaterThan(0);

      // Verify all operations were called
      Object.values(operations).forEach(op => {
        expect(op).toHaveBeenCalledTimes(6); // 5 + 1 warmup
      });
    });

    it('tracks suite performance metrics', async () => {
      const suite = await benchmarkEngine.benchmarkSuite('metrics-suite', {
        'operation-a': () => Math.random(),
        'operation-b': () => Array.from({ length: 10 }, () => Math.random()).sort()
      }, {
        iterations: 3,
        warmupIterations: 0
      });

      expect(suite.results).toHaveLength(2);
      suite.results.forEach(result => {
        expect(result.operationName).toMatch(/metrics-suite_operation-[ab]/);
        expect(result.throughput).toBeGreaterThan(0);
        expect(result.metrics).toBeDefined();
      });
    });
  });

  describe('baseline comparison', () => {
    it('sets and compares against baselines', async () => {
      const operation = () => {
        let sum = 0;
        for (let i = 0; i < 100; i++) sum += i;
        return sum;
      };

      // First run - establishes baseline
      const baseline = await benchmarkEngine.benchmarkOperation('baseline-test', operation, {
        iterations: 10
      });

      const comparison1 = benchmarkEngine.compareAgainstBaseline('baseline-test', baseline);
      expect(comparison1).toBeNull(); // No comparison possible, baseline was just set

      // Second run - compare against baseline
      const current = await benchmarkEngine.benchmarkOperation('baseline-test', operation, {
        iterations: 10
      });

      const comparison2 = benchmarkEngine.compareAgainstBaseline('baseline-test', current);
      expect(comparison2).not.toBeNull();
      expect(comparison2!.baseline).toBeDefined();
      expect(comparison2!.current).toBeDefined();
      expect(comparison2!.performance.improvement).toBeGreaterThanOrEqual(0);
      expect(comparison2!.performance.regression).toBeGreaterThanOrEqual(0);
    });

    it('detects significant performance changes', async () => {
      const fastOperation = () => 42;
      const slowOperation = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      };

      const baseline = await benchmarkEngine.benchmarkOperation('change-test', fastOperation, {
        iterations: 5
      });

      benchmarkEngine.setBaseline('change-test', baseline);

      const current = await benchmarkEngine.benchmarkOperation('change-test', slowOperation, {
        iterations: 5
      });

      const comparison = benchmarkEngine.compareAgainstBaseline('change-test', current);
      expect(comparison).not.toBeNull();
      expect(comparison!.performance.significant).toBe(true);
      expect(comparison!.performance.regression).toBeGreaterThan(0);
    });
  });

  describe('data management', () => {
    it('stores and retrieves benchmark results', async () => {
      const operation = () => Math.random();

      await benchmarkEngine.benchmarkOperation('storage-test', operation, { iterations: 3 });
      await benchmarkEngine.benchmarkOperation('storage-test', operation, { iterations: 3 });

      const results = benchmarkEngine.getResults('storage-test');
      expect(results).toHaveLength(2);

      const allResults = benchmarkEngine.getAllResults();
      expect(allResults.has('storage-test')).toBe(true);
      expect(allResults.get('storage-test')).toHaveLength(2);
    });

    it('exports comprehensive benchmark data', async () => {
      await benchmarkEngine.benchmarkOperation('export-test', () => 42, { iterations: 2 });

      const exportData = benchmarkEngine.exportBenchmarkData();

      expect(exportData.timestamp).toBeDefined();
      expect(exportData.results['export-test']).toHaveLength(1);
      expect(exportData.summary.totalOperations).toBe(1);
      expect(exportData.summary.totalBenchmarks).toBe(1);
      expect(exportData.summary.averagePerformance).toBeGreaterThan(0);
    });

    it('clears all data', async () => {
      await benchmarkEngine.benchmarkOperation('clear-test', () => 42, { iterations: 1 });

      expect(benchmarkEngine.getResults('clear-test')).toHaveLength(1);

      benchmarkEngine.clear();

      expect(benchmarkEngine.getResults('clear-test')).toHaveLength(0);
      expect(benchmarkEngine.getAllResults().size).toBe(0);
    });
  });

  describe('decorator functionality', () => {
    it('benchmarks decorated methods', async () => {
      class TestClass {
        @benchmark('decorated-method')
        async testMethod(value: number): Promise<number> {
          await new Promise(resolve => setTimeout(resolve, 1));
          return value * 2;
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod(21);

      expect(result).toBeInstanceOf(Object); // Returns benchmark result
      expect(result.operationName).toBe('decorated-method');
    });
  });

  describe('BOVI operations benchmarking', () => {
    it('benchmarks BOVI compute operations', async () => {
      // Mock the imported functions to avoid actual API calls
      jest.mock('../hayek-apis.js', () => ({
        computeLocalIndex: jest.fn().mockResolvedValue({
          median: 2.35,
          sources: ['mock-data']
        })
      }));

      jest.mock('../friedman-apis.js', () => ({
        switchButler: jest.fn().mockResolvedValue({
          switched: true,
          activationTime: 150
        })
      }));

      // This test verifies the structure, actual benchmarking would need real implementations
      expect(benchmarkBoviOperations).toBeDefined();
      expect(typeof benchmarkBoviOperations).toBe('function');
    });
  });

  describe('memory profiling', () => {
    it('tracks memory usage when available', async () => {
      // Mock performance.memory
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000
        },
        configurable: true
      });

      const result = await benchmarkEngine.benchmarkOperation('memory-test', () => {
        // Simulate memory allocation
        const arr = new Array(1000).fill(Math.random());
        return arr.length;
      }, {
        iterations: 5,
        memoryProfiling: true
      });

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage!.before).toBeDefined();
      expect(result.memoryUsage!.after).toBeDefined();
      expect(result.memoryUsage!.peak).toBeDefined();
    });

    it('handles missing memory API gracefully', async () => {
      // Remove performance.memory
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true
      });

      const result = await benchmarkEngine.benchmarkOperation('no-memory-test', () => 42, {
        memoryProfiling: true
      });

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage!.before).toBe(0);
      expect(result.memoryUsage!.after).toBe(0);
      expect(result.memoryUsage!.peak).toBe(0);
    });
  });
});