import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import { SEOAuditLogger } from '@/lib/seo-audit-logger';
import { z } from 'zod';

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().optional(),
  entityType: z.enum(['seo_page', 'redirect']).optional(),
  path: z.string().optional(),
  performedBy: z.string().optional(),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  siteId: z.string().default('altiorainfotech')
});

// GET /api/admin/seo-pages/audit-logs - Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const queryParams = auditLogQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      action: searchParams.get('action'),
      entityType: searchParams.get('entityType'),
      path: searchParams.get('path'),
      performedBy: searchParams.get('performedBy'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      siteId: searchParams.get('siteId')
    });
    
    const result = await SEOAuditLogger.getAuditLogs(queryParams);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// GET /api/admin/seo-pages/audit-logs/stats - Get audit statistics
export async function POST(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const body = await request.json();
    const { siteId = 'altiorainfotech', days = 30 } = body;
    
    const stats = await SEOAuditLogger.getAuditStats(siteId, days);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching audit stats:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit statistics' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}