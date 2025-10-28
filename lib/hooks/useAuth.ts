import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'loading') {
      // Still loading, don't redirect yet
      return
    }

    if (requireAuth && status === 'unauthenticated') {
      // Not authenticated, redirect to login
      router.push('/admin/login')
      return
    }

    if (requireAuth && session?.user?.status === 'inactive') {
      // Account disabled, redirect to login with error
      router.push('/admin/login?error=account-disabled')
      return
    }

    if (!requireAuth && status === 'authenticated' && session?.user?.status === 'active') {
      // Already authenticated and trying to access login page, redirect to dashboard
      // Only redirect if we're actually on the login page to avoid redirect loops
      if (typeof window !== 'undefined' && window.location.pathname === '/admin/login') {
        router.push('/admin')
      }
      return
    }
  }, [session, status, requireAuth, router])

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && session?.user?.status === 'active',
    user: session?.user
  }
}

export function useRequireAuth() {
  return useAuth(true)
}

export function useOptionalAuth() {
  return useAuth(false)
}