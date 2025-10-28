'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { useToast } from '@/lib/components/ui/Toast'
import { BulkActions } from '@/app/admin/components/BulkActions'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAllCategories } from '@/lib/hooks/useCategories'
import { hasPermission } from '@/lib/permissions'
import { useSession } from 'next-auth/react'
import Toast from '../components/Toast'
import { ApiCallMonitor } from '../components/ApiCallMonitor'

interface BlogPost {
  _id: string
  id: string
  title: string
  excerpt?: string
  category: string
  status: 'draft' | 'published' | 'archived'
  author: string
  date: string
  image: string
  createdAt: string
  updatedAt: string
}

interface BlogListResponse {
  posts: BlogPost[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function BlogsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { categories } = useAllCategories()
  const { data: session } = useSession()
  
  // All hooks must be called before any conditional returns
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<BlogListResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Track if initial load is complete to prevent unnecessary calls
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Selected posts for bulk operations
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  const fetchPosts = useCallback(async (page = 1, search = searchQuery, status = statusFilter, category = categoryFilter) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (search.trim()) params.append('search', search.trim())
      if (status) params.append('status', status)
      if (category) params.append('category', category)
      
      console.log('🔄 Fetching blogs:', `/api/admin/blogs?${params}`)
      
      const response = await fetch(`/api/admin/blogs?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch blog posts')
      }
      
      setPosts(data.data.posts)
      setPagination(data.data.pagination)
      setCurrentPage(page)
      setInitialLoadComplete(true)
      

    } catch (err) {
      console.error('❌ Error fetching blogs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, categoryFilter])

  // Separate effect for initial load
  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  // Debounced search effect - only run after initial load
  useEffect(() => {
    if (!initialLoadComplete) return
    
    const timeoutId = setTimeout(() => {
      fetchPosts(1, searchQuery, statusFilter, categoryFilter)
    }, searchQuery ? 500 : 0) // 500ms debounce for search, immediate for filters

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, categoryFilter, fetchPosts, initialLoadComplete])

  // Permission checks
  const currentUser = session?.user as any
  const canReadBlogs = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'blogs', 'read')
  const canWriteBlogs = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'blogs', 'write')
  const canDeleteBlogs = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'blogs', 'delete')
  
  // Access control - redirect if no read permission
  if (!canReadBlogs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Blog Posts</h1>
          <p className="text-gray-400 mt-2">Manage your blog content</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-3 text-yellow-400">
            <span>⚠️</span>
            <p>You don&apos;t have permission to access blog posts.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    fetchPosts(page, searchQuery, statusFilter, categoryFilter)
  }

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(posts.map(post => post.id))
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    
    try {
      const response = await fetch(`/api/admin/blogs/${postId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete post')
      }
      
      setToast({ message: 'Blog post deleted successfully', type: 'success' })
      fetchPosts(currentPage, searchQuery, statusFilter, categoryFilter)
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to delete post', 
        type: 'error' 
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} blog posts?`)) return
    
    try {
      const deletePromises = selectedPosts.map(postId => 
        fetch(`/api/admin/blogs/${postId}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      setToast({ message: `${selectedPosts.length} blog posts deleted successfully`, type: 'success' })
      setSelectedPosts([])
      fetchPosts(currentPage, searchQuery, statusFilter, categoryFilter)
    } catch (err) {
      setToast({ 
        message: 'Failed to delete some posts', 
        type: 'error' 
      })
    }
  }

  const handleBulkStatusChange = async (status: 'draft' | 'published' | 'archived') => {
    if (!confirm(`Are you sure you want to change ${selectedPosts.length} blog posts to ${status}?`)) return
    
    try {
      const updatePromises = selectedPosts.map(postId => 
        fetch(`/api/admin/blogs/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      )
      
      await Promise.all(updatePromises)
      
      setToast({ 
        message: `${selectedPosts.length} blog posts updated to ${status} successfully`, 
        type: 'success' 
      })
      setSelectedPosts([])
      fetchPosts(currentPage, searchQuery, statusFilter, categoryFilter)
    } catch (err) {
      setToast({ 
        message: 'Failed to update some posts', 
        type: 'error' 
      })
    }
  }

  const handleClearSelection = () => {
    setSelectedPosts([])
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-gray-400 mt-1">Manage your blog content</p>
        </div>
        {canWriteBlogs && (
          <Button
            onClick={() => router.push('/admin/blogs/new')}
            icon={<Plus size={16} />}
          >
            New Post
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <FormInput
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <FormSelect
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' }
            ]}
          />
          <FormSelect
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat.name, label: cat.name }))
            ]}
          />
        </div>
        
        {(canWriteBlogs || canDeleteBlogs) && (
          <BulkActions
            selectedCount={selectedPosts.length}
            onBulkDelete={canDeleteBlogs ? handleBulkDelete : undefined}
            onBulkStatusChange={canWriteBlogs ? handleBulkStatusChange : undefined}
            onClearSelection={handleClearSelection}
            loading={loading}
          />
        )}
      </div>

      {/* Posts Table */}
      {error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchPosts(currentPage, searchQuery, statusFilter, categoryFilter)}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">No blog posts found</p>
          {canWriteBlogs && (
            <Button
              onClick={() => router.push('/admin/blogs/new')}
              icon={<Plus size={16} />}
            >
              Create Your First Post
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left">
                    {(canWriteBlogs || canDeleteBlogs) && (
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === posts.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Author</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {(canWriteBlogs || canDeleteBlogs) && (
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => handleSelectPost(post.id)}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={post.image}
                          alt={post.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-white font-medium truncate max-w-xs">{post.title}</p>
                          {post.excerpt && (
                            <p className="text-gray-400 text-sm truncate max-w-xs">{post.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{post.category}</td>
                    <td className="px-4 py-3">{getStatusBadge(post.status)}</td>
                    <td className="px-4 py-3 text-gray-300">{post.author}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(post.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-2">
                        {canWriteBlogs && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/blogs/${post.id}/edit`)}
                            icon={<Edit size={14} />}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/blog/${post.id}`, '_blank')}
                          icon={<Eye size={14} />}
                        >
                          View
                        </Button>
                        {canDeleteBlogs && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            icon={<Trash2 size={14} />}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} posts
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-gray-300 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* API Call Monitor - Remove in production */}
      <ApiCallMonitor />
    </div>
  )
}