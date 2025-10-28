'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import AdminUserForm from '../../../components/AdminUserForm'
import Toast from '../../../components/Toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { IAdminUser } from '@/lib/models/AdminUser'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<IAdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setUser(data.data)
      } else {
        setToast({ message: data.error || 'Failed to fetch user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to fetch user', type: 'error' })
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id, fetchUser])

  const handleUpdateUser = async (userData: any) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Admin user updated successfully', type: 'success' })
        setTimeout(() => {
          router.push('/admin/users')
        }, 2000)
      } else {
        setToast({ message: data.error || 'Failed to update user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to update user', type: 'error' })
      console.error('Error updating user:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-300">User Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The requested user could not be found.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/users"
          className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Users
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-100">Edit Admin User</h1>
        <p className="text-gray-400 mt-2">Update user information and permissions for {user.name || user.email}</p>
      </div>
      
      <AdminUserForm
        user={user as any}
        onSubmit={handleUpdateUser}
        onCancel={handleCancel}
        isLoading={saving}
      />

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