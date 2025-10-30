'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface MetaDescriptionTextareaProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  rows?: number
}

export default function MetaDescriptionTextarea({
  value,
  onChange,
  label = 'Meta Description',
  placeholder = 'Enter meta description...',
  required = false,
  className = '',
  rows = 4
}: MetaDescriptionTextareaProps) {
  const [focused, setFocused] = useState(false)
  const maxLength = 160
  const warningLength = 140
  const currentLength = value.length

  const getStatusColor = () => {
    if (currentLength > maxLength) return 'text-red-600'
    if (currentLength > warningLength) return 'text-orange-600'
    if (currentLength > 0) return 'text-green-600'
    return 'text-gray-500'
  }

  const getStatusIcon = () => {
    if (currentLength > maxLength) return <AlertCircle className="w-4 h-4 text-red-500" />
    if (currentLength > warningLength) return <AlertCircle className="w-4 h-4 text-orange-500" />
    if (currentLength > 0) return <CheckCircle className="w-4 h-4 text-green-500" />
    return null
  }

  const getStatusMessage = () => {
    if (currentLength > maxLength) return 'Description is too long and may be truncated in search results'
    if (currentLength > warningLength) return 'Approaching the recommended character limit'
    if (currentLength > 0) return 'Good length for search results'
    return 'Enter a compelling description for search results'
  }

  const getBorderColor = () => {
    if (currentLength > maxLength) return 'border-red-300 focus:border-red-500 focus:ring-red-500'
    if (currentLength > warningLength) return 'border-orange-300 focus:border-orange-500 focus:ring-orange-500'
    if (focused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
    return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  }

  return (
    <div className={className}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength + 20} // Allow slight overflow for warning
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm resize-none
            placeholder-gray-400 focus:outline-none focus:ring-1
            transition-colors duration-200
            ${getBorderColor()}
          `}
          required={required}
        />
        
        {/* Status Icon */}
        <div className="absolute top-2 right-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Character Count and Status */}
      <div className="flex items-center justify-between mt-2">
        <div className={`text-sm ${getStatusColor()}`}>
          {currentLength}/{maxLength} characters
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentLength > maxLength
                  ? 'bg-red-500'
                  : currentLength > warningLength
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min((currentLength / maxLength) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-xs mt-1 ${getStatusColor()}`}>
        {getStatusMessage()}
      </div>

      {/* SEO Tips */}
      {focused && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Meta Description Best Practices:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Summarize the page content accurately</li>
            <li>• Keep it under 160 characters to avoid truncation</li>
            <li>• Include relevant keywords naturally</li>
            <li>• Write compelling copy that encourages clicks</li>
            <li>• Avoid duplicate descriptions across pages</li>
            <li>• Include a call-to-action when appropriate</li>
          </ul>
        </div>
      )}
    </div>
  )
}