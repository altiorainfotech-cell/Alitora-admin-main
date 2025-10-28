'use client'

import { useState, useEffect } from 'react'
import { IPermissions } from '@/lib/models/AdminUser'
import { PERMISSION_LEVELS, ADMIN_PAGES, DEFAULT_PERMISSIONS, validatePermissions, PermissionLevel } from '@/lib/permissions'

interface AdminUser {
  _id?: string
  email: string
  name: string
  role: 'admin' | 'seo' | 'custom'
  status: 'active' | 'inactive'
  permissions?: IPermissions
}

interface AdminUserFormProps {
  user?: AdminUser
  onSubmit: (userData: any) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function AdminUserForm({ user, onSubmit, onCancel, isLoading }: AdminUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'custom' as 'admin' | 'seo' | 'custom',
    status: 'active' as 'active' | 'inactive',
    permissions: DEFAULT_PERMISSIONS.custom
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPermissions, setShowPermissions] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        name: user.name,
        password: '',
        confirmPassword: '',
        role: user.role,
        status: user.status,
        permissions: user.permissions || DEFAULT_PERMISSIONS[user.role]
      })
      setShowPermissions(user.role === 'custom')
    }
  }, [user])

  useEffect(() => {
    // Update permissions when role changes
    if (formData.role !== 'custom') {
      setFormData(prev => ({
        ...prev,
        permissions: DEFAULT_PERMISSIONS[prev.role]
      }))
      setShowPermissions(false)
    } else {
      setShowPermissions(true)
    }
  }, [formData.role])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePermissionChange = (page: keyof IPermissions, value: string) => {
    if (page === 'dashboard') return // Dashboard permission cannot be changed
    
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [page]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: any = {
      email: formData.email.trim(),
      name: formData.name.trim(),
      role: formData.role,
      status: formData.status,
      permissions: validatePermissions(formData.permissions)
    }

    // Always include password for new users, only include for existing users if provided
    if (!user || formData.password) {
      submitData.password = formData.password
    }

    console.log('Submitting data:', { ...submitData, password: submitData.password ? '[REDACTED]' : 'NOT_PROVIDED' })

    await onSubmit(submitData)
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to all admin panel features and settings'
      case 'seo':
        return 'Full access to blog management, read-only access to other sections (except users)'
      case 'custom':
        return 'Customizable permissions - configure specific access levels below'
      default:
        return ''
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password {!user && '*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder={user ? "Leave blank to keep current password" : "Enter password"}
            />
            {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password {!user && '*'}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Role and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="seo">SEO Manager</option>
              <option value="custom">Custom</option>
            </select>
            <p className="mt-1 text-sm text-gray-400">{getRoleDescription(formData.role)}</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Custom Permissions */}
        {showPermissions && (
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Custom Permissions</h3>
            <p className="text-sm text-gray-400 mb-6">
              Configure specific access levels for each section of the admin panel.
            </p>
            
            <div className="space-y-4">
              {Object.entries(ADMIN_PAGES).map(([pageKey, pageInfo]) => {
                if (pageKey === 'dashboard') return null // Skip dashboard
                if (pageKey === 'settings') return null // Skip settings - accessible to all users
                
                const page = pageKey as keyof IPermissions
                const currentPermission = formData.permissions[page] as PermissionLevel
                
                return (
                  <div key={page} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-100">{pageInfo.label}</h4>
                        <p className="text-sm text-gray-400">{pageInfo.description}</p>
                      </div>
                      <select
                        value={currentPermission}
                        onChange={(e) => handlePermissionChange(page, e.target.value)}
                        className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(PERMISSION_LEVELS).map(([level, info]) => (
                          <option key={level} value={level}>
                            {info.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-gray-500">
                      {PERMISSION_LEVELS[currentPermission as keyof typeof PERMISSION_LEVELS]?.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}