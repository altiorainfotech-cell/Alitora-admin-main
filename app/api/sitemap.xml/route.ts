import { NextRequest, NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/sitemap-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the base URL from the request URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const sitemapGenerator = new SitemapGenerator(baseUrl);
    
    // Check if we need sitemap index or single sitemap
    const entries = await sitemapGenerator.generateSitemap();
    const maxEntriesPerSitemap = 50000;
    
    let xmlContent: string;
    
    if (entries.length <= maxEntriesPerSitemap) {
      // Generate single sitemap
      xmlContent = await sitemapGenerator.generateXMLSitemap();
    } else {
      // Generate sitemap index
      xmlContent = await sitemapGenerator.generateSitemapIndex();
    }

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap</error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}