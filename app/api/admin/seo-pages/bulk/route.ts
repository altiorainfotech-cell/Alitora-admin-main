import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import SEOPage from '@/lib/models/SEOPage';
import { PREDEFINED_PAGES, getPredefinedPageByPath } from '@/lib/data/predefined-pages';
import { 
  enhancedBulkSeoOperationSchema,
  validateContentSecurity,
  validateBulkOperationLimits
} from '@/lib/seo-validation';
import { SEOAuditLogger } from '@/lib/seo-audit-logger';
import { z } from 'zod';

// POST /api/admin/seo-pages/bulk - Enhanced bulk operations
export async function POST(request: NextRequest) {
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
      validatedData.paths?.length || validatedData.importData?.length || 0,
      user.role
    );
    
    if (!limitCheck.isValid) {
      return NextResponse.json(
        { success: false, error: limitCheck.error },
        { status: 400 }
      );
    }
    
    const { operation, paths, data, updatedBy, exportFormat, importData } = validatedData;
    const siteId = 'altiorainfotech'; // Default site ID
    
    let results: any[] = [];
    
    switch (operation) {
      case 'update':
        if (!data || !paths) {
          return NextResponse.json(
            { success: false, error: 'Data and paths are required for update operation' },
            { status: 400 }
          );
        }
        
        // Validate content security for bulk data
        if (data.metaTitle) {
          const titleSecurity = validateContentSecurity(data.metaTitle);
          if (!titleSecurity.isSecure) {
            return NextResponse.json(
              { success: false, error: 'Meta title security validation failed', threats: titleSecurity.threats },
              { status: 400 }
            );
          }
        }
        
        if (data.metaDescription) {
          const descSecurity = validateContentSecurity(data.metaDescription);
          if (!descSecurity.isSecure) {
            return NextResponse.json(
              { success: false, error: 'Meta description security validation failed', threats: descSecurity.threats },
              { status: 400 }
            );
          }
        }
        
        // Verify all paths exist in predefined pages
        const invalidPaths = paths.filter(path => !getPredefinedPageByPath(path));
        if (invalidPaths.length > 0) {
          return NextResponse.json(
            { success: false, error: `Invalid paths: ${invalidPaths.join(', ')}` },
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
                openGraph: data.openGraph || {},
                isCustom: true,
                createdBy: updatedBy,
                updatedBy
              });
              await seoPage.save();
            }
            
            results.push({ path, success: true, action: 'updated' });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'delete':
        if (!paths) {
          return NextResponse.json(
            { success: false, error: 'Paths are required for delete operation' },
            { status: 400 }
          );
        }
        
        for (const path of paths) {
          try {
            const deleted = await SEOPage.findOneAndDelete({ siteId, path });
            results.push({ 
              path, 
              success: true, 
              action: 'deleted',
              deleted: !!deleted 
            });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'reset':
        if (!paths) {
          return NextResponse.json(
            { success: false, error: 'Paths are required for reset operation' },
            { status: 400 }
          );
        }
        
        for (const path of paths) {
          try {
            const deleted = await SEOPage.findOneAndDelete({ siteId, path });
            results.push({ 
              path, 
              success: true, 
              action: 'reset',
              hadCustomData: !!deleted
            });
          } catch (error: any) {
            results.push({ path, success: false, error: error.message });
          }
        }
        break;
        
      case 'export':
        if (!paths) {
          return NextResponse.json(
            { success: false, error: 'Paths are required for export operation' },
            { status: 400 }
          );
        }
        
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
          
          // Format data based on export format
          let formattedData: any = exportData;
          if (exportFormat === 'csv') {
            // Convert to CSV format
            const csvHeaders = ['path', 'slug', 'metaTitle', 'metaDescription', 'robots', 'pageCategory', 'isCustom', 'updatedAt'];
            const csvRows = exportData.map(item => [
              item.path,
              item.slug,
              `"${item.metaTitle.replace(/"/g, '""')}"`,
              `"${item.metaDescription.replace(/"/g, '""')}"`,
              item.robots,
              item.pageCategory,
              item.isCustom,
              item.updatedAt || ''
            ]);
            
            formattedData = [csvHeaders, ...csvRows];
          }
          
          return NextResponse.json({
            success: true,
            data: {
              operation: 'export',
              exportData: formattedData,
              format: exportFormat || 'json',
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
        if (!importData || importData.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Import data is required for import operation' },
            { status: 400 }
          );
        }
        
        // Validate content security for all import items
        for (const importItem of importData) {
          if (importItem.metaTitle) {
            const titleSecurity = validateContentSecurity(importItem.metaTitle);
            if (!titleSecurity.isSecure) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Meta title security validation failed for path ${importItem.path}`, 
                  threats: titleSecurity.threats 
                },
                { status: 400 }
              );
            }
          }
          
          if (importItem.metaDescription) {
            const descSecurity = validateContentSecurity(importItem.metaDescription);
            if (!descSecurity.isSecure) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Meta description security validation failed for path ${importItem.path}`, 
                  threats: descSecurity.threats 
                },
                { status: 400 }
              );
            }
          }
        }
        
        for (const importItem of importData) {
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
            
            results.push({ path: importItem.path, success: true, action: 'imported' });
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
    
    // Log bulk operation
    if (successCount > 0) {
      const successfulPaths = results.filter(r => r.success).map(r => r.path);
      let auditAction: 'bulk_update' | 'bulk_delete' | 'bulk_reset';
      
      switch (operation) {
        case 'update':
          auditAction = 'bulk_update';
          break;
        case 'delete':
          auditAction = 'bulk_delete';
          break;
        case 'reset':
          auditAction = 'bulk_reset';
          break;
        default:
          auditAction = 'bulk_update';
      }
      
      if (operation !== 'import') {
        await SEOAuditLogger.logBulkOperation(
          siteId,
          auditAction,
          successfulPaths,
          operation === 'update' ? data : { operation },
          updatedBy,
          request
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        operation,
        results,
        summary: {
          total: results.length,
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