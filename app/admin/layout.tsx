'use client'

import { usePathname } from 'next/navigation'
import { Providers } from '@/app/providers'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import PerformanceMonitor from './components/PerformanceMonitor'
import { useRequireAuth } from '@/lib/hooks/useAuth'
import { ToastProvider } from '@/lib/components/ui'

// Pages that should not use the admin layout (auth pages)
const AUTH_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const { isLoading, isAuthenticated } = useRequireAuth()

  // For auth pages, render children directly without admin layout
  if (isAuthPage) {
    return <>{children}</>
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render admin content if not authenticated (redirect will happen in useRequireAuth)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Redirecting...</div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Background Pattern */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <PerformanceMonitor />
      </div>
    </ToastProvider>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </Providers>
  )
}