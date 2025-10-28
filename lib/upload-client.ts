import { UploadResponse } from './validations'

export interface UploadOptions {
  folder?: string
  onProgress?: (progress: number) => void
  optimize?: boolean
  thumbnail?: boolean
}

export interface UploadError extends Error {
  status?: number
  code?: string
}

/**
 * Uploads a file to the server
 */
export async function uploadFile(
  file: File, 
  options: UploadOptions = {}
): Promise<UploadResponse> {
  const { folder = 'general', onProgress, optimize = true, thumbnail = false } = options

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  if (optimize) formData.append('optimize', 'true')
  if (thumbnail) formData.append('thumbnail', 'true')

  try {
    if (onProgress) {
      return uploadWithProgress(formData, onProgress)
    }
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      const error = new Error(result.error || 'Upload failed') as UploadError
      error.status = response.status
      throw error
    }

    return result
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

/**
 * Uploads multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResponse[]> {
  const uploadPromises = files.map(file => uploadFile(file, options))
  return Promise.all(uploadPromises)
}

/**
 * Deletes a file from the server
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Delete failed')
    }
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Uploads file with progress tracking using XMLHttpRequest
 */
function uploadWithProgress(
  formData: FormData, 
  onProgress: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      try {
        const result = JSON.parse(xhr.responseText)
        
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result)
        } else {
          const error = new Error(result.error || 'Upload failed') as UploadError
          error.status = xhr.status
          reject(error)
        }
      } catch (error) {
        reject(new Error('Invalid response from server'))
      }
    })

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'))
    })

    // Start upload
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

/**
 * Validates file before upload
 */
export function validateFileForUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB default
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file selected' }
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' }
  }

  return { isValid: true }
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Creates a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Revokes a preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
}