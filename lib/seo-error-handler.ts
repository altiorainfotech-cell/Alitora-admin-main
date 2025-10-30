import { logger } from './logger';
import { SEOMetadata } from './seo-data-service';

/**
 * SEO Error Handler and Fallback System
 * Provides graceful degradation when SEO system components fail
 */

export interface SEOErrorContext {
  path: string;
  siteId: string;
  operation: 'metadata' | 'redirect' | 'database' | 'validation';
  error: Error | unknown;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export interface FallbackOptions {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  fallbackTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Main error handler for SEO operations
 */
export class SEOErrorHandler {
  private static instance: SEOErrorHandler;
  private errorCount: Map<string, number> = new Map();
  private lastErrors: Map<string, Date> = new Map();
  private options: Required<FallbackOptions>;

  private constructor(options: FallbackOptions = {}) {
    this.options = {
      enableLogging: true,
      enableMetrics: true,
      fallbackTimeout: 5000,
      retryAttempts: 2,
      retryDelay: 1000,
      ...options
    };
  }

  public static getInstance(options?: FallbackOptions): SEOErrorHandler {
    if (!SEOErrorHandler.instance) {
      SEOErrorHandler.instance = new SEOErrorHandler(options);
    }
    return SEOErrorHandler.instance;
  }

  /**
   * Handle SEO operation errors with fallback
   */
  public async handleError<T>(
    context: SEOErrorContext,
    fallbackFn: () => T | Promise<T>
  ): Promise<T> {
    // Log the error
    if (this.options.enableLogging) {
      this.logError(context);
    }

    // Update error metrics
    if (this.options.enableMetrics) {
      this.updateErrorMetrics(context);
    }

    // Execute fallback function
    try {
      const result = await Promise.race([
        Promise.resolve(fallbackFn()),
        this.createTimeoutPromise<T>(this.options.fallbackTimeout)
      ]);
      
      return result;
    } catch (fallbackError) {
      // Fallback also failed
      const fallbackContext: SEOErrorContext = {
        ...context,
        operation: 'fallback' as any,
        error: fallbackError,
        timestamp: new Date()
      };
      
      this.logError(fallbackContext);
      throw new Error(`Both primary operation and fallback failed: ${context.operation}`);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    context: Omit<SEOErrorContext, 'error' | 'timestamp'>,
    maxAttempts: number = this.options.retryAttempts
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          // Final attempt failed
          await this.handleError(
            { ...context, error: lastError, timestamp: new Date() },
            () => {
              throw lastError;
            }
          );
        }
        
        // Wait before retry with exponential backoff
        const delay = this.options.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if system is healthy based on error rates
   */
  public getSystemHealth(): {
    healthy: boolean;
    errorRate: number;
    recentErrors: number;
    recommendations: string[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    let recentErrors = 0;
    let totalOperations = 0;
    
    for (const [key, lastError] of this.lastErrors.entries()) {
      if (lastError > oneHourAgo) {
        recentErrors += this.errorCount.get(key) || 0;
      }
      totalOperations += this.errorCount.get(key) || 0;
    }
    
    const errorRate = totalOperations > 0 ? recentErrors / totalOperations : 0;
    const healthy = errorRate < 0.1; // Less than 10% error rate
    
    const recommendations: string[] = [];
    if (errorRate > 0.05) {
      recommendations.push('High error rate detected - check database connectivity');
    }
    if (recentErrors > 50) {
      recommendations.push('Many recent errors - consider enabling circuit breaker');
    }
    
    return {
      healthy,
      errorRate,
      recentErrors,
      recommendations
    };
  }

  private logError(context: SEOErrorContext): void {
    const errorMessage = context.error instanceof Error 
      ? context.error.message 
      : String(context.error);
    
    logger.error(`SEO ${context.operation} error:`, {
      path: context.path,
      siteId: context.siteId,
      error: errorMessage,
      stack: context.error instanceof Error ? context.error.stack : undefined,
      timestamp: context.timestamp.toISOString(),
      userAgent: context.userAgent,
      ip: context.ip
    });
  }

  private updateErrorMetrics(context: SEOErrorContext): void {
    const key = `${context.operation}:${context.path}`;
    const currentCount = this.errorCount.get(key) || 0;
    this.errorCount.set(key, currentCount + 1);
    this.lastErrors.set(key, context.timestamp);
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Fallback metadata provider
 */
export class FallbackMetadataProvider {
  private static defaultMetadata: Map<string, SEOMetadata> = new Map();

  /**
   * Get fallback metadata for a path
   */
  public static getFallbackMetadata(path: string): SEOMetadata {
    // Check if we have cached fallback metadata
    const cached = this.defaultMetadata.get(path);
    if (cached) {
      return cached;
    }

    // Generate fallback metadata based on path
    const metadata = this.generateFallbackMetadata(path);
    this.defaultMetadata.set(path, metadata);
    
    return metadata;
  }

  /**
   * Preload fallback metadata for common paths
   */
  public static preloadFallbackMetadata(paths: string[]): void {
    paths.forEach(path => {
      if (!this.defaultMetadata.has(path)) {
        const metadata = this.generateFallbackMetadata(path);
        this.defaultMetadata.set(path, metadata);
      }
    });
  }

  private static generateFallbackMetadata(path: string): SEOMetadata {
    const normalizedPath = path.toLowerCase();
    
    // Home page
    if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === 'home') {
      return {
        title: 'Altiora Infotech - AI, Web3 & Growth Engineering',
        description: 'Leading AI, Web3, and growth engineering solutions for modern businesses. Transform your digital presence with cutting-edge technology.',
        robots: 'index,follow',
        openGraph: {
          title: 'Altiora Infotech - Technology Innovation Leaders',
          description: 'Leading AI, Web3, and growth engineering solutions for modern businesses.',
          image: 'https://altiorainfotech.com/og-home.jpg'
        }
      };
    }
    
    // Services pages
    if (normalizedPath.includes('/services/')) {
      return {
        title: 'Professional Services | Altiora Infotech',
        description: 'Comprehensive technology services including AI, Web3, mobile, and web development solutions.',
        robots: 'index,follow',
        openGraph: {
          title: 'Professional Technology Services',
          description: 'Comprehensive technology services for modern businesses.',
          image: 'https://altiorainfotech.com/og-services.jpg'
        }
      };
    }
    
    // About pages
    if (normalizedPath.includes('/about')) {
      return {
        title: 'About Altiora Infotech | Technology Innovation Leaders',
        description: 'Learn about Altiora Infotech, a leading technology company specializing in AI, Web3, and growth engineering solutions.',
        robots: 'index,follow'
      };
    }
    
    // Contact pages
    if (normalizedPath.includes('/contact')) {
      return {
        title: 'Contact Altiora Infotech | Get In Touch',
        description: 'Contact Altiora Infotech for AI, Web3, and technology consulting. Let\'s discuss your project needs.',
        robots: 'index,follow'
      };
    }
    
    // Blog pages
    if (normalizedPath.includes('/blog')) {
      return {
        title: 'Technology Blog | Altiora Infotech',
        description: 'Stay updated with the latest insights on AI, Web3, blockchain, and technology trends.',
        robots: 'index,follow'
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
      description: `Discover ${formattedTitle.toLowerCase()} services and solutions from Altiora Infotech.`,
      robots: 'index,follow'
    };
  }
}

/**
 * Circuit breaker for SEO operations
 */
export class SEOCircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const now = new Date();
    return (now.getTime() - this.lastFailureTime.getTime()) >= this.recoveryTimeout;
  }

  public getState(): { state: string; failures: number; lastFailure: Date | null } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailureTime
    };
  }
}

/**
 * Global error handler instance
 */
export const seoErrorHandler = SEOErrorHandler.getInstance({
  enableLogging: true,
  enableMetrics: true,
  fallbackTimeout: 5000,
  retryAttempts: 2,
  retryDelay: 1000
});

/**
 * Global circuit breaker instance
 */
export const seoCircuitBreaker = new SEOCircuitBreaker(5, 60000);

/**
 * Utility function to wrap SEO operations with error handling
 */
export async function withSEOErrorHandling<T>(
  operation: () => Promise<T>,
  context: Omit<SEOErrorContext, 'error' | 'timestamp'>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await seoCircuitBreaker.execute(operation);
  } catch (error) {
    return await seoErrorHandler.handleError(
      { ...context, error, timestamp: new Date() },
      fallback
    );
  }
}

/**
 * Health check for the entire SEO system
 */
export async function checkSEOSystemHealth(): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: { status: string; error?: string };
    metadata: { status: string; error?: string };
    redirects: { status: string; error?: string };
    circuitBreaker: { status: string; state: string };
  };
  recommendations: string[];
}> {
  const health = seoErrorHandler.getSystemHealth();
  const circuitState = seoCircuitBreaker.getState();
  
  const components = {
    database: { status: 'unknown' },
    metadata: { status: 'unknown' },
    redirects: { status: 'unknown' },
    circuitBreaker: { 
      status: circuitState.state === 'closed' ? 'healthy' : 'degraded',
      state: circuitState.state
    }
  };
  
  // Test database connectivity
  try {
    const { checkSEODataServiceHealth } = await import('./seo-data-service');
    const dbHealth = await checkSEODataServiceHealth();
    components.database.status = dbHealth.connected ? 'healthy' : 'unhealthy';
    if (!dbHealth.connected) {
      (components.database as any).error = dbHealth.error;
    }
  } catch (error) {
    components.database.status = 'unhealthy';
    (components.database as any).error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  // Test metadata generation
  try {
    const { getSEOMetadata } = await import('./seo-data-service');
    await getSEOMetadata('/test-health-check');
    components.metadata.status = 'healthy';
  } catch (error) {
    components.metadata.status = 'degraded';
    (components.metadata as any).error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  // Test redirect checking
  try {
    const { checkRedirect } = await import('./seo-data-service');
    await checkRedirect('/test-health-check');
    components.redirects.status = 'healthy';
  } catch (error) {
    components.redirects.status = 'degraded';
    (components.redirects as any).error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  // Determine overall health
  const unhealthyComponents = Object.values(components).filter(c => c.status === 'unhealthy').length;
  const degradedComponents = Object.values(components).filter(c => c.status === 'degraded').length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyComponents > 0) {
    overall = 'unhealthy';
  } else if (degradedComponents > 0 || !health.healthy) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    components,
    recommendations: health.recommendations
  };
}