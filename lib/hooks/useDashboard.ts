import useSWR from 'swr'
import { cacheKeys } from '../swr-config'

interface DashboardStats {
  totalBlogs: number
  publishedBlogs: number
  draftBlogs: number
  totalCategories: number
  totalUsers: number
  totalMessages: number
  unreadMessages: number
  recentActivity: Array<{
    id: string
    title: string
    status: string
    category: string
    author: string
    createdAt: string
  }>
}

interface UseDashboardReturn {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(): UseDashboardReturn {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    cacheKeys.dashboardStats,
    {
      // Refresh dashboard stats every 30 seconds
      refreshInterval: 30000,
      // Keep data fresh for 1 minute
      dedupingInterval: 60000,
      // Revalidate on focus for real-time updates
      revalidateOnFocus: true
    }
  )

  return {
    stats: data || null,
    isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}