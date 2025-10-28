'use client'

import React, { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import Image from 'next/image'

interface BlogImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
  error?: string
  className?: string
}

export function BlogImageUpload({
  onImageUpload,
  currentImage,
  error,
  className = ''
}: BlogImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)


  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true)
    setUploadError(null)

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.')
      }

      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.')
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('isFeaturedImage', 'true')

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to upload images.')
        } else if (response.status === 413) {
          throw new Error('File is too large. Maximum size is 10MB.')
        } else {
          throw new Error(data.error || data.message || `Upload failed (${response.status})`)
        }
      }

      // Call the callback with the uploaded image URL
      onImageUpload(data.data.url)

    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [onImageUpload])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )

    if (files.length === 0) {
      setUploadError('Please drop valid image files')
      return
    }

    if (files.length > 0) {
      await uploadImage(files[0])
    }
  }, [uploadImage])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    await uploadImage(files[0])

    // Reset input
    e.target.value = ''
  }, [uploadImage])

  const handleRemoveImage = () => {
    onImageUpload('')
  }



  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Preview */}
      {currentImage && (
        <div className="relative">
          <Image
            src={currentImage}
            alt="Featured image"
            width={400}
            height={192}
            className="w-full h-48 object-cover rounded-lg border border-gray-600"
          />
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2"
            icon={<X size={14} />}
          >
            Remove
          </Button>
        </div>
      )}



      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-600 hover:border-gray-500'
          }
          ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('image-file-input')?.click()}
      >
        <input
          id="image-file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-2">
          <div className="text-gray-300">
            {uploading ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Uploading image...
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-300 bg-blue-500 animate-pulse w-1/2" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-2">
                  <ImageIcon size={32} className="text-gray-500" />
                </div>
                <div className="text-lg">
                  Drop an image here or click to browse
                </div>
                <div className="text-sm text-gray-500">
                  Supports JPEG, PNG, WebP, and GIF (max 10MB)
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(error || uploadError) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-red-300 text-sm">{error || uploadError}</div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}