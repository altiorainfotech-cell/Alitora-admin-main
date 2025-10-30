import { NextRequest, NextResponse } from 'next/server';
import { SitemapGenerator } from '@/lib/sitemap-generator';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chunk: string }> }
) {
  try {
    // Await params since it's now a Promise
    const { chunk } = await params;
    
    // Parse chunk number from params
    const chunkNumber = parseInt(chunk, 10);
    
    if (isNaN(chunkNumber) || chunkNumber < 1) {
      return new NextResponse('Invalid chunk number', { status: 400 });
    }

    // Get the base URL from the request
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const sitemapGenerator = new SitemapGenerator(baseUrl);
    
    // Generate specific sitemap chunk (convert to 0-based index)
    const xmlContent = await sitemapGenerator.generateSitemapChunk(chunkNumber - 1);

    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error('Error generating sitemap chunk:', error);
    
    if (error.message.includes('out of range')) {
      return new NextResponse('Sitemap chunk not found', { status: 404 });
    }
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap chunk</error>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}