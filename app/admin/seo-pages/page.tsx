'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Globe, 
  Search, 
  Edit, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock
} from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { useToast } from '@/lib/components/ui/Toast'
import { PREDEFINED_PAGES, PredefinedPage } from '@/lib/data/predefined-pages'
import { BulkSEOOperations } from '@/app/admin/components/seo/BulkSEOOperations'
import { SEOAuditLogs } from '@/app/admin/components/seo/SEOAuditLogs'
import { SitemapManager } from '@/app/admin/components/seo/SitemapManager'
import { PerformanceDashboard } from '@/app/admin/components/seo/PerformanceDashboard'

interface SEOPageData {
  _id?: string
  path: string
  slug: string
  metaTitle: string
  metaDescription: string
  isCustom: boolean
  pageCategory: string
  updatedAt?: string
  updatedBy?: string
}

interface BulkAction {
  type: 'reset' | 'export' | 'update'
  label: string
  icon: React.ComponentType<any>
  description: string
}

const BULK_ACTIONS: BulkAction[] = [
  {
    type: 'reset',
    label: 'Reset to Default',
    icon: RotateCcw,
    description: 'Reset selected pages to default SEO values'
  },
  {
    type: 'export',
    label: 'Export Data',
    icon: Download,
    description: 'Export selected pages SEO data as CSV'
  }
]

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Categories' },
  { value: 'main', label: 'Main Pages' },
  { value: 'services', label: 'Services' },
  { value: 'blog', label: 'Blog' },
  { value: 'about', label: 'About' },
  { value: 'contact', label: 'Contact' },
  { value: 'other', label: 'Other' }
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'custom', label: 'Custom SEO' },
  { value: 'default', label: 'Default SEO' }
]

