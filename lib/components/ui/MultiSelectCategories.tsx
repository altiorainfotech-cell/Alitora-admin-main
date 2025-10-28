'use client'

import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  imageCount?: number
}

interface MultiSelectCategoriesProps {
  categories: Category[]
  selected: string[]
  onChange: (selected: string[]) => void
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  loading?: boolean
  maxSelections?: number
  searchable?: boolean
  showImageCount?: boolean
}

export function MultiSelectCategories({
  categories,
  selected,
  onChange,
  label,
  error,
  helperText,
  required,
  loading,
  maxSelections,
  searchable = true,
  showImageCount = false
}: MultiSelectCategoriesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      onChange(selected.filter(id => id !== categoryId))
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return
      }
      onChange([...selected, categoryId])
    }
  }

  const handleSelectAll = () => {
    if (maxSelections) {
      onChange(filteredCategories.slice(0, maxSelections).map(cat => cat.id))
    } else {
      onChange(filteredCategories.map(cat => cat.id))
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const selectedCategories = categories.filter(cat => selected.includes(cat.id))

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm"
            >
              {category.name}
              {showImageCount && category.imageCount !== undefined && (
                <span className="ml-1 text-blue-200">({category.imageCount})</span>
              )}
              <button
                type="button"
                onClick={() => handleToggle(category.id)}
                disabled={loading}
                className="ml-2 text-blue-200 hover:text-white disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-left",
          "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-200 flex items-center justify-between",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          loading && "opacity-50 cursor-wait"
        )}
      >
        <span className="text-gray-100">
          {selectedCategories.length === 0
            ? 'Select categories'
            : `${selectedCategories.length} selected`}
          {maxSelections && ` (max ${maxSelections})`}
        </span>
        <div className={cn(
          "transform transition-transform duration-200",
          isOpen && "rotate-180"
        )}>
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="border border-gray-600 rounded-lg bg-gray-700 shadow-lg max-h-64 overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2 border-b border-gray-600 flex justify-between">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={loading || (maxSelections ? filteredCategories.length > maxSelections : false)}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={loading || selected.length === 0}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>

          {/* Category List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selected.includes(category.id)
                const isDisabled = loading || (maxSelections ? !isSelected && selected.length >= maxSelections : false)

                return (
                  <label
                    key={category.id}
                    className={cn(
                      "flex items-center p-3 hover:bg-gray-600 cursor-pointer transition-colors",
                      isDisabled && "opacity-50 cursor-not-allowed hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 border-2 rounded flex items-center justify-center mr-3",
                        isSelected
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-500 bg-transparent"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && handleToggle(category.id)}
                        disabled={isDisabled}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className="text-gray-100 font-medium">{category.name}</span>
                        {showImageCount && category.imageCount !== undefined && (
                          <span className="ml-2 text-sm text-gray-400">
                            ({category.imageCount} images)
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}

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