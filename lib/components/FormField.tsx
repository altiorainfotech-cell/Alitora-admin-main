'use client'

import React, { forwardRef, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  success?: string
  helperText?: string
  required?: boolean
  schema?: z.ZodSchema
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    label,
    error,
    success,
    helperText,
    required,
    schema,
    validateOnBlur = true,
    validateOnChange = false,
    onValidation,
    className = '',
    id,
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string>()
    const [isValid, setIsValid] = useState<boolean>()
    
    // Generate unique ID if not provided
    const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`

    const validate = useCallback((value: any) => {
      if (!schema) return

      try {
        schema.parse(value)
        setInternalError(undefined)
        setIsValid(true)
        onValidation?.(true)
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errorMessage = err.issues[0]?.message || 'Invalid input'
          setInternalError(errorMessage)
          setIsValid(false)
          onValidation?.(false, errorMessage)
        }
      }
    }, [schema, onValidation])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (validateOnBlur) {
        validate(e.target.value)
      }
      props.onBlur?.(e)
    }, [validate, validateOnBlur, props])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (validateOnChange) {
        validate(e.target.value)
      }
      props.onChange?.(e)
    }, [validate, validateOnChange, props])

    const displayError = error || internalError
    const displaySuccess = success || (isValid && !displayError)

    return (
      <div className="space-y-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            {...props}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`
              w-full px-3 py-2 bg-gray-800 border rounded-lg text-gray-100 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors duration-200
              ${displayError 
                ? 'border-red-500 focus:ring-red-500' 
                : displaySuccess 
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-600 hover:border-gray-500'
              }
              ${className}
            `}
          />
          
          {/* Validation icons */}
          {(displayError || displaySuccess) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {displayError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {displayError}
          </p>
        )}

        {/* Success message */}
        {displaySuccess && !displayError && (
          <p className="text-sm text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {success || 'Valid'}
          </p>
        )}

        {/* Helper text */}
        {helperText && !displayError && !displaySuccess && (
          <p className="text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

// Textarea variant
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  success?: string
  helperText?: string
  required?: boolean
  schema?: z.ZodSchema
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({
    label,
    error,
    success,
    helperText,
    required,
    schema,
    validateOnBlur = true,
    validateOnChange = false,
    onValidation,
    className = '',
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string>()
    const [isValid, setIsValid] = useState<boolean>()

    const validate = useCallback((value: any) => {
      if (!schema) return

      try {
        schema.parse(value)
        setInternalError(undefined)
        setIsValid(true)
        onValidation?.(true)
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errorMessage = err.issues[0]?.message || 'Invalid input'
          setInternalError(errorMessage)
          setIsValid(false)
          onValidation?.(false, errorMessage)
        }
      }
    }, [schema, onValidation])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (validateOnBlur) {
        validate(e.target.value)
      }
      props.onBlur?.(e)
    }, [validate, validateOnBlur, props])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (validateOnChange) {
        validate(e.target.value)
      }
      props.onChange?.(e)
    }, [validate, validateOnChange, props])

    const displayError = error || internalError
    const displaySuccess = success || (isValid && !displayError)

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <textarea
            ref={ref}
            {...props}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`
              w-full px-3 py-2 bg-gray-800 border rounded-lg text-gray-100 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors duration-200 resize-vertical
              ${displayError 
                ? 'border-red-500 focus:ring-red-500' 
                : displaySuccess 
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-600 hover:border-gray-500'
              }
              ${className}
            `}
          />
          
          {/* Validation icons */}
          {(displayError || displaySuccess) && (
            <div className="absolute top-2 right-2">
              {displayError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {displayError}
          </p>
        )}

        {/* Success message */}
        {displaySuccess && !displayError && (
          <p className="text-sm text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {success || 'Valid'}
          </p>
        )}

        {/* Helper text */}
        {helperText && !displayError && !displaySuccess && (
          <p className="text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'

// Select variant
export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  success?: string
  helperText?: string
  required?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
  schema?: z.ZodSchema
  validateOnBlur?: boolean
  validateOnChange?: boolean
  onValidation?: (isValid: boolean, error?: string) => void
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({
    label,
    error,
    success,
    helperText,
    required,
    options,
    placeholder,
    schema,
    validateOnBlur = true,
    validateOnChange = false,
    onValidation,
    className = '',
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string>()
    const [isValid, setIsValid] = useState<boolean>()

    const validate = useCallback((value: any) => {
      if (!schema) return

      try {
        schema.parse(value)
        setInternalError(undefined)
        setIsValid(true)
        onValidation?.(true)
      } catch (err) {
        if (err instanceof z.ZodError) {
          const errorMessage = err.issues[0]?.message || 'Invalid selection'
          setInternalError(errorMessage)
          setIsValid(false)
          onValidation?.(false, errorMessage)
        }
      }
    }, [schema, onValidation])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLSelectElement>) => {
      if (validateOnBlur) {
        validate(e.target.value)
      }
      props.onBlur?.(e)
    }, [validate, validateOnBlur, props])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      if (validateOnChange) {
        validate(e.target.value)
      }
      props.onChange?.(e)
    }, [validate, validateOnChange, props])

    const displayError = error || internalError
    const displaySuccess = success || (isValid && !displayError)

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        
        <div className="relative">
          <select
            ref={ref}
            {...props}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`
              w-full px-3 py-2 bg-gray-800 border rounded-lg text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors duration-200
              ${displayError 
                ? 'border-red-500 focus:ring-red-500' 
                : displaySuccess 
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-600 hover:border-gray-500'
              }
              ${className}
            `}
          >
            {placeholder && (
              <option value="" disabled className="text-gray-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Validation icons */}
          {(displayError || displaySuccess) && (
            <div className="absolute inset-y-0 right-8 flex items-center pr-3">
              {displayError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {displayError}
          </p>
        )}

        {/* Success message */}
        {displaySuccess && !displayError && (
          <p className="text-sm text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {success || 'Valid'}
          </p>
        )}

        {/* Helper text */}
        {helperText && !displayError && !displaySuccess && (
          <p className="text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'