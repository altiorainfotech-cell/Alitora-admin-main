import { z } from 'zod'

// Enhanced security validation
export const validateContentSecurity = (content: string): { isSecure: boolean; threats: string[] } => {
  const threats: string[] = []
  
  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    threats.push('Script tags detected')
  }
  
  // Check for javascript: protocol
  if (/javascript:/gi.test(content)) {
    threats.push('JavaScript protocol detected')
  }
  
  // Check for event handlers
  if (/on\w+\s*=/gi.test(content)) {
    threats.push('Event handlers detected')
  }
  
  // Check for data: URLs with scripts
  if (/data:.*script/gi.test(content)) {
    threats.push('Data URL with script detected')
  }
  
  return {
    isSecure: threats.length === 0,
    threats
  }
}

// Bulk operation limits based on user role
export const validateBulkOperationLimits = (
  operation: string, 
  itemCount: number, 
  userRole: string
): { isValid: boolean; error?: string } => {
  const limits = {
    ADMIN: { update: 100, delete: 50, reset: 100 },
    EDITOR: { update: 20, delete: 10, reset: 20 },
    default: { update: 10, delete: 5, reset: 10 }
  }
  
  const userLimits = limits[userRole as keyof typeof limits] || limits.default
  const limit = userLimits[operation as keyof typeof userLimits] || 0
  
  if (itemCount > limit) {
    return {
      isValid: false,
      error: `Bulk ${operation} limited to ${limit} items for ${userRole} role`
    }
  }
  
  return { isValid: true }
}

// Enhanced SEO page schema with security validation
export const enhancedSeoPageSchema = z.object({
  siteId: z.string()
    .min(1, 'Site ID is required')
    .max(50, 'Site ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid site ID format')
    .default('altiorainfotech'),
  path: z.string()
    .min(1, 'Path is required')
    .max(500, 'Path too long')
    .refine(path => path.startsWith('/') || path === 'home', 'Path must start with / or be "home"'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)'),
  metaTitle: z.string()
    .min(1, 'Meta title is required')
    .max(60, 'Meta title must be 60 characters or less')
    .refine(title => title.trim().length > 0, 'Meta title cannot be empty'),
  metaDescription: z.string()
    .min(1, 'Meta description is required')
    .max(160, 'Meta description must be 160 characters or less')
    .refine(desc => desc.trim().length > 0, 'Meta description cannot be empty'),
  robots: z.string()
    .default('index,follow')
    .refine(robots => {
      const validDirectives = ['index', 'noindex', 'follow', 'nofollow', 'archive', 'noarchive', 'snippet', 'nosnippet'];
      const directives = robots.split(',').map(d => d.trim().toLowerCase());
      return directives.every(directive => validDirectives.includes(directive));
    }, 'Invalid robots directive'),
  isCustom: z.boolean().default(false),
  pageCategory: z.enum(['main', 'services', 'blog', 'about', 'contact', 'other']).default('other'),
  openGraph: z.object({
    title: z.string().max(60, 'OpenGraph title must be 60 characters or less').optional(),
    description: z.string().max(160, 'OpenGraph description must be 160 characters or less').optional(),
    image: z.string().url('Invalid OpenGraph image URL').optional()
  }).optional(),
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
})

// Enhanced bulk SEO operation schema
export const enhancedBulkSeoOperationSchema = z.object({
  operation: z.enum(['update', 'delete', 'reset', 'export', 'import']),
  paths: z.array(z.string().min(1)).min(1, 'At least one path is required').max(100, 'Too many paths'),
  data: z.object({
    metaTitle: z.string().max(60, 'Meta title must be 60 characters or less').optional(),
    metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
    robots: z.string().optional(),
    pageCategory: z.enum(['main', 'services', 'blog', 'about', 'contact', 'other']).optional(),
    openGraph: z.object({
      title: z.string().max(60, 'OpenGraph title must be 60 characters or less').optional(),
      description: z.string().max(160, 'OpenGraph description must be 160 characters or less').optional(),
      image: z.string().url('Invalid OpenGraph image URL').optional()
    }).optional()
  }).optional(),
  updatedBy: z.string().min(1, 'Updated by is required'),
  exportFormat: z.enum(['json', 'csv']).optional(),
  importData: z.array(z.object({
    path: z.string().min(1),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    robots: z.string().optional(),
    pageCategory: z.enum(['main', 'services', 'blog', 'about', 'contact', 'other']).optional()
  })).optional()
})

// SEO validation schemas
export const seoPageSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be less than 100 characters'),
  metaTitle: z.string()
    .min(1, 'Meta title is required')
    .max(60, 'Meta title must be 60 characters or less')
    .refine(title => title.trim().length > 0, 'Meta title cannot be empty'),
  metaDescription: z.string()
    .min(1, 'Meta description is required')
    .max(160, 'Meta description must be 160 characters or less')
    .refine(desc => desc.trim().length > 0, 'Meta description cannot be empty'),
  robots: z.string().optional().default('index,follow'),
  openGraph: z.object({
    title: z.string().max(60, 'OpenGraph title must be 60 characters or less').optional(),
    description: z.string().max(160, 'OpenGraph description must be 160 characters or less').optional(),
    image: z.string().url('OpenGraph image must be a valid URL').optional().or(z.literal(''))
  }).optional()
})

export type SEOPageInput = z.infer<typeof seoPageSchema>

