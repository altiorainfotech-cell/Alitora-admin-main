'use client'

import { useState, useRef } from 'react'
import { Upload, X, Plus, Image as ImageIcon, Move } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import Image from 'next/image'

interface ImageItem {
  id: string
  url: string
  alt: string
  caption?: string
}

interface MultipleImageUploadProps {
  images: ImageItem[]
  onImagesChange: (images: ImageItem[]) => void
  maxImages?: number
  error?: string
}

export function MultipleImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  error
}: MultipleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    
    try {
      console.log(`🚀 Starting upload of ${files.length} files`)
      
      // Upload files sequentially to avoid ID conflicts and better error handling
      const newImages = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`)
        
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error(`❌ Upload failed for ${file.name}:`, errorData)
          throw new Error(`Upload failed for ${file.name}: ${errorData.error || 'Unknown error'}`)
        }
        
        const data = await response.json()
        console.log(`✅ Upload successful for ${file.name}:`, data)
        
        // The API returns { success: true, data: { url: "...", ... } }
        const imageUrl = data.data?.url
        if (!imageUrl) {
          console.error(`❌ No URL in response for ${file.name}:`, data)
          throw new Error(`No URL returned from upload for ${file.name}`)
        }
        
        const imageItem = {
          id: `img_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          alt: file.name.split('.')[0],
          caption: ''
        }
        
        newImages.push(imageItem)
        console.log(`📸 Created image item:`, imageItem)
      }
      
      console.log(`🎉 All uploads completed. Adding ${newImages.length} images to form`)
      onImagesChange([...images, ...newImages])
      
    } catch (error) {
      console.error('❌ Upload process failed:', error)
      alert(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id))
  }

  const updateImage = (id: string, updates: Partial<ImageItem>) => {
    onImagesChange(images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <div className="space-y-2">
          <p className="text-gray-300">
            Drag and drop images here, or{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              browse files
            </button>
          </p>
          <p className="text-sm text-gray-500">
            {images.length}/{maxImages} images • PNG, JPG, GIF up to 10MB each
          </p>
        </div>
        
        {uploading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-400 mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={`
                bg-gray-700 rounded-lg p-4 border border-gray-600 
                hover:border-gray-500 transition-colors cursor-move
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              <div className="relative mb-3">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={300}
                  height={128}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeImage(image.id)}
                    className="p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
                <div className="absolute top-2 left-2">
                  <Move size={16} className="text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={image.alt}
                  onChange={(e) => updateImage(image.id, { alt: e.target.value })}
                  className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={image.caption || ''}
                  onChange={(e) => updateImage(image.id, { caption: e.target.value })}
                  className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add More Button */}
      {images.length > 0 && images.length < maxImages && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          icon={<Plus size={16} />}
          disabled={uploading}
        >
          Add More Images
        </Button>
      )}
    </div>
  )
}