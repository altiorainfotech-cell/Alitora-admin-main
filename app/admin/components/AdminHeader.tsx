'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { LogOut, User, ChevronDown, Bell, Search } from 'lucide-react'

const getPageTitle = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 1) return 'Admin Dashboard'
  
  const page = segments[segments.length - 1]
  return page.charAt(0).toUpperCase() + page.slice(1)
}

export default function AdminHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  const handleLogout = async () => {
    try {
      // Clear JWT token
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (logError) {
      console.error('Failed to clear JWT token:', logError)
    }

    try {
      // Use signOut with explicit redirect to admin login
      const result = await signOut({ 
        callbackUrl: '/admin/login',
        redirect: false // Handle redirect manually for better control
      })
      
      // Manual redirect to ensure we go to admin login
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: manual redirect if signOut fails
      window.location.href = '/admin/login'
    }
  }

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-6 relative z-30 flex-shrink-0">
      {/* Left side - Page title */}
      <div className="flex items-center min-w-0 flex-1">
        <h1 className="text-xl font-bold text-white ml-12 lg:ml-0 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Center - Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-600/50 rounded-lg bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side - Actions and User menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-slate-800/50 transition-all duration-200 touch-manipulation"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-white truncate max-w-32">
                {session?.user?.email?.split('@')[0] || 'admin'}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {session?.user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <>
              {/* Overlay to close dropdown */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown content */}
              <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-20">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <div className="text-sm font-medium text-white truncate">
                      {session?.user?.email || 'admin@example.com'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Signed in as {session?.user?.role || 'Admin'}
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200 touch-manipulation"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}