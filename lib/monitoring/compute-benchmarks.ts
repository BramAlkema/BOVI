/**
 * BOVI Compute Operations Benchmarking
 * Specialized benchmarking for compute-intensive operations
 */

import { performanceCollector } from "./performance-collector.js";

// Benchmark result interfaces
export interface BenchmarkResult {
  operationName: string;
  duration: number;
  iterations: number;
  averagePerIteration: number;
  minDuration: number;
  maxDuration: number;
  throughput: number; // operations per second
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
  metrics: {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
}

export interface ComparativeBenchmark {
  baseline: BenchmarkResult;
  current: BenchmarkResult;
  performance: {
    improvement: number; // percentage
    regression: number; // percentage
    significant: boolean;
  };
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalDuration: number;
  summary: {
    fastestOperation: string;
    slowestOperation: string;
    averageThroughput: number;
    totalMemoryUsed: number;
  };
}

// Compute benchmark configuration
export interface BenchmarkConfig {
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  memoryProfiling?: boolean;
  collectGC?: boolean;
}

/**
 * Compute Operations Benchmark Engine
 */
export class ComputeBenchmark {
  private results: Map<string, BenchmarkResult[]> = new Map();
  private baselines: Map<string, BenchmarkResult> = new Map();

  /**
   * Benchmark a single compute operation
   */
  async benchmarkOperation<T>(
    name: string,
    operation: () => T | Promise<T>,
    config: BenchmarkConfig = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 100,
      warmupIterations = 10,
      timeout = 30000,
      memoryProfiling = true,
      collectGC = false
    } = config;

    // Warmup phase
    for (let i = 0; i < warmupIterations; i++) {
      await operation();
    }

    // Force garbage collection if available and requested
    if (collectGC && "gc" in global) {
      (global as any).gc();
    }

    // Memory baseline (if available)
    const memoryBefore = this.getMemoryUsage();
    let memoryPeak = memoryBefore;

    const durations: number[] = [];
    let totalDuration = 0;
    const startTime = performance.now();

    // Benchmark iterations
    for (let i = 0; i < iterations; i++) {
      // Check timeout
      if (performance.now() - startTime > timeout) {
        console.warn(`Benchmark ${name} timed out after ${i} iterations`);
        break;
      }

      const iterationStart = performance.now();
      
      try {
        await operation();
      } catch (error) {
        console.error(`Benchmark ${name} failed at iteration ${i}:`, error);
        throw error;
      }

      const iterationDuration = performance.now() - iterationStart;
      durations.push(iterationDuration);
      totalDuration += iterationDuration;

      // Track memory usage
      if (memoryProfiling && i % 10 === 0) {
        const currentMemory = this.getMemoryUsage();
        memoryPeak = Math.max(memoryPeak, currentMemory);
      }
    }

    const memoryAfter = this.getMemoryUsage();
    
    // Calculate statistics
    const sortedDurations = durations.sort((a, b) => a - b);
    const mean = totalDuration / durations.length;
    const median = this.getPercentile(sortedDurations, 0.5);
    const p95 = this.getPercentile(sortedDurations, 0.95);
    const p99 = this.getPercentile(sortedDurations, 0.99);
    const stdDev = this.calculateStdDev(durations, mean);

    const result: BenchmarkResult = {
      operationName: name,
      duration: totalDuration,
      iterations: durations.length,
      averagePerIteration: mean,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      throughput: (durations.length / totalDuration) * 1000, // ops per second
      memoryUsage: memoryProfiling ? {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak
      } : undefined,
      metrics: {
        mean,
        median,
        p95,
        p99,
        stdDev
      }
    };

    // Store result
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(result);

    // Track with performance collector
    performanceCollector.trackKPI(`benchmark_${name}_duration`, mean);
    performanceCollector.trackKPI(`benchmark_${name}_throughput`, result.throughput);

    return result;
  }

  /**
   * Benchmark multiple related operations
   */
  async benchmarkSuite(
    suiteName: string,
    operations: Record<string, () => any | Promise<any>>,
    config: BenchmarkConfig = {}
  ): Promise<BenchmarkSuite> {
    const results: BenchmarkResult[] = [];
    const suiteStart = performance.now();

    console.log(`Starting benchmark suite: ${suiteName}`);

    for (const [name, operation] of Object.entries(operations)) {
      console.log(`Benchmarking: ${name}`);
      const result = await this.benchmarkOperation(`${suiteName}_${name}`, operation, config);
      results.push(result);
    }

    const totalDuration = performance.now() - suiteStart;

    // Calculate suite summary
    const throughputs = results.map(r => r.throughput);
    const memoryUsages = results
      .map(r => r.memoryUsage?.peak || 0)
      .filter(m => m > 0);

    const fastest = results.reduce((min, r) => 
      r.averagePerIteration < min.averagePerIteration ? r : min
    );
    
    const slowest = results.reduce((max, r) => 
      r.averagePerIteration > max.averagePerIteration ? r : max
    );

    const suite: BenchmarkSuite = {
      name: suiteName,
      results,
      totalDuration,
      summary: {
        fastestOperation: fastest.operationName,
        slowestOperation: slowest.operationName,
        averageThroughput: throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length,
        totalMemoryUsed: memoryUsages.reduce((sum, m) => sum + m, 0)
      }
    };

    console.log(`Completed benchmark suite: ${suiteName} in ${totalDuration.toFixed(2)}ms`);
    return suite;
  }

