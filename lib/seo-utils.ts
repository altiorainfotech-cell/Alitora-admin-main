import SEOPage from '@/lib/models/SEOPage';
import Redirect from '@/lib/models/Redirect';
import { getPredefinedPageByPath, getAllPredefinedSlugs } from '@/lib/data/predefined-pages';

export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export interface RedirectChainResult {
  hasChain: boolean;
  depth: number;
  isLoop: boolean;
  chain?: string[];
}

/**
 * Validates if a slug is unique and follows proper format
 */
export async function validateSlugUniqueness(
  siteId: string,
  slug: string,
  excludePath?: string
): Promise<SlugValidationResult> {
  try {
    // Check format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return {
        isValid: false,
        error: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)'
      };
    }
    
    // Check length
    if (slug.length > 100) {
      return {
        isValid: false,
        error: 'Slug cannot exceed 100 characters'
      };
    }
    
    // Check if slug exists in database (excluding current page)
    const query: any = { siteId, slug };
    if (excludePath) {
      query.path = { $ne: excludePath };
    }
    
    const existingPage = await SEOPage.findOne(query);
    if (existingPage) {
      return {
        isValid: false,
        error: `Slug '${slug}' is already used by page: ${existingPage.path}`,
        suggestions: [
          `${slug}-2`,
          `${slug}-new`,
          `${slug}-updated`
        ]
      };
    }
    
    // Check if slug conflicts with predefined slugs (for other pages)
    const predefinedSlugs = getAllPredefinedSlugs();
    const conflictingSlug = predefinedSlugs.find(predefinedSlug => {
      if (excludePath) {
        const predefinedPage = getPredefinedPageByPath(excludePath);
        if (predefinedPage && predefinedPage.defaultSlug === predefinedSlug) {
          return false; // Allow using the page's own default slug
        }
      }
      return predefinedSlug === slug;
    });
    
    if (conflictingSlug) {
      return {
        isValid: false,
        error: `Slug '${slug}' conflicts with a predefined page slug`,
        suggestions: [
          `${slug}-custom`,
          `${slug}-alt`,
          `${slug}-v2`
        ]
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating slug uniqueness:', error);
    return {
      isValid: false,
      error: 'Failed to validate slug uniqueness'
    };
  }
}

/**
 * Checks for redirect chains and loops
 */
export async function checkRedirectChain(
  siteId: string,
  from: string,
  to: string,
  maxDepth: number = 5
): Promise<RedirectChainResult> {
  try {
    let currentPath = to;
    let depth = 0;
    const visited = new Set([from]);
    const chain = [from, to];

    while (depth < maxDepth) {
      const redirect = await Redirect.findOne({ siteId, from: currentPath });
      if (!redirect) {
        return { hasChain: false, depth, isLoop: false, chain };
      }

      if (visited.has(redirect.to)) {
        return { 
          hasChain: true, 
          depth: depth + 1, 
          isLoop: true, 
          chain: [...chain, redirect.to] 
        };
      }

      visited.add(redirect.to);
      chain.push(redirect.to);
      currentPath = redirect.to;
      depth++;
    }

    return { 
      hasChain: true, 
      depth, 
      isLoop: false, 
      chain 
    };
  } catch (error) {
    console.error('Error checking redirect chain:', error);
    return { hasChain: false, depth: 0, isLoop: false };
  }
}

/**
 * Creates a redirect with validation
 */
export async function createRedirectSafely(
  siteId: string,
  from: string,
  to: string,
  statusCode: number = 301,
  createdBy: string
): Promise<{ success: boolean; redirect?: any; error?: string }> {
  try {
    // Check if redirect already exists
    const existingRedirect = await Redirect.findOne({ siteId, from });
    if (existingRedirect) {
      // Update existing redirect
      existingRedirect.to = to;
      existingRedirect.statusCode = statusCode;
      await existingRedirect.save();
      
      return { success: true, redirect: existingRedirect };
    }
    
    // Check for redirect chains/loops
    const chainResult = await checkRedirectChain(siteId, from, to);
    if (chainResult.isLoop) {
      return { 
        success: false, 
        error: `Redirect would create an infinite loop: ${chainResult.chain?.join(' → ')}` 
      };
    }
    
    if (chainResult.hasChain && chainResult.depth >= 5) {
      return { 
        success: false, 
        error: `Redirect chain too long (${chainResult.depth} redirects). Maximum allowed: 5` 
      };
    }
    
    // Create new redirect
    const redirect = new Redirect({
      siteId,
      from,
      to,
      statusCode,
      createdBy
    });
    
    await redirect.save();
    
    return { success: true, redirect };
  } catch (error: any) {
    console.error('Error creating redirect safely:', error);
    return { success: false, error: error.message || 'Failed to create redirect' };
  }
}

