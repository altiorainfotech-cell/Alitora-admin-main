'use client'

import { CheckCircle, AlertTriangle, AlertCircle, Info, TrendingUp } from 'lucide-react'

interface ValidationFeedbackProps {
  score: number
  suggestions: string[]
  validationSummary: {
    totalFields: number
    validFields: number
    warningFields: number
    errorFields: number
    isAllValid: boolean
    hasWarnings: boolean
  }
  className?: string
}

export default function ValidationFeedback({
  score,
  suggestions,
  validationSummary,
  className = ''
}: ValidationFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200'
    if (score >= 70) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-orange-500" />
    return <AlertCircle className="w-5 h-5 text-red-500" />
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div className={className}>
      {/* SEO Score */}
      <div className={`p-4 rounded-lg border ${getScoreBgColor(score)} mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getScoreIcon(score)}
            <h3 className="font-medium text-gray-900">SEO Score</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>
        
        {/* Score Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className={getScoreColor(score)}>{getScoreLabel(score)}</span>
          <div className="flex items-center gap-1 text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span>SEO Optimization</span>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Validation Summary
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Valid Fields:</span>
            <span className="font-medium text-green-600">
              {validationSummary.validFields}/{validationSummary.totalFields}
            </span>
          </div>
          
          {validationSummary.warningFields > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Warnings:</span>
              <span className="font-medium text-orange-600">
                {validationSummary.warningFields}
              </span>
            </div>
          )}
          
          {validationSummary.errorFields > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Errors:</span>
              <span className="font-medium text-red-600">
                {validationSummary.errorFields}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              validationSummary.isAllValid 
                ? 'text-green-600' 
                : validationSummary.hasWarnings 
                ? 'text-orange-600' 
                : 'text-red-600'
            }`}>
              {validationSummary.isAllValid 
                ? 'All Valid' 
                : validationSummary.hasWarnings 
                ? 'Has Warnings' 
                : 'Has Errors'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            SEO Improvement Suggestions
          </h4>
          
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Perfect Score Message */}
      {score === 100 && suggestions.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Perfect SEO Score!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your SEO metadata follows all best practices. Great job!
          </p>
        </div>
      )}
    </div>
  )
}