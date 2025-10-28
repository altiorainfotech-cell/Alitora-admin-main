// Simple in-memory cache for both client and server-side caching
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const memoryCache = new MemoryCache(200)

// Cleanup expired entries every 5 minutes (only on client side)
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup()
  }, 5 * 60 * 1000)
}

// Cache utilities
export const cacheUtils = {
  // Generate cache key from object
  generateKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)
    
    return `${prefix}:${JSON.stringify(sortedParams)}`
  },

  // Cached fetch function
  cachedFetch: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> => {
    // Check cache first
    const cached = memoryCache.get(key)
    if (cached) {
      return cached
    }

    // Fetch and cache
    const data = await fetcher()
    memoryCache.set(key, data, ttl)
    return data
  },

  // Invalidate cache by pattern
  invalidatePattern: (pattern: string): void => {
    // We can't iterate over Map keys directly in this context
    // So we'll need to track keys separately if needed
    // For now, we'll just clear all cache
    memoryCache.clear()
  }
}

// Server-side cache utilities (for API routes)
class ServerCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Cached database query
  async cachedQuery<T>(
    key: string,
    query: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get(key) as T | null
    if (cached !== null) {
      return cached
    }

    const data = await query()
    this.set(key, data, ttl)
    return data
  }
}

export const serverCache = new ServerCache()