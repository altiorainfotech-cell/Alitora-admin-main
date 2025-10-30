import { NextRequest, NextResponse } from 'next/server';
import { checkSEOSystemHealth } from '@/lib/seo-error-handler';
import { logger } from '@/lib/logger';

/**
 * SEO System Health Check API
 * Provides health status for all SEO system components
 */

export async function GET(request: NextRequest) {
  try {
    const health = await checkSEOSystemHealth();
    
    // Log health check
    logger.info('SEO system health check:', {
      overall: health.overall,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // Return appropriate HTTP status based on health
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 207 : 503;
    
    return NextResponse.json({
      success: true,
      data: {
        status: health.overall,
        timestamp: new Date().toISOString(),
        components: health.components,
        recommendations: health.recommendations
      }
    }, { status: statusCode });
    
  } catch (error) {
    logger.error('Error in SEO health check:', { error });
    
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Detailed health check with metrics
 */
export async function POST(request: NextRequest) {
  try {
    const { includeMetrics = false } = await request.json().catch(() => ({}));
    
    const health = await checkSEOSystemHealth();
    
    const response: any = {
      success: true,
      data: {
        status: health.overall,
        timestamp: new Date().toISOString(),
        components: health.components,
        recommendations: health.recommendations
      }
    };
    
    if (includeMetrics) {
      // Add performance metrics if requested
      const { seoErrorHandler, seoCircuitBreaker } = await import('@/lib/seo-error-handler');
      
      response.data.metrics = {
        errorHandler: seoErrorHandler.getSystemHealth(),
        circuitBreaker: seoCircuitBreaker.getState()
      };
    }
    
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 207 : 503;
    
    return NextResponse.json(response, { status: statusCode });
    
  } catch (error) {
    logger.error('Error in detailed SEO health check:', { error });
    
    return NextResponse.json({
      success: false,
      error: 'Detailed health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}