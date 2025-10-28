'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card'
import { Button } from '@/lib/components/ui/Button'
import { Input } from '@/lib/components/ui/input'
// Using native select for simplicity
import { Badge } from '@/lib/components/ui/badge'
import { Calendar, Filter, Search, User, Clock, Activity, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'

interface ActivityLogEntry {
  _id: string
  userId: string
  userEmail: string
  userName: string
  userRole: 'admin' | 'seo' | 'custom'
  action: string
  category: 'auth' | 'user' | 'blog' | 'image' | 'category' | 'settings' | 'system'
  details: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

interface ActivityStats {
  totalActivities: number
  activitiesByCategory: Array<{ _id: string; count: number }>
  activitiesByRole: Array<{ _id: string; count: number }>
  recentLogins: number
  topUsers: Array<{
    _id: { userId: string; userName: string; userEmail: string }
    count: number
    lastActivity: string
  }>
  period: string
}

const categoryColors = {
  auth: 'bg-green-500/20 text-green-300 border border-green-500/30',
  user: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  blog: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  image: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  category: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  settings: 'bg-red-500/20 text-red-300 border border-red-500/30',
  system: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
}

const roleColors = {
  admin: 'bg-red-500/20 text-red-300 border border-red-500/30',
  seo: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  custom: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
}

export default function ActivityLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    category: '',
    action: '',
    userId: '',
    userRole: '',
    startDate: '',
    endDate: ''
  })
  const [searchTerm, setSearchTerm] = useState('')

  const userRole = (session?.user as any)?.role

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/activity-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      
      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStats()
    }
  }, [userRole])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/activity-logs/stats?days=30')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      action: '',
      userId: '',
      userRole: '',
      startDate: '',
      endDate: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        limit: '1000' // Export more records
      })

      const response = await fetch(`/api/activity-logs?${params}`)
      if (!response.ok) throw new Error('Failed to export logs')
      
      const data = await response.json()
      
      // Convert to CSV
      const csvContent = [
        ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Details', 'IP Address'].join(','),
        ...data.logs.map((log: ActivityLogEntry) => [
          format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          `"${log.userName} (${log.userEmail})"`,
          log.userRole,
          log.action,
          log.category,
          `"${JSON.stringify(log.details)}"`,
          log.ipAddress || 'N/A'
        ].join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const getActionDescription = (log: ActivityLogEntry) => {
    const { action, details } = log
    
    switch (action) {
      case 'LOGIN_SUCCESS':
        return 'Logged in successfully'
      case 'LOGOUT':
        return 'Logged out'
      case 'LOGIN_FAILED':
        return 'Failed login attempt'
      case 'USER_CREATE':
        return `Created user: ${details.userEmail}`
      case 'USER_UPDATE':
        return `Updated user: ${details.userEmail}`
      case 'USER_DELETE':
        return `Deleted user: ${details.userEmail}`
      case 'IMAGE_UPLOAD':
        return `Uploaded image: ${details.imageTitle}`
      case 'IMAGE_DELETE':
        return `Deleted image: ${details.imageTitle}`
      case 'CATEGORY_CREATE':
        return `Created category: ${details.categoryName}`
      default:
        return action.replace(/_/g, ' ').toLowerCase()
    }
  }

  if (!session) {
    return <div className="text-white text-center py-8">Please log in to view activity logs.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-300 mt-1">
            {userRole === 'admin' 
              ? 'Monitor all user activities and system events'
              : 'View your recent activity history (last 7 days)'
            }
          </p>
        </div>
        {userRole === 'admin' && (
          <Button onClick={exportLogs} variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats Cards - Admin Only */}
      {userRole === 'admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalActivities}</div>
              <p className="text-xs text-gray-400">Last {stats.period}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Recent Logins</CardTitle>
              <User className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.recentLogins}</div>
              <p className="text-xs text-gray-400">Successful logins</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Top Category</CardTitle>
              <Eye className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.activitiesByCategory[0]?._id || 'N/A'}
              </div>
              <p className="text-xs text-gray-400">
                {stats.activitiesByCategory[0]?.count || 0} activities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
              <User className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.topUsers.length}</div>
              <p className="text-xs text-gray-400">Users with activity</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-blue-400" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="user">User Management</option>
              <option value="blog">Blog</option>
              <option value="image">Images</option>
              <option value="category">Categories</option>
              <option value="settings">Settings</option>
              <option value="system">System</option>
            </select>

            {userRole === 'admin' && (
              <select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="seo">SEO</option>
                <option value="custom">Custom</option>
              </select>
            )}

            <Input
              type="date"
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />

            <Input
              type="date"
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
            />

            <Button onClick={clearFilters} variant="ghost" className="text-white hover:bg-slate-700">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No activity logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={categoryColors[log.category]}>
                          {log.category}
                        </Badge>
                        <Badge className={roleColors[log.userRole]}>
                          {log.userRole}
                        </Badge>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="font-medium text-white">{log.userName}</span>
                        <span className="text-gray-400 ml-2">({log.userEmail})</span>
                      </div>
                      
                      <div className="text-sm text-gray-300">
                        <strong className="text-white">Action:</strong> {getActionDescription(log)}
                      </div>
                      
                      {log.ipAddress && (
                        <div className="text-xs text-gray-500 mt-1">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="ghost"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-white hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}