import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import SEOPage from '@/lib/models/SEOPage';
import { PREDEFINED_PAGES } from '@/lib/data/predefined-pages';

// POST /api/admin/seo-pages/seed - Initialize all 57 pages in database
export async function POST(request: NextRequest) {
  try {
    // Check permissions - require SEO write permission
    const user = await requirePermission(request, 'seo', 'write');
    
    await connectToDatabase();
    
    const siteId = 'altiorainfotech'; // Default site ID
    const results = [];
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each predefined page
    for (const predefinedPage of PREDEFINED_PAGES) {
      try {
        // Check if SEO page already exists
        const existingPage = await SEOPage.findOne({ 
          siteId, 
          path: predefinedPage.path 
        });
        
        if (existingPage) {
          results.push({
            path: predefinedPage.path,
            status: 'skipped',
            reason: 'Already exists',
            isCustom: existingPage.isCustom
          });
          skippedCount++;
          continue;
        }
        
        // Create new SEO page with default values
        const seoPage = new SEOPage({
          siteId,
          path: predefinedPage.path,
          slug: predefinedPage.defaultSlug,
          metaTitle: predefinedPage.defaultTitle,
          metaDescription: predefinedPage.defaultDescription,
          robots: 'index,follow',
          isCustom: false, // Mark as default, not custom
          pageCategory: predefinedPage.category,
          createdBy: user.id,
          updatedBy: user.id
        });
        
        await seoPage.save();
        
        results.push({
          path: predefinedPage.path,
          status: 'created',
          slug: seoPage.slug,
          category: seoPage.pageCategory
        });
        createdCount++;
        
      } catch (error: any) {
        console.error(`Error seeding page ${predefinedPage.path}:`, error);
        results.push({
          path: predefinedPage.path,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }
    
    // Get final statistics
    const totalExisting = await SEOPage.countDocuments({ siteId });
    const customPages = await SEOPage.countDocuments({ siteId, isCustom: true });
    
    return NextResponse.json({
      success: true,
      message: `Seeding completed: ${createdCount} created, ${skippedCount} skipped, ${errorCount} errors`,
      data: {
        summary: {
          totalPredefinedPages: PREDEFINED_PAGES.length,
          created: createdCount,
          skipped: skippedCount,
          errors: errorCount,
          totalInDatabase: totalExisting,
          customPages: customPages,
          defaultPages: totalExisting - customPages
        },
        results: results
      }
    });
  } catch (error: any) {
    console.error('Error seeding SEO pages:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed SEO pages' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// GET /api/admin/seo-pages/seed - Get seeding status and statistics
export async function GET(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const siteId = 'altiorainfotech'; // Default site ID
    
    // Get existing SEO pages
    const existingPages = await SEOPage.find({ siteId })
      .select('path isCustom pageCategory createdAt')
      .lean();
    
    // Create a map for quick lookup
    const existingPageMap = new Map(
      existingPages.map((page: any) => [page.path, page])
    );
    
    // Analyze seeding status
    const seedingStatus = PREDEFINED_PAGES.map(predefinedPage => {
      const existing = existingPageMap.get(predefinedPage.path) as any;
      
      return {
        path: predefinedPage.path,
        category: predefinedPage.category,
        isSeeded: !!existing,
        isCustom: existing?.isCustom || false,
        createdAt: existing?.createdAt || null
      };
    });
    
    // Calculate statistics
    const seededPages = seedingStatus.filter(p => p.isSeeded);
    const unseededPages = seedingStatus.filter(p => !p.isSeeded);
    const customPages = seededPages.filter(p => p.isCustom);
    const defaultPages = seededPages.filter(p => !p.isCustom);
    
    // Group by category
    const categoryStats = PREDEFINED_PAGES.reduce((acc, page) => {
      const category = page.category;
      if (!acc[category]) {
        acc[category] = { total: 0, seeded: 0, custom: 0 };
      }
      acc[category].total++;
      
      const existing = existingPageMap.get(page.path) as any;
      if (existing) {
        acc[category].seeded++;
        if (existing.isCustom) {
          acc[category].custom++;
        }
      }
      
      return acc;
    }, {} as Record<string, { total: number; seeded: number; custom: number }>);
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPredefinedPages: PREDEFINED_PAGES.length,
          seededPages: seededPages.length,
          unseededPages: unseededPages.length,
          customPages: customPages.length,
          defaultPages: defaultPages.length,
          seedingProgress: Math.round((seededPages.length / PREDEFINED_PAGES.length) * 100)
        },
        categoryStats,
        seedingStatus: seedingStatus,
        needsSeeding: unseededPages.length > 0,
        recommendations: unseededPages.length > 0 
          ? [`${unseededPages.length} pages need to be seeded`, 'Run POST /api/admin/seo-pages/seed to initialize missing pages']
          : ['All pages are seeded', 'Database is ready for SEO management']
      }
    });
  } catch (error: any) {
    console.error('Error getting seeding status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get seeding status' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}