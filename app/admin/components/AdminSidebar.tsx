'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  MessageSquare,
  UserCheck,
  Activity
} from 'lucide-react'
import { canAccessPage } from '@/lib/permissions'
import { IPermissions } from '@/lib/models/AdminUser'

const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard' as keyof IPermissions },
  { name: 'Blog Posts', href: '/admin/blogs', icon: FileText, permission: 'blogs' as keyof IPermissions },
  { name: 'FAQ', href: '/admin/FAQ', icon: FileText, permission: 'FAQ' as keyof IPermissions },
  { name: 'Staff', href: '/admin/staff', icon: UserCheck, permission: 'staff' as keyof IPermissions },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare, permission: 'messages' as keyof IPermissions },
  { name: 'Admin Users', href: '/admin/users', icon: Users, permission: 'users' as keyof IPermissions },
  { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity, permission: 'activity' as keyof IPermissions },
  { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings' as keyof IPermissions },
]

export default function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Get user permissions
  const user = session?.user as any
  const userRole = user?.role as 'admin' | 'seo' | 'custom'
  const userPermissions = user?.permissions as IPermissions | undefined
  
  // Filter navigation items based on permissions
  const allowedNavigationItems = navigationItems.filter(item => 
    canAccessPage(userPermissions, userRole, item.permission)
  )

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isMobileMenuOpen && !target.closest('[data-sidebar]') && !target.closest('[data-sidebar-toggle]')) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        data-sidebar-toggle
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 rounded-md bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 shadow-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center transition-all duration-200"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        data-sidebar
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-5 border-b border-slate-700/50">
            <Link href="/admin" className="flex items-center space-x-3 touch-manipulation w-full" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                <Image
                  src="https://res.cloudinary.com/dkisnzuvo/image/upload/v1759732780/logo_spmerp.png"
                  alt="Admin Panel Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white truncate">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {allowedNavigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation relative
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 active:bg-slate-700/50'
                    }
                  `}
                >
                  <div className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0">
                    <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  </div>
                  <span className="font-medium truncate">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75 flex-shrink-0"></div>
                  )}
                </Link>
              )
            })}
            
            {/* Show message if user has limited access */}
            {allowedNavigationItems.length < navigationItems.length && (
              <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-700/50 mt-4 pt-4">
                Some sections are hidden based on your permissions
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-400 text-center font-medium">
              © {new Date().getFullYear()} Altiora Admin-Panel
            </div>
          </div>
        </div>
      </div>
    </>
  )
}