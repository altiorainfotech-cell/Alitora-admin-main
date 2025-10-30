'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/lib/components/ui/Button';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { useToast } from '@/lib/components/ui/Toast';
import { 
  Globe, 
  Download, 
  RefreshCw, 
  ExternalLink,
  BarChart3,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: number;
}

interface SitemapStats {
  totalUrls: number;
  lastModified: string;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<number, number>;
  averagePriority: number;
}

interface SitemapInfo {
  totalEntries: number;
  needsSitemapIndex: boolean;
  sitemapCount: number;
  sitemapUrls: string[];
  indexUrl: string | null;
}

interface SitemapManagerProps {
  onClose: () => void;
}

export const SitemapManager: React.FC<SitemapManagerProps> = ({ onClose }) => {
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [sitemapInfo, setSitemapInfo] = useState<SitemapInfo | null>(null);
  const [previewEntries, setPreviewEntries] = useState<SitemapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const loadSitemapInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo-pages/sitemap');
      if (!response.ok) throw new Error('Failed to load sitemap information');

      const result = await response.json();
      setStats(result.data.stats);
      setSitemapInfo(result.data.sitemapInfo);
      setPreviewEntries(result.data.previewEntries);
    } catch (error) {
      console.error('Error loading sitemap info:', error);
      toast.error('Failed to load sitemap information');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSitemapInfo();
  }, [loadSitemapInfo]);

  const generateSitemap = async (format: 'xml' | 'json' = 'xml', chunk?: number) => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/seo-pages/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, chunk })
      });

      if (!response.ok) throw new Error('Failed to generate sitemap');

      if (format === 'xml') {
        // Download XML file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sitemap${chunk !== undefined ? `-${chunk + 1}` : ''}.xml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Sitemap downloaded successfully');
      } else {
        // Handle JSON response
        const result = await response.json();
        const dataStr = JSON.stringify(result.data.sitemap, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sitemap.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Sitemap JSON downloaded successfully');
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setGenerating(false);
    }
  };

  const openSitemapUrl = (url: string) => {
    window.open(url, '_blank');
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
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sitemap Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Statistics */}
          {stats && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Sitemap Statistics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">Total URLs</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalUrls}</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Avg Priority</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{stats.averagePriority.toFixed(2)}</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Last Modified</span>
                  </div>
                  <div className="text-sm font-bold text-purple-900">
                    {new Date(stats.lastModified).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-600 font-medium">Categories</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {Object.keys(stats.categoryBreakdown).length}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Category Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sitemap Information */}
          {sitemapInfo && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Sitemap Configuration</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Entries:</span>
                    <div className="font-medium">{sitemapInfo.totalEntries}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Sitemap Type:</span>
                    <div className="font-medium">
                      {sitemapInfo.needsSitemapIndex ? 'Sitemap Index' : 'Single Sitemap'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Sitemap Count:</span>
                    <div className="font-medium">{sitemapInfo.sitemapCount}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Index URL:</span>
                    <div className="font-medium">
                      {sitemapInfo.indexUrl ? (
                        <button
                          onClick={() => openSitemapUrl(sitemapInfo.indexUrl!)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sitemap URLs */}
              <div className="space-y-2">
                <h4 className="font-medium">Sitemap URLs</h4>
                {sitemapInfo.sitemapUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <span className="text-sm font-mono">{url}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openSitemapUrl(url)}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => generateSitemap('xml', sitemapInfo.needsSitemapIndex ? index : undefined)}
                        disabled={generating}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => generateSitemap('xml')}
                disabled={generating}
                className="flex items-center gap-2"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download XML Sitemap
              </Button>
              
              <Button
                onClick={() => generateSitemap('json')}
                disabled={generating}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </Button>
              
              <Button
                onClick={loadSitemapInfo}
                disabled={loading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Preview */}
          {previewEntries.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Preview (First 10 URLs)</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">URL</th>
                        <th className="px-4 py-2 text-left">Priority</th>
                        <th className="px-4 py-2 text-left">Change Freq</th>
                        <th className="px-4 py-2 text-left">Last Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewEntries.map((entry, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2 font-mono text-xs">{entry.url}</td>
                          <td className="px-4 py-2">{entry.priority.toFixed(1)}</td>
                          <td className="px-4 py-2 capitalize">{entry.changeFrequency}</td>
                          <td className="px-4 py-2">
                            {new Date(entry.lastModified).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};