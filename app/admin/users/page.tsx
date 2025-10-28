'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { IAdminUser, IPermissions } from '@/lib/models/AdminUser'
import { ApiResponse } from '@/types'
import { PERMISSION_LEVELS, hasPermission } from '@/lib/permissions'
import AdminUserForm from '../components/AdminUserForm'
import Toast from '../components/Toast'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Eye,
  EyeOff
} from 'lucide-react'

import RefreshSession from '../components/RefreshSession'

interface AdminUserWithCounts extends IAdminUser {
  _count?: {
    activityLogs: number
  }
}

interface UsersResponse {
  users: AdminUserWithCounts[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUserWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserWithCounts | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUserWithCounts | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showPermissions, setShowPermissions] = useState<string | null>(null)
  
  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'admin' | 'seo' | 'custom' | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Check if current user has permission to manage users
  const currentUser = session?.user as any
  const canManageUsers = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'users', 'read')
  const canCreateUsers = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'users', 'write')
  const canDeleteUsers = currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'users', 'delete')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success && data.data) {
        setUsers(data.data.users || data.data)
        setPagination(data.data.pagination || {
          page: 1,
          limit: 20,
          total: data.data.length || 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        })
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers()
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, canManageUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateUser = async (userData: any) => {
    try {
      setFormLoading(true)

      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data: ApiResponse = await response.json()

      if (data.success) {
        setToast({ message: 'User created successfully', type: 'success' })
        setShowCreateForm(false)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to create user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to create user', type: 'error' })
      console.error('Error creating user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'User updated successfully', type: 'success' })
        setEditingUser(null)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to update user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to update user', type: 'error' })
      console.error('Error updating user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/admin/users/${deletingUser._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'User deleted successfully', type: 'success' })
        setDeletingUser(null)
        fetchUsers()
      } else {
        setToast({ message: data.error || 'Failed to delete user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to delete user', type: 'error' })
      console.error('Error deleting user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-900 text-purple-300'
      case 'seo':
        return 'bg-green-900 text-green-300'
      case 'custom':
        return 'bg-blue-900 text-blue-300'
      default:
        return 'bg-gray-900 text-gray-300'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />
      case 'seo':
        return <Shield className="w-4 h-4" />
      case 'custom':
        return <ShieldX className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full administrative access'
      case 'seo':
        return 'SEO and content management'
      case 'custom':
        return 'Custom permissions'
      default:
        return 'Unknown role'
    }
  }

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Users</h1>
          <p className="text-gray-400 mt-2">Manage admin user accounts and permissions</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <ShieldX className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-300">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don&apos;t have permission to manage admin users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Create New Admin User</h1>
          <p className="text-gray-400 mt-2">Add a new admin user to the system</p>
        </div>
        
        <AdminUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
          isLoading={formLoading}
        />
      </div>
    )
  }

  if (editingUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Edit Admin User</h1>
          <p className="text-gray-400 mt-2">Update user information and permissions</p>
        </div>
        
        <AdminUserForm
          user={editingUser as any}
          onSubmit={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
          isLoading={formLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!session?.user?.permissions && session?.user?.role === 'admin' && <RefreshSession />}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Users</h1>
          <p className="text-gray-400 mt-2">Manage admin user accounts and permissions</p>
        </div>
        {canCreateUsers && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-md flex items-center justify-center touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Admin User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
              Search by email
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              placeholder="Enter email address..."
            />
          </div>
          
          <div className="w-full sm:w-auto min-w-[120px]">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'admin' | 'seo' | 'custom' | '')}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="seo">SEO Manager</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto min-w-[120px]">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
              className="w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            Search
          </button>
          
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
                setStatusFilter('')
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-400">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">Error Loading Users</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No Users Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || roleFilter || statusFilter 
                ? 'No users match your current filters.'
                : 'Get started by creating your first user.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role & Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id as string} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-300">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-100">{user.name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                          </span>
                          {user.role === 'custom' && (
                            <button
                              onClick={() => setShowPermissions(showPermissions === user._id ? null : user._id as string)}
                              className="text-gray-400 hover:text-gray-300"
                              title="View permissions"
                            >
                              {showPermissions === user._id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{getRoleDescription(user.role)}</div>
                        {showPermissions === user._id && user.permissions && (
                          <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                            <div className="grid grid-cols-2 gap-1">
                              {Object.entries(user.permissions).map(([page, permission]) => {
                                if (page === 'dashboard') return null
                                return (
                                  <div key={page} className="flex justify-between">
                                    <span className="text-gray-400 capitalize">{page}:</span>
                                    <span className={`${permission === 'none' ? 'text-red-400' : permission === 'full' ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {permission}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {(currentUser?.role === 'admin' || hasPermission(currentUser?.permissions, currentUser?.role, 'users', 'write')) && (
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-400 hover:text-blue-300"
                              title="Edit user"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                          {canDeleteUsers && user._id !== currentUser?.id && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="text-red-400 hover:text-red-300"
                              title="Delete user"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between border-t border-gray-600">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Delete Admin User</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deletingUser.name || deletingUser.email}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={formLoading}
              >
                {formLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
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
    </div>
  )
}