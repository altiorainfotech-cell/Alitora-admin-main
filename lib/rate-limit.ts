import { NextRequest } from 'next/server'

interface RateLimitResult {
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  retryAfter?: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export async function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  // Skip rate limiting in development mode
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowMs
    }
  }
  // Get client identifier (IP address or user ID)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'
  const userId = request.headers.get('x-user-id')
  const userAgent = request.headers.get('user-agent') || ''
  const identifier = userId || ip

  // Different limits for different endpoints and user types
  const pathname = new URL(request.url).pathname
  let adjustedLimit = limit
  let adjustedWindow = windowMs

  // Check if request is from a bot/crawler
  const isBotRequest = /bot|crawler|spider|scraper|curl|wget|python|java|go-http-client/i.test(userAgent)

  // Stricter limits for bots
  if (isBotRequest) {
    adjustedLimit = Math.floor(limit * 0.1) // 10% of normal limit
    adjustedWindow = windowMs * 2 // Double the window
  }

  // Endpoint-specific rate limits
  if (pathname.includes('/auth/login')) {
    adjustedLimit = isBotRequest ? 2 : 5 // Very strict for login
    adjustedWindow = 15 * 60 * 1000 // per 15 minutes
  } else if (pathname.includes('/auth/reset-password')) {
    adjustedLimit = isBotRequest ? 1 : 3 // Very strict for password reset
    adjustedWindow = 60 * 60 * 1000 // per hour
  } else if (pathname.includes('/upload')) {
    adjustedLimit = isBotRequest ? 5 : 20 // 20 uploads per hour for humans
    adjustedWindow = 60 * 60 * 1000 // per hour
  } else if (pathname.startsWith('/api/admin/users')) {
    adjustedLimit = isBotRequest ? 10 : 50 // User management operations
    adjustedWindow = 60 * 60 * 1000 // per hour
  } else if (pathname.startsWith('/api/admin/')) {
    adjustedLimit = isBotRequest ? 20 : 200 // Higher limit for admin users
  } else if (request.method === 'GET') {
    adjustedLimit = isBotRequest ? 50 : 300 // Higher limit for read operations
  } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    adjustedLimit = isBotRequest ? 10 : 100 // Stricter for write operations
  }

  // Progressive rate limiting - increase restrictions for repeated violations
  const violationKey = `violations:${identifier}`
  const violationRecord = store[violationKey]

  if (violationRecord && violationRecord.count > 3) {
    // Apply progressive penalties
    adjustedLimit = Math.floor(adjustedLimit * 0.5) // Halve the limit
    adjustedWindow = adjustedWindow * 2 // Double the window
  }

  const key = `${identifier}:${pathname}:${request.method}`
  const now = Date.now()
  const resetTime = now + adjustedWindow

  // Initialize or get existing record
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime
    }

    return {
      success: true,
      limit: adjustedLimit,
      remaining: adjustedLimit - 1,
      reset: resetTime
    }
  }

  // Increment counter
  store[key].count++

  // Check if limit exceeded
  if (store[key].count > adjustedLimit) {
    // Record violation for progressive limiting
    if (!store[violationKey] || store[violationKey].resetTime < now) {
      store[violationKey] = { count: 1, resetTime: now + 24 * 60 * 60 * 1000 } // 24 hour window
    } else {
      store[violationKey].count++
    }

    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)

    // Log suspicious activity for security monitoring (only in production)
    if (process.env.NODE_ENV === 'production' && store[key].count > adjustedLimit * 2) {
      console.warn(`Suspicious activity detected: ${identifier} exceeded rate limit by ${store[key].count - adjustedLimit} requests on ${pathname}`)
    }

    return {
      success: false,
      limit: adjustedLimit,
      remaining: 0,
      reset: store[key].resetTime,
      retryAfter
    }
  }

  return {
    success: true,
    limit: adjustedLimit,
    remaining: adjustedLimit - store[key].count,
    reset: store[key].resetTime
  }
}

// Helper function to get rate limit status without incrementing
export function getRateLimitStatus(
  identifier: string,
  pathname: string,
  limit: number = 100
): RateLimitResult {
  const key = `${identifier}:${pathname}`
  const now = Date.now()

  if (!store[key] || store[key].resetTime < now) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: now + 15 * 60 * 1000
    }
  }

  return {
    success: store[key].count <= limit,
    limit,
    remaining: Math.max(0, limit - store[key].count),
    reset: store[key].resetTime
  }
}