export default function SEOPagesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [seoPages, setSeoPages] = useState<SEOPageData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [bulkActionOpen, setBulkActionOpen] = useState(false)
  const [showBulkOperations, setShowBulkOperations] = useState(false)
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const [showSitemapManager, setShowSitemapManager] = useState(false)
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false)
  const [editingPage, setEditingPage] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ metaTitle: '', metaDescription: '' })
  const toast = useToast()

  const loadSEOPages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/seo-pages')
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Not authenticated')
        }
        throw new Error('Failed to load SEO pages')
      }
      
      const result = await response.json()
      
      // Handle API response structure
      if (!result.success) {
        throw new Error(result.error || 'Failed to load SEO pages')
      }
      
      const data = result.data.pages || []
      
      // Merge with predefined pages to show all 57 pages
      const mergedPages = PREDEFINED_PAGES.map(predefinedPage => {
        const existingSEO = data.find((seo: SEOPageData) => seo.path === predefinedPage.path)
        
        return {
          path: predefinedPage.path,
          slug: existingSEO?.slug || predefinedPage.defaultSlug,
          metaTitle: existingSEO?.metaTitle || predefinedPage.defaultTitle,
          metaDescription: existingSEO?.metaDescription || predefinedPage.defaultDescription,
          isCustom: !!existingSEO,
          pageCategory: predefinedPage.category,
          _id: existingSEO?._id,
          updatedAt: existingSEO?.updatedAt,
          updatedBy: existingSEO?.updatedBy
        }
      })
      
      setSeoPages(mergedPages)
    } catch (error: any) {
      console.error('Error loading SEO pages:', error)
      
      // Handle authentication errors
      if (error.message?.includes('Not authenticated') || error.message?.includes('Access denied')) {
        toast.error('Please log in to access SEO pages')
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/admin/login?error=Session expired. Please log in again.')
        }, 2000)
      } else {
        toast.error('Failed to load SEO pages')
      }
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  // Load SEO pages data
  useEffect(() => {
    if (session?.user) {
      loadSEOPages()
    } else if (session === null) {
      // Session is null (not loading), user is not authenticated
      setLoading(false)
      toast.error('Please log in to access SEO pages')
      setTimeout(() => {
        router.push('/admin/login?error=Authentication required')
      }, 2000)
    }
  }, [session, loadSEOPages, router, toast])

  // Filter pages based on search and filters
  const filteredPages = seoPages.filter(page => {
    const matchesSearch = page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.metaTitle.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || page.pageCategory === categoryFilter
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'custom' && page.isCustom) ||
                         (statusFilter === 'default' && !page.isCustom)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Handle page selection
  const handlePageSelection = (path: string, checked: boolean) => {
    if (checked) {
      setSelectedPages([...selectedPages, path])
    } else {
      setSelectedPages(selectedPages.filter(p => p !== path))
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPages(filteredPages.map(page => page.path))
    } else {
      setSelectedPages([])
    }
  }

  // Handle inline editing
  const startEditing = (page: SEOPageData) => {
    setEditingPage(page.path)
    setEditForm({
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription
    })
  }

  const cancelEditing = () => {
    setEditingPage(null)
    setEditForm({ metaTitle: '', metaDescription: '' })
  }

  const saveInlineEdit = async (path: string) => {
    try {
      const response = await fetch('/api/admin/seo-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          metaTitle: editForm.metaTitle,
          metaDescription: editForm.metaDescription
        })
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Authentication required')
          setTimeout(() => router.push('/admin/login'), 2000)
          return
        }
        throw new Error('Failed to save SEO data')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to save SEO data')
      }

      toast.success('SEO data saved successfully')
      setEditingPage(null)
      loadSEOPages()
    } catch (error: any) {
      console.error('Error saving SEO data:', error)
      toast.error(error.message || 'Failed to save SEO data')
    }
  }

  // Handle reset to default
  const resetToDefault = async (path: string) => {
    try {
      const response = await fetch(`/api/admin/seo-pages/${encodeURIComponent(path)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Authentication required')
          setTimeout(() => router.push('/admin/login'), 2000)
          return
        }
        throw new Error('Failed to reset SEO data')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset SEO data')
      }

      toast.success('SEO data reset to default')
      loadSEOPages()
    } catch (error: any) {
      console.error('Error resetting SEO data:', error)
      toast.error(error.message || 'Failed to reset SEO data')
    }
  }

  // Handle bulk actions
  const executeBulkAction = async (action: string) => {
    if (selectedPages.length === 0) {
      toast.error('Please select pages first')
      return
    }

    try {
      switch (action) {
        case 'reset':
          await Promise.all(selectedPages.map(path => resetToDefault(path)))
          toast.success(`Reset ${selectedPages.length} pages to default`)
          break
        case 'export':
          exportSelectedPages()
          break
      }
      
      setSelectedPages([])
      setBulkActionOpen(false)
    } catch (error) {
      console.error('Error executing bulk action:', error)
      toast.error('Failed to execute bulk action')
    }
  }

  // Export selected pages
  const exportSelectedPages = () => {
    const selectedData = filteredPages.filter(page => selectedPages.includes(page.path))
    const csvContent = [
      ['Path', 'Slug', 'Meta Title', 'Meta Description', 'Category', 'Status'],
      ...selectedData.map(page => [
        page.path,
        page.slug,
        page.metaTitle,
        page.metaDescription,
        page.pageCategory,
        page.isCustom ? 'Custom' : 'Default'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-pages-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('SEO data exported successfully')
  }

  if (loading || session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If no session and not loading, show error state
  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the SEO management system.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">SEO Pages Management</h1>
                <p className="text-slate-400 mt-1">
                  Manage SEO metadata for all {PREDEFINED_PAGES.length} website pages
                </p>
              </div>
            </div>
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{seoPages.filter(p => p.isCustom).length}</div>
                    <div className="text-xs text-slate-400">Custom SEO</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{PREDEFINED_PAGES.length}</div>
                    <div className="text-xs text-slate-400">Total Pages</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{seoPages.filter(p => !p.isCustom).length}</div>
                    <div className="text-xs text-slate-400">Default SEO</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{Math.round((seoPages.filter(p => p.isCustom).length / PREDEFINED_PAGES.length) * 100)}%</div>
                    <div className="text-xs text-slate-400">Optimized</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowPerformanceDashboard(true)}
              variant="secondary"
              className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 border-slate-600/50"
            >
              <TrendingUp className="w-4 h-4" />
              Performance
            </Button>
            
            <Button
              onClick={() => setShowSitemapManager(true)}
              variant="secondary"
              className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 border-slate-600/50"
            >
              <Globe className="w-4 h-4" />
              Sitemap
            </Button>
            
            <Button
              onClick={() => setShowAuditLogs(true)}
              variant="secondary"
              className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 border-slate-600/50"
            >
              <Clock className="w-4 h-4" />
              Audit Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Search & Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Search Pages</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by path or title..."
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {CATEGORY_FILTERS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">SEO Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {STATUS_FILTERS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Actions</label>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBulkOperations(true)}
                disabled={selectedPages.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk ({selectedPages.length})
              </Button>
              
              <div className="relative">
                <Button
                  onClick={() => setBulkActionOpen(!bulkActionOpen)}
                  disabled={selectedPages.length === 0}
                  variant="secondary"
                  className="bg-slate-700/50 hover:bg-slate-700 border-slate-600/50"
                >
                  {bulkActionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                
                {bulkActionOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-20">
                    {BULK_ACTIONS.map(action => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.type}
                          onClick={() => executeBulkAction(action.type)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-700/50 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          <Icon className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium text-slate-200">{action.label}</div>
                            <div className="text-sm text-slate-400">{action.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-300">{filteredPages.length}</span> of <span className="font-medium text-slate-300">{seoPages.length}</span> pages
          </div>
          {selectedPages.length > 0 && (
            <div className="text-sm text-blue-400 font-medium">
              {selectedPages.length} selected
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Pages Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Page</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Meta Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Meta Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredPages.map((page) => (
                <tr key={page.path} className="hover:bg-slate-700/30 transition-colors duration-200">
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.path)}
                      onChange={(e) => handlePageSelection(page.path, e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                    />
                  </td>
                  
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{page.path}</div>
                        <div className="text-sm text-slate-400 capitalize flex items-center gap-2">
                          <span className="px-2 py-1 bg-slate-700/50 rounded text-xs">{page.pageCategory}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 max-w-xs">
                    {editingPage === page.path ? (
                      <input
                        type="text"
                        value={editForm.metaTitle}
                        onChange={(e) => setEditForm({ ...editForm, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        maxLength={60}
                      />
                    ) : (
                      <div className="truncate" title={page.metaTitle}>
                        {page.metaTitle}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {editingPage === page.path ? editForm.metaTitle.length : page.metaTitle.length}/60 chars
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 max-w-sm">
                    {editingPage === page.path ? (
                      <textarea
                        value={editForm.metaDescription}
                        onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        maxLength={160}
                      />
                    ) : (
                      <div className="line-clamp-3" title={page.metaDescription}>
                        {page.metaDescription}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {editingPage === page.path ? editForm.metaDescription.length : page.metaDescription.length}/160 chars
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {page.isCustom ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">Custom</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Default</span>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {editingPage === page.path ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveInlineEdit(page.path)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEditing(page)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {page.isCustom && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => resetToDefault(page.path)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Operations Modal */}
      {showBulkOperations && (
        <BulkSEOOperations
          selectedPaths={selectedPages}
          onOperationComplete={() => {
            loadSEOPages()
            setSelectedPages([])
            setShowBulkOperations(false)
          }}
          onClose={() => setShowBulkOperations(false)}
        />
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <SEOAuditLogs
          onClose={() => setShowAuditLogs(false)}
        />
      )}

      {/* Sitemap Manager Modal */}
      {showSitemapManager && (
        <SitemapManager
          onClose={() => setShowSitemapManager(false)}
        />
      )}

      {/* Performance Dashboard Modal */}
      {showPerformanceDashboard && (
        <PerformanceDashboard
          onClose={() => setShowPerformanceDashboard(false)}
        />
      )}

      {/* Toast Notification */}

    </div>
  )
}