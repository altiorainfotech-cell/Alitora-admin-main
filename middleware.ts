import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { SecurityAuditor } from '@/lib/security-audit'

function validateCSRFToken(request: NextRequest): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  const csrfToken = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value

  return csrfToken === csrfCookie && csrfToken !== undefined
}

function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  let auditResult: { score: number; riskLevel: 'low' | 'medium' | 'high' | 'critical'; issues?: any[] } = { 
    score: 100, 
    riskLevel: 'low' 
  }
  
  try {
    auditResult = SecurityAuditor.auditRequest(request)
    
    if (auditResult.riskLevel === 'critical') {
      console.error('Critical security threat detected:', auditResult)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Request blocked for security reasons' 
        },
        { status: 403 }
      )
    }

    if (auditResult.riskLevel === 'high') {
      console.warn('High-risk request detected:', {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
        issues: auditResult.issues || []
      })
    }
  } catch (error) {
    console.error('Security audit error:', error)
  }

  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.reset?.toString() || Date.now().toString()
          }
        }
      )
    }
  }

  if (pathname.startsWith('/api/admin/') || 
      (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method))) {
  }

  if (!request.cookies.get('csrf-token')) {
    const csrfToken = generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    })
  }

  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-Security-Score', auditResult.score.toString())
  
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)

  // Handle admin route protection
  if (pathname.startsWith('/admin') && 
      !pathname.startsWith('/admin/login') && 
      !pathname.startsWith('/admin/forgot-password') &&
      !pathname.startsWith('/admin/reset-password') &&
      !pathname.startsWith('/api/auth')) {
    
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
      })

      console.log('Middleware - checking token for path:', pathname)
      console.log('Middleware - token exists:', !!token)
      
      if (!token) {
        console.log('Middleware - no token, redirecting to login')
        const loginUrl = new URL('/admin/login', request.url)
        // Add current path as callback URL for post-login redirect
        if (pathname !== '/admin') {
          loginUrl.searchParams.set('callbackUrl', pathname)
        }
        return NextResponse.redirect(loginUrl)
      }

      // Check if user account is active
      if (token.status !== 'active') {
        console.log('Middleware - inactive user, redirecting to login')
        return NextResponse.redirect(new URL('/admin/login?error=account-disabled', request.url))
      }
      
      console.log('Middleware - token valid, allowing access')
      
      // Add user info to request headers for downstream use
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', token.userId as string)
      requestHeaders.set('x-user-email', token.email as string)
      requestHeaders.set('x-user-role', token.role as string)

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    } catch (error) {
      console.error('Middleware - token verification error:', error)
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/admin/login?error=invalid-token', request.url))
    }
  }

  // Redirect to admin dashboard if already authenticated
  if (pathname === '/admin/login') {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
      })
      
      console.log('Middleware - login page, checking existing token:', !!token)
      
      if (token && token.status === 'active') {
        console.log('Middleware - user already authenticated, redirecting to dashboard')
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/admin'
        return NextResponse.redirect(new URL(callbackUrl, request.url))
      }
    } catch (error) {
      console.error('Middleware - login page token check error:', error)
      // Invalid token, allow access to login page
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/categories/:path*',
    '/api/blogs/:path*',
    '/api/dashboard/:path*',
    '/api/health/:path*',
    '/api/upload/:path*'
  ]
}