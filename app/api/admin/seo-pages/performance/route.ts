import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permission-middleware';
import { SEOPerformanceMonitor } from '@/lib/seo-performance-monitor';
import { SEOCache } from '@/lib/seo-cache';

// GET /api/admin/seo-pages/performance - Get performance statistics
export async function GET(request: NextRequest) {
  try {
    // Check permissions - require admin access
    const user = await requirePermission(request, 'seo', 'read');
    
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '60', 10);
    
    // Get performance statistics
    const stats = SEOPerformanceMonitor.getStats(timeWindow);
    const slowOperations = SEOPerformanceMonitor.getSlowOperations(500, 10);
    const recommendations = SEOPerformanceMonitor.getRecommendations();
    const cacheStats = SEOCache.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        timeWindow,
        performance: stats,
        slowOperations,
        recommendations,
        cache: cacheStats,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting performance stats:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get performance statistics' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// POST /api/admin/seo-pages/performance - Performance management actions
export async function POST(request: NextRequest) {
  try {
    // Check permissions - require admin access
    const user = await requirePermission(request, 'seo', 'write');
    
    const body = await request.json();
    const { action, siteId } = body;
    
    switch (action) {
      case 'clear_cache':
        if (siteId) {
          SEOCache.invalidateAll(siteId);
        } else {
          SEOCache.clearAll();
        }
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });
        
      case 'clear_metrics':
        SEOPerformanceMonitor.clear();
        return NextResponse.json({
          success: true,
          message: 'Performance metrics cleared successfully'
        });
        
      case 'warmup_cache':
        if (!siteId) {
          return NextResponse.json(
            { success: false, error: 'Site ID is required for cache warmup' },
            { status: 400 }
          );
        }
        await SEOCache.warmupCache(siteId);
        return NextResponse.json({
          success: true,
          message: 'Cache warmup initiated'
        });
        
      case 'export_metrics':
        const exportData = SEOPerformanceMonitor.exportData();
        return NextResponse.json({
          success: true,
          data: exportData
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error performing performance action:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform performance action' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}