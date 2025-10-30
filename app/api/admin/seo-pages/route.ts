import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import SEOPage from '@/lib/models/SEOPage';
import Redirect from '@/lib/models/Redirect';
import { PREDEFINED_PAGES, getPredefinedPageByPath } from '@/lib/data/predefined-pages';
import { 
  seoPageSchema, 
  seoPageQuerySchema, 
  bulkSeoOperationSchema,
  sanitizeString 
} from '@/lib/validations';
import { 
  enhancedSeoPageSchema, 
  enhancedBulkSeoOperationSchema,
  validateContentSecurity,
  validateBulkOperationLimits
} from '@/lib/seo-validation';
import { createRedirectSafely } from '@/lib/seo-utils';
import { SEOAuditLogger } from '@/lib/seo-audit-logger';
import { SEOCache } from '@/lib/seo-cache';
import { SEOPerformanceMonitor } from '@/lib/seo-performance-monitor';
import { z } from 'zod';

// GET /api/admin/seo-pages - List all 57 pages with SEO status
export async function GET(request: NextRequest) {
  return SEOPerformanceMonitor.monitorAPIEndpoint('seo-pages-list', async () => {
    try {
      // Check permissions - require SEO read permission
      const user = await requirePermission(request, 'seo', 'read');
      
      await connectToDatabase();
      
      const { searchParams } = new URL(request.url);
      const queryParams = seoPageQuerySchema.parse({
        page: searchParams.get('page') || undefined,
        limit: searchParams.get('limit') || undefined,
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        isCustom: searchParams.get('isCustom') || undefined,
        siteId: searchParams.get('siteId') || undefined
      });
      
      const { page, limit, search, category, isCustom, siteId } = queryParams;
      
      // Check cache first (unless bypassed)
      const queryHash = SEOCache.generateQueryHash(queryParams);
      if (!SEOCache.shouldBypassCache(request)) {
        const cachedResult = SEOCache.getCachedSEOList(siteId, queryHash);
        if (cachedResult) {
          return NextResponse.json(cachedResult, {
            headers: SEOCache.getCacheHeaders(1800) // 30 minutes
          });
        }
      }
    
    // Get all existing SEO pages from database with performance monitoring
    const existingSeoPages = await SEOPerformanceMonitor.monitorQuery(
      'find_seo_pages',
      () => SEOPage.find({ siteId })
        .select('path slug metaTitle metaDescription isCustom pageCategory updatedAt')
        .lean()
    ) as any[];
    
    // Create a map for quick lookup
    const seoPageMap = new Map(
      existingSeoPages.map(page => [page.path, page])
    );
    
    // Combine predefined pages with existing SEO data
    let allPages = PREDEFINED_PAGES.map(predefinedPage => {
      const existingSeo = seoPageMap.get(predefinedPage.path);
      
      return {
        path: predefinedPage.path,
        slug: existingSeo?.slug || predefinedPage.defaultSlug,
        metaTitle: existingSeo?.metaTitle || predefinedPage.defaultTitle,
        metaDescription: existingSeo?.metaDescription || predefinedPage.defaultDescription,
        isCustom: existingSeo?.isCustom || false,
        pageCategory: existingSeo?.pageCategory || predefinedPage.category,
        updatedAt: existingSeo?.updatedAt || null,
        hasCustomSeo: !!existingSeo,
        defaultTitle: predefinedPage.defaultTitle,
        defaultDescription: predefinedPage.defaultDescription,
        defaultSlug: predefinedPage.defaultSlug
      };
    });
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      allPages = allPages.filter(page => 
        page.path.toLowerCase().includes(searchLower) ||
        page.metaTitle.toLowerCase().includes(searchLower) ||
        page.metaDescription.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
      );
    }
    
    if (category) {
      allPages = allPages.filter(page => page.pageCategory === category);
    }
    
    if (typeof isCustom === 'boolean') {
      allPages = allPages.filter(page => page.isCustom === isCustom);
    }
    
    // Sort by path for consistent ordering
    allPages.sort((a, b) => a.path.localeCompare(b.path));
    
    // Apply pagination
    const total = allPages.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPages = allPages.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(total / limit);
    
    const result = {
      success: true,
      data: {
        pages: paginatedPages,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary: {
          totalPages: PREDEFINED_PAGES.length,
          customPages: existingSeoPages.filter(p => p.isCustom).length,
          defaultPages: PREDEFINED_PAGES.length - existingSeoPages.filter(p => p.isCustom).length
        }
      }
    };
    
    // Cache the result
    SEOCache.cacheSEOList(siteId, queryHash, result, 1800); // 30 minutes
    
    return NextResponse.json(result, {
      headers: SEOCache.getCacheHeaders(1800)
    });
    } catch (error: any) {
      console.error('Error fetching SEO pages:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch SEO pages' },
        { status: error.message?.includes('Access denied') ? 403 : 500 }
      );
    }
  }, request);
}

