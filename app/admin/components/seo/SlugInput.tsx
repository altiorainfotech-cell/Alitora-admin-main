'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react'

interface SlugInputProps {
  value: string
  onChange: (value: string) => void
  basePath: string
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  onSlugChange?: (oldSlug: string, newSlug: string) => void
  originalSlug?: string
}

export default function SlugInput({
  value,
  onChange,
  basePath,
  label = 'Page Slug',
  placeholder = 'page-slug',
  required = false,
  className = '',
  onSlugChange,
  originalSlug,
}: SlugInputProps) {
  const [focused, setFocused] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isUnique, setIsUnique] = useState(true)
  const [validationMessage, setValidationMessage] = useState('')

  // Generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  // Validate slug format
  const isValidSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugRegex.test(slug) && slug.length > 0
  }

  // Check if slug has changed from original
  const hasSlugChanged = originalSlug && originalSlug !== value

  // Validate slug uniqueness (mock implementation)
  const validateSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug === originalSlug) {
      setIsUnique(true)
      setValidationMessage('')
      return
    }

    setIsValidating(true)
    
    try {
      // Mock API call - replace with actual validation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // For demo purposes, assume slug is unique unless it's 'taken-slug'
      const unique = slug !== 'taken-slug'
      setIsUnique(unique)
      setValidationMessage(unique ? 'Slug is available' : 'This slug is already in use')
    } catch (error) {
      setValidationMessage('Unable to validate slug uniqueness')
    } finally {
      setIsValidating(false)
    }
  }, [originalSlug])

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && isValidSlug(value)) {
        validateSlugUniqueness(value)
      } else {
        setIsUnique(true)
        setValidationMessage('')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [value, originalSlug, validateSlugUniqueness])

  const getStatusColor = () => {
    if (!value) return 'text-gray-500'
    if (!isValidSlug(value)) return 'text-red-600'
    if (isValidating) return 'text-blue-600'
    if (!isUnique) return 'text-red-600'
    return 'text-green-600'
  }

  const getStatusIcon = () => {
    if (!value) return null
    if (!isValidSlug(value)) return <AlertTriangle className="w-4 h-4 text-red-500" />
    if (isValidating) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    if (!isUnique) return <AlertTriangle className="w-4 h-4 text-red-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getBorderColor = () => {
    if (!value) return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    if (!isValidSlug(value) || !isUnique) return 'border-red-300 focus:border-red-500 focus:ring-red-500'
    if (focused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
    return 'border-green-300 focus:border-green-500 focus:ring-green-500'
  }

  const getFullUrl = () => {
    const baseUrl = 'https://altiorainfotech.com'
    const fullPath = basePath === '/' ? `/${value}` : `${basePath}/${value}`
    return `${baseUrl}${fullPath}`
  }

  const handleSlugChange = (newValue: string) => {
    const sanitizedValue = newValue.toLowerCase().replace(/[^a-z0-9-]/g, '')
    onChange(sanitizedValue)
    
    if (onSlugChange && originalSlug && originalSlug !== sanitizedValue) {
      onSlugChange(originalSlug, sanitizedValue)
    }
  }

  const autoGenerateSlug = () => {
    // This would typically be called with a title value
    // For now, we'll just clean up the current value
    const cleanSlug = generateSlug(value)
    onChange(cleanSlug)
  }

  return (
    <div className={className}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleSlugChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 pr-12 border rounded-md shadow-sm
            placeholder-gray-400 focus:outline-none focus:ring-1
            transition-colors duration-200 font-mono text-sm
            ${getBorderColor()}
          `}
          required={required}
        />
        
        {/* Status Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getStatusIcon()}
        </div>
      </div>

      {/* Full URL Preview */}
      {value && (
        <div className="mt-2 p-2 bg-gray-50 rounded border">
          <div className="text-xs text-gray-500 mb-1">Full URL:</div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-blue-600 break-all">{getFullUrl()}</code>
            <button
              onClick={() => window.open(getFullUrl(), '_blank')}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Preview URL"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {(validationMessage || !isValidSlug(value)) && value && (
        <div className={`text-xs mt-1 ${getStatusColor()}`}>
          {!isValidSlug(value) 
            ? 'Slug must contain only lowercase letters, numbers, and hyphens'
            : validationMessage
          }
        </div>
      )}

      {/* Redirect Warning */}
      {hasSlugChanged && (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-orange-900">Redirect Warning</div>
              <div className="text-xs text-orange-700 mt-1">
                Changing the slug will create a redirect from the old URL to the new one.
                This helps maintain SEO rankings and prevents broken links.
              </div>
              <div className="text-xs text-orange-600 mt-2">
                <strong>Old:</strong> {originalSlug}<br />
                <strong>New:</strong> {value}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Tips */}
      {focused && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">URL Slug Best Practices:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Use lowercase letters, numbers, and hyphens only</li>
            <li>• Keep it short and descriptive</li>
            <li>• Include relevant keywords</li>
            <li>• Avoid stop words (a, an, the, etc.)</li>
            <li>• Use hyphens to separate words</li>
            <li>• Make it readable and user-friendly</li>
          </ul>
          
          <button
            onClick={autoGenerateSlug}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Auto-generate from current value
          </button>
        </div>
      )}
    </div>
  )
}