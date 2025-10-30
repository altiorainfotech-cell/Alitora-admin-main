import { Metadata } from 'next';
import { getSEOMetadata, SEOMetadata } from './seo-data-service';
import { logger } from './logger';

/**
 * Metadata Generator for Next.js Pages
 * Generates dynamic metadata based on SEO data from the database
 */

export interface MetadataGeneratorOptions {
  path: string;
  siteId?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  images?: string[];
  canonical?: string;
}

/**
 * Generate metadata for a Next.js page
 * This function should be used in page components' generateMetadata export
 */
export async function generatePageMetadata(
  options: MetadataGeneratorOptions
): Promise<Metadata> {
  const {
    path,
    siteId = 'altiorainfotech',
    fallbackTitle,
    fallbackDescription,
    images = [],
    canonical
  } = options;

  try {
    // Fetch SEO metadata from database
    const seoData = await getSEOMetadata(path, siteId);
    
    // Build base metadata
    const metadata: Metadata = {
      title: seoData.title || fallbackTitle || 'Altiora Infotech',
      description: seoData.description || fallbackDescription || 'Leading technology solutions',
      robots: seoData.robots || 'index,follow',
      
      // Canonical URL
      alternates: canonical ? {
        canonical: canonical
      } : undefined,
      
      // OpenGraph metadata
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: canonical || `${getBaseUrl()}${path}`,
        siteName: 'Altiora Infotech',
        title: seoData.openGraph?.title || seoData.title || fallbackTitle || 'Altiora Infotech',
        description: seoData.openGraph?.description || seoData.description || fallbackDescription || 'Leading technology solutions',
        images: [
          ...(seoData.openGraph?.image ? [seoData.openGraph.image] : []),
          ...images,
          // Default fallback image
          'https://altiorainfotech.com/og-default.jpg'
        ].filter(Boolean)
      },
      
      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: seoData.openGraph?.title || seoData.title || fallbackTitle || 'Altiora Infotech',
        description: seoData.openGraph?.description || seoData.description || fallbackDescription || 'Leading technology solutions',
        images: [
          ...(seoData.openGraph?.image ? [seoData.openGraph.image] : []),
          ...images,
          'https://altiorainfotech.com/og-default.jpg'
        ].filter(Boolean)
      },
      
      // Additional metadata
      keywords: generateKeywords(path, seoData),
      authors: [{ name: 'Altiora Infotech' }],
      creator: 'Altiora Infotech',
      publisher: 'Altiora Infotech',
      
      // Structured data will be handled separately
      other: {
        'og:site_name': 'Altiora Infotech',
        'og:locale': 'en_US'
      }
    };
    
    return metadata;
    
  } catch (error) {
    logger.error('Error generating metadata:', { path, siteId, error });
    
    // Return fallback metadata on error
    return getFallbackMetadata(options);
  }
}

/**
 * Generate structured data (JSON-LD) for a page
 */
export function generateStructuredData(
  path: string,
  seoData: SEOMetadata,
  options: {
    type?: 'WebPage' | 'Article' | 'Service' | 'Organization';
    datePublished?: string;
    dateModified?: string;
    author?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
  } = {}
): object {
  const {
    type = 'WebPage',
    datePublished,
    dateModified,
    author,
    breadcrumbs
  } = options;

  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${path}`;
  
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': type,
    name: seoData.title,
    description: seoData.description,
    url: fullUrl,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Altiora Infotech',
      url: baseUrl
    }
  };
  
  // Add image if available
  if (seoData.openGraph?.image) {
    structuredData.image = seoData.openGraph.image;
  }
  
  // Add dates for articles
  if (type === 'Article' && (datePublished || dateModified)) {
    if (datePublished) structuredData.datePublished = datePublished;
    if (dateModified) structuredData.dateModified = dateModified;
    if (author) {
      structuredData.author = {
        '@type': 'Person',
        name: author
      };
    }
  }
  
  // Add organization for service pages
  if (type === 'Service') {
    structuredData.provider = {
      '@type': 'Organization',
      name: 'Altiora Infotech',
      url: baseUrl
    };
  }
  
  // Add breadcrumbs if provided
  if (breadcrumbs && breadcrumbs.length > 0) {
    structuredData.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${baseUrl}${crumb.url}`
      }))
    };
  }
  
  return structuredData;
}

/**
 * Generate a complete metadata object with structured data
 */
