import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger, LogContext } from './logger'
import { 
  ApiError, 
  ApiErrorCode, 
  ApiErrorResponse, 
  ApiSuccessResponse,
  handleApiError as baseHandleApiError 
} from './api-error-handler'

// MongoDB error interface with full typing
interface MongoError extends Error {
  code?: number
  codeName?: string
  keyPattern?: Record<string, any>
  keyValue?: Record<string, any>
}

// Enhanced server-side error handler with full MongoDB support
export function handleServerApiError(
  error: unknown, 
  path?: string, 
  context?: LogContext
): NextResponse<ApiErrorResponse> {
  
  // Enhanced logging with context
  logger.error(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { path, ...context }, error instanceof Error ? error : undefined)

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

  // Enhanced MongoDB error handling with full error details
  if (error instanceof Error && 'code' in error && typeof (error as any).code === 'number') {
    const mongoError = error as MongoError
    let message = 'Database operation failed'
    let statusCode = 500
    let code = ApiErrorCode.DATABASE_ERROR
    let details: any = undefined

    switch (mongoError.code) {
      case 11000: // Duplicate key error
        message = 'Resource already exists'
        statusCode = 409
        code = ApiErrorCode.CONFLICT
        if (process.env.NODE_ENV === 'development' && mongoError.keyValue) {
          details = {
            duplicateField: Object.keys(mongoError.keyValue)[0],
            duplicateValue: Object.values(mongoError.keyValue)[0]
          }
        }
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
      case 2: // BadValue
        message = 'Invalid data provided'
        statusCode = 400
        code = ApiErrorCode.VALIDATION_ERROR
        break
      case 50: // ExceededTimeLimit
        message = 'Database operation timed out'
        statusCode = 504
        code = ApiErrorCode.DATABASE_ERROR
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
        mongoCodeName: mongoError.codeName,
        mongoMessage: mongoError.message,
        ...details
      } : details,
      timestamp,
      path
    }, { status: statusCode })
  }

  // Handle MongoDB connection errors
  if (error instanceof Error && (
    error.message.includes('MongoServerError') ||
    error.message.includes('MongoNetworkError') ||
    error.message.includes('MongoTimeoutError')
  )) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      code: ApiErrorCode.DATABASE_ERROR,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp,
      path
    }, { status: 503 })
  }

  // Fallback to base error handler for other errors
  return baseHandleApiError(error, path, context)
}

// Server-side async error wrapper for API routes with enhanced context
export function withServerErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: { action?: string; resource?: string }
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract path from request if available
      const request = args.find(arg => arg && typeof arg === 'object' && 'url' in arg)
      const path = request ? new URL(request.url).pathname : undefined
      
      return handleServerApiError(error, path, context)
    }
  }
}

// Database operation wrapper with enhanced retry logic and MongoDB-specific error handling
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: { operation?: string }
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
      
      // Don't retry on MongoDB duplicate key errors
      if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Log retry attempt
      logger.warn(`Database operation retry ${attempt}/${maxRetries}`, {
        ...context,
        attempt,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Wait before retrying with exponential backoff and jitter
      const backoffDelay = delay * Math.pow(2, attempt - 1)
      const jitteredDelay = backoffDelay + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }
  
  throw lastError
}

// Export all the base error handler utilities for consistency
export {
  ApiError,
  ApiErrorCode,
  createSuccessResponse,
  validateRequest,
  createAuthError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  isApiError,
  isApiSuccess
} from './api-error-handler'

// Export types separately
export type { ApiErrorResponse, ApiSuccessResponse } from './api-error-handler'