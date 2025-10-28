import useSWR from 'swr'
import { cacheKeys } from '../swr-config'

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'EDITOR'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  updatedAt: string
  _count?: {
    uploadedImages: number
    activityLogs: number
  }
}

interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UseUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}

interface UseUsersReturn {
  data: UserListResponse | null
  users: User[]
  pagination: UserListResponse['pagination'] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useUsers(params: UseUsersParams = {}): UseUsersReturn {
  const { page = 1, limit = 20, search, role, status } = params
  
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: UserListResponse }>(
    cacheKeys.users({ page, limit, search, role, status }),
    {
      // User data should be relatively fresh
      dedupingInterval: 2 * 60 * 1000,
      // Revalidate on focus for security
      revalidateOnFocus: true
    }
  )

  return {
    data: data?.data || null,
    users: data?.data?.users || [],
    pagination: data?.data?.pagination || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}