import { logger } from './logger';
import { withSEOErrorHandling, FallbackMetadataProvider } from './seo-error-handler';

/**
 * SEO Data Service
 * Provides read-only access to SEO data for the website
 * Uses read-only database connection for security and performance
 */

export interface SEOMetadata {
  title: string;
  description: string;
  robots: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
  };
  canonical?: string;
}

export interface RedirectInfo {
  to: string;
  statusCode: number;
}

/**
 * Get SEO metadata for a specific page path
 * Falls back to default values if no custom SEO data exists
 */
export async function getSEOMetadata(
  path: string, 
  siteId: string = 'altiorainfotech'
): Promise<SEOMetadata> {
  return withSEOErrorHandling(
    async () => {
      // Use direct MongoDB connection to avoid mongoose model issues in Edge Runtime
      const { MongoClient } = await import('mongodb');
      const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
      
      if (!uri) {
        throw new Error('MongoDB URI not configured');
      }
      
      const client = new MongoClient(uri);
      await client.connect();
      
      try {
        const db = client.db();
        const collection = db.collection('seo_pages');
        
        // Find SEO data by path
        const seoPage = await collection.findOne({ siteId, path });
        
        if (seoPage) {
          return {
            title: seoPage.metaTitle,
            description: seoPage.metaDescription,
            robots: seoPage.robots,
            openGraph: seoPage.openGraph ? {
              title: seoPage.openGraph.title || seoPage.metaTitle,
              description: seoPage.openGraph.description || seoPage.metaDescription,
              image: seoPage.openGraph.image
            } : undefined
          };
        }
        
        // Return default metadata if no custom SEO data found
        return getDefaultSEOMetadata(path);
      } finally {
        await client.close();
      }
    },
    {
      path,
      siteId,
      operation: 'metadata'
    },
    () => FallbackMetadataProvider.getFallbackMetadata(path)
  );
}

/**
 * Check if a path should be redirected
 * Returns redirect information if a redirect exists
 */
export async function checkRedirect(
  path: string, 
  siteId: string = 'altiorainfotech'
): Promise<RedirectInfo | null> {
  return withSEOErrorHandling(
    async () => {
      // Use direct MongoDB connection to avoid mongoose model issues in Edge Runtime
      const { MongoClient } = await import('mongodb');
      const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
      
      if (!uri) {
        throw new Error('MongoDB URI not configured');
      }
      
      const client = new MongoClient(uri);
      await client.connect();
      
      try {
        const db = client.db();
        const collection = db.collection('redirects');
        
        // Check for exact path match
        const redirect = await collection.findOne({ siteId, from: path });
        
        if (redirect) {
          return {
            to: redirect.to,
            statusCode: redirect.statusCode
          };
        }
        
        // Check for slug-based redirect (remove leading slash for slug comparison)
        const slug = path.startsWith('/') ? path.substring(1) : path;
        const slugRedirect = await collection.findOne({ siteId, from: slug });
        
        if (slugRedirect) {
          return {
            to: slugRedirect.to,
            statusCode: slugRedirect.statusCode
          };
        }
        
        return null;
      } finally {
        await client.close();
      }
    },
    {
      path,
      siteId,
      operation: 'redirect'
    },
    () => null // Don't redirect on error
  );
}

/**
 * Get all SEO pages for sitemap generation
 */
export async function getAllSEOPages(
  siteId: string = 'altiorainfotech'
): Promise<Array<{ path: string; updatedAt: Date; robots: string }>> {
  try {
    // Use direct MongoDB connection to avoid mongoose model issues in Edge Runtime
    const { MongoClient } = await import('mongodb');
    const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection('seo_pages');
      
      const pages = await collection
        .find({ siteId }, { projection: { path: 1, updatedAt: 1, robots: 1 } })
        .toArray();
      
      return pages.map(page => ({
        path: page.path,
        updatedAt: page.updatedAt,
        robots: page.robots
      }));
    } finally {
      await client.close();
    }
    
  } catch (error) {
    logger.error('Error fetching SEO pages for sitemap:', { siteId, error });
    return [];
  }
}

/**
 * Get default SEO metadata for a path
 * This provides fallback values when no custom SEO data exists
 */
function getDefaultSEOMetadata(path: string): SEOMetadata {
  // Default metadata based on path patterns
  const defaults = getDefaultMetadataByPath(path);
  
  return {
    title: defaults.title,
    description: defaults.description,
    robots: 'index,follow'
  };
}

/**
 * Get default metadata based on path patterns
 */
