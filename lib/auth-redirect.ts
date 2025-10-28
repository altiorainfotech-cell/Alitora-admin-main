import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { JWTUtils } from './jwt-utils'

/**
 * Server-side authentication check and redirect utility
 */
export async function requireAuth(redirectTo: string = '/admin/login') {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    redirect(redirectTo)
  }

  try {
    const decoded = JWTUtils.verifyToken(token)
    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    }
  } catch (error) {
    redirect(`${redirectTo}?error=invalid-token`)
  }
}

/**
 * Server-side admin role check and redirect utility
 */
export async function requireAdmin(redirectTo: string = '/admin/login') {
  const auth = await requireAuth(redirectTo)
  
  if (auth.user.role !== 'admin') {
    redirect('/admin?error=insufficient-permissions')
  }

  return auth
}

/**
 * Server-side optional authentication check
 */
export async function getOptionalAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = JWTUtils.verifyToken(token)
    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    }
  } catch (error) {
    return null
  }
}

/**
 * Client-side redirect utility
 */
export function redirectToLogin(error?: string) {
  const url = error ? `/admin/login?error=${encodeURIComponent(error)}` : '/admin/login'
  
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

/**
 * Client-side redirect utility for authenticated users
 */
export function redirectToDashboard() {
  if (typeof window !== 'undefined') {
    window.location.href = '/admin'
  }
}