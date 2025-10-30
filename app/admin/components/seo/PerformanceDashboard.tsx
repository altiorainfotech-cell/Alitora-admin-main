'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/lib/components/ui/Button';
import { FormSelect } from '@/lib/components/ui/FormSelect';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { useToast } from '@/lib/components/ui/Toast';
import { 
  Activity, 
  Database, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  Zap,
  BarChart3
} from 'lucide-react';

interface PerformanceStats {
  timeWindow: number;
  performance: {
    operations: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      totalDuration: number;
    }>;
    queries: {
      totalQueries: number;
      cachedQueries: number;
      avgDuration: number;
      slowQueries: any[];
    };
    overall: {
      totalOperations: number;
      avgOperationDuration: number;
      cacheHitRate: number;
    };
  };
  slowOperations: any[];
  recommendations: string[];
  cache: {
    total: number;
    active: number;
    expired: number;
    maxSize: number;
  };
  generatedAt: string;
}

interface PerformanceDashboardProps {
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onClose }) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState(60);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const toast = useToast();

  const loadPerformanceStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/seo-pages/performance?timeWindow=${timeWindow}`);
      if (!response.ok) throw new Error('Failed to load performance statistics');

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error loading performance stats:', error);
      toast.error('Failed to load performance statistics');
    } finally {
      setLoading(false);
    }
  }, [timeWindow, toast]);

  useEffect(() => {
    loadPerformanceStats();
  }, [loadPerformanceStats]);

  const performAction = async (action: string, siteId?: string) => {
    try {
      setActionLoading(action);
      const response = await fetch('/api/admin/seo-pages/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, siteId })
      });

      if (!response.ok) throw new Error(`Failed to ${action}`);

      const result = await response.json();
      
      if (action === 'export_metrics') {
        // Download the exported data
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `seo-performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast.success(result.message);
      
      // Reload stats after cache/metrics operations
      if (action !== 'export_metrics') {
        await loadPerformanceStats();
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(`Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'text-green-600 bg-green-50';
    if (value <= thresholds.warning) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <FormSelect
                label="Time Window"
                value={timeWindow.toString()}
                onChange={(e) => setTimeWindow(parseInt(e.target.value))}
                options={[
                  { value: '15', label: 'Last 15 minutes' },
                  { value: '60', label: 'Last hour' },
                  { value: '240', label: 'Last 4 hours' },
                  { value: '1440', label: 'Last 24 hours' }
                ]}
              />
              
              <Button
                onClick={loadPerformanceStats}
                disabled={loading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => performAction('export_metrics')}
                disabled={!!actionLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              <Button
                onClick={() => performAction('clear_cache')}
                disabled={!!actionLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </Button>
              
              <Button
                onClick={() => performAction('warmup_cache', 'altiorainfotech')}
                disabled={!!actionLoading}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Warmup Cache
              </Button>
            </div>
          </div>

          {stats && (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Total Operations</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.performance.overall.totalOperations}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${getPerformanceColor(stats.performance.overall.avgOperationDuration, { good: 100, warning: 500 })}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Avg Duration</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatDuration(stats.performance.overall.avgOperationDuration)}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${getPerformanceColor(100 - stats.performance.overall.cacheHitRate, { good: 20, warning: 50 })}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4" />
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.performance.overall.cacheHitRate.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Total Queries</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {stats.performance.queries.totalQueries}
                  </div>
                </div>
              </div>

              {/* Cache Statistics */}
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Cache Statistics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Entries</span>
                    <div className="text-xl font-bold">{stats.cache.total}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Active Entries</span>
                    <div className="text-xl font-bold text-green-600">{stats.cache.active}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Expired Entries</span>
                    <div className="text-xl font-bold text-red-600">{stats.cache.expired}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cache Usage</span>
                    <div className="text-xl font-bold">
                      {((stats.cache.total / stats.cache.maxSize) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Operation Performance */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Operation Performance</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Operation</th>
                          <th className="px-4 py-3 text-left">Count</th>
                          <th className="px-4 py-3 text-left">Avg Duration</th>
                          <th className="px-4 py-3 text-left">Min Duration</th>
                          <th className="px-4 py-3 text-left">Max Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stats.performance.operations).map(([operation, opStats]) => (
                          <tr key={operation} className="border-t">
                            <td className="px-4 py-3 font-medium">{operation}</td>
                            <td className="px-4 py-3">{opStats.count}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${getPerformanceColor(opStats.avgDuration, { good: 100, warning: 500 })}`}>
                                {formatDuration(opStats.avgDuration)}
                              </span>
                            </td>
                            <td className="px-4 py-3">{formatDuration(opStats.minDuration)}</td>
                            <td className="px-4 py-3">{formatDuration(opStats.maxDuration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Slow Operations */}
              {stats.slowOperations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Slow Operations
                  </h3>
                  <div className="space-y-2">
                    {stats.slowOperations.map((op, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-red-900">{op.operation}</span>
                          <span className="text-red-600 font-bold">{formatDuration(op.duration)}</span>
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          {new Date(op.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {stats.recommendations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Performance Recommendations</h3>
                  <div className="space-y-2">
                    {stats.recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <span className="text-yellow-800">{recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Performance */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Query Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Queries</span>
                    <div className="text-xl font-bold">{stats.performance.queries.totalQueries}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cached Queries</span>
                    <div className="text-xl font-bold text-green-600">{stats.performance.queries.cachedQueries}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Avg Query Duration</span>
                    <div className={`text-xl font-bold ${stats.performance.queries.avgDuration > 100 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatDuration(stats.performance.queries.avgDuration)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  );
};