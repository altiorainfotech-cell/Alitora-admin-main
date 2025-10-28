import { NextResponse } from 'next/server'
import { z } from 'zod'

// MongoDB error interface (to avoid importing the full MongoDB client)
interface MongoError extends Error {
  code?: number
}

// Logger interface to avoid importing server-side logger in client code
interface LogContext {
  [key: string]: any
}

// Simple logger fallback for client-side usage
const logger = {
  error: (message: string, context?: LogContext, error?: Error) => {
    if (typeof window === 'undefined') {
      // Server-side: try to import the actual logger
      try {
        const { logger: serverLogger } = require('./logger')
        serverLogger.error(message, context, error)
      } catch {
        console.error(message, context, error)
      }
    } else {
      // Client-side: use console
      console.error(message, context, error)
    }
  }
}

// Standard API error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// Structured API error response
export interface ApiErrorResponse {
  success: false
  error: string
  code: ApiErrorCode
  details?: any
  timestamp: string
  path?: string
}

// Structured API success response
export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  timestamp: string
}

// Custom API error class
export class ApiError extends Error {
  constructor(
    public message: string,
    public code: ApiErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Enhanced error logging function using the logger system
function logError(error: unknown, context?: LogContext) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
  logger.error(`API Error: ${errorMessage}`, context, error instanceof Error ? error : undefined)
}

// Error handler function with enhanced logging and MongoDB support
export function handleApiError(
  error: unknown, 
  path?: string, 
  context?: LogContext
): NextResponse<ApiErrorResponse> {
  
  // Enhanced logging with context
  logError(error, { path, ...context })

  const timestamp = new Date().toISOString()
  
  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      path
    }, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      code: ApiErrorCode.VALIDATION_ERROR,
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      })),
      timestamp,
      path
    }, { status: 400 })
  }

  // Handle MongoDB errors (check for MongoDB error properties)
  if (error instanceof Error && 'code' in error && typeof (error as any).code === 'number') {
    const mongoError = error as MongoError
    let message = 'Database operation failed'
    let statusCode = 500
    let code = ApiErrorCode.DATABASE_ERROR

    switch (mongoError.code) {
      case 11000: // Duplicate key error
        message = 'Resource already exists'
        statusCode = 409
        code = ApiErrorCode.CONFLICT
        break
      case 121: // Document validation failed
        message = 'Invalid data format'
        statusCode = 400
        code = ApiErrorCode.VALIDATION_ERROR
        break
      case 13: // Unauthorized
        message = 'Database access denied'
        statusCode = 403
        code = ApiErrorCode.AUTHORIZATION_ERROR
        break
      case 18: // Authentication failed
        message = 'Database authentication failed'
        statusCode = 401
        code = ApiErrorCode.AUTHENTICATION_ERROR
        break
      default:
        // Keep default values
        break
    }

    return NextResponse.json({
      success: false,
      error: message,
      code,
      details: process.env.NODE_ENV === 'development' ? {
        mongoCode: mongoError.code,
        mongoMessage: mongoError.message
      } : undefined,
      timestamp,
      path
    }, { status: statusCode })
  }

  // Handle MongoDB connection errors
  if (error instanceof Error && error.message.includes('MongoServerError')) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      code: ApiErrorCode.DATABASE_ERROR,
      timestamp,
      path
    }, { status: 503 })
  }

  // Handle Cloudinary errors
  if (error instanceof Error && error.message.includes('cloudinary')) {
    return NextResponse.json({
      success: false,
      error: 'Image service unavailable',
      code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp,
      path
    }, { status: 503 })
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return NextResponse.json({
      success: false,
      error: 'External service unavailable',
      code: ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      timestamp,
      path
    }, { status: 503 })
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp,
      path
    }, { status: 500 })
  }

  // Fallback for unknown errors
  return NextResponse.json({
    success: false,
    error: 'An unexpected error occurred',
    code: ApiErrorCode.INTERNAL_SERVER_ERROR,
    timestamp,
    path
  }, { status: 500 })
}

// Success response helper
export function createSuccessResponse<T>(
  data?: T, 
  message?: string, 
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }, { status })
}

// Validation helper with better error handling
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(
        'Invalid request data',
        ApiErrorCode.VALIDATION_ERROR,
        400,
        error.issues
      )
    }
    throw error
  }
}

// Authentication error helpers
export function createAuthError(message: string = 'Authentication required'): ApiError {
  return new ApiError(message, ApiErrorCode.AUTHENTICATION_ERROR, 401)
}

export function createAuthorizationError(message: string = 'Insufficient permissions'): ApiError {
  return new ApiError(message, ApiErrorCode.AUTHORIZATION_ERROR, 403)
}

export function createNotFoundError(resource: string = 'Resource'): ApiError {
  return new ApiError(`${resource} not found`, ApiErrorCode.NOT_FOUND, 404)
}

export function createConflictError(message: string): ApiError {
  return new ApiError(message, ApiErrorCode.CONFLICT, 409)
}

export function createRateLimitError(message: string = 'Rate limit exceeded'): ApiError {
  return new ApiError(message, ApiErrorCode.RATE_LIMIT_EXCEEDED, 429)
}

// Async error wrapper for API routes with context
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: { action?: string }
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract path from request if available
      const request = args.find(arg => arg && typeof arg === 'object' && 'url' in arg)
      const path = request ? new URL(request.url).pathname : undefined
      
      return handleApiError(error, path, context)
    }
  }
}

// Database operation wrapper with retry logic
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on validation errors or client errors
      if (error instanceof ApiError && error.statusCode < 500) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }
  
  throw lastError
}

// Type guards for error responses
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && response.code
}

export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true
}