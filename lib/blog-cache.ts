import { serverCache } from '@/lib/cache';

/**
 * Blog cache invalidation utilities
 */
export class BlogCacheManager {
  
  /**
   * Get cached data
   */
  static get(key: string): any | null {
    return serverCache.get(key);
  }

  /**
   * Set cached data
   */
  static set(key: string, data: any, ttl: number = 300): void {
    serverCache.set(key, data, ttl * 1000); // Convert seconds to milliseconds
  }

  /**
   * Invalidate all blog-related cache entries
   */
  static invalidateAll(): void {
    // Clear all cache entries (since we don't have pattern matching in our simple cache)
    serverCache.clear();
  }

  /**
   * Invalidate cache for a specific blog post
   */
  static invalidatePost(slug: string): void {
    const cacheKey = `blog:post:${slug}`;
    serverCache.delete(cacheKey);
  }

  /**
   * Invalidate cache for blog listings
   */
  static invalidateListings(): void {
    // Since we can't pattern match, we'll clear all cache
    // In a production environment, you'd want a more sophisticated cache with pattern matching
    serverCache.clear();
  }

  /**
   * Invalidate cache for categories
   */
  static invalidateCategories(): void {
    const categoryCacheKey = 'blog:categories:active';
    serverCache.delete(categoryCacheKey);
    // Also clear category-specific listings
    serverCache.clear();
  }

  /**
   * Invalidate cache when a blog post is created, updated, or deleted
   */
  static invalidateOnPostChange(post?: { href?: string; category?: string }): void {
    // Clear all cache to ensure consistency
    serverCache.clear();
    
    // If we have post details, we could be more specific
    if (post?.href) {
      const slug = post.href.replace('/blog/', '');
      this.invalidatePost(slug);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number } {
    return {
      size: 0 // serverCache doesn't expose size method
    };
  }
}

/**
 * Middleware to add cache headers for blog responses
 */
export function addBlogCacheHeaders(response: Response, cacheType: 'short' | 'medium' | 'long' = 'medium'): void {
  const cacheSettings = {
    short: { maxAge: 180, staleWhileRevalidate: 360 }, // 3 minutes / 6 minutes
    medium: { maxAge: 300, staleWhileRevalidate: 600 }, // 5 minutes / 10 minutes  
    long: { maxAge: 900, staleWhileRevalidate: 1800 }   // 15 minutes / 30 minutes
  };

  const { maxAge, staleWhileRevalidate } = cacheSettings[cacheType];
  
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
  response.headers.set('Vary', 'Accept-Encoding');
}

/**
 * Database indexing recommendations for optimal performance
 */
export const RECOMMENDED_INDEXES = [
  // For blog post queries
  { collection: 'blogposts', index: { status: 1, date: -1 } },
  { collection: 'blogposts', index: { href: 1, status: 1 } },
  { collection: 'blogposts', index: { category: 1, status: 1, date: -1 } },
  { collection: 'blogposts', index: { status: 1, createdAt: -1 } },
  
  // For text search
  { collection: 'blogposts', index: { title: 'text', excerpt: 'text', 'seo.keywords': 'text' } },
  
  // For categories
  { collection: 'categories', index: { name: 1 } },
  { collection: 'categories', index: { slug: 1 } }
];

/**
 * Create database indexes for optimal performance
 */
export async function createBlogIndexes(db: any): Promise<void> {
  try {
    for (const { collection, index } of RECOMMENDED_INDEXES) {
      await db.collection(collection).createIndex(index);
      console.log(`Created index for ${collection}:`, index);
    }
  } catch (error) {
    console.error('Error creating blog indexes:', error);
  }
}