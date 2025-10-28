'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, helperText, required, loading, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            className={cn(
              "w-full bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400",
              "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200",
              "min-h-[44px] sm:min-h-0", // Touch-friendly height on mobile
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              loading && "opacity-50 cursor-wait",
              icon ? "pl-10 pr-3 py-3 sm:py-2" : "px-3 py-3 sm:py-2",
              className
            )}
            ref={ref}
            disabled={loading || props.disabled}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
        </div>
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

FormInput.displayName = 'FormInput'

export { FormInput }