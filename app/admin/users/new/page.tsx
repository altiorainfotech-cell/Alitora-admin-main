'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminUserForm from '../../components/AdminUserForm'
import Toast from '../../components/Toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleCreateUser = async (userData: any) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        setToast({ message: 'Admin user created successfully', type: 'success' })
        setTimeout(() => {
          router.push('/admin/users')
        }, 2000)
      } else {
        setToast({ message: data.error || 'Failed to create user', type: 'error' })
      }
    } catch (err) {
      setToast({ message: 'Failed to create user', type: 'error' })
      console.error('Error creating user:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/users')
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
        <h1 className="text-3xl font-bold text-gray-100">Create New Admin User</h1>
        <p className="text-gray-400 mt-2">Add a new admin user to the system with specific permissions</p>
      </div>
      
      <AdminUserForm
        onSubmit={handleCreateUser}
        onCancel={handleCancel}
        isLoading={loading}
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