'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, File, AlertCircle } from 'lucide-react'
import { useFileUpload } from '../hooks/use-file-upload'
import { validateFileForUpload, formatFileSize, createImagePreview, revokeImagePreview } from '../upload-client'
import { cn } from '../utils'
import Image from 'next/image'

export interface FileUploadProps {
  onUpload?: (files: { url: string; filename: string }[]) => void
  onError?: (error: string) => void
  multiple?: boolean
  accept?: string
  maxSize?: number
  folder?: string
  className?: string
  disabled?: boolean
  showPreview?: boolean
}

interface PreviewFile {
  file: File
  preview: string
  id: string
}

export function FileUpload({
  onUpload,
  onError,
  multiple = false,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  folder = 'general',
  className,
  disabled = false,
  showPreview = true
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  
  const { upload, uploadMultiple, isUploading, progress, error, clearError } = useFileUpload()

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const previews: PreviewFile[] = []

    // Validate files and create previews
    for (const file of fileArray) {
      const validation = validateFileForUpload(file, maxSize)
      if (!validation.isValid) {
        onError?.(validation.error || 'Invalid file')
        continue
      }

      validFiles.push(file)

      if (showPreview && file.type.startsWith('image/')) {
        previews.push({
          file,
          preview: createImagePreview(file),
          id: Math.random().toString(36).substring(2)
        })
      }
    }

    if (validFiles.length === 0) return

    setPreviewFiles(prev => [...prev, ...previews])
    clearError()

    try {
      let results
      if (multiple && validFiles.length > 1) {
        results = await uploadMultiple(validFiles, { folder })
      } else {
        results = [await upload(validFiles[0], { folder })]
      }

      const uploadedFiles = results.map(result => ({
        url: result.url!,
        filename: result.filename!
      }))

      onUpload?.(uploadedFiles)
      
      // Clear previews after successful upload
      setPreviewFiles([])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      onError?.(errorMessage)
    }
  }, [upload, uploadMultiple, multiple, maxSize, folder, onUpload, onError, clearError, showPreview])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }, [handleFiles, disabled])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }, [handleFiles])

  const removePreview = useCallback((id: string) => {
    setPreviewFiles(prev => {
      const updated = prev.filter(p => p.id !== id)
      const removed = prev.find(p => p.id === id)
      if (removed) {
        revokeImagePreview(removed.preview)
      }
      return updated
    })
  }, [])

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          'hover:border-blue-400 hover:bg-blue-50/50',
          dragActive && 'border-blue-400 bg-blue-50/50',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-400 bg-red-50/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-10 h-10 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            {accept === 'image/*' ? 'Images only' : 'Files'} up to {formatFileSize(maxSize)}
          </p>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* File Previews */}
      {previewFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Files to upload:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewFiles.map((previewFile) => (
              <div key={previewFile.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {previewFile.file.type.startsWith('image/') ? (
                    <Image
                      src={previewFile.preview}
                      alt={previewFile.file.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <File className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removePreview(previewFile.id)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="mt-1 text-xs text-gray-600 truncate">
                  {previewFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(previewFile.file.size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}