export async function generateCompleteMetadata(
  options: MetadataGeneratorOptions & {
    structuredDataType?: 'WebPage' | 'Article' | 'Service' | 'Organization';
    datePublished?: string;
    dateModified?: string;
    author?: string;
    breadcrumbs?: Array<{ name: string; url: string }>;
  }
): Promise<{
  metadata: Metadata;
  structuredData: object;
}> {
  const metadata = await generatePageMetadata(options);
  
  // Get SEO data for structured data generation
  const seoData = await getSEOMetadata(options.path, options.siteId);
  
  const structuredData = generateStructuredData(options.path, seoData, {
    type: options.structuredDataType,
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    author: options.author,
    breadcrumbs: options.breadcrumbs
  });
  
  return { metadata, structuredData };
}

/**
 * Generate keywords based on path and SEO data
 */
function generateKeywords(path: string, seoData: SEOMetadata): string {
  const baseKeywords = ['Altiora Infotech', 'technology', 'software development'];
  const pathKeywords: string[] = [];
  
  // Extract keywords from path
  if (path.includes('ai') || path.includes('ml')) {
    pathKeywords.push('artificial intelligence', 'machine learning', 'AI services');
  }
  if (path.includes('web3') || path.includes('blockchain')) {
    pathKeywords.push('Web3', 'blockchain', 'decentralized', 'smart contracts');
  }
  if (path.includes('mobile')) {
    pathKeywords.push('mobile app development', 'iOS', 'Android');
  }
  if (path.includes('web')) {
    pathKeywords.push('web development', 'full-stack', 'responsive design');
  }
  if (path.includes('services')) {
    pathKeywords.push('professional services', 'consulting', 'development');
  }
  
  // Extract keywords from title and description
  const titleKeywords = extractKeywordsFromText(seoData.title);
  const descriptionKeywords = extractKeywordsFromText(seoData.description);
  
  const allKeywords = [
    ...baseKeywords,
    ...pathKeywords,
    ...titleKeywords,
    ...descriptionKeywords
  ];
  
  // Remove duplicates and join
  return [...new Set(allKeywords)].join(', ');
}

/**
 * Extract keywords from text
 */
function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  
  // Simple keyword extraction - remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Get fallback metadata when SEO data is unavailable
 */
function getFallbackMetadata(options: MetadataGeneratorOptions): Metadata {
  const { path, fallbackTitle, fallbackDescription, images = [], canonical } = options;
  
  return {
    title: fallbackTitle || 'Altiora Infotech - Technology Solutions',
    description: fallbackDescription || 'Leading technology solutions for modern businesses',
    robots: 'index,follow',
    
    alternates: canonical ? {
      canonical: canonical
    } : undefined,
    
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical || `${getBaseUrl()}${path}`,
      siteName: 'Altiora Infotech',
      title: fallbackTitle || 'Altiora Infotech',
      description: fallbackDescription || 'Leading technology solutions',
      images: [
        ...images,
        'https://altiorainfotech.com/og-default.jpg'
      ]
    },
    
    twitter: {
      card: 'summary_large_image',
      title: fallbackTitle || 'Altiora Infotech',
      description: fallbackDescription || 'Leading technology solutions',
      images: [
        ...images,
        'https://altiorainfotech.com/og-default.jpg'
      ]
    },
    
    keywords: 'Altiora Infotech, technology, software development',
    authors: [{ name: 'Altiora Infotech' }],
    creator: 'Altiora Infotech',
    publisher: 'Altiora Infotech'
  };
}

/**
 * Get base URL for the site
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
         'http://localhost:3000';
}

/**
 * Utility function to create a generateMetadata function for page components
 */
export function createMetadataGenerator(
  defaultOptions: Partial<MetadataGeneratorOptions> = {}
) {
  return async function generateMetadata(
    { params }: { params: any },
    parent?: Promise<Metadata>
  ): Promise<Metadata> {
    // Extract path from params or use default
    const path = params?.path ? `/${Array.isArray(params.path) ? params.path.join('/') : params.path}` : defaultOptions.path || '/';
    
    const options: MetadataGeneratorOptions = {
      ...defaultOptions,
      path
    };
    
    return generatePageMetadata(options);
  };
}

/**
 * Preload metadata for better performance
 */
export async function preloadMetadata(paths: string[], siteId?: string): Promise<void> {
  try {
    await Promise.all(
      paths.map(path => getSEOMetadata(path, siteId))
    );
    logger.info('Metadata preloaded for paths:', paths);
  } catch (error) {
    logger.error('Error preloading metadata:', { error });
  }
}