/**
 * Generates slug suggestions based on title
 */
export function generateSlugSuggestions(title: string, existingSlugs: string[] = []): string[] {
  // Basic slug generation
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 80); // Limit length
  
  const suggestions = [baseSlug];
  
  // Add numbered variations if base slug exists
  if (existingSlugs.includes(baseSlug)) {
    for (let i = 2; i <= 5; i++) {
      const numberedSlug = `${baseSlug}-${i}`;
      if (!existingSlugs.includes(numberedSlug)) {
        suggestions.push(numberedSlug);
      }
    }
    
    // Add other variations
    const variations = [
      `${baseSlug}-new`,
      `${baseSlug}-updated`,
      `${baseSlug}-v2`,
      `${baseSlug}-alt`
    ];
    
    variations.forEach(variation => {
      if (!existingSlugs.includes(variation)) {
        suggestions.push(variation);
      }
    });
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}

/**
 * Validates SEO data completeness and quality
 */
export interface SEOQualityCheck {
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
}

export function checkSEOQuality(
  metaTitle: string,
  metaDescription: string,
  slug: string
): SEOQualityCheck {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;
  
  // Meta title checks
  if (metaTitle.length < 30) {
    issues.push('Meta title is too short (less than 30 characters)');
    suggestions.push('Consider expanding the meta title to better describe the page');
    score -= 15;
  } else if (metaTitle.length > 60) {
    issues.push('Meta title exceeds 60 characters and may be truncated in search results');
    suggestions.push('Shorten the meta title to under 60 characters');
    score -= 10;
  }
  
  // Meta description checks
  if (metaDescription.length < 120) {
    issues.push('Meta description is too short (less than 120 characters)');
    suggestions.push('Expand the meta description to provide more context');
    score -= 15;
  } else if (metaDescription.length > 160) {
    issues.push('Meta description exceeds 160 characters and may be truncated');
    suggestions.push('Shorten the meta description to under 160 characters');
    score -= 10;
  }
  
  // Slug checks
  if (slug.length > 50) {
    issues.push('Slug is quite long, shorter URLs are generally better for SEO');
    suggestions.push('Consider shortening the slug while keeping it descriptive');
    score -= 5;
  }
  
  // Content quality checks
  if (metaTitle.toLowerCase() === metaDescription.toLowerCase()) {
    issues.push('Meta title and description are identical');
    suggestions.push('Make the meta description more detailed than the title');
    score -= 20;
  }
  
  // Keyword repetition check (basic)
  const titleWords = metaTitle.toLowerCase().split(/\s+/);
  const descWords = metaDescription.toLowerCase().split(/\s+/);
  const commonWords = titleWords.filter(word => 
    word.length > 3 && descWords.includes(word)
  );
  
  if (commonWords.length === 0) {
    issues.push('No common keywords between title and description');
    suggestions.push('Include relevant keywords in both title and description');
    score -= 10;
  }
  
  return {
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * Batch validates multiple slugs
 */
export async function batchValidateSlugs(
  siteId: string,
  slugs: Array<{ slug: string; path?: string }>
): Promise<Array<{ slug: string; isValid: boolean; error?: string }>> {
  const results = [];
  
  for (const { slug, path } of slugs) {
    const validation = await validateSlugUniqueness(siteId, slug, path);
    results.push({
      slug,
      isValid: validation.isValid,
      error: validation.error
    });
  }
  
  return results;
}