// POST /api/admin/seo-pages - Create/update SEO data for specific pages
export async function POST(request: NextRequest) {
  return SEOPerformanceMonitor.monitorAPIEndpoint('seo-pages-create-update', async () => {
    try {
      // Check permissions - require SEO write permission
      const user = await requirePermission(request, 'seo', 'write');
    
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate input data with enhanced security
    const validatedData = enhancedSeoPageSchema.parse({
      ...body,
      createdBy: user.id,
      updatedBy: user.id
    });
    
    // Additional security validation
    const titleSecurity = validateContentSecurity(validatedData.metaTitle);
    const descSecurity = validateContentSecurity(validatedData.metaDescription);
    
    if (!titleSecurity.isSecure || !descSecurity.isSecure) {
      const threats = [...titleSecurity.threats, ...descSecurity.threats];
      return NextResponse.json(
        { success: false, error: 'Content security validation failed', threats },
        { status: 400 }
      );
    }
    
    const { path, slug, siteId } = validatedData;
    
    // Verify the path exists in predefined pages
    const predefinedPage = getPredefinedPageByPath(path);
    if (!predefinedPage) {
      return NextResponse.json(
        { success: false, error: 'Invalid page path. Path must be one of the predefined website pages.' },
        { status: 400 }
      );
    }
    
    // Check if slug is unique (excluding current page)
    const existingSlugPage = await SEOPage.findOne({ 
      siteId, 
      slug, 
      path: { $ne: path } 
    });
    
    if (existingSlugPage) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists for another page' },
        { status: 400 }
      );
    }
    
    // Find existing SEO page or create new one with performance monitoring
    let seoPage = await SEOPerformanceMonitor.monitorQuery(
      'find_seo_page_by_path',
      () => SEOPage.findOne({ siteId, path })
    ) as any;
    let isNewPage = false;
    let oldSlug: string | null = null;
    let oldData: any = null;
    
    if (seoPage) {
      // Store old data for audit logging
      oldData = {
        metaTitle: seoPage.metaTitle,
        metaDescription: seoPage.metaDescription,
        slug: seoPage.slug,
        robots: seoPage.robots,
        pageCategory: seoPage.pageCategory,
        openGraph: seoPage.openGraph
      };
      
      // Store old slug for redirect creation
      oldSlug = seoPage.slug !== slug ? seoPage.slug : null;
      
      // Update existing page
      Object.assign(seoPage, {
        ...validatedData,
        updatedBy: user.id,
        isCustom: true
      });
    } else {
      // Create new page
      isNewPage = true;
      seoPage = new SEOPage({
        ...validatedData,
        pageCategory: predefinedPage.category,
        isCustom: true
      });
    }
    
    // Save the SEO page with performance monitoring
    await SEOPerformanceMonitor.monitorQuery(
      'save_seo_page',
      () => seoPage.save()
    );
    
    // Invalidate related caches
    SEOCache.invalidateSEOPage(siteId, path);
    
    // Log the audit trail
    if (isNewPage) {
      await SEOAuditLogger.logSEOPageCreate(
        siteId,
        path,
        {
          metaTitle: seoPage.metaTitle,
          metaDescription: seoPage.metaDescription,
          slug: seoPage.slug,
          robots: seoPage.robots,
          pageCategory: seoPage.pageCategory,
          openGraph: seoPage.openGraph
        },
        user.id,
        request
      );
    } else {
      await SEOAuditLogger.logSEOPageUpdate(
        siteId,
        path,
        oldData,
        {
          metaTitle: seoPage.metaTitle,
          metaDescription: seoPage.metaDescription,
          slug: seoPage.slug,
          robots: seoPage.robots,
          pageCategory: seoPage.pageCategory,
          openGraph: seoPage.openGraph
        },
        user.id,
        request
      );
    }
    
    // Create redirect if slug changed
    let redirectCreated = false;
    if (oldSlug && oldSlug !== slug) {
      const redirectResult = await createRedirectSafely(
        siteId,
        oldSlug,
        slug,
        301,
        user.id
      );
      
      if (redirectResult.success) {
        redirectCreated = true;
        console.log(`Created redirect from ${oldSlug} to ${slug}`);
        
        // Log slug change and redirect creation
        await SEOAuditLogger.logSlugChange(
          siteId,
          path,
          oldSlug,
          slug,
          true,
          user.id,
          request
        );
        
        await SEOAuditLogger.logRedirectCreate(
          siteId,
          oldSlug,
          slug,
          301,
          user.id,
          request
        );
      } else {
        console.error('Error creating redirect:', redirectResult.error);
      }
    }
    
    // Return the saved page without sensitive data
    const responseData = {
      _id: seoPage._id,
      siteId: seoPage.siteId,
      path: seoPage.path,
      slug: seoPage.slug,
      metaTitle: seoPage.metaTitle,
      metaDescription: seoPage.metaDescription,
      robots: seoPage.robots,
      isCustom: seoPage.isCustom,
      pageCategory: seoPage.pageCategory,
      openGraph: seoPage.openGraph,
      createdAt: seoPage.createdAt,
      updatedAt: seoPage.updatedAt
    };
    
    return NextResponse.json({
      success: true,
      data: responseData,
      message: isNewPage ? 'SEO page created successfully' : 'SEO page updated successfully',
      redirectCreated
    });
    } catch (error: any) {
      console.error('Error creating/updating SEO page:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to create/update SEO page' },
        { status: error.message?.includes('Access denied') ? 403 : 500 }
      );
    }
  }, request);
}

