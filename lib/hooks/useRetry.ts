'use client'

import { useState, useCallback, useRef, useMemo } from 'react'

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: Error) => boolean
  onRetry?: (attempt: number, error: Error) => void
  onMaxAttemptsReached?: (error: Error) => void
}

export interface RetryState {
  isRetrying: boolean
  attempt: number
  lastError: Error | null
  canRetry: boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, 5xx errors, and timeout errors
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')
    )
  },
  onRetry: () => { },
  onMaxAttemptsReached: () => { }
}

export function useRetry<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  const opts = useMemo(() => ({ ...defaultOptions, ...options }), [options])
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
    canRetry: false
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const executeWithRetry = useCallback(async (...args: T): Promise<R> => {
    let attempt = 0
    let lastError: Error

    const execute = async (): Promise<R> => {
      attempt++

      setState(prev => ({
        ...prev,
        isRetrying: attempt > 1,
        attempt,
        canRetry: false
      }))

      try {
        const result = await operation(...args)

        setState({
          isRetrying: false,
          attempt: 0,
          lastError: null,
          canRetry: false
        })

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        const shouldRetry = attempt < opts.maxAttempts && opts.retryCondition(lastError)

        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError,
          canRetry: shouldRetry
        }))

        if (shouldRetry) {
          opts.onRetry(attempt, lastError)

          const delay = Math.min(
            opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
            opts.maxDelay
          )

          const jitteredDelay = delay + Math.random() * 1000

          return new Promise<R>((resolve, reject) => {
            timeoutRef.current = setTimeout(async () => {
              try {
                const result = await execute()
                resolve(result)
              } catch (retryError) {
                reject(retryError)
              }
            }, jitteredDelay)
          })
        } else {
          opts.onMaxAttemptsReached(lastError)
          throw lastError
        }
      }
    }

    return execute()
  }, [operation, opts])

  const retry = useCallback(async (...args: T): Promise<R> => {
    if (!state.canRetry) {
      throw new Error('Cannot retry: no previous error or max attempts reached')
    }

    return executeWithRetry(...args)
  }, [executeWithRetry, state.canRetry])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setState({
      isRetrying: false,
      attempt: 0,
      lastError: null,
      canRetry: false
    })
  }, [])

  return {
    execute: executeWithRetry,
    retry,
    reset,
    state
  }
}

// Specialized hook for API calls
export function useApiRetry<T extends any[], R>(
  apiCall: (...args: T) => Promise<R>,
  options: Omit<RetryOptions, 'retryCondition'> & {
    retryOn?: 'network' | 'server' | 'all'
  } = {}
) {
  const { retryOn = 'all', ...retryOptions } = options

  const retryCondition = useCallback((error: Error) => {
    const errorMessage = error.message.toLowerCase()

    switch (retryOn) {
      case 'network':
        return (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout')
        )

      case 'server':
        return (
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504')
        )

      case 'all':
      default:
        return (
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504')
        )
    }
  }, [retryOn])

  return useRetry(apiCall, {
    ...retryOptions,
    retryCondition
  })
}

// Hook for file upload with retry
export function useUploadRetry<T extends any[], R>(
  uploadFunction: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return useRetry(uploadFunction, {
    maxAttempts: 3,
    initialDelay: 2000,
    backoffFactor: 1.5,
    retryCondition: (error: Error) => {
      const errorMessage = error.message.toLowerCase()
      // Retry on network errors and server errors, but not on validation errors
      return (
        (errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('500') ||
          errorMessage.includes('502') ||
          errorMessage.includes('503') ||
          errorMessage.includes('504')) &&
        !errorMessage.includes('validation') &&
        !errorMessage.includes('invalid') &&
        !errorMessage.includes('unauthorized')
      )
    },
    ...options
  })
}