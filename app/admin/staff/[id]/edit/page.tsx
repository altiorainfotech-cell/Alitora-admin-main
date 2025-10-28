'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'

interface Staff {
  _id: string
  name: string
  title: string
  avatar: string
  isVisible: boolean
  order: number
  bio?: string
  email?: string
  linkedin?: string
  twitter?: string
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [staffId, setStaffId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    isVisible: true,
    avatar: null as File | null
  })

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setStaffId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchStaff = useCallback(async () => {
    try {
      const response = await fetch(`/api/staff/${staffId}`)
      const data = await response.json()
      
      if (data.success) {
        const staff: Staff = data.data
        setFormData({
          name: staff.name,
          title: staff.title,
          isVisible: staff.isVisible,
          avatar: null
        })
        setImagePreview(staff.avatar)
      } else {
        console.error('Failed to fetch staff:', data.error)
        router.push('/admin/staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      router.push('/admin/staff')
    } finally {
      setFetchLoading(false)
    }
  }, [staffId, router])

  useEffect(() => {
    if (staffId) {
      fetchStaff()
    }
  }, [staffId, fetchStaff])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }))
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, avatar: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.title) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('title', formData.title)
      submitData.append('isVisible', formData.isVisible.toString())
      
      if (formData.avatar) {
        submitData.append('avatar', formData.avatar)
      }

      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        body: submitData
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/staff')
      } else {
        alert('Error updating staff member: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating staff member:', error)
      alert('Error updating staff member')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/staff"
          className="p-2 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Staff Member</h1>
          <p className="text-gray-300 mt-1">Update team member information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
          <label className="block text-sm font-medium text-white mb-4">
            Profile Image
          </label>
          
          {imagePreview ? (
            <div className="relative w-48 h-60 mx-auto">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <label className="cursor-pointer">
                <span className="text-blue-400 hover:text-blue-300">Upload a new image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-gray-400 text-sm mt-2">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Employee Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Website Visibility */}
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700/50 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Website Display</h3>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleInputChange}
                className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
              />
              <span className="ml-2 text-sm font-medium text-white">
                Show this employee on the Altiora website
              </span>
            </label>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            When enabled, this employee will be displayed on the public staff page
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Update Staff Member'}
          </button>
          <Link
            href="/admin/staff"
            className="px-6 py-2 border border-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}