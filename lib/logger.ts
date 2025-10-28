// Comprehensive logging system for the blog admin panel
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string
  action?: string
  resource?: string
  ip?: string
  userAgent?: string
  requestId?: string
  duration?: number
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const contextStr = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : ''
      const errorStr = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}\n${entry.error.stack}` : ''
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`
    } else {
      // JSON format for production (easier for log aggregation)
      return JSON.stringify(entry)
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }

    const formattedLog = this.formatLogEntry(entry)

    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
    }

    // In production, send to external logging service
    if (this.isProduction) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service integration
    // Examples:
    // - Sentry for error tracking
    // - LogRocket for session replay
    // - DataDog for log aggregation
    // - CloudWatch for AWS deployments
    
    // For now, we'll just ensure the log is properly formatted for external consumption
    if (entry.level === LogLevel.ERROR && entry.error) {
      // Example: Sentry.captureException(new Error(entry.error.message), {
      //   contexts: { custom: entry.context },
      //   tags: { action: entry.context?.action }
      // })
    }
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  // Audit logging for admin actions
  audit(action: string, context: LogContext) {
    this.info(`AUDIT: ${action}`, {
      ...context,
      audit: true,
      timestamp: new Date().toISOString()
    })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext) {
    const level = duration > 100000 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      duration,
      performance: true
    })
  }

  // Database operation logging
  database(operation: string, collection?: string, context?: LogContext) {
    this.debug(`Database: ${operation}${collection ? ` on ${collection}` : ''}`, {
      ...context,
      database: true,
      collection
    })
  }

  // Authentication logging
  auth(event: string, context: LogContext) {
    this.info(`Auth: ${event}`, {
      ...context,
      auth: true
    })
  }

  // API request logging
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, `API: ${method} ${path} - ${statusCode} (${duration}ms)`, {
      ...context,
      api: true,
      method,
      path,
      statusCode,
      duration
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Utility function to measure execution time
export async function measureTime<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await operation()
    const duration = Date.now() - startTime
    logger.performance(operationName, duration, context)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`${operationName} failed after ${duration}ms`, context, error as Error)
    throw error
  }
}

// Request context extractor for Next.js
export function extractRequestContext(request: Request): LogContext {
  const url = new URL(request.url)
  return {
    method: request.method,
    path: url.pathname,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestId: request.headers.get('x-request-id') || crypto.randomUUID()
  }
}