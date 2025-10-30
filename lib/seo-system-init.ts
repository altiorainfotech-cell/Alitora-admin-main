import { logger } from './logger';
import { FallbackMetadataProvider } from './seo-error-handler';
import { preloadSEOData } from './seo-data-service';
import { preloadRedirectData } from './redirect-middleware';
import { preloadMetadata } from './metadata-generator';

/**
 * SEO System Initialization
 * Handles startup tasks and system preparation
 */

export interface SEOSystemConfig {
  enablePreloading?: boolean;
  preloadPaths?: string[];
  enableFallbacks?: boolean;
  enableHealthChecks?: boolean;
  siteId?: string;
}

/**
 * Initialize the SEO system
 * Should be called during application startup
 */
export async function initializeSEOSystem(
  config: SEOSystemConfig = {}
): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
  initialized: {
    database: boolean;
    preloading: boolean;
    fallbacks: boolean;
    healthChecks: boolean;
  };
}> {
  const {
    enablePreloading = true,
    preloadPaths = getDefaultPreloadPaths(),
    enableFallbacks = true,
    enableHealthChecks = true,
    siteId = 'altiorainfotech'
  } = config;

  const result = {
    success: true,
    errors: [] as string[],
    warnings: [] as string[],
    initialized: {
      database: false,
      preloading: false,
      fallbacks: false,
      healthChecks: false
    }
  };

  logger.info('Initializing SEO system...', { config });

  // 1. Initialize database connections
  try {
    const { initializeSEOConnections } = await import('./database/seo-connection');
    const dbResult = await initializeSEOConnections();
    
    if (dbResult.readOnly && dbResult.readWrite) {
      result.initialized.database = true;
      logger.info('SEO database connections initialized successfully');
    } else {
      result.errors.push(...dbResult.errors);
      if (!dbResult.readOnly) {
        result.warnings.push('Read-only database connection failed - using fallbacks');
      }
      if (!dbResult.readWrite) {
        result.warnings.push('Read-write database connection failed - admin features may not work');
      }
    }
  } catch (error) {
    const message = `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(message);
    logger.error('SEO database initialization error:', { error });
  }

  // 2. Initialize fallback metadata
  if (enableFallbacks) {
    try {
      FallbackMetadataProvider.preloadFallbackMetadata(preloadPaths);
      result.initialized.fallbacks = true;
      logger.info('SEO fallback metadata initialized');
    } catch (error) {
      const message = `Fallback initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.warnings.push(message);
      logger.warn('SEO fallback initialization warning:', { error });
    }
  }

  // 3. Preload data for performance
  if (enablePreloading && result.initialized.database) {
    try {
      await Promise.allSettled([
        preloadSEOData(siteId),
        preloadRedirectData(preloadPaths, siteId),
        preloadMetadata(preloadPaths, siteId)
      ]);
      
      result.initialized.preloading = true;
      logger.info('SEO data preloading completed');
    } catch (error) {
      const message = `Data preloading failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.warnings.push(message);
      logger.warn('SEO data preloading warning:', { error });
    }
  }

  // 4. Initialize health checks
  if (enableHealthChecks) {
    try {
      const { checkSEOSystemHealth } = await import('./seo-error-handler');
      const health = await checkSEOSystemHealth();
      
      result.initialized.healthChecks = true;
      logger.info('SEO health check system initialized', { 
        status: health.overall,
        recommendations: health.recommendations 
      });
      
      if (health.overall !== 'healthy') {
        result.warnings.push(`SEO system health: ${health.overall}`);
        result.warnings.push(...health.recommendations);
      }
    } catch (error) {
      const message = `Health check initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.warnings.push(message);
      logger.warn('SEO health check initialization warning:', { error });
    }
  }

  // Determine overall success
  result.success = result.errors.length === 0;

  if (result.success) {
    logger.info('SEO system initialization completed successfully', {
      initialized: result.initialized,
      warnings: result.warnings.length
    });
  } else {
    logger.error('SEO system initialization failed', {
      errors: result.errors,
      warnings: result.warnings,
      initialized: result.initialized
    });
  }

  return result;
}

/**
 * Gracefully shutdown the SEO system
 */
export async function shutdownSEOSystem(): Promise<void> {
  logger.info('Shutting down SEO system...');

  try {
    const { closeSEOConnections } = await import('./database/seo-connection');
    await closeSEOConnections();
    logger.info('SEO database connections closed');
  } catch (error) {
    logger.error('Error closing SEO database connections:', { error });
  }

  logger.info('SEO system shutdown completed');
}

/**
 * Get default paths to preload
 */
function getDefaultPreloadPaths(): string[] {
  return [
    '/',
    '/services',
    '/services/ai-ml',
    '/services/web3',
    '/services/mobile',
    '/services/web',
    '/about',
    '/contact',
    '/blog'
  ];
}

/**
 * Validate SEO system configuration
 */
export function validateSEOConfig(config: SEOSystemConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  // Validate preload paths
  if (config.preloadPaths) {
    const invalidPaths = config.preloadPaths.filter(path => 
      typeof path !== 'string' || path.length === 0
    );
    
    if (invalidPaths.length > 0) {
      result.errors.push('Invalid preload paths detected');
      result.valid = false;
    }

    if (config.preloadPaths.length > 50) {
      result.warnings.push('Large number of preload paths may impact startup performance');
    }
  }

  // Validate site ID
  if (config.siteId && !/^[a-zA-Z0-9_-]+$/.test(config.siteId)) {
    result.errors.push('Invalid site ID format');
    result.valid = false;
  }

  return result;
}

/**
 * Get SEO system status
 */
export async function getSEOSystemStatus(): Promise<{
  initialized: boolean;
  healthy: boolean;
  components: Record<string, any>;
  uptime: number;
  version: string;
}> {
  const startTime = process.uptime() * 1000; // Convert to milliseconds
  
  try {
    const { checkSEOSystemHealth } = await import('./seo-error-handler');
    const health = await checkSEOSystemHealth();
    
    return {
      initialized: true,
      healthy: health.overall === 'healthy',
      components: health.components,
      uptime: startTime,
      version: '1.0.0' // You can read this from package.json
    };
  } catch (error) {
    return {
      initialized: false,
      healthy: false,
      components: {},
      uptime: startTime,
      version: '1.0.0'
    };
  }
}

/**
 * Monitor SEO system performance
 */
export class SEOSystemMonitor {
  private static instance: SEOSystemMonitor;
  private metrics: Map<string, number> = new Map();
  private startTime: Date = new Date();

  public static getInstance(): SEOSystemMonitor {
    if (!SEOSystemMonitor.instance) {
      SEOSystemMonitor.instance = new SEOSystemMonitor();
    }
    return SEOSystemMonitor.instance;
  }

  public recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  public getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  public reset(): void {
    this.metrics.clear();
    this.startTime = new Date();
  }
}

// Export singleton instance
export const seoSystemMonitor = SEOSystemMonitor.getInstance();