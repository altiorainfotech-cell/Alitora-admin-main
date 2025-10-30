import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import { SitemapGenerator } from '@/lib/sitemap-generator';
import { headers } from 'next/headers';

// GET /api/admin/seo-pages/sitemap - Get sitemap information and statistics
export async function GET(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    // Get the base URL from the request
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const sitemapGenerator = new SitemapGenerator(baseUrl);
    
    // Get sitemap statistics
    const stats = await sitemapGenerator.getSitemapStats();
    
    // Get sitemap entries for preview
    const entries = await sitemapGenerator.generateSitemap();
    const previewEntries = entries.slice(0, 10); // First 10 entries for preview
    
    // Determine if sitemap index is needed
    const maxEntriesPerSitemap = 50000;
    const needsSitemapIndex = entries.length > maxEntriesPerSitemap;
    const sitemapCount = Math.ceil(entries.length / maxEntriesPerSitemap);
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        previewEntries: previewEntries.map(entry => ({
          url: entry.url,
          lastModified: entry.lastModified,
          changeFrequency: entry.changeFrequency,
          priority: entry.priority
        })),
        sitemapInfo: {
          totalEntries: entries.length,
          needsSitemapIndex,
          sitemapCount,
          sitemapUrls: needsSitemapIndex 
            ? Array.from({ length: sitemapCount }, (_, i) => `${baseUrl}/sitemap-${i + 1}.xml`)
            : [`${baseUrl}/sitemap.xml`],
          indexUrl: needsSitemapIndex ? `${baseUrl}/sitemap.xml` : null
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting sitemap info:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get sitemap information' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// POST /api/admin/seo-pages/sitemap - Generate and download sitemap
export async function POST(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const body = await request.json();
    const { format = 'xml', chunk } = body;
    
    // Get the base URL from the request
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const sitemapGenerator = new SitemapGenerator(baseUrl);
    
    if (format === 'xml') {
      let xmlContent: string;
      
      if (typeof chunk === 'number') {
        // Generate specific chunk
        xmlContent = await sitemapGenerator.generateSitemapChunk(chunk);
      } else {
        // Generate complete sitemap or sitemap index
        const entries = await sitemapGenerator.generateSitemap();
        const maxEntriesPerSitemap = 50000;
        
        if (entries.length <= maxEntriesPerSitemap) {
          xmlContent = await sitemapGenerator.generateXMLSitemap();
        } else {
          xmlContent = await sitemapGenerator.generateSitemapIndex();
        }
      }
      
      return new NextResponse(xmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="sitemap${chunk ? `-${chunk + 1}` : ''}.xml"`,
        },
      });
    } else if (format === 'json') {
      // Return sitemap data as JSON
      const entries = await sitemapGenerator.generateSitemap();
      
      return NextResponse.json({
        success: true,
        data: {
          sitemap: entries,
          generatedAt: new Date().toISOString(),
          totalEntries: entries.length
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use "xml" or "json"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error generating sitemap:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate sitemap' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}