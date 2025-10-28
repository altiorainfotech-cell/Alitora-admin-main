import { z } from 'zod'

export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

const sanitizedString = (minLength: number = 1, maxLength: number = 1000) =>
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .transform(sanitizeString)
    .refine(val => val.length >= minLength, `Must be at least ${minLength} characters after sanitization`)

const secureUrl = z.string()
  .url('Invalid URL')
  .refine(url => {
    try {
      const parsed = new URL(url)
      const allowedProtocols = ['http:', 'https:']
      return allowedProtocols.includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine(url => {
    if (process.env.NODE_ENV === 'production') {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase()
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false
      }
      const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^fc00:/,
        /^fe80:/
      ]
      
      return !privateRanges.some(range => range.test(hostname))
    }
    return true
  }, 'Invalid URL for production environment')

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(sanitizeString),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
  rememberMe: z.boolean().optional(),
})

export const reelSchema = z.object({
  title: sanitizedString(1, 200),
  link: secureUrl,
  categories: z.array(
    z.enum(['Clothing', 'Branding', 'Fashion'])
  ).min(1, 'At least one category is required')
   .max(3, 'Maximum 3 categories allowed'),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
})

export const sliderSchema = z.object({
  heading: sanitizedString(1, 100),
  subheading: sanitizedString(1, 200),
})

export const sliderImageSchema = z.object({
  url: secureUrl,
  order: z.number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative')
    .max(100, 'Order too large')
    .optional()
})

export const reorderSliderImagesSchema = z.object({
  images: z.array(z.object({
    id: z.string()
      .min(1, 'ID is required')
      .max(50, 'ID too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format'),
    order: z.number()
      .int('Order must be an integer')
      .min(0, 'Order must be non-negative')
      .max(100, 'Order too large')
  })).max(20, 'Too many images')
})

export const categorySchema = z.object({
  name: z.enum(['Clothing', 'Branding', 'Fashion']),
})

// Enhanced file upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' })
    .refine(file => file.size > 0, 'File cannot be empty')
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB'),
  folder: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid folder name')
    .max(50, 'Folder name too long')
    .optional()
    .default('general'),
})

export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Image file is required' })
    .refine(file => file.size > 0, 'File cannot be empty')
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    )
    .refine(
      file => {
        // Additional filename validation
        const filename = file.name.toLowerCase()
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        return allowedExtensions.some(ext => filename.endsWith(ext))
      },
      'File extension must match content type'
    ),
  folder: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid folder name')
    .max(50, 'Folder name too long')
    .optional()
    .default('general'),
  optimize: z.boolean().optional().default(true),
  thumbnail: z.boolean().optional().default(false),
})

// Image metadata schema for admin panel
export const imageMetadataSchema = z.object({
  title: sanitizedString(1, 200),
  description: sanitizedString(0, 1000).optional(),
  tags: z.array(sanitizedString(1, 50)).max(10, 'Maximum 10 tags allowed').optional().default([]),
  categoryId: z.string().min(1, 'Category is required'),
})

// Combined image upload with metadata schema
export const adminImageUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Image file is required' })
    .refine(file => file.size > 0, 'File cannot be empty')
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    )
    .refine(
      file => {
        // Additional filename validation
        const filename = file.name.toLowerCase()
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        return allowedExtensions.some(ext => filename.endsWith(ext))
      },
      'File extension must match content type'
    ),
  title: sanitizedString(1, 200),
  description: sanitizedString(0, 1000).optional(),
  tags: z.array(sanitizedString(1, 50)).max(10, 'Maximum 10 tags allowed').optional().default([]),
  categoryId: z.string().min(1, 'Category is required'),
})

export const uploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  filename: z.string().max(255).optional(),
  size: z.number().int().min(0).optional(),
  originalSize: z.number().int().min(0).optional(),
  error: z.string().max(500).optional(),
})

// API response schemas for consistent error handling
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().max(500),
  code: z.string().optional(),
  details: z.any().optional(),
})

export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ReelInput = z.infer<typeof reelSchema>
export type SliderInput = z.infer<typeof sliderSchema>
export type SliderImageInput = z.infer<typeof sliderImageSchema>
export type ReorderSliderImagesInput = z.infer<typeof reorderSliderImagesSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type ImageMetadataInput = z.infer<typeof imageMetadataSchema>
export type AdminImageUploadInput = z.infer<typeof adminImageUploadSchema>
export type UploadResponse = z.infer<typeof uploadResponseSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
export type ApiSuccess = z.infer<typeof apiSuccessSchema>
export type PaginationInput = z.infer<typeof paginationSchema>

// User management schemas
export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(sanitizeString),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
  role: z.enum(['ADMIN', 'EDITOR']),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
})

export const updateUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .toLowerCase()
    .transform(sanitizeString)
    .optional(),
  role: z.enum(['ADMIN', 'EDITOR']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long')
    .optional(),
})

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: z.enum(['ADMIN', 'EDITOR']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserQueryInput = z.infer<typeof userQuerySchema>