'use client'

import { useState } from 'react'
import { Trash2, Archive, Eye, EyeOff, MoreHorizontal } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { FormSelect } from '@/lib/components/ui/FormSelect'

interface BulkActionsProps {
  selectedCount: number
  onBulkDelete?: () => void
  onBulkStatusChange?: (status: 'draft' | 'published' | 'archived') => void
  onClearSelection: () => void
  loading?: boolean
}

export function BulkActions({
  selectedCount,
  onBulkDelete,
  onBulkStatusChange,
  onClearSelection,
  loading = false
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false)

  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-blue-300 text-sm">
          {selectedCount} post{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          Clear Selection
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Quick Actions */}
        {onBulkStatusChange && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onBulkStatusChange('published')}
              disabled={loading}
              icon={<Eye size={14} />}
            >
              Publish
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onBulkStatusChange('draft')}
              disabled={loading}
              icon={<EyeOff size={14} />}
            >
              Draft
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onBulkStatusChange('archived')}
              disabled={loading}
              icon={<Archive size={14} />}
            >
              Archive
            </Button>
          </>
        )}
        
        {onBulkDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            disabled={loading}
            icon={<Trash2 size={14} />}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}