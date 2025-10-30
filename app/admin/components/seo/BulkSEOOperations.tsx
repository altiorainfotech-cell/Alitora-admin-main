'use client';

import React, { useState } from 'react';
import { Button } from '@/lib/components/ui/Button';
import { FormSelect } from '@/lib/components/ui/FormSelect';
import { FormInput } from '@/lib/components/ui/FormInput';
import { FormTextarea } from '@/lib/components/ui/FormTextarea';
import { useToast } from '@/lib/components/ui/Toast';
import ConfirmationDialog from './ConfirmationDialog';

interface BulkSEOOperationsProps {
  selectedPaths: string[];
  onOperationComplete: () => void;
  onClose: () => void;
}

interface BulkOperationData {
  metaTitle?: string;
  metaDescription?: string;
  robots?: string;
  pageCategory?: string;
}

interface ImportData {
  path: string;
  metaTitle?: string;
  metaDescription?: string;
  robots?: string;
  pageCategory?: string;
}

export const BulkSEOOperations: React.FC<BulkSEOOperationsProps> = ({
  selectedPaths,
  onOperationComplete,
  onClose
}) => {
  const [operation, setOperation] = useState<'update' | 'delete' | 'reset' | 'export' | 'import'>('update');
  const [bulkData, setBulkData] = useState<BulkOperationData>({});
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importData, setImportData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const toast = useToast();

  const handleBulkOperation = async () => {
    if (selectedPaths.length === 0 && operation !== 'import') {
      toast.error('Please select at least one page');
      return;
    }

    setIsLoading(true);
    setShowConfirmation(false);

    try {
      let requestBody: any = {
        operation,
        paths: selectedPaths
      };

      if (operation === 'update') {
        if (!bulkData.metaTitle && !bulkData.metaDescription && !bulkData.robots && !bulkData.pageCategory) {
          toast.error('Please provide at least one field to update');
          setIsLoading(false);
          return;
        }
        requestBody.data = bulkData;
      } else if (operation === 'export') {
        requestBody.exportFormat = exportFormat;
      } else if (operation === 'import') {
        try {
          const parsedImportData: ImportData[] = JSON.parse(importData);
          requestBody.importData = parsedImportData;
          requestBody.paths = parsedImportData.map(item => item.path);
        } catch (error) {
          toast.error('Invalid JSON format for import data');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/admin/seo-pages/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        if (operation === 'export') {
          // Handle export - download the data
          const dataStr = exportFormat === 'json' 
            ? JSON.stringify(result.data.exportData, null, 2)
            : result.data.exportData.map((row: any[]) => row.join(',')).join('\n');
          
          const dataBlob = new Blob([dataStr], { 
            type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
          });
          
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `seo-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success(`Successfully exported ${result.data.totalItems} entries`);
        } else {
          toast.success(result.message);
          onOperationComplete();
        }
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('An error occurred during the operation');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationDescription = () => {
    switch (operation) {
      case 'update':
        return `Update SEO data for ${selectedPaths.length} selected pages`;
      case 'delete':
        return `Delete custom SEO data for ${selectedPaths.length} selected pages (will revert to defaults)`;
      case 'reset':
        return `Reset ${selectedPaths.length} selected pages to default SEO values`;
      case 'export':
        return `Export SEO data for ${selectedPaths.length} selected pages as ${exportFormat.toUpperCase()}`;
      case 'import':
        return 'Import SEO data from JSON format';
      default:
        return '';
    }
  };

  const isDestructiveOperation = operation === 'delete' || operation === 'reset';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Bulk SEO Operations</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <FormSelect
            label="Operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
            options={[
              { value: 'update', label: 'Update SEO Data' },
              { value: 'delete', label: 'Delete Custom SEO Data' },
              { value: 'reset', label: 'Reset to Defaults' },
              { value: 'export', label: 'Export SEO Data' },
              { value: 'import', label: 'Import SEO Data' }
            ]}
          />

          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">{getOperationDescription()}</p>
          </div>

          {operation === 'update' && (
            <div className="space-y-4">
              <h3 className="font-medium">Update Fields (leave empty to keep existing values)</h3>
              
              <FormInput
                label="Meta Title"
                value={bulkData.metaTitle || ''}
                onChange={(e) => setBulkData({ ...bulkData, metaTitle: e.target.value })}
                placeholder="Enter meta title to apply to all selected pages"
                maxLength={60}
              />
              
              <FormTextarea
                label="Meta Description"
                value={bulkData.metaDescription || ''}
                onChange={(e) => setBulkData({ ...bulkData, metaDescription: e.target.value })}
                placeholder="Enter meta description to apply to all selected pages"
                maxLength={160}
                rows={3}
              />
              
              <FormSelect
                label="Robots"
                value={bulkData.robots || ''}
                onChange={(e) => setBulkData({ ...bulkData, robots: e.target.value })}
                options={[
                  { value: '', label: 'Keep existing' },
                  { value: 'index,follow', label: 'index,follow' },
                  { value: 'noindex,follow', label: 'noindex,follow' },
                  { value: 'index,nofollow', label: 'index,nofollow' },
                  { value: 'noindex,nofollow', label: 'noindex,nofollow' }
                ]}
              />
              
              <FormSelect
                label="Page Category"
                value={bulkData.pageCategory || ''}
                onChange={(e) => setBulkData({ ...bulkData, pageCategory: e.target.value })}
                options={[
                  { value: '', label: 'Keep existing' },
                  { value: 'main', label: 'Main' },
                  { value: 'services', label: 'Services' },
                  { value: 'blog', label: 'Blog' },
                  { value: 'about', label: 'About' },
                  { value: 'contact', label: 'Contact' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
          )}

          {operation === 'export' && (
            <FormSelect
              label="Export Format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              options={[
                { value: 'json', label: 'JSON' },
                { value: 'csv', label: 'CSV' }
              ]}
            />
          )}

          {operation === 'import' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Import Data (JSON format)
              </label>
              <FormTextarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={`[
  {
    "path": "/services/web3",
    "metaTitle": "Web3 Services",
    "metaDescription": "Professional Web3 development services",
    "robots": "index,follow",
    "pageCategory": "services"
  }
]`}
                rows={10}
              />
              <p className="text-xs text-gray-500">
                Provide an array of objects with path and SEO data to import
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={isDestructiveOperation ? "danger" : "primary"}
              onClick={() => setShowConfirmation(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `${operation.charAt(0).toUpperCase() + operation.slice(1)}`}
            </Button>
          </div>
        </div>

        {showConfirmation && (
          <ConfirmationDialog
            isOpen={showConfirmation}
            title={`Confirm ${operation.charAt(0).toUpperCase() + operation.slice(1)}`}
            message={getOperationDescription()}
            confirmText={operation.charAt(0).toUpperCase() + operation.slice(1)}
            onConfirm={handleBulkOperation}
            onClose={() => setShowConfirmation(false)}
            type={isDestructiveOperation ? 'danger' : 'warning'}
            loading={isLoading}
          />
        )}


      </div>
    </div>
  );
};