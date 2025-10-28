'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LoadingOverlay } from './LoadingSpinner'

interface FormCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  loading?: boolean
  loadingText?: string
}

export function FormCard({ 
  title, 
  description, 
  children, 
  className, 
  loading = false,
  loadingText = 'Processing...'
}: FormCardProps) {
  return (
    <div className={cn(
      "relative bg-gray-800 rounded-lg p-6 shadow-lg",
      className
    )}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      
      {children}
      
      <LoadingOverlay isLoading={loading} text={loadingText} />
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium text-gray-200 mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}