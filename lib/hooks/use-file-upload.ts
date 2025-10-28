'use client'

import { useState, useCallback } from 'react'
import { uploadFile, uploadMultipleFiles, deleteFile, UploadOptions, UploadError } from '../upload-client'
import { UploadResponse } from '../validations'

export interface UseFileUploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedFiles: UploadResponse[]
}

export interface UseFileUploadReturn extends UseFileUploadState {
  upload: (file: File, options?: UploadOptions) => Promise<UploadResponse>
  uploadMultiple: (files: File[], options?: UploadOptions) => Promise<UploadResponse[]>
  deleteUploadedFile: (filePath: string) => Promise<void>
  reset: () => void
  clearError: () => void
}

/**
 * Custom hook for managing file uploads
 */
export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<UseFileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: []
  })

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFiles: []
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const upload = useCallback(async (file: File, options: UploadOptions = {}) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0, 
      error: null 
    }))

    try {
      const result = await uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          setState(prev => ({ ...prev, progress }))
        }
      })

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  const uploadMultiple = useCallback(async (files: File[], options: UploadOptions = {}) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      progress: 0, 
      error: null 
    }))

    try {
      const results = await uploadMultipleFiles(files, options)

      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...results]
      }))

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  const deleteUploadedFile = useCallback(async (filePath: string) => {
    try {
      await deleteFile(filePath)
      
      setState(prev => ({
        ...prev,
        uploadedFiles: prev.uploadedFiles.filter(file => file.url !== filePath)
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  return {
    ...state,
    upload,
    uploadMultiple,
    deleteUploadedFile,
    reset,
    clearError
  }
}