/**
 * Performance monitoring utilities for API routes
 */

export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  static start(operationId: string): void {
    this.timers.set(operationId, Date.now());
  }

  /**
   * End timing and log the duration
   */
  static end(operationId: string, description?: string): number {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      console.warn(`⚠️ No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(operationId);

    const message = description || operationId;
    if (duration > 1000) {
      console.warn(`🐌 SLOW: ${message} took ${duration}ms`);
    } else if (duration > 500) {
      console.log(`⚡ ${message} took ${duration}ms`);
    } else {
      console.log(`✅ ${message} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Measure async function execution time
   */
  static async measure<T>(
    operationId: string,
    operation: () => Promise<T>,
    description?: string
  ): Promise<T> {
    this.start(operationId);
    try {
      const result = await operation();
      this.end(operationId, description);
      return result;
    } catch (error) {
      this.end(operationId, `${description || operationId} (FAILED)`);
      throw error;
    }
  }

  /**
   * Create a middleware function for API routes
   */
  static middleware(routeName: string) {
    return (handler: Function) => {
      return async (...args: any[]) => {
        const operationId = `${routeName}-${Date.now()}`;
        return this.measure(operationId, () => handler(...args), routeName);
      };
    };
  }
}

/**
 * Database query performance wrapper
 */
export class QueryPerformanceMonitor {
  /**
   * Wrap a MongoDB query with performance monitoring
   */
  static async wrapQuery<T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> {
    return PerformanceMonitor.measure(
      `db-${queryName}`,
      query,
      `Database query: ${queryName}`
    );
  }
}

/**
 * Cache performance metrics
 */
export class CacheMetrics {
  private static hits = 0;
  private static misses = 0;

  static recordHit(): void {
    this.hits++;
  }

  static recordMiss(): void {
    this.misses++;
  }

  static getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Enhanced Performance Monitor with statistics tracking
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  slowOperations: number;
  criticalOperations: number;
  apiStats: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
  };
  dbStats: {
    totalQueries: number;
    averageQueryTime: number;
    readWriteRatio: number;
  };
}

export class EnhancedPerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static apiRequests = 0;
  private static apiErrors = 0;
  private static apiTotalTime = 0;
  private static dbQueries = 0;
  private static dbTotalTime = 0;
  private static dbReads = 0;
  private static dbWrites = 0;

  /**
   * Record a performance metric
   */
  static recordMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Track API metrics
    if (name.includes('api') || name.includes('route')) {
      this.apiRequests++;
      this.apiTotalTime += duration;
      if (name.includes('error') || name.includes('failed')) {
        this.apiErrors++;
      }
    }

    // Track DB metrics
    if (name.includes('db') || name.includes('query')) {
      this.dbQueries++;
      this.dbTotalTime += duration;
      if (name.includes('read') || name.includes('find') || name.includes('get')) {
        this.dbReads++;
      } else {
        this.dbWrites++;
      }
    }
  }

  /**
   * Get performance statistics for a time window
   */
  static getStats(timeWindow: number): PerformanceStats {
    const now = Date.now();
    const windowStart = now - timeWindow;
    const recentMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

    const totalOperations = recentMetrics.length;
    const averageDuration = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    const slowOperations = recentMetrics.filter(m => m.duration > 1000).length;
    const criticalOperations = recentMetrics.filter(m => m.duration > 5000).length;

    return {
      totalOperations,
      averageDuration,
      slowOperations,
      criticalOperations,
      apiStats: {
        totalRequests: this.apiRequests,
        averageResponseTime: this.apiRequests > 0 ? this.apiTotalTime / this.apiRequests : 0,
        errorRate: this.apiRequests > 0 ? this.apiErrors / this.apiRequests : 0
      },
      dbStats: {
        totalQueries: this.dbQueries,
        averageQueryTime: this.dbQueries > 0 ? this.dbTotalTime / this.dbQueries : 0,
        readWriteRatio: this.dbWrites > 0 ? this.dbReads / this.dbWrites : this.dbReads
      }
    };
  }

  /**
   * Get recent metrics
   */
  static getRecentMetrics(limit: number = 20): PerformanceMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Clear all metrics
   */
  static reset(): void {
    this.metrics = [];
    this.apiRequests = 0;
    this.apiErrors = 0;
    this.apiTotalTime = 0;
    this.dbQueries = 0;
    this.dbTotalTime = 0;
    this.dbReads = 0;
    this.dbWrites = 0;
  }
}

// Create a singleton instance for backward compatibility
export const performanceMonitor = EnhancedPerformanceMonitor;