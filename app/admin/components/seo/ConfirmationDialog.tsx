'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  details?: string[]
  loading?: boolean
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  details = [],
  loading = false
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  // Close dialog on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isConfirming) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isConfirming, onClose])

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
    } catch (error) {
      console.error('Confirmation action failed:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          buttonColor: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        }
      case 'info':
        return {
          icon: Check,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          buttonColor: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        }
    }
  }

  if (!isOpen) return null

  const styles = getTypeStyles()
  const Icon = styles.icon

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isConfirming ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Header */}
          <div className="flex items-start p-6 pb-4">
            <div className={`flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.bgColor} ${styles.borderColor} border`}>
              <Icon className={`h-6 w-6 ${styles.iconColor}`} />
            </div>
            
            <button
              onClick={!isConfirming ? onClose : undefined}
              disabled={isConfirming}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {message}
              </p>

              {/* Details */}
              {details.length > 0 && (
                <div className={`text-left p-3 rounded-md ${styles.bgColor} ${styles.borderColor} border mb-4`}>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isConfirming}
                className="min-w-[80px]"
              >
                {cancelText}
              </Button>
              
              <Button
                onClick={handleConfirm}
                disabled={isConfirming || loading}
                className={`min-w-[80px] text-white ${styles.buttonColor}`}
              >
                {isConfirming || loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}