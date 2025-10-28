// CSRF token utilities for client-side requests

export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='))
  
  if (!csrfCookie) {
    return null
  }
  
  return csrfCookie.split('=')[1]
}

export function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const csrfToken = getCSRFToken()
    
    const headers = new Headers(options.headers)
    
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
      headers.set('x-csrf-token', csrfToken)
    }
    
    headers.set('Content-Type', 'application/json')
    
    return fetch(url, {
      ...options,
      headers
    })
  }
}

// Helper for making authenticated API calls
export const authenticatedFetch = createAuthenticatedFetch()