  /**
   * Compare current performance against baseline
   */
  compareAgainstBaseline(
    operationName: string,
    current: BenchmarkResult
  ): ComparativeBenchmark | null {
    const baseline = this.baselines.get(operationName);
    if (!baseline) {
      // Set current as baseline if none exists
      this.baselines.set(operationName, current);
      return null;
    }

    const baselineAvg = baseline.averagePerIteration;
    const currentAvg = current.averagePerIteration;
    const performanceChange = ((baselineAvg - currentAvg) / baselineAvg) * 100;
    const improvement = Math.max(0, performanceChange);
    const regression = Math.max(0, -performanceChange);
    
    // Statistical significance test (simple threshold-based)
    const significant = Math.abs(performanceChange) > 5; // 5% threshold

    return {
      baseline,
      current,
      performance: {
        improvement,
        regression,
        significant
      }
    };
  }

  /**
   * Set performance baseline for comparison
   */
  setBaseline(operationName: string, result: BenchmarkResult): void {
    this.baselines.set(operationName, result);
  }

  /**
   * Get benchmark results for an operation
   */
  getResults(operationName: string): BenchmarkResult[] {
    return this.results.get(operationName) || [];
  }

  /**
   * Get all benchmark results
   */
  getAllResults(): Map<string, BenchmarkResult[]> {
    return new Map(this.results);
  }

  /**
   * Export benchmark data for analysis
   */
  exportBenchmarkData(): {
    timestamp: string;
    results: Record<string, BenchmarkResult[]>;
    baselines: Record<string, BenchmarkResult>;
    summary: {
      totalOperations: number;
      totalBenchmarks: number;
      averagePerformance: number;
    };
    } {
    const resultsObj: Record<string, BenchmarkResult[]> = {};
    this.results.forEach((results, name) => {
      resultsObj[name] = results;
    });

    const baselinesObj: Record<string, BenchmarkResult> = {};
    this.baselines.forEach((baseline, name) => {
      baselinesObj[name] = baseline;
    });

    const totalBenchmarks = Array.from(this.results.values()).flat().length;
    const averagePerformance = Array.from(this.results.values())
      .flat()
      .reduce((sum, r) => sum + r.throughput, 0) / Math.max(1, totalBenchmarks);

    return {
      timestamp: new Date().toISOString(),
      results: resultsObj,
      baselines: baselinesObj,
      summary: {
        totalOperations: this.results.size,
        totalBenchmarks,
        averagePerformance
      }
    };
  }

  /**
   * Clear all benchmark data
   */
  clear(): void {
    this.results.clear();
    this.baselines.clear();
  }

  // Utility methods

  private getMemoryUsage(): number {
    if ("memory" in performance && performance.memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  private calculateStdDev(values: number[], mean: number): number {
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}

// Global benchmark instance
export const computeBenchmark = new ComputeBenchmark();

/**
 * Quick benchmark decorator for functions
 */
export function benchmark(name?: string) {
  return function (target: any, propertyName: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      // Handle case where descriptor is not provided (property decorator)
      return;
    }
    
    const method = descriptor.value;
    const benchmarkName = name || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return computeBenchmark.benchmarkOperation(benchmarkName, () => method.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Benchmark common BOVI compute operations
 */
export async function benchmarkBoviOperations(): Promise<BenchmarkSuite> {
  // Import compute operations dynamically to avoid circular dependencies
  const { computeLocalIndex } = await import("../hayek-apis.js");
  const { switchButler } = await import("../friedman-apis.js");

  return computeBenchmark.benchmarkSuite("bovi-compute-ops", {
    "local-index-calculation": () => computeLocalIndex([
      { price: 2.5 }, { price: 1.2 }, { price: 3.8 }, { price: 0.9 }
    ]),
    "butler-switching": () => switchButler("bovi-default"),
    "json-processing": () => {
      const data = { complex: "data", with: ["arrays", 1, 2, 3], and: { nested: "objects" } };
      return JSON.parse(JSON.stringify(data));
    },
    "array-sorting": () => {
      const arr = Array.from({ length: 1000 }, () => Math.random());
      return arr.sort((a, b) => a - b);
    },
    "mathematical-operations": () => {
      let result = 0;
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(i * Math.PI) / Math.log(i + 1);
      }
      return result;
    }
  });
}
