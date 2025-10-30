import SEOPage from '@/lib/models/SEOPage';
import { PREDEFINED_PAGES } from '@/lib/data/predefined-pages';
import { connectToDatabase } from '@/lib/mongoose';

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private siteId: string;

  constructor(baseUrl: string, siteId: string = 'altiorainfotech') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.siteId = siteId;
  }

  /**
   * Generate complete sitemap entries
   */
  async generateSitemap(): Promise<SitemapEntry[]> {
    await connectToDatabase();

    // Get all SEO pages from database
    const seoPages = await SEOPage.find({ siteId: this.siteId })
      .select('path slug updatedAt pageCategory')
      .lean();

    // Create a map for quick lookup
    const seoPageMap = new Map(
      seoPages.map((page: any) => [page.path, page])
    );

    // Generate sitemap entries for all predefined pages
    const sitemapEntries: SitemapEntry[] = PREDEFINED_PAGES.map(predefinedPage => {
      const seoPage = seoPageMap.get(predefinedPage.path) as any;
      
      return {
        url: this.buildUrl(predefinedPage.path, seoPage?.slug || predefinedPage.defaultSlug),
        lastModified: seoPage?.updatedAt || new Date(),
        changeFrequency: this.getChangeFrequency(predefinedPage.category),
        priority: this.getPriority(predefinedPage.path, predefinedPage.category)
      };
    });

    // Sort by priority (highest first) and then by URL
    sitemapEntries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.url.localeCompare(b.url);
    });

    return sitemapEntries;
  }

  /**
   * Generate XML sitemap string
   */
  async generateXMLSitemap(): Promise<string> {
    const entries = await this.generateSitemap();
    
    const xmlEntries = entries.map(entry => `
  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  /**
   * Generate sitemap index for large websites
   */
  async generateSitemapIndex(): Promise<string> {
    const entries = await this.generateSitemap();
    const maxEntriesPerSitemap = 50000; // Google's limit
    
    if (entries.length <= maxEntriesPerSitemap) {
      // Single sitemap is sufficient
      return this.generateXMLSitemap();
    }

    // Generate multiple sitemaps
    const sitemapCount = Math.ceil(entries.length / maxEntriesPerSitemap);
    const sitemaps: string[] = [];

    for (let i = 0; i < sitemapCount; i++) {
      const startIndex = i * maxEntriesPerSitemap;
      const endIndex = Math.min(startIndex + maxEntriesPerSitemap, entries.length);
      const sitemapEntries = entries.slice(startIndex, endIndex);
      
      const lastModified = sitemapEntries.reduce((latest, entry) => 
        entry.lastModified > latest ? entry.lastModified : latest, 
        new Date(0)
      );

      sitemaps.push(`
  <sitemap>
    <loc>${this.baseUrl}/sitemap-${i + 1}.xml</loc>
    <lastmod>${lastModified.toISOString().split('T')[0]}</lastmod>
  </sitemap>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('')}
</sitemapindex>`;
  }

  /**
   * Generate specific sitemap chunk for large websites
   */
  async generateSitemapChunk(chunkIndex: number): Promise<string> {
    const entries = await this.generateSitemap();
    const maxEntriesPerSitemap = 50000;
    
    const startIndex = chunkIndex * maxEntriesPerSitemap;
    const endIndex = Math.min(startIndex + maxEntriesPerSitemap, entries.length);
    
    if (startIndex >= entries.length) {
      throw new Error('Sitemap chunk index out of range');
    }

    const chunkEntries = entries.slice(startIndex, endIndex);
    
    const xmlEntries = chunkEntries.map(entry => `
  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  /**
   * Build full URL from path and slug
   */
  private buildUrl(path: string, slug: string): string {
    if (path === '/' || path === '/home') {
      return this.baseUrl;
    }
    
    // For other pages, use the slug if it's different from the default path
    if (slug && slug !== path.replace(/^\//, '').replace(/\//g, '-')) {
      return `${this.baseUrl}/${slug}`;
    }
    
    return `${this.baseUrl}${path}`;
  }

  /**
   * Determine change frequency based on page category
   */
  private getChangeFrequency(category: string): SitemapEntry['changeFrequency'] {
    switch (category) {
      case 'main':
        return 'weekly';
      case 'services':
        return 'monthly';
      case 'blog':
        return 'weekly';
      case 'about':
        return 'monthly';
      case 'contact':
        return 'yearly';
      default:
        return 'monthly';
    }
  }

  /**
   * Determine priority based on path and category
   */
  private getPriority(path: string, category: string): number {
    // Homepage gets highest priority
    if (path === '/' || path === '/home') {
      return 1.0;
    }

    // Main pages get high priority
    if (category === 'main') {
      return 0.9;
    }

    // Services pages get medium-high priority
    if (category === 'services') {
      return 0.8;
    }

    // Blog pages get medium priority
    if (category === 'blog') {
      return 0.7;
    }

    // About and contact pages get lower priority
    if (category === 'about' || category === 'contact') {
      return 0.6;
    }

    // Default priority for other pages
    return 0.5;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  /**
   * Get sitemap statistics
   */
  async getSitemapStats() {
    const entries = await this.generateSitemap();
    
    const categoryStats = entries.reduce((stats, entry) => {
      // Extract category from URL patterns
      let category = 'other';
      if (entry.url === this.baseUrl) {
        category = 'main';
      } else if (entry.url.includes('/services/')) {
        category = 'services';
      } else if (entry.url.includes('/blog/')) {
        category = 'blog';
      } else if (entry.url.includes('/about')) {
        category = 'about';
      } else if (entry.url.includes('/contact')) {
        category = 'contact';
      }
      
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const priorityStats = entries.reduce((stats, entry) => {
      const priorityRange = Math.floor(entry.priority * 10) / 10;
      stats[priorityRange] = (stats[priorityRange] || 0) + 1;
      return stats;
    }, {} as Record<number, number>);

    const lastModified = entries.reduce((latest, entry) => 
      entry.lastModified > latest ? entry.lastModified : latest, 
      new Date(0)
    );

    return {
      totalUrls: entries.length,
      lastModified,
      categoryBreakdown: categoryStats,
      priorityBreakdown: priorityStats,
      averagePriority: entries.reduce((sum, entry) => sum + entry.priority, 0) / entries.length
    };
  }
}