// Validation functions
export const validateMetaTitle = (title: string): { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' } => {
  if (!title.trim()) {
    return { isValid: false, message: 'Meta title is required', severity: 'error' }
  }
  
  if (title.length > 60) {
    return { isValid: false, message: 'Meta title is too long (max 60 characters)', severity: 'error' }
  }
  
  if (title.length > 50) {
    return { isValid: true, message: 'Meta title is approaching the recommended limit', severity: 'warning' }
  }
  
  if (title.length < 30) {
    return { isValid: true, message: 'Consider making the meta title longer for better SEO', severity: 'warning' }
  }
  
  return { isValid: true, message: 'Meta title length is optimal', severity: 'success' }
}

export const validateMetaDescription = (description: string): { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' } => {
  if (!description.trim()) {
    return { isValid: false, message: 'Meta description is required', severity: 'error' }
  }
  
  if (description.length > 160) {
    return { isValid: false, message: 'Meta description is too long (max 160 characters)', severity: 'error' }
  }
  
  if (description.length > 140) {
    return { isValid: true, message: 'Meta description is approaching the recommended limit', severity: 'warning' }
  }
  
  if (description.length < 120) {
    return { isValid: true, message: 'Consider making the meta description longer for better SEO', severity: 'warning' }
  }
  
  return { isValid: true, message: 'Meta description length is optimal', severity: 'success' }
}

export const validateSlug = (slug: string): { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' } => {
  if (!slug.trim()) {
    return { isValid: false, message: 'Slug is required', severity: 'error' }
  }
  
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(slug)) {
    return { isValid: false, message: 'Slug must contain only lowercase letters, numbers, and hyphens', severity: 'error' }
  }
  
  if (slug.length > 50) {
    return { isValid: true, message: 'Consider shortening the slug for better URLs', severity: 'warning' }
  }
  
  return { isValid: true, message: 'Slug format is valid', severity: 'success' }
}

export const validateOpenGraphImage = (imageUrl: string): { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' } => {
  if (!imageUrl) {
    return { isValid: true, message: 'OpenGraph image is optional', severity: 'success' }
  }
  
  try {
    new URL(imageUrl)
  } catch {
    return { isValid: false, message: 'OpenGraph image must be a valid URL', severity: 'error' }
  }
  
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const hasImageExtension = imageExtensions.some(ext => imageUrl.toLowerCase().includes(ext))
  
  if (!hasImageExtension) {
    return { isValid: true, message: 'Make sure the URL points to an image file', severity: 'warning' }
  }
  
  return { isValid: true, message: 'OpenGraph image URL is valid', severity: 'success' }
}

// Form validation helper
export const validateSEOForm = (data: Partial<SEOPageInput>): { isValid: boolean; errors: Record<string, string> } => {
  try {
    seoPageSchema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.issues.forEach(err => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// SEO best practices checker
export const checkSEOBestPractices = (data: SEOPageInput): { score: number; suggestions: string[] } => {
  const suggestions: string[] = []
  let score = 100
  
  // Check meta title
  if (data.metaTitle.length < 30) {
    suggestions.push('Consider making your meta title longer (30-60 characters is optimal)')
    score -= 10
  }
  
  if (data.metaTitle.length > 50) {
    suggestions.push('Your meta title might be truncated in search results')
    score -= 5
  }
  
  // Check meta description
  if (data.metaDescription.length < 120) {
    suggestions.push('Consider making your meta description longer (120-160 characters is optimal)')
    score -= 10
  }
  
  if (data.metaDescription.length > 140) {
    suggestions.push('Your meta description might be truncated in search results')
    score -= 5
  }
  
  // Check slug
  if (data.slug.length > 50) {
    suggestions.push('Consider shortening your URL slug for better readability')
    score -= 5
  }
  
  // Check for keywords in title and description
  const titleWords = data.metaTitle.toLowerCase().split(' ')
  const descWords = data.metaDescription.toLowerCase().split(' ')
  const commonWords = titleWords.filter(word => descWords.includes(word) && word.length > 3)
  
  if (commonWords.length === 0) {
    suggestions.push('Consider including some keywords from your title in your description')
    score -= 10
  }
  
  // Check OpenGraph
  if (!data.openGraph?.image) {
    suggestions.push('Adding an OpenGraph image will improve social media sharing')
    score -= 5
  }
  
  return { score: Math.max(0, score), suggestions }
}

// Enhanced redirect schema with security validation
export const enhancedRedirectSchema = z.object({
  siteId: z.string()
    .min(1, 'Site ID is required')
    .max(50, 'Site ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid site ID format')
    .default('altiorainfotech'),
  from: z.string()
    .min(1, 'Source path is required')
    .max(500, 'Source path too long')
    .refine(path => path.startsWith('/'), 'Source path must start with /'),
  to: z.string()
    .min(1, 'Destination path is required')
    .max(500, 'Destination path too long')
    .refine(path => path.startsWith('/') || path.startsWith('http'), 'Destination must be a path or URL'),
  statusCode: z.number()
    .int('Status code must be an integer')
    .min(300, 'Status code must be 300 or higher')
    .max(399, 'Status code must be 399 or lower')
    .default(301),
  description: z.string()
    .max(200, 'Description too long')
    .optional(),
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
})

// Character count helpers
export const getCharacterCountStatus = (current: number, max: number, warning: number) => {
  if (current > max) return { color: 'red', status: 'error', message: 'Too long' }
  if (current > warning) return { color: 'orange', status: 'warning', message: 'Approaching limit' }
  if (current > 0) return { color: 'green', status: 'success', message: 'Good length' }
  return { color: 'gray', status: 'empty', message: 'Enter content' }
}