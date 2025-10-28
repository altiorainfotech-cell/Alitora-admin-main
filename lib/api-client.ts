'use client'

import { ApiErrorResponse, ApiSuccessResponse, ApiErrorCode, isApiError } from './api-error-handler'

export interface ApiClientOptions {
  baseUrl?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export class ApiClient {
  private baseUrl: string
  private defaultTimeout: number
  private defaultRetries: number
  private defaultRetryDelay: number
  private defaultHeaders: Record<string, string>

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || ''
    this.defaultTimeout = options.timeout || 10000
    this.defaultRetries = options.retries || 3
    this.defaultRetryDelay = options.retryDelay || 1000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`)
      }
      throw error
    }
  }

  private async fetchWithRetry(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options

    const headers = {
      ...this.defaultHeaders,
      ...fetchOptions.headers
    }

    let lastError: Error
    let attempt = 0

    while (attempt <= retries) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          { ...fetchOptions, headers },
          timeout
        )

        // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response
        }

        // Server error - might be worth retrying
        if (attempt === retries) {
          return response // Return the error response on final attempt
        }

        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++

        // Don't retry on the last attempt
        if (attempt > retries) {
          throw lastError
        }

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError)
        if (!isRetryable) {
          throw lastError
        }

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1)
        const jitteredDelay = delay + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, jitteredDelay))
      }
    }

    throw lastError!
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('server error: 5') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    )
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.text() as unknown as T
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle structured API errors
      if (isApiError(data)) {
        const error = new Error(data.error)
        error.name = data.code
        throw error
      }
      
      // Handle generic errors
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return data
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      ...options
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithRetry(url, {
      method: 'DELETE',
      ...options
    })
    return this.handleResponse<T>(response)
  }

  // File upload with progress tracking
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const formData = new FormData()
    
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value))
        }
      })
    }

    // Remove Content-Type header to let browser set it with boundary
    const { 'Content-Type': _, ...headersWithoutContentType } = this.defaultHeaders
    const headers = {
      ...headersWithoutContentType,
      ...options.headers
    }

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            onProgress(progress)
          }
        })
      }

      xhr.addEventListener('load', async () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`))
          }
        } catch (error) {
          reject(new Error('Failed to parse response'))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })

      xhr.open('POST', url)
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, String(value))
      })

      xhr.timeout = options.timeout || this.defaultTimeout
      xhr.send(formData)
    })
  }
}

// Default API client instance
export const apiClient = new ApiClient({
  baseUrl: '/api',
  timeout: 15000,
  retries: 3,
  retryDelay: 1000
})

// Typed API methods for common operations
export const api = {
  // Dashboard
  getDashboardStats: () => apiClient.get<ApiSuccessResponse>('/dashboard/stats'),
  
  // Categories
  getCategories: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    
    const query = searchParams.toString()
    return apiClient.get<ApiSuccessResponse>(`/categories${query ? `?${query}` : ''}`)
  },
  
  createCategory: (data: { name: string; description?: string }) =>
    apiClient.post<ApiSuccessResponse>('/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put<ApiSuccessResponse>(`/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    apiClient.delete<ApiSuccessResponse>(`/categories/${id}`),
  
  // Images
  getImages: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    
    const query = searchParams.toString()
    return apiClient.get<ApiSuccessResponse>(`/admin/images${query ? `?${query}` : ''}`)
  },
  
  uploadImage: (
    file: File,
    metadata: { title: string; description?: string; tags?: string[]; categoryId: string },
    onProgress?: (progress: number) => void
  ) => apiClient.uploadFile<ApiSuccessResponse>('/admin/images', file, metadata, onProgress),
  
  updateImage: (id: string, data: { title?: string; description?: string; tags?: string[]; categoryId?: string }) =>
    apiClient.put<ApiSuccessResponse>(`/admin/images/${id}`, data),
  
  deleteImage: (id: string) =>
    apiClient.delete<ApiSuccessResponse>(`/admin/images/${id}`),
  
  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.status) searchParams.set('status', params.status)
    
    const query = searchParams.toString()
    return apiClient.get<ApiSuccessResponse>(`/admin/users${query ? `?${query}` : ''}`)
  },
  
  createUser: (data: { email: string; password: string; role: string; status?: string }) =>
    apiClient.post<ApiSuccessResponse>('/admin/users', data),
  
  updateUser: (id: string, data: { email?: string; role?: string; status?: string; password?: string }) =>
    apiClient.put<ApiSuccessResponse>(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) =>
    apiClient.delete<ApiSuccessResponse>(`/admin/users/${id}`),
  
  // Activity logs
  getActivityLogs: (params?: { page?: number; limit?: number; userId?: string; action?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.userId) searchParams.set('userId', params.userId)
    if (params?.action) searchParams.set('action', params.action)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    
    const query = searchParams.toString()
    return apiClient.get<ApiSuccessResponse>(`/admin/activity${query ? `?${query}` : ''}`)
  },
  
  exportActivityLogs: (params?: { userId?: string; action?: string; startDate?: string; endDate?: string }) =>
    apiClient.post<Blob>('/admin/activity/export', params, {
      headers: { 'Accept': 'text/csv' }
    })
}