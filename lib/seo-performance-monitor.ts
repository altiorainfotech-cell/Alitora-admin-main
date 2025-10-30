import { NextRequest } from 'next/server';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface QueryPerformance {
  query: string;
  duration: number;
  resultCount?: number;
  cached: boolean;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private queryMetrics: QueryPerformance[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const startTime = process.hrtime.bigint();
    
    return (metadata?: Record<string, any>) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      this.addMetric({
        operation,
        duration,
        timestamp: new Date(),
        metadata
      });
    };
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record database query performance
   */
  recordQuery(query: string, duration: number, resultCount?: number, cached: boolean = false): void {
    this.queryMetrics.push({
      query,
      duration,
      resultCount,
      cached,
      timestamp: new Date()
    });
    
    // Keep only the most recent query metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindowMinutes: number = 60): {
    operations: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      totalDuration: number;
    }>;
    queries: {
      totalQueries: number;
      cachedQueries: number;
      avgDuration: number;
      slowQueries: QueryPerformance[];
    };
    overall: {
      totalOperations: number;
      avgOperationDuration: number;
      cacheHitRate: number;
    };
  } {
    const cutoffTime = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));
    
    // Filter metrics within time window
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    const recentQueries = this.queryMetrics.filter(q => q.timestamp >= cutoffTime);
    
    // Aggregate operation statistics
    const operationStats: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      totalDuration: number;
    }> = {};
    
    recentMetrics.forEach(metric => {
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = {
          count: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          totalDuration: 0
        };
      }
      
      const stats = operationStats[metric.operation];
      stats.count++;
      stats.totalDuration += metric.duration;
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      stats.avgDuration = stats.totalDuration / stats.count;
    });
    
    // Query statistics
    const cachedQueries = recentQueries.filter(q => q.cached).length;
    const avgQueryDuration = recentQueries.length > 0 
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length 
      : 0;
    
    // Identify slow queries (top 10% by duration)
    const sortedQueries = [...recentQueries].sort((a, b) => b.duration - a.duration);
    const slowQueryCount = Math.max(1, Math.ceil(sortedQueries.length * 0.1));
    const slowQueries = sortedQueries.slice(0, slowQueryCount);
    
    // Overall statistics
    const totalOperations = recentMetrics.length;
    const avgOperationDuration = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    const cacheHitRate = recentQueries.length > 0 
      ? (cachedQueries / recentQueries.length) * 100 
      : 0;
    
    return {
      operations: operationStats,
      queries: {
        totalQueries: recentQueries.length,
        cachedQueries,
        avgDuration: avgQueryDuration,
        slowQueries
      },
      overall: {
        totalOperations,
        avgOperationDuration,
        cacheHitRate
      }
    };
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(thresholdMs: number = 1000, limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.queryMetrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: PerformanceMetric[];
    queries: QueryPerformance[];
    exportedAt: Date;
  } {
    return {
      metrics: [...this.metrics],
      queries: [...this.queryMetrics],
      exportedAt: new Date()
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export class SEOPerformanceMonitor {
  /**
   * Monitor SEO page operations
   */
  static monitorSEOPageOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const endTimer = performanceMonitor.startTimer(`seo_page_${operation}`);
    
    return fn().finally(() => {
      endTimer();
    });
  }

  /**
   * Monitor database queries
   */
  static monitorQuery<T>(
    queryName: string,
    fn: () => Promise<T>,
    cached: boolean = false
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    return fn().then(result => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      let resultCount: number | undefined;
      if (Array.isArray(result)) {
        resultCount = result.length;
      } else if (result && typeof result === 'object' && 'length' in result) {
        resultCount = (result as any).length;
      }
      
      performanceMonitor.recordQuery(queryName, duration, resultCount, cached);
      
      return result;
    }).catch(error => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      performanceMonitor.recordQuery(`${queryName}_ERROR`, duration, 0, cached);
      
      throw error;
    });
  }

  /**
   * Monitor API endpoint performance
   */
  static monitorAPIEndpoint<T>(
    endpoint: string,
    fn: () => Promise<T>,
    request?: NextRequest
  ): Promise<T> {
    const metadata: Record<string, any> = {};
    
    if (request) {
      metadata.method = request.method;
      metadata.userAgent = request.headers.get('user-agent');
      metadata.contentLength = request.headers.get('content-length');
    }
    
    const endTimer = performanceMonitor.startTimer(`api_${endpoint}`);
    
    return fn().finally(() => {
      endTimer();
    });
  }

  /**
   * Get performance statistics
   */
  static getStats(timeWindowMinutes?: number) {
    return performanceMonitor.getStats(timeWindowMinutes);
  }

  /**
   * Get slow operations
   */
  static getSlowOperations(thresholdMs?: number, limit?: number) {
    return performanceMonitor.getSlowOperations(thresholdMs, limit);
  }

  /**
   * Clear all performance data
   */
  static clear(): void {
    performanceMonitor.clear();
  }

  /**
   * Export performance data
   */
  static exportData() {
    return performanceMonitor.exportMetrics();
  }

  /**
   * Log performance warning for slow operations
   */
  static logSlowOperation(operation: string, duration: number, threshold: number = 1000): void {
    if (duration > threshold) {
      console.warn(`Slow SEO operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance recommendations
   */
  static getRecommendations(): string[] {
    const stats = performanceMonitor.getStats(60);
    const recommendations: string[] = [];
    
    // Check cache hit rate
    if (stats.overall.cacheHitRate < 50) {
      recommendations.push('Consider increasing cache TTL or improving cache strategy');
    }
    
    // Check slow operations
    const slowOps = Object.entries(stats.operations)
      .filter(([, opStats]) => opStats.avgDuration > 500)
      .map(([operation]) => operation);
    
    if (slowOps.length > 0) {
      recommendations.push(`Optimize slow operations: ${slowOps.join(', ')}`);
    }
    
    // Check query performance
    if (stats.queries.avgDuration > 100) {
      recommendations.push('Database queries are slow, consider adding indexes or optimizing queries');
    }
    
    // Check overall performance
    if (stats.overall.avgOperationDuration > 200) {
      recommendations.push('Overall performance is slow, consider performance optimization');
    }
    
    return recommendations;
  }
}