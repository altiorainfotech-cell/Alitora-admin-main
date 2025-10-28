import { z, ZodIssue } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Image item schema
const imageItemSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  url: z.string().url('Image URL must be valid'),
  alt: z.string().min(1, 'Image alt text is required'),
  caption: z.string().optional()
});

// Content section schema
const contentSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  type: z.enum(['title', 'content']),
  value: z.string().min(1, 'Section value is required'),
  fontSize: z.string().optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional()
});

// Blog post creation validation schema (for POST requests)
export const createBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content is too long (max 100,000 characters)'),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .trim()
    .optional(),
  image: z.string()
    .min(1, 'Image URL is required')
    .url('Image must be a valid URL')
    .refine((url) => {
      // Validate Cloudinary URLs or common image URLs
      return /^https:\/\/res\.cloudinary\.com\/.+/.test(url) || 
             /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }, 'Image must be a valid image URL'),
  images: z.array(imageItemSchema).max(20, 'Maximum 20 additional images allowed').optional(),
  contentSections: z.array(contentSectionSchema).max(50, 'Maximum 50 content sections allowed').optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category name is too long')
    .trim(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author name is too long')
    .trim(),
  date: z.string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Date must be a valid ISO date string'),
  seo: z.object({
    metaTitle: z.string()
      .max(60, 'Meta title must be less than 60 characters')
      .trim()
      .optional(),
    metaDescription: z.string()
      .max(160, 'Meta description must be less than 160 characters')
      .trim()
      .optional(),
    keywords: z.array(z.string().trim().min(1)).max(10, 'Maximum 10 keywords allowed').optional()
  }).optional()
});

// Blog post update validation schema (for PUT requests)
export const updateBlogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Content is required')
    .max(100000, 'Content is too long (max 100,000 characters)')
    .optional(),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .trim()
    .optional(),
  image: z.string()
    .min(1, 'Image URL is required')
    .url('Image must be a valid URL')
    .refine((url) => {
      return /^https:\/\/res\.cloudinary\.com\/.+/.test(url) || 
             /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }, 'Image must be a valid image URL')
    .optional(),
  images: z.array(imageItemSchema).max(20, 'Maximum 20 additional images allowed').optional(),
  contentSections: z.array(contentSectionSchema).max(50, 'Maximum 50 content sections allowed').optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category name is too long')
    .trim()
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author name is too long')
    .trim()
    .optional(),
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Date must be a valid ISO date string')
    .optional(),
  seo: z.object({
    metaTitle: z.string()
      .max(60, 'Meta title must be less than 60 characters')
      .trim()
      .optional(),
    metaDescription: z.string()
      .max(160, 'Meta description must be less than 160 characters')
      .trim()
      .optional(),
    keywords: z.array(z.string().trim().min(1)).max(10, 'Maximum 10 keywords allowed').optional()
  }).optional()
});

// Query parameters validation for GET requests
export const blogQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().max(100, 'Search query is too long').optional(),
  author: z.string().trim().max(100, 'Author name is too long').optional()
});

// Sanitization functions
export function sanitizeHtmlContent(content: string): string {
  // Configure DOMPurify to allow common HTML tags for blog content
  const cleanContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
  
  return cleanContent;
}

export function sanitizeTextContent(text: string): string {
  // Remove HTML tags and sanitize plain text
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}

// Validation helper functions
export function validateBlogPostCreation(data: any) {
  try {
    console.log('🔍 Starting validation with data:', {
      title: data.title || 'MISSING',
      content: data.content ? `${data.content.length} chars` : 'MISSING',
      image: data.image || 'MISSING',
      category: data.category || 'MISSING',
      author: data.author || 'MISSING',
      imagesCount: data.images?.length || 0,
      contentSectionsCount: data.contentSections?.length || 0
    });
    
    const validatedData = createBlogPostSchema.parse(data);
    
    // Sanitize content
    if (validatedData.content) {
      validatedData.content = sanitizeHtmlContent(validatedData.content);
    }
    
    // Sanitize excerpt
    if (validatedData.excerpt) {
      validatedData.excerpt = sanitizeTextContent(validatedData.excerpt);
    }
    
    // Sanitize content sections
    if (validatedData.contentSections) {
      validatedData.contentSections = validatedData.contentSections.map(section => ({
        ...section,
        value: section.type === 'content' 
          ? sanitizeHtmlContent(section.value)
          : sanitizeTextContent(section.value)
      }));
    }

    // Sanitize SEO fields
    if (validatedData.seo) {
      if (validatedData.seo.metaTitle) {
        validatedData.seo.metaTitle = sanitizeTextContent(validatedData.seo.metaTitle);
      }
      if (validatedData.seo.metaDescription) {
        validatedData.seo.metaDescription = sanitizeTextContent(validatedData.seo.metaDescription);
      }
      if (validatedData.seo.keywords) {
        validatedData.seo.keywords = validatedData.seo.keywords.map(keyword => 
          sanitizeTextContent(keyword)
        );
      }
    }
    
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error
      }
    };
  }
}

export function validateBlogPostUpdate(data: any) {
  try {
    const validatedData = updateBlogPostSchema.parse(data);
    
    // Sanitize content if provided
    if (validatedData.content) {
      validatedData.content = sanitizeHtmlContent(validatedData.content);
    }
    
    // Sanitize excerpt if provided
    if (validatedData.excerpt) {
      validatedData.excerpt = sanitizeTextContent(validatedData.excerpt);
    }
    
    // Sanitize content sections if provided
    if (validatedData.contentSections) {
      validatedData.contentSections = validatedData.contentSections.map(section => ({
        ...section,
        value: section.type === 'content' 
          ? sanitizeHtmlContent(section.value)
          : sanitizeTextContent(section.value)
      }));
    }

    // Sanitize SEO fields if provided
    if (validatedData.seo) {
      if (validatedData.seo.metaTitle) {
        validatedData.seo.metaTitle = sanitizeTextContent(validatedData.seo.metaTitle);
      }
      if (validatedData.seo.metaDescription) {
        validatedData.seo.metaDescription = sanitizeTextContent(validatedData.seo.metaDescription);
      }
      if (validatedData.seo.keywords) {
        validatedData.seo.keywords = validatedData.seo.keywords.map(keyword => 
          sanitizeTextContent(keyword)
        );
      }
    }
    
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error
      }
    };
  }
}

export function validateBlogQuery(query: any) {
  try {
    const validatedQuery = blogQuerySchema.parse(query);
    
    // Set defaults
    if (!validatedQuery.page) validatedQuery.page = 1;
    if (!validatedQuery.limit) validatedQuery.limit = 10;
    
    // Ensure reasonable limits
    if (validatedQuery.limit > 100) validatedQuery.limit = 100;
    if (validatedQuery.page < 1) validatedQuery.page = 1;
    
    return { success: true, data: validatedQuery };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map((err: ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }
      };
    }
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query validation failed',
        details: error
      }
    };
  }
}



// Export types
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type BlogQueryInput = z.infer<typeof blogQuerySchema>;
