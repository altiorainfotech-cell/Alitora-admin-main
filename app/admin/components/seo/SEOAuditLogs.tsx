'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/lib/components/ui/Button';
import { FormInput } from '@/lib/components/ui/FormInput';
import { FormSelect } from '@/lib/components/ui/FormSelect';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { useToast } from '@/lib/components/ui/Toast';
import { Pagination } from '@/lib/components/Pagination';
import { 
  Clock, 
  User, 
  FileText, 
  RotateCcw, 
  Edit, 
  Trash2, 
  Plus,
  ArrowRight,
  Filter,
  Download,
  TrendingUp
} from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  path?: string;
  oldSlug?: string;
  newSlug?: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    bulkOperation?: boolean;
    affectedPaths?: string[];
    redirectCreated?: boolean;
  };
  performedBy: {
    _id: string;
    email: string;
    role: string;
  };
  performedAt: string;
}

interface AuditStats {
  totalChanges: number;
  uniquePagesModified: number;
  actionBreakdown: Record<string, number>;
  topUsers: {
    userId: string;
    email: string;
    changeCount: number;
  }[];
}

interface SEOAuditLogsProps {
  onClose: () => void;
}

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  reset: 'Reset',
  bulk_update: 'Bulk Update',
  bulk_delete: 'Bulk Delete',
  bulk_reset: 'Bulk Reset',
  slug_change: 'Slug Changed',
  redirect_create: 'Redirect Created'
};

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  reset: RotateCcw,
  bulk_update: Edit,
  bulk_delete: Trash2,
  bulk_reset: RotateCcw,
  slug_change: ArrowRight,
  redirect_create: ArrowRight
};

const ACTION_COLORS = {
  create: 'text-green-600 bg-green-50',
  update: 'text-blue-600 bg-blue-50',
  delete: 'text-red-600 bg-red-50',
  reset: 'text-orange-600 bg-orange-50',
  bulk_update: 'text-blue-600 bg-blue-50',
  bulk_delete: 'text-red-600 bg-red-50',
  bulk_reset: 'text-orange-600 bg-orange-50',
  slug_change: 'text-purple-600 bg-purple-50',
  redirect_create: 'text-indigo-600 bg-indigo-50'
};

export const SEOAuditLogs: React.FC<SEOAuditLogsProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: '',
    entityType: '',
    path: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const toast = useToast();

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/seo-pages/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to load audit logs');

      const result = await response.json();
      setLogs(result.data.logs);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const loadAuditStats = useCallback(async () => {


    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/seo-pages/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30 })
      });
      
      if (!response.ok) throw new Error('Failed to load audit stats');

      const result = await response.json();
      setStats(result.data);
    } catch (error) {
      console.error('Error loading audit stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    loadAuditStats();
  }, [loadAuditStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const exportAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString());
        }
      });
      params.append('limit', '1000'); // Export more records

      const response = await fetch(`/api/admin/seo-pages/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to export audit logs');

      const result = await response.json();
      const csvContent = [
        ['Date', 'Action', 'Entity Type', 'Path', 'User', 'Changes'],
        ...result.data.logs.map((log: AuditLog) => [
          new Date(log.performedAt).toLocaleString(),
          ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action,
          log.entityType,
          log.path || '',
          log.performedBy.email,
          log.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; ')
        ])
      ].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seo-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const formatChangeValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            SEO Audit Logs
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Statistics */}
        {!statsLoading && stats && (
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Changes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalChanges}</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pages Modified</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.uniquePagesModified}</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Most Common</span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {Object.entries(stats.actionBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Top User</span>
                </div>
                <div className="text-sm font-bold text-gray-900 truncate">
                  {stats.topUsers[0]?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <FormSelect
              label="Action"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              options={[
                { value: '', label: 'All Actions' },
                ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))
              ]}
            />
            
            <FormSelect
              label="Entity Type"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'seo_page', label: 'SEO Page' },
                { value: 'redirect', label: 'Redirect' }
              ]}
            />
            
            <FormInput
              label="Path"
              value={filters.path}
              onChange={(e) => handleFilterChange('path', e.target.value)}
              placeholder="Filter by path..."
            />
            
            <FormInput
              label="Date From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            
            <FormInput
              label="Date To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
            
            <div className="flex items-end">
              <Button
                onClick={exportAuditLogs}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {logs.map((log) => {
                  const ActionIcon = ACTION_ICONS[log.action as keyof typeof ACTION_ICONS] || FileText;
                  const actionColor = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || 'text-gray-600 bg-gray-50';
                  
                  return (
                    <div key={log._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${actionColor}`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action}
                              </span>
                              {log.path && (
                                <span className="text-sm text-gray-500">
                                  on {log.path}
                                </span>
                              )}
                              {log.metadata.bulkOperation && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Bulk Operation
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              by {log.performedBy.email} • {new Date(log.performedAt).toLocaleString()}
                            </div>
                            
                            {log.changes.length > 0 && (
                              <div className="space-y-1">
                                {log.changes.map((change, index) => (
                                  <div key={index} className="text-sm">
                                    <span className="font-medium text-gray-700">{change.field}:</span>
                                    <span className="text-red-600 mx-1">{formatChangeValue(change.oldValue)}</span>
                                    <ArrowRight className="w-3 h-3 inline mx-1" />
                                    <span className="text-green-600">{formatChangeValue(change.newValue)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {log.metadata.affectedPaths && log.metadata.affectedPaths.length > 0 && (
                              <div className="text-sm text-gray-600 mt-2">
                                Affected {log.metadata.affectedPaths.length} pages
                              </div>
                            )}
                            
                            {log.metadata.redirectCreated && (
                              <div className="text-sm text-blue-600 mt-1">
                                Redirect created: {log.oldSlug} → {log.newSlug}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs found matching your criteria
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}


      </div>
    </div>
  );
};