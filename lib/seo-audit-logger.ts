import SEOAuditLog, { ISEOAuditLog } from '@/lib/models/SEOAuditLog';
import { NextRequest } from 'next/server';

interface AuditLogData {
  siteId: string;
  action: ISEOAuditLog['action'];
  entityType: ISEOAuditLog['entityType'];
  entityId?: string;
  path?: string;
  oldSlug?: string;
  newSlug?: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    bulkOperation?: boolean;
    affectedPaths?: string[];
    redirectCreated?: boolean;
  };
  performedBy: string;
  request?: NextRequest;
}

export class SEOAuditLogger {
  /**
   * Log an SEO-related action
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      const auditLog = new SEOAuditLog({
        siteId: data.siteId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        path: data.path,
        oldSlug: data.oldSlug,
        newSlug: data.newSlug,
        changes: data.changes,
        metadata: {
          ...data.metadata,
          userAgent: data.request?.headers.get('user-agent') || data.metadata?.userAgent,
          ipAddress: data.request?.headers.get('x-forwarded-for') || data.request?.headers.get('x-real-ip') || data.metadata?.ipAddress
        },
        performedBy: data.performedBy,
        performedAt: new Date()
      });

      await auditLog.save();
    } catch (error) {
      console.error('Failed to log SEO audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log SEO page creation
   */
  static async logSEOPageCreate(
    siteId: string,
    path: string,
    seoPageData: any,
    performedBy: string,
    request?: NextRequest
  ): Promise<void> {
    const changes = Object.entries(seoPageData).map(([field, value]) => ({
      field,
      oldValue: null,
      newValue: value
    }));

    await this.log({
      siteId,
      action: 'create',
      entityType: 'seo_page',
      path,
      changes,
      performedBy,
      request
    });
  }

  /**
   * Log SEO page update
   */
  static async logSEOPageUpdate(
    siteId: string,
    path: string,
    oldData: any,
    newData: any,
    performedBy: string,
    request?: NextRequest
  ): Promise<void> {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    // Compare old and new data to identify changes
    const fieldsToTrack = ['metaTitle', 'metaDescription', 'slug', 'robots', 'pageCategory', 'openGraph'];
    
    for (const field of fieldsToTrack) {
      if (oldData[field] !== newData[field]) {
        changes.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field]
        });
      }
    }

    if (changes.length > 0) {
      await this.log({
        siteId,
        action: 'update',
        entityType: 'seo_page',
        path,
        changes,
        performedBy,
        request
      });
    }
  }

  /**
   * Log SEO page deletion/reset
   */
  static async logSEOPageDelete(
    siteId: string,
    path: string,
    seoPageData: any,
    performedBy: string,
    isReset: boolean = false,
    request?: NextRequest
  ): Promise<void> {
    const changes = Object.entries(seoPageData).map(([field, value]) => ({
      field,
      oldValue: value,
      newValue: null
    }));

    await this.log({
      siteId,
      action: isReset ? 'reset' : 'delete',
      entityType: 'seo_page',
      path,
      changes,
      performedBy,
      request
    });
  }

  /**
   * Log slug change and redirect creation
   */
  static async logSlugChange(
    siteId: string,
    path: string,
    oldSlug: string,
    newSlug: string,
    redirectCreated: boolean,
    performedBy: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      siteId,
      action: 'slug_change',
      entityType: 'seo_page',
      path,
      oldSlug,
      newSlug,
      changes: [{
        field: 'slug',
        oldValue: oldSlug,
        newValue: newSlug
      }],
      metadata: {
        redirectCreated
      },
      performedBy,
      request
    });
  }

  /**
   * Log redirect creation
   */
  static async logRedirectCreate(
    siteId: string,
    from: string,
    to: string,
    statusCode: number,
    performedBy: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      siteId,
      action: 'redirect_create',
      entityType: 'redirect',
      changes: [{
        field: 'redirect',
        oldValue: null,
        newValue: { from, to, statusCode }
      }],
      performedBy,
      request
    });
  }

  /**
   * Log bulk operations
   */
  static async logBulkOperation(
    siteId: string,
    action: 'bulk_update' | 'bulk_delete' | 'bulk_reset',
    affectedPaths: string[],
    changes: any,
    performedBy: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      siteId,
      action,
      entityType: 'seo_page',
      changes: [{
        field: 'bulk_operation',
        oldValue: null,
        newValue: changes
      }],
      metadata: {
        bulkOperation: true,
        affectedPaths
      },
      performedBy,
      request
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters: {
    siteId: string;
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    path?: string;
    performedBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const {
      siteId,
      page = 1,
      limit = 50,
      action,
      entityType,
      path,
      performedBy,
      dateFrom,
      dateTo
    } = filters;

    const query: any = { siteId };

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (path) query.path = path;
    if (performedBy) query.performedBy = performedBy;

    if (dateFrom || dateTo) {
      query.performedAt = {};
      if (dateFrom) query.performedAt.$gte = dateFrom;
      if (dateTo) query.performedAt.$lte = dateTo;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      SEOAuditLog.find(query)
        .populate('performedBy', 'email role')
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SEOAuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(siteId: string, days: number = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const stats = await SEOAuditLog.aggregate([
      {
        $match: {
          siteId,
          performedAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalChanges = await SEOAuditLog.countDocuments({
      siteId,
      performedAt: { $gte: dateFrom }
    });

    const uniquePages = await SEOAuditLog.distinct('path', {
      siteId,
      performedAt: { $gte: dateFrom }
    });

    const topUsers = await SEOAuditLog.aggregate([
      {
        $match: {
          siteId,
          performedAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$performedBy',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'adminusers',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    return {
      totalChanges,
      uniquePagesModified: uniquePages.length,
      actionBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      topUsers: topUsers.map(user => ({
        userId: user._id,
        email: user.user[0]?.email || 'Unknown',
        changeCount: user.count
      }))
    };
  }
}