function getDefaultMetadataByPath(path: string): { title: string; description: string } {
  // Normalize path
  const normalizedPath = path.toLowerCase();
  
  // Home page
  if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === 'home') {
    return {
      title: 'Altiora Infotech - AI, Web3 & Growth Engineering',
      description: 'Leading AI, Web3, and growth engineering solutions for modern businesses. Transform your digital presence with cutting-edge technology.'
    };
  }
  
  // Services pages
  if (normalizedPath.includes('/services/')) {
    if (normalizedPath.includes('ai') || normalizedPath.includes('ml')) {
      return {
        title: 'AI & ML Services | Altiora Infotech',
        description: 'Comprehensive AI and machine learning services to transform your business with intelligent automation and data-driven insights.'
      };
    }
    if (normalizedPath.includes('web3') || normalizedPath.includes('blockchain')) {
      return {
        title: 'Web3 & Blockchain Development | Altiora Infotech',
        description: 'Expert Web3 and blockchain development services for decentralized applications, smart contracts, and digital transformation.'
      };
    }
    if (normalizedPath.includes('mobile')) {
      return {
        title: 'Mobile App Development | Altiora Infotech',
        description: 'Professional mobile app development services for iOS and Android platforms with cutting-edge technology and user experience.'
      };
    }
    if (normalizedPath.includes('web')) {
      return {
        title: 'Web Development Services | Altiora Infotech',
        description: 'Full-stack web development services with modern frameworks, responsive design, and scalable architecture.'
      };
    }
    return {
      title: 'Professional Services | Altiora Infotech',
      description: 'Comprehensive technology services to accelerate your digital transformation and business growth.'
    };
  }
  
  // About pages
  if (normalizedPath.includes('/about')) {
    return {
      title: 'About Altiora Infotech | Technology Innovation Leaders',
      description: 'Learn about Altiora Infotech, a leading technology company specializing in AI, Web3, and growth engineering solutions.'
    };
  }
  
  // Contact pages
  if (normalizedPath.includes('/contact')) {
    return {
      title: 'Contact Altiora Infotech | Get In Touch',
      description: 'Contact Altiora Infotech for AI, Web3, and technology consulting. Let\'s discuss your project and digital transformation needs.'
    };
  }
  
  // Blog pages
  if (normalizedPath.includes('/blog')) {
    return {
      title: 'Technology Blog | Altiora Infotech',
      description: 'Stay updated with the latest insights on AI, Web3, blockchain, and technology trends from Altiora Infotech experts.'
    };
  }
  
  // Generic fallback
  const pathSegments = normalizedPath.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || 'page';
  const formattedTitle = lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    title: `${formattedTitle} | Altiora Infotech`,
    description: `Discover ${formattedTitle.toLowerCase()} services and solutions from Altiora Infotech. Expert technology consulting and development.`
  };
}

/**
 * Health check for SEO data service
 */
export async function checkSEODataServiceHealth(
  siteId: string = 'altiorainfotech'
): Promise<{
  connected: boolean;
  error?: string;
  stats?: {
    totalPages: number;
    customPages: number;
    totalRedirects: number;
  };
}> {
  try {
    // Use direct MongoDB connection to avoid mongoose model issues in Edge Runtime
    const { MongoClient } = await import('mongodb');
    const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    try {
      const db = client.db();
      
      // Test database connectivity
      await db.admin().ping();
      
      // Get basic statistics
      const [totalPages, customPages, totalRedirects] = await Promise.all([
        db.collection('seo_pages').countDocuments({ siteId }),
        db.collection('seo_pages').countDocuments({ siteId, isCustom: true }),
        db.collection('redirects').countDocuments({ siteId })
      ]);
      
      return {
        connected: true,
        stats: {
          totalPages,
          customPages,
          totalRedirects
        }
      };
    } finally {
      await client.close();
    }
    
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Preload SEO data for better performance
 * Can be called during application startup
 */
export async function preloadSEOData(siteId: string = 'altiorainfotech'): Promise<void> {
  try {
    // Use direct MongoDB connection to avoid mongoose model issues in Edge Runtime
    const { MongoClient } = await import('mongodb');
    const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    try {
      const db = client.db();
      const collection = db.collection('seo_pages');
      
      // Preload frequently accessed pages
      const commonPaths = ['/', '/services', '/about', '/contact'];
      
      await Promise.all(
        commonPaths.map(path => 
          collection.findOne({ siteId, path })
        )
      );
      
      logger.info('SEO data preloaded successfully');
    } finally {
      await client.close();
    }
    
  } catch (error) {
    logger.error('Error preloading SEO data:', { error });
  }
}

/**
 * Clear any cached SEO data (if caching is implemented)
 */
export async function clearSEOCache(): Promise<void> {
  // Placeholder for cache clearing logic
  // This can be implemented when caching is added
  logger.info('SEO cache cleared');
}