// PUT /api/admin/seo-pages (bulk operations)
export async function PUT(request: NextRequest) {
  try {
    // Check permissions - require SEO write permission
    const user = await requirePermission(request, 'seo', 'write');
    
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate bulk operation data with enhanced security
    const validatedData = enhancedBulkSeoOperationSchema.parse({
      ...body,
      updatedBy: user.id
    });
    
    // Check bulk operation limits based on user role
    const limitCheck = validateBulkOperationLimits(
      validatedData.operation,
      validatedData.paths.length,
      user.role
    );
    
    if (!limitCheck.isValid) {
      return NextResponse.json(
        { success: false, error: limitCheck.error },
        { status: 400 }
      );
    }
    
    const { operation, paths, data, updatedBy } = validatedData;
    const siteId = 'altiorainfotech'; // Default site ID
    
    // Verify all paths exist in predefined pages
    const invalidPaths = paths.filter(path => !getPredefinedPageByPath(path));
    if (invalidPaths.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid paths: ${invalidPaths.join(', ')}` },
        { status: 400 }
      );
    }
    
    let results = [];
    
    switch (operation) {
      case 'update':
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Data is required for update operation' },
            { status: 400 }
          );
        }
        
        for (const path of paths) {
          try {
            const predefinedPage = getPredefinedPageByPath(path)!;
            
            let seoPage = await SEOPage.findOne({ siteId, path });
            
            if (seoPage) {
              // Update existing page
              Object.assign(seoPage, {
                ...data,
                updatedBy,
                isCustom: true
              });
              await seoPage.save();
            } else {
              // Create new page with bulk data
              seoPage = new SEOPage({
                siteId,
                path,
                slug: predefinedPage.defaultSlug,
                metaTitle: data.metaTitle || predefinedPage.defaultTitle,
                metaDescription: data.metaDescription || predefinedPage.defaultDescription,
                robots: data.robots || 'index,follow',
                pageCategory: data.pageCategory || predefinedPage.category,
                isCustom: true,
                createdBy: updatedBy,
                updatedBy
              });
              await seoPage.save();
            }
            
            results.push({ path, success: true });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'delete':
        for (const path of paths) {
          try {
            const deleted = await SEOPage.findOneAndDelete({ siteId, path });
            results.push({ 
              path, 
              success: true, 
              deleted: !!deleted 
            });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'reset':
        for (const path of paths) {
          try {
            const deleted = await SEOPage.findOneAndDelete({ siteId, path });
            results.push({ 
              path, 
              success: true, 
              reset: true,
              hadCustomData: !!deleted
            });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'export':
        try {
          const exportData = [];
          for (const path of paths) {
            const seoPage = await SEOPage.findOne({ siteId, path });
            const predefinedPage = getPredefinedPageByPath(path);
            
            exportData.push({
              path,
              slug: seoPage?.slug || predefinedPage?.defaultSlug || '',
              metaTitle: seoPage?.metaTitle || predefinedPage?.defaultTitle || '',
              metaDescription: seoPage?.metaDescription || predefinedPage?.defaultDescription || '',
              robots: seoPage?.robots || 'index,follow',
              pageCategory: seoPage?.pageCategory || predefinedPage?.category || 'other',
              isCustom: seoPage?.isCustom || false,
              openGraph: seoPage?.openGraph || {},
              updatedAt: seoPage?.updatedAt || null
            });
          }
          
          return NextResponse.json({
            success: true,
            data: {
              operation: 'export',
              exportData,
              format: validatedData.exportFormat || 'json',
              exportedAt: new Date().toISOString(),
              totalItems: exportData.length
            },
            message: `Exported ${exportData.length} SEO entries`
          });
        } catch (error: any) {
          return NextResponse.json(
            { success: false, error: `Export failed: ${error.message}` },
            { status: 500 }
          );
        }
        
      case 'import':
        if (!validatedData.importData || validatedData.importData.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Import data is required for import operation' },
            { status: 400 }
          );
        }
        
        for (const importItem of validatedData.importData) {
          try {
            const predefinedPage = getPredefinedPageByPath(importItem.path);
            if (!predefinedPage) {
              results.push({ 
                path: importItem.path, 
                success: false, 
                error: 'Invalid page path' 
              });
              continue;
            }
            
            let seoPage = await SEOPage.findOne({ siteId, path: importItem.path });
            
            if (seoPage) {
              // Update existing page
              Object.assign(seoPage, {
                metaTitle: importItem.metaTitle || seoPage.metaTitle,
                metaDescription: importItem.metaDescription || seoPage.metaDescription,
                robots: importItem.robots || seoPage.robots,
                pageCategory: importItem.pageCategory || seoPage.pageCategory,
                updatedBy,
                isCustom: true
              });
              await seoPage.save();
            } else {
              // Create new page
              seoPage = new SEOPage({
                siteId,
                path: importItem.path,
                slug: predefinedPage.defaultSlug,
                metaTitle: importItem.metaTitle || predefinedPage.defaultTitle,
                metaDescription: importItem.metaDescription || predefinedPage.defaultDescription,
                robots: importItem.robots || 'index,follow',
                pageCategory: importItem.pageCategory || predefinedPage.category,
                isCustom: true,
                createdBy: updatedBy,
                updatedBy
              });
              await seoPage.save();
            }
            
            results.push({ path: importItem.path, success: true, imported: true });
          } catch (error: any) {
            results.push({ 
              path: importItem.path, 
              success: false, 
              error: error.message 
            });
          }
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return NextResponse.json({
      success: true,
      data: {
        operation,
        results,
        summary: {
          total: paths.length,
          successful: successCount,
          failed: failureCount
        }
      },
      message: `Bulk ${operation} completed: ${successCount} successful, ${failureCount} failed`
    });
  } catch (error: any) {
    console.error('Error performing bulk SEO operation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to perform bulk operation' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}