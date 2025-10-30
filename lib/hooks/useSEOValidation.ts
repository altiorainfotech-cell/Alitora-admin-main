import { useState, useEffect, useCallback } from 'react'
import { 
  validateMetaTitle, 
  validateMetaDescription, 
  validateSlug, 
  validateOpenGraphImage,
  validateSEOForm,
  checkSEOBestPractices,
  SEOPageInput
} from '@/lib/seo-validation'

interface ValidationState {
  metaTitle: { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' }
  metaDescription: { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' }
  slug: { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' }
  openGraphImage: { isValid: boolean; message: string; severity: 'error' | 'warning' | 'success' }
}

interface SEOScore {
  score: number
  suggestions: string[]
}

export const useSEOValidation = (formData: Partial<SEOPageInput>) => {
  const [validation, setValidation] = useState<ValidationState>({
    metaTitle: { isValid: true, message: '', severity: 'success' },
    metaDescription: { isValid: true, message: '', severity: 'success' },
    slug: { isValid: true, message: '', severity: 'success' },
    openGraphImage: { isValid: true, message: '', severity: 'success' }
  })

  const [seoScore, setSeoScore] = useState<SEOScore>({ score: 0, suggestions: [] })
  const [isFormValid, setIsFormValid] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Validate individual fields
  const validateField = useCallback((field: keyof ValidationState, value: string) => {
    let result
    
    switch (field) {
      case 'metaTitle':
        result = validateMetaTitle(value)
        break
      case 'metaDescription':
        result = validateMetaDescription(value)
        break
      case 'slug':
        result = validateSlug(value)
        break
      case 'openGraphImage':
        result = validateOpenGraphImage(value)
        break
      default:
        result = { isValid: true, message: '', severity: 'success' as const }
    }

    setValidation(prev => ({
      ...prev,
      [field]: result
    }))

    return result
  }, [])

  // Validate entire form
  const validateForm = useCallback(() => {
    const { isValid, errors } = validateSEOForm(formData)
    setIsFormValid(isValid)
    setFormErrors(errors)
    return { isValid, errors }
  }, [formData])

  // Calculate SEO score
  const calculateSEOScore = useCallback(() => {
    if (formData.metaTitle && formData.metaDescription && formData.slug) {
      const score = checkSEOBestPractices(formData as SEOPageInput)
      setSeoScore(score)
      return score
    }
    return { score: 0, suggestions: [] }
  }, [formData])

  // Auto-validate when form data changes
  useEffect(() => {
    if (formData.metaTitle !== undefined) {
      validateField('metaTitle', formData.metaTitle)
    }
    if (formData.metaDescription !== undefined) {
      validateField('metaDescription', formData.metaDescription)
    }
    if (formData.slug !== undefined) {
      validateField('slug', formData.slug)
    }
    if (formData.openGraph?.image !== undefined) {
      validateField('openGraphImage', formData.openGraph.image)
    }

    // Validate form and calculate score
    validateForm()
    calculateSEOScore()
  }, [formData, validateField, validateForm, calculateSEOScore])

  // Get validation status for a field
  const getFieldValidation = (field: keyof ValidationState) => validation[field]

  // Check if field has error
  const hasFieldError = (field: keyof ValidationState) => !validation[field].isValid

  // Get field error message
  const getFieldError = (field: keyof ValidationState) => 
    validation[field].isValid ? '' : validation[field].message

  // Get field status color
  const getFieldStatusColor = (field: keyof ValidationState) => {
    const { isValid, severity } = validation[field]
    if (!isValid) return 'red'
    
    switch (severity) {
      case 'error': return 'red'
      case 'warning': return 'orange'
      case 'success': return 'green'
      default: return 'gray'
    }
  }

  // Check if form can be submitted
  const canSubmit = () => {
    return isFormValid && 
           validation.metaTitle.isValid && 
           validation.metaDescription.isValid && 
           validation.slug.isValid &&
           validation.openGraphImage.isValid
  }

  // Get all validation errors
  const getAllErrors = () => {
    const errors: string[] = []
    
    Object.entries(validation).forEach(([field, validation]) => {
      if (!validation.isValid) {
        errors.push(`${field}: ${validation.message}`)
      }
    })

    Object.entries(formErrors).forEach(([field, message]) => {
      errors.push(`${field}: ${message}`)
    })

    return errors
  }

  // Get validation summary
  const getValidationSummary = () => {
    const totalFields = Object.keys(validation).length
    const validFields = Object.values(validation).filter(v => v.isValid).length
    const warningFields = Object.values(validation).filter(v => v.isValid && v.severity === 'warning').length
    
    return {
      totalFields,
      validFields,
      warningFields,
      errorFields: totalFields - validFields,
      isAllValid: validFields === totalFields,
      hasWarnings: warningFields > 0
    }
  }

  return {
    validation,
    seoScore,
    isFormValid,
    formErrors,
    validateField,
    validateForm,
    calculateSEOScore,
    getFieldValidation,
    hasFieldError,
    getFieldError,
    getFieldStatusColor,
    canSubmit,
    getAllErrors,
    getValidationSummary
  }
}