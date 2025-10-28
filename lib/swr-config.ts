'use client'

import { SWRConfiguration } from 'swr'
import { apiClient } from './api-client'

export const fetcher = async (url: string) => {
  try {
    const response = await apiClient.get(url)
    return response
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred')
  }
}

export const swrConfig: SWRConfiguration = {
  fetcher,
  dedupingInterval: 5 * 60 * 1000,
  focusThrottleInterval: 30 * 1000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  revalidateOnReconnect: true,
  revalidateOnFocus: true,
  revalidateIfStale: true,
  keepPreviousData: true,
  onError: (error, key) => {
    console.error('SWR Error:', { error, key })
  },
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', { key, dataSize: JSON.stringify(data).length })
    }
  }
}

// Cache keys for consistent usage across the app
export const cacheKeys = {
  // Dashboard
  dashboardStats: '/dashboard/stats',
  
  // Categories
  categories: (params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    return `/categories${query ? `?${query}` : ''}`
  },
  
  // Images
  images: (params?: { page?: number; limit?: number; search?: string; categoryId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    const query = searchParams.toString()
    return `/admin/images${query ? `?${query}` : ''}`
  },
  
  // Users
  users: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.search) searchParams.set('search', params.search)
    if (params?.role) searchParams.set('role', params.role)
    if (params?.status) searchParams.set('status', params.status)
    const query = searchParams.toString()
    return `/admin/users${query ? `?${query}` : ''}`
  },
  
  // Activity logs
  activityLogs: (params?: { page?: number; limit?: number; userId?: string; action?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.userId) searchParams.set('userId', params.userId)
    if (params?.action) searchParams.set('action', params.action)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    const query = searchParams.toString()
    return `/admin/activity${query ? `?${query}` : ''}`
  }
}

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate specific cache keys
  invalidate: async (keys: string | string[]) => {
    const { mutate } = await import('swr')
    if (Array.isArray(keys)) {
      return Promise.all(keys.map(key => mutate(key)))
    }
    return mutate(keys)
  },
  
  // Clear all cache
  clearAll: async () => {
    const { mutate } = await import('swr')
    mutate(() => true, undefined, { revalidate: false })
  },
  
  // Preload data
  preload: async (key: string) => {
    const { preload } = await import('swr')
    return preload(key, fetcher)
  }
}