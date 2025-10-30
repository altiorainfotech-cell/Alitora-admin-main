import { NextRequest } from 'next/server';

// In-memory cache for development/simple deployments
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 1000; // Maximum number of cached items

  set(key: string, data: any, ttlSeconds: number = 3600): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [, item] of this.cache.entries()) {
      if (now > item.expires) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize
    };
  }
}

// Global cache instance
const memoryCache = new MemoryCache();

export class SEOCache {
  private static readonly CACHE_PREFIXES = {
    SEO_PAGE: 'seo:page:',
    SEO_LIST: 'seo:list:',
    SITEMAP: 'seo:sitemap:',
    METADATA: 'seo:metadata:',
    AUDIT_LOGS: 'seo:audit:',
    STATS: 'seo:stats:'
  };

  private static readonly DEFAULT_TTL = {
    SEO_PAGE: 3600, // 1 hour
    SEO_LIST: 1800, // 30 minutes
    SITEMAP: 7200, // 2 hours
    METADATA: 3600, // 1 hour
    AUDIT_LOGS: 300, // 5 minutes
    STATS: 900 // 15 minutes
  };

  /**
   * Cache SEO page data
   */
  static cacheSEOPage(siteId: string, path: string, data: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.SEO_PAGE}${siteId}:${path}`;
    memoryCache.set(key, data, ttl || this.DEFAULT_TTL.SEO_PAGE);
  }

  /**
   * Get cached SEO page data
   */
  static getCachedSEOPage(siteId: string, path: string): any | null {
    const key = `${this.CACHE_PREFIXES.SEO_PAGE}${siteId}:${path}`;
    return memoryCache.get(key);
  }

  /**
   * Cache SEO pages list
   */
  static cacheSEOList(siteId: string, queryHash: string, data: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.SEO_LIST}${siteId}:${queryHash}`;
    memoryCache.set(key, data, ttl || this.DEFAULT_TTL.SEO_LIST);
  }

  /**
   * Get cached SEO pages list
   */
  static getCachedSEOList(siteId: string, queryHash: string): any | null {
    const key = `${this.CACHE_PREFIXES.SEO_LIST}${siteId}:${queryHash}`;
    return memoryCache.get(key);
  }

  /**
   * Cache sitemap data
   */
  static cacheSitemap(siteId: string, data: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.SITEMAP}${siteId}`;
    memoryCache.set(key, data, ttl || this.DEFAULT_TTL.SITEMAP);
  }

  /**
   * Get cached sitemap data
   */
  static getCachedSitemap(siteId: string): any | null {
    const key = `${this.CACHE_PREFIXES.SITEMAP}${siteId}`;
    return memoryCache.get(key);
  }

  /**
   * Cache metadata for a specific path
   */
  static cacheMetadata(siteId: string, path: string, metadata: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.METADATA}${siteId}:${path}`;
    memoryCache.set(key, metadata, ttl || this.DEFAULT_TTL.METADATA);
  }

  /**
   * Get cached metadata
   */
  static getCachedMetadata(siteId: string, path: string): any | null {
    const key = `${this.CACHE_PREFIXES.METADATA}${siteId}:${path}`;
    return memoryCache.get(key);
  }

  /**
   * Cache audit logs
   */
  static cacheAuditLogs(queryHash: string, data: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.AUDIT_LOGS}${queryHash}`;
    memoryCache.set(key, data, ttl || this.DEFAULT_TTL.AUDIT_LOGS);
  }

  /**
   * Get cached audit logs
   */
  static getCachedAuditLogs(queryHash: string): any | null {
    const key = `${this.CACHE_PREFIXES.AUDIT_LOGS}${queryHash}`;
    return memoryCache.get(key);
  }

  /**
   * Cache statistics
   */
  static cacheStats(siteId: string, statsType: string, data: any, ttl?: number): void {
    const key = `${this.CACHE_PREFIXES.STATS}${siteId}:${statsType}`;
    memoryCache.set(key, data, ttl || this.DEFAULT_TTL.STATS);
  }

  /**
   * Get cached statistics
   */
  static getCachedStats(siteId: string, statsType: string): any | null {
    const key = `${this.CACHE_PREFIXES.STATS}${siteId}:${statsType}`;
    return memoryCache.get(key);
  }

  /**
   * Invalidate cache for a specific SEO page
   */
  static invalidateSEOPage(siteId: string, path: string): void {
    const pageKey = `${this.CACHE_PREFIXES.SEO_PAGE}${siteId}:${path}`;
    const metadataKey = `${this.CACHE_PREFIXES.METADATA}${siteId}:${path}`;
    
    memoryCache.delete(pageKey);
    memoryCache.delete(metadataKey);
    
    // Also invalidate related caches
    this.invalidateSEOList(siteId);
    this.invalidateSitemap(siteId);
  }

  /**
   * Invalidate SEO list cache
   */
  static invalidateSEOList(siteId: string): void {
    // Since we can't easily iterate through all list cache keys,
    // we'll use a more aggressive approach and clear related caches
    const listPrefix = `${this.CACHE_PREFIXES.SEO_LIST}${siteId}:`;
    
    // In a real Redis implementation, we would use pattern matching
    // For memory cache, we'll clear all list caches for this site
    memoryCache.clear(); // Simplified approach for memory cache
  }

  /**
   * Invalidate sitemap cache
   */
  static invalidateSitemap(siteId: string): void {
    const key = `${this.CACHE_PREFIXES.SITEMAP}${siteId}`;
    memoryCache.delete(key);
  }

  /**
   * Invalidate all caches for a site
   */
  static invalidateAll(siteId: string): void {
    // For memory cache, we'll clear everything
    // In a Redis implementation, we would use pattern matching
    memoryCache.clear();
  }

  /**
   * Generate cache key hash from query parameters
   */
  static generateQueryHash(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, any>);

    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return memoryCache.getStats();
  }

  /**
   * Clear all caches
   */
  static clearAll(): void {
    memoryCache.clear();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmupCache(siteId: string): Promise<void> {
    try {
      // This would typically pre-load frequently accessed SEO pages
      // For now, we'll just log that warmup was requested
      console.log(`Cache warmup requested for site: ${siteId}`);
      
      // In a real implementation, you might:
      // 1. Load homepage and main pages
      // 2. Pre-generate sitemap
      // 3. Cache common metadata
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  /**
   * Get cache headers for HTTP responses
   */
  static getCacheHeaders(maxAge: number = 3600, sMaxAge?: number): Record<string, string> {
    const headers: Record<string, string> = {
      'Cache-Control': `public, max-age=${maxAge}${sMaxAge ? `, s-maxage=${sMaxAge}` : ''}`,
      'Vary': 'Accept-Encoding'
    };

    return headers;
  }

  /**
   * Check if request should bypass cache
   */
  static shouldBypassCache(request: NextRequest): boolean {
    const bypassHeader = request.headers.get('cache-control');
    const bypassQuery = request.nextUrl.searchParams.get('no-cache');
    
    return (
      bypassHeader?.includes('no-cache') ||
      bypassQuery === 'true' ||
      process.env.NODE_ENV === 'development'
    );
  }
}