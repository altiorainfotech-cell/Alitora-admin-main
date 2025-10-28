'use client'

import { useState, useEffect } from 'react'
import { EnhancedPerformanceMonitor as PerfMonitor } from '@/lib/performance-monitor'
import { Activity, Clock, Database, Zap } from 'lucide-react'

interface PerformanceStats {
  renderTime: number
  apiCalls: number
  cacheHits: number
  cacheMisses: number
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const updateStats = () => {
      const perfStats = PerfMonitor.getStats(3600000) // Last hour
      const recentMetrics = PerfMonitor.getRecentMetrics(100)
      
      // Filter metrics by type
      const renderMetrics = recentMetrics.filter(m => m.name.includes('render'))
      const apiMetrics = recentMetrics.filter(m => m.name.includes('api') || m.name.includes('route'))
      const cacheHitMetrics = recentMetrics.filter(m => m.name.includes('cache') && m.name.includes('hit'))
      const cacheMissMetrics = recentMetrics.filter(m => m.name.includes('cache') && m.name.includes('miss'))

      setStats({
        renderTime: renderMetrics.length > 0 
          ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length 
          : 0,
        apiCalls: perfStats.apiStats.totalRequests,
        cacheHits: cacheHitMetrics.length,
        cacheMisses: cacheMissMetrics.length
      })
    }

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    updateStats() // Initial update

    return () => clearInterval(interval)
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-700 min-w-64">
          <h3 className="text-sm font-semibold mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Performance Monitor
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Avg Render Time
              </span>
              <span className="text-blue-400">
                {stats.renderTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Database className="w-3 h-3 mr-1" />
                API Calls
              </span>
              <span className="text-green-400">
                {stats.apiCalls}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Cache Hit Rate</span>
              <span className="text-purple-400">
                {stats.cacheHits + stats.cacheMisses > 0 
                  ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-gray-700">
            <button
              onClick={() => {
                PerfMonitor.reset()
                setStats({ renderTime: 0, apiCalls: 0, cacheHits: 0, cacheMisses: 0 })
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear Metrics
            </button>
          </div>
        </div>
      )}
    </div>
  )
}