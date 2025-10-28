import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './rate-limit'
import { sanitizeInput, scanFileContent, hasSuspiciousFilePattern, getSecurityHeaders } from './security'

interface SecurityConfig {
  enableRateLimit?: boolean
  enableCSRF?: boolean
  enableXSSProtection?: boolean
  enableFileScanning?: boolean
  logSuspiciousActivity?: boolean
}

interface SecurityResult {
  allowed: boolean
  reason?: string
  headers?: Record<string, string>
  status?: number
}

/**
 * Comprehensive security middleware for API routes
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<SecurityResult> {
  const {
    enableRateLimit = true,
    enableCSRF = true,
    enableXSSProtection = true,
    enableFileScanning = true,
    logSuspiciousActivity = true
  } = config

  const pathname = new URL(request.url).pathname
  const method = request.method
  const userAgent = request.headers.get('user-agent') || ''
  const ip = getClientIP(request)

  // Apply security headers
  const securityHeaders = getSecurityHeaders()

  // 1. Rate limiting
  if (enableRateLimit) {
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      if (logSuspiciousActivity) {
        console.warn(`Rate limit exceeded: ${ip} on ${pathname}`)
      }
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        status: 429,
        headers: {
          ...securityHeaders,
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || Date.now().toString()
        }
      }
    }
  }

  // 2. CSRF protection for state-changing operations
  if (enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfValid = validateCSRFToken(request)
    if (!csrfValid) {
      if (logSuspiciousActivity) {
        console.warn(`CSRF token validation failed: ${ip} on ${pathname}`)
      }
      
      return {
        allowed: false,
        reason: 'Invalid CSRF token',
        status: 403,
        headers: securityHeaders
      }
    }
  }

  // 3. Suspicious request detection
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS attempts
    /<script|javascript:|vbscript:|onload=|onerror=/i,
    // Path traversal
    /\.\.|\/\.\.|\\\.\.|\%2e\%2e/i,
    // Command injection
    /(\||;|&|\$\(|\`)/,
    // Common attack tools
    /(sqlmap|nmap|nikto|burp|acunetix)/i
  ]

  const queryString = new URL(request.url).search
  const suspiciousInQuery = suspiciousPatterns.some(pattern => pattern.test(queryString))
  const suspiciousInUserAgent = suspiciousPatterns.some(pattern => pattern.test(userAgent))

  if (suspiciousInQuery || suspiciousInUserAgent) {
    if (logSuspiciousActivity) {
      console.warn(`Suspicious request detected: ${ip} on ${pathname}`, {
        userAgent,
        queryString,
        suspiciousInQuery,
        suspiciousInUserAgent
      })
    }
    
    return {
      allowed: false,
      reason: 'Suspicious request pattern detected',
      status: 400,
      headers: securityHeaders
    }
  }

  // 4. File upload security (for multipart requests)
  if (enableFileScanning && request.headers.get('content-type')?.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const files = Array.from(formData.values()).filter(value => value instanceof File) as File[]
      
      for (const file of files) {
        // Check filename for suspicious patterns
        if (hasSuspiciousFilePattern(file.name)) {
          if (logSuspiciousActivity) {
            console.warn(`Suspicious filename detected: ${file.name} from ${ip}`)
          }
          
          return {
            allowed: false,
            reason: 'Suspicious file detected',
            status: 400,
            headers: securityHeaders
          }
        }

        // Scan file content for malware
        const buffer = Buffer.from(await file.arrayBuffer())
        const scanResult = scanFileContent(buffer, file.name)
        
        if (!scanResult.isSafe) {
          if (logSuspiciousActivity) {
            console.warn(`Malware detected in file: ${file.name} from ${ip}`, {
              threats: scanResult.threats,
              confidence: scanResult.confidence
            })
          }
          
          return {
            allowed: false,
            reason: `File security scan failed: ${scanResult.threats.join(', ')}`,
            status: 400,
            headers: securityHeaders
          }
        }
      }
    } catch (error) {
      // If we can't scan the file, be cautious and reject
      if (logSuspiciousActivity) {
        console.warn(`File scanning failed for request from ${ip}:`, error)
      }
      
      return {
        allowed: false,
        reason: 'File validation failed',
        status: 400,
        headers: securityHeaders
      }
    }
  }

  // 5. XSS protection for JSON payloads
  if (enableXSSProtection && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const body = await request.json()
        const sanitizedBody = sanitizeObjectInputs(body)
        
        // Check if sanitization changed the input significantly
        const originalStr = JSON.stringify(body)
        const sanitizedStr = JSON.stringify(sanitizedBody)
        
        if (originalStr !== sanitizedStr) {
          if (logSuspiciousActivity) {
            console.warn(`XSS attempt detected in JSON payload from ${ip}`)
          }
          
          return {
            allowed: false,
            reason: 'Potentially malicious content detected',
            status: 400,
            headers: securityHeaders
          }
        }
      }
    } catch (error) {
      // If we can't parse JSON, let the endpoint handle it
    }
  }

  return {
    allowed: true,
    headers: securityHeaders
  }
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(request: NextRequest): boolean {
  const csrfToken = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value
  
  return csrfToken === csrfCookie && csrfToken !== undefined && csrfToken !== null
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'
}

/**
 * Recursively sanitize object inputs
 */
function sanitizeObjectInputs(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj, { strictMode: true })
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectInputs)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeInput(key, { strictMode: true, maxLength: 100 })
      sanitized[sanitizedKey] = sanitizeObjectInputs(value)
    }
    return sanitized
  }
  
  return obj
}

/**
 * Security wrapper for API routes
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: SecurityConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const securityResult = await securityMiddleware(request, config)
    
    if (!securityResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: securityResult.reason || 'Security check failed' 
        },
        { 
          status: securityResult.status || 400,
          headers: securityResult.headers
        }
      )
    }
    
    const response = await handler(request)
    
    // Add security headers to response
    if (securityResult.headers) {
      Object.entries(securityResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    return response
  }
}