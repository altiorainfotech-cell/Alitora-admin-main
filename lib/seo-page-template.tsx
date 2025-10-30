import { Metadata } from 'next';
import { generateCompleteMetadata } from './metadata-generator';
import { SEOHead } from './components/StructuredData';

/**
 * Example template for implementing SEO metadata in Next.js pages
 * This shows how to use the metadata generation system
 */

// Example for a dynamic page with params
export async function generateMetadata(
  { params }: { params: { slug?: string; path?: string[] } }
): Promise<Metadata> {
  // Extract path from params
  const path = params.path 
    ? `/${params.path.join('/')}`
    : params.slug 
    ? `/${params.slug}`
    : '/';
  
  // Generate metadata using the SEO system
  const { metadata } = await generateCompleteMetadata({
    path,
    siteId: 'altiorainfotech',
    fallbackTitle: 'Altiora Infotech - Technology Solutions',
    fallbackDescription: 'Leading technology solutions for modern businesses',
    canonical: `https://altiorainfotech.com${path}`,
    structuredDataType: 'WebPage'
  });
  
  return metadata;
}

// Example page component with structured data
interface PageProps {
  params: { slug?: string; path?: string[] };
}

export default async function SEOEnabledPage({ params }: PageProps) {
  // Extract path from params
  const path = params.path 
    ? `/${params.path.join('/')}`
    : params.slug 
    ? `/${params.slug}`
    : '/';
  
  // Generate complete metadata including structured data
  const { structuredData } = await generateCompleteMetadata({
    path,
    siteId: 'altiorainfotech',
    structuredDataType: 'WebPage',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: 'Current Page', url: path }
    ]
  });
  
  return (
    <>
      <SEOHead structuredData={structuredData} />
      
      <main>
        <h1>Your Page Content</h1>
        <p>This page uses the SEO management system for metadata.</p>
      </main>
    </>
  );
}

/**
 * Example for a static page
 */
export async function generateStaticPageMetadata(path: string): Promise<Metadata> {
  const { metadata } = await generateCompleteMetadata({
    path,
    siteId: 'altiorainfotech',
    fallbackTitle: `Page ${path} | Altiora Infotech`,
    fallbackDescription: 'Professional technology services and solutions',
    canonical: `https://altiorainfotech.com${path}`,
    structuredDataType: 'WebPage'
  });
  
  return metadata;
}

/**
 * Example for service pages
 */
export async function generateServicePageMetadata(
  servicePath: string,
  serviceTitle: string
): Promise<Metadata> {
  const { metadata } = await generateCompleteMetadata({
    path: servicePath,
    siteId: 'altiorainfotech',
    fallbackTitle: `${serviceTitle} | Altiora Infotech`,
    fallbackDescription: `Professional ${serviceTitle.toLowerCase()} services from Altiora Infotech`,
    canonical: `https://altiorainfotech.com${servicePath}`,
    structuredDataType: 'Service'
  });
  
  return metadata;
}

/**
 * Example for blog/article pages
 */
export async function generateArticleMetadata(
  articlePath: string,
  articleTitle: string,
  publishDate: string,
  author: string
): Promise<Metadata> {
  const { metadata } = await generateCompleteMetadata({
    path: articlePath,
    siteId: 'altiorainfotech',
    fallbackTitle: `${articleTitle} | Altiora Infotech Blog`,
    fallbackDescription: `Read about ${articleTitle.toLowerCase()} on the Altiora Infotech blog`,
    canonical: `https://altiorainfotech.com${articlePath}`,
    structuredDataType: 'Article',
    datePublished: publishDate,
    dateModified: publishDate,
    author
  });
  
  return metadata;
}

/**
 * Utility function for pages that need to handle both static and dynamic metadata
 */
export function createPageMetadataGenerator(
  staticPath?: string,
  pageType: 'WebPage' | 'Service' | 'Article' = 'WebPage'
) {
  return async function generateMetadata(
    { params }: { params?: any } = {}
  ): Promise<Metadata> {
    // Determine path from params or use static path
    let path = staticPath || '/';
    
    if (params) {
      if (params.path && Array.isArray(params.path)) {
        path = `/${params.path.join('/')}`;
      } else if (params.slug) {
        path = `/${params.slug}`;
      } else if (params.id) {
        path = `${staticPath || ''}/${params.id}`;
      }
    }
    
    const { metadata } = await generateCompleteMetadata({
      path,
      siteId: 'altiorainfotech',
      structuredDataType: pageType,
      canonical: `https://altiorainfotech.com${path}`
    });
    
    return metadata;
  };
}