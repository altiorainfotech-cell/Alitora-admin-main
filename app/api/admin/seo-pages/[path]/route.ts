import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import SEOPage from '@/lib/models/SEOPage';
import Redirect from '@/lib/models/Redirect';
import { getPredefinedPageByPath } from '@/lib/data/predefined-pages';
import { updateSeoPageSchema } from '@/lib/validations';
import { validateContentSecurity } from '@/lib/seo-validation';
import { createRedirectSafely } from '@/lib/seo-utils';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{
    path: string;
  }>;
}

// Helper function to decode path parameter
function decodePath(encodedPath: string): string {
  try {
    // Handle multiple levels of encoding
    let decoded = decodeURIComponent(encodedPath);
    
    // If it doesn't start with /, add it (except for home page)
    if (decoded !== 'home' && !decoded.startsWith('/')) {
      decoded = '/' + decoded;
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid path encoding');
  }
}

// GET /api/admin/seo-pages/[path] - Get SEO data for specific page path
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const path = decodePath(resolvedParams.path);
    const siteId = 'altiorainfotech'; // Default site ID
    
    // Verify the path exists in predefined pages
    const predefinedPage = getPredefinedPageByPath(path);
    if (!predefinedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found in predefined pages' },
        { status: 404 }
      );
    }
    
    // Get existing SEO data
    const seoPage = await SEOPage.findOne({ siteId, path })
      .select('-createdBy -updatedBy')
      .lean();
    
    // Combine with predefined data
    const responseData = {
      path,
      slug: seoPage?.slug || predefinedPage.defaultSlug,
      metaTitle: seoPage?.metaTitle || predefinedPage.defaultTitle,
      metaDescription: seoPage?.metaDescription || predefinedPage.defaultDescription,
      robots: seoPage?.robots || 'index,follow',
      isCustom: seoPage?.isCustom || false,
      pageCategory: seoPage?.pageCategory || predefinedPage.category,
      openGraph: seoPage?.openGraph || {},
      hasCustomSeo: !!seoPage,
      predefinedData: {
        defaultTitle: predefinedPage.defaultTitle,
        defaultDescription: predefinedPage.defaultDescription,
        defaultSlug: predefinedPage.defaultSlug,
        category: predefinedPage.category
      },
      updatedAt: seoPage?.updatedAt || null,
      createdAt: seoPage?.createdAt || null
    };
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error: any) {
    console.error('Error fetching SEO page:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch SEO page' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// PUT /api/admin/seo-pages/[path] - Update existing entries by page path
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check permissions - require SEO write permission
    const user = await requirePermission(request, 'seo', 'write');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const path = decodePath(resolvedParams.path);
    const siteId = 'altiorainfotech'; // Default site ID
    
    // Verify the path exists in predefined pages
    const predefinedPage = getPredefinedPageByPath(path);
    if (!predefinedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found in predefined pages' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate input data
    const validatedData = updateSeoPageSchema.parse({
      ...body,
      updatedBy: user.id
    });
    
    // Additional security validation for content fields
    if (validatedData.metaTitle) {
      const titleSecurity = validateContentSecurity(validatedData.metaTitle);
      if (!titleSecurity.isSecure) {
        return NextResponse.json(
          { success: false, error: 'Meta title security validation failed', threats: titleSecurity.threats },
          { status: 400 }
        );
      }
    }
    
    if (validatedData.metaDescription) {
      const descSecurity = validateContentSecurity(validatedData.metaDescription);
      if (!descSecurity.isSecure) {
        return NextResponse.json(
          { success: false, error: 'Meta description security validation failed', threats: descSecurity.threats },
          { status: 400 }
        );
      }
    }
    
    // If slug is being updated, check for uniqueness
    if (validatedData.slug) {
      const existingSlugPage = await SEOPage.findOne({ 
        siteId, 
        slug: validatedData.slug, 
        path: { $ne: path } 
      });
      
      if (existingSlugPage) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists for another page' },
          { status: 400 }
        );
      }
    }
    
    // Find existing SEO page
    let seoPage = await SEOPage.findOne({ siteId, path });
    let isNewPage = false;
    let oldSlug: string | null = null;
    
    if (seoPage) {
      // Store old slug for redirect creation
      if (validatedData.slug && seoPage.slug !== validatedData.slug) {
        oldSlug = seoPage.slug;
      }
      
      // Update existing page
      Object.assign(seoPage, {
        ...validatedData,
        isCustom: true
      });
    } else {
      // Create new page with provided data and defaults
      isNewPage = true;
      seoPage = new SEOPage({
        siteId,
        path,
        slug: validatedData.slug || predefinedPage.defaultSlug,
        metaTitle: validatedData.metaTitle || predefinedPage.defaultTitle,
        metaDescription: validatedData.metaDescription || predefinedPage.defaultDescription,
        robots: validatedData.robots || 'index,follow',
        pageCategory: validatedData.pageCategory || predefinedPage.category,
        openGraph: validatedData.openGraph || {},
        isCustom: true,
        createdBy: user.id,
        updatedBy: user.id
      });
    }
    
    // Save the SEO page
    await seoPage.save();
    
    // Create redirect if slug changed
    let redirectCreated = false;
    if (oldSlug && validatedData.slug && oldSlug !== validatedData.slug) {
      const redirectResult = await createRedirectSafely(
        siteId,
        oldSlug,
        validatedData.slug,
        301,
        user.id
      );
      
      if (redirectResult.success) {
        redirectCreated = true;
        console.log(`Created redirect from ${oldSlug} to ${validatedData.slug}`);
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
    console.error('Error updating SEO page:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update SEO page' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/seo-pages/[path] - Reset pages to default SEO values
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check permissions - require SEO delete permission
    const user = await requirePermission(request, 'seo', 'delete');
    
    await connectToDatabase();
    
    const resolvedParams = await params;
    const path = decodePath(resolvedParams.path);
    const siteId = 'altiorainfotech'; // Default site ID
    
    // Verify the path exists in predefined pages
    const predefinedPage = getPredefinedPageByPath(path);
    if (!predefinedPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found in predefined pages' },
        { status: 404 }
      );
    }
    
    // Find and delete the SEO page
    const deletedPage = await SEOPage.findOneAndDelete({ siteId, path });
    
    if (!deletedPage) {
      return NextResponse.json(
        { success: false, error: 'No custom SEO data found for this page' },
        { status: 404 }
      );
    }
    
    // Return confirmation with default values that will now be used
    return NextResponse.json({
      success: true,
      message: 'SEO page reset to default values successfully',
      data: {
        path,
        resetToDefaults: {
          slug: predefinedPage.defaultSlug,
          metaTitle: predefinedPage.defaultTitle,
          metaDescription: predefinedPage.defaultDescription,
          pageCategory: predefinedPage.category
        },
        deletedCustomData: {
          slug: deletedPage.slug,
          metaTitle: deletedPage.metaTitle,
          metaDescription: deletedPage.metaDescription,
          isCustom: deletedPage.isCustom
        }
      }
    });
  } catch (error: any) {
    console.error('Error deleting SEO page:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset SEO page' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}