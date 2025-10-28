'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { announceToScreenReader } from '@/lib/accessibility'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      
      // Announce to screen readers
      const announcement = `${toast.type}: ${toast.title}${toast.message ? `. ${toast.message}` : ''}`
      announceToScreenReader(announcement, toast.type === 'error' ? 'assertive' : 'polite')
      
      return updated
    })

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAll = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => onRemove(toast.id), 150) // Wait for exit animation
  }

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-150 ease-in-out"
    const visibleStyles = isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
    const removingStyles = isRemoving ? "translate-x-full opacity-0 scale-95" : ""
    
    return `${baseStyles} ${visibleStyles} ${removingStyles}`
  }

  const getToastColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-800 border-green-600',
          icon: 'text-green-400',
          text: 'text-green-100'
        }
      case 'error':
        return {
          bg: 'bg-red-800 border-red-600',
          icon: 'text-red-400',
          text: 'text-red-100'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-800 border-yellow-600',
          icon: 'text-yellow-400',
          text: 'text-yellow-100'
        }
      case 'info':
        return {
          bg: 'bg-blue-800 border-blue-600',
          icon: 'text-blue-400',
          text: 'text-blue-100'
        }
      default:
        return {
          bg: 'bg-gray-800 border-gray-600',
          icon: 'text-gray-400',
          text: 'text-gray-100'
        }
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <AlertCircle className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const colors = getToastColors()

  return (
    <div
      className={`${getToastStyles()} ${colors.bg} border rounded-lg shadow-lg p-4 max-w-sm w-full`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${colors.icon}`} aria-hidden="true">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${colors.text}`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`mt-1 text-sm ${colors.text} opacity-90`}>
              {toast.message}
            </p>
          )}
          
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={toast.action.onClick}
                className={`text-sm font-medium ${colors.text} hover:opacity-80 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white rounded`}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className={`flex-shrink-0 ${colors.text} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white rounded p-1`}
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function useSuccessToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, options?: Partial<Toast>) =>
    addToast({ type: 'success', title, message, ...options })
}

export function useErrorToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, options?: Partial<Toast>) =>
    addToast({ type: 'error', title, message, duration: 0, ...options }) // Errors don't auto-dismiss
}

export function useWarningToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, options?: Partial<Toast>) =>
    addToast({ type: 'warning', title, message, ...options })
}

export function useInfoToast() {
  const { addToast } = useToast()
  return (title: string, message?: string, options?: Partial<Toast>) =>
    addToast({ type: 'info', title, message, ...options })
}