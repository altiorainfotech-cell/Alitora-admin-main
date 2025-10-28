'use client'

import { useState, useEffect } from 'react'

interface ApiCall {
  url: string
  timestamp: number
  method: string
}

export function ApiCallMonitor() {
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Override fetch to monitor API calls
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const [url, options] = args
      const method = options?.method || 'GET'
      
      // Only track admin API calls
      if (typeof url === 'string' && url.includes('/api/admin/')) {
        setApiCalls(prev => [...prev.slice(-9), { // Keep last 10 calls
          url,
          timestamp: Date.now(),
          method
        }])
      }
      
      return originalFetch(...args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        API Monitor
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-medium">API Calls</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {apiCalls.length === 0 ? (
          <p className="text-gray-400 text-sm">No API calls yet</p>
        ) : (
          apiCalls.map((call, index) => (
            <div key={index} className="text-xs">
              <div className="text-green-400">{call.method} {call.url}</div>
              <div className="text-gray-500">
                {new Date(call.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => setApiCalls([])}
        className="mt-2 text-xs text-blue-400 hover:text-blue-300"
      >
        Clear
      </button>
    </div>
  )
}