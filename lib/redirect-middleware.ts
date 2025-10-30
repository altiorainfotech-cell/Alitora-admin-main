import { NextRequest, NextResponse } from 'next/server';
import { checkRedirect } from './seo-data-service';
import { logger } from './logger';

/**
 * SEO Redirect Middleware
 * Handles URL redirects based on SEO data from the database
 */

export interface RedirectResult {
  shouldRedirect: boolean;
  response?: NextResponse;
  error?: string;
}

/**
 * Handle SEO redirects for a request
 * Returns a redirect response if a redirect is found, otherwise returns null
 */
export async function handleSEORedirects(
  request: NextRequest,
  siteId: string = 'altiorainfotech'
): Promise<RedirectResult> {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip redirect checking for certain paths
    if (shouldSkipRedirectCheck(pathname)) {
      return { shouldRedirect: false };
    }
    
    // Check for redirect in database
    const redirectInfo = await checkRedirect(pathname, siteId);
    
    if (redirectInfo) {
      // Log redirect for analytics
      logRedirect(request, pathname, redirectInfo.to, redirectInfo.statusCode);
      
      // Create redirect URL
      const redirectUrl = createRedirectUrl(request, redirectInfo.to);
      
      // Return redirect response
      const response = NextResponse.redirect(redirectUrl, redirectInfo.statusCode);
      
      // Add redirect headers for debugging
      response.headers.set('X-Redirect-From', pathname);
      response.headers.set('X-Redirect-To', redirectInfo.to);
      response.headers.set('X-Redirect-Status', redirectInfo.statusCode.toString());
      response.headers.set('X-Redirect-Source', 'seo-system');
      
      return {
        shouldRedirect: true,
        response
      };
    }
    
    return { shouldRedirect: false };
    
  } catch (error) {
    logger.error('Error in SEO redirect middleware:', {
      pathname: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      shouldRedirect: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if redirect checking should be skipped for this path
 */
function shouldSkipRedirectCheck(pathname: string): boolean {
  const skipPatterns = [
    '/api/',           // API routes
    '/admin/',         // Admin panel
    '/_next/',         // Next.js internal
    '/favicon.ico',    // Favicon
    '/robots.txt',     // Robots.txt
    '/sitemap.xml',    // Sitemap
    '/manifest.json',  // Web manifest
    '/sw.js',          // Service worker
    '/.well-known/',   // Well-known URIs
    '/public/',        // Public assets
    '/uploads/',       // Upload directory
  ];
  
  return skipPatterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Create redirect URL from the 'to' path
 */
function createRedirectUrl(request: NextRequest, toPath: string): URL {
  // If toPath is a full URL, use it directly
  if (toPath.startsWith('http://') || toPath.startsWith('https://')) {
    return new URL(toPath);
  }
  
  // If toPath starts with '/', it's an absolute path
  if (toPath.startsWith('/')) {
    return new URL(toPath, request.url);
  }
  
  // Otherwise, treat it as a relative path
  return new URL(`/${toPath}`, request.url);
}

/**
 * Log redirect for analytics and debugging
 */
function logRedirect(
  request: NextRequest,
  fromPath: string,
  toPath: string,
  statusCode: number
): void {
  const logData = {
    type: 'seo_redirect',
    fromPath,
    toPath,
    statusCode,
    userAgent: request.headers.get('user-agent') || undefined,
    referer: request.headers.get('referer') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    timestamp: new Date().toISOString()
  };
  
  logger.info('SEO redirect executed:', logData);
  
  // You can also send this to analytics service
  // await sendToAnalytics(logData);
}

/**
 * Validate redirect to prevent infinite loops and malicious redirects
 */
export function validateRedirect(fromPath: string, toPath: string): {
  isValid: boolean;
  reason?: string;
} {
  // Prevent self-redirect
  if (fromPath === toPath) {
    return {
      isValid: false,
      reason: 'Self-redirect detected'
    };
  }
  
  // Prevent redirect to external domains (unless explicitly allowed)
  if (toPath.startsWith('http://') || toPath.startsWith('https://')) {
    const allowedDomains = [
      'altiorainfotech.com',
      'www.altiorainfotech.com'
    ];
    
    try {
      const url = new URL(toPath);
      if (!allowedDomains.includes(url.hostname)) {
        return {
          isValid: false,
          reason: 'External redirect not allowed'
        };
      }
    } catch {
      return {
        isValid: false,
        reason: 'Invalid redirect URL'
      };
    }
  }
  
  // Prevent redirect to admin or API paths
  if (toPath.startsWith('/admin/') || toPath.startsWith('/api/')) {
    return {
      isValid: false,
      reason: 'Redirect to protected path not allowed'
    };
  }
  
  return { isValid: true };
}

/**
 * Batch check redirects for multiple paths (useful for sitemap generation)
 */
export async function batchCheckRedirects(
  paths: string[],
  siteId: string = 'altiorainfotech'
): Promise<Map<string, { to: string; statusCode: number } | null>> {
  const results = new Map<string, { to: string; statusCode: number } | null>();
  
  try {
    const redirectPromises = paths.map(async (path) => {
      const redirect = await checkRedirect(path, siteId);
      return { path, redirect };
    });
    
    const redirectResults = await Promise.all(redirectPromises);
    
    redirectResults.forEach(({ path, redirect }) => {
      results.set(path, redirect);
    });
    
  } catch (error) {
    logger.error('Error in batch redirect check:', { error });
  }
  
  return results;
}

/**
 * Get redirect statistics for analytics
 */
export interface RedirectStats {
  totalRedirects: number;
  redirectsByStatus: Record<number, number>;
  topRedirects: Array<{ from: string; to: string; count: number }>;
}

// This would typically be implemented with a proper analytics database
export async function getRedirectStats(
  siteId: string = 'altiorainfotech',
  timeRange: { start: Date; end: Date }
): Promise<RedirectStats> {
  // Placeholder implementation
  // In a real implementation, this would query analytics data
  return {
    totalRedirects: 0,
    redirectsByStatus: {},
    topRedirects: []
  };
}

/**
 * Preload redirect data for better performance
 */
export async function preloadRedirectData(
  commonPaths: string[],
  siteId: string = 'altiorainfotech'
): Promise<void> {
  try {
    await Promise.all(
      commonPaths.map(path => checkRedirect(path, siteId))
    );
    logger.info('Redirect data preloaded for paths:', commonPaths);
  } catch (error) {
    logger.error('Error preloading redirect data:', { error });
  }
}

/**
 * Clear redirect cache (if caching is implemented)
 */
export async function clearRedirectCache(): Promise<void> {
  // Placeholder for cache clearing logic
  logger.info('Redirect cache cleared');
}

/**
 * Health check for redirect system
 */
export async function checkRedirectSystemHealth(): Promise<{
  healthy: boolean;
  error?: string;
  stats?: {
    totalRedirects: number;
    recentRedirects: number;
  };
}> {
  try {
    // Test redirect checking functionality
    await checkRedirect('/test-path', 'altiorainfotech');
    
    return {
      healthy: true,
      stats: {
        totalRedirects: 0, // Would be populated from database
        recentRedirects: 0  // Would be populated from recent logs
      }
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}