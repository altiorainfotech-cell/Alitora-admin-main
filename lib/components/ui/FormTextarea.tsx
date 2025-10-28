'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  loading?: boolean
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, label, error, helperText, required, loading, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            "w-full px-3 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400",
            "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200 resize-vertical",
            "min-h-[100px]", // Minimum height for better mobile usability
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            loading && "opacity-50 cursor-wait",
            className
          )}
          ref={ref}
          disabled={loading || props.disabled}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400 flex items-center">
            <span className="mr-1">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

export { FormTextarea }