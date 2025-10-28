import { logger } from './logger'

export interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  userEmail?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  success: boolean
  error?: string
}

export type AuditAction = 
  // Authentication actions
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  
  // Blog post actions
  | 'blog_create'
  | 'blog_update'
  | 'blog_delete'
  | 'blog_publish'
  | 'blog_unpublish'
  | 'blog_view'
  
  // Category actions
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  
  // Image actions
  | 'image_upload'
  | 'image_delete'
  | 'image_update'
  
  // User management actions
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_activate'
  | 'user_deactivate'
  
  // System actions
  | 'settings_update'
  | 'system_backup'
  | 'system_restore'
  | 'data_export'
  | 'data_import'

export type AuditResource = 
  | 'auth'
  | 'blog_post'
  | 'category'
  | 'image'
  | 'user'
  | 'settings'
  | 'system'

class AuditLogger {
  private events: AuditEvent[] = []
  private readonly maxEvents = 10000 // Keep last 10k events in memory

  // Log an audit event
  logEvent(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    options: {
      resourceId?: string
      details?: Record<string, any>
      ip?: string
      userAgent?: string
      userEmail?: string
      success?: boolean
      error?: string
    } = {}
  ): string {
    const eventId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const event: AuditEvent = {
      id: eventId,
      timestamp,
      userId,
      userEmail: options.userEmail,
      action,
      resource,
      resourceId: options.resourceId,
      details: options.details,
      ip: options.ip,
      userAgent: options.userAgent,
      success: options.success ?? true,
      error: options.error
    }

    // Add to in-memory storage
    this.events.push(event)
    
    // Keep only the last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log using the main logger
    logger.audit(`${action} on ${resource}`, {
      eventId,
      userId,
      userEmail: options.userEmail,
      resource,
      resourceId: options.resourceId,
      success: event.success,
      ip: options.ip,
      userAgent: options.userAgent,
      details: options.details,
      error: options.error
    })

    // In production, you might want to send to external audit service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalAuditService(event)
    }

    return eventId
  }

  // Convenience methods for common audit events
  logAuth(
    userId: string,
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset',
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'auth', options)
  }

  logBlogAction(
    userId: string,
    action: 'blog_create' | 'blog_update' | 'blog_delete' | 'blog_publish' | 'blog_unpublish' | 'blog_view',
    blogId: string,
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'blog_post', {
      ...options,
      resourceId: blogId
    })
  }

  logCategoryAction(
    userId: string,
    action: 'category_create' | 'category_update' | 'category_delete',
    categoryId: string,
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'category', {
      ...options,
      resourceId: categoryId
    })
  }

  logImageAction(
    userId: string,
    action: 'image_upload' | 'image_delete' | 'image_update',
    imageId: string,
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'image', {
      ...options,
      resourceId: imageId
    })
  }

  logUserAction(
    userId: string,
    action: 'user_create' | 'user_update' | 'user_delete' | 'user_activate' | 'user_deactivate',
    targetUserId: string,
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'user', {
      ...options,
      resourceId: targetUserId
    })
  }

  logSystemAction(
    userId: string,
    action: 'settings_update' | 'system_backup' | 'system_restore' | 'data_export' | 'data_import',
    options: {
      userEmail?: string
      ip?: string
      userAgent?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    } = {}
  ): string {
    return this.logEvent(userId, action, 'system', options)
  }

  // Query audit events
  getEvents(filters: {
    userId?: string
    action?: AuditAction
    resource?: AuditResource
    resourceId?: string
    success?: boolean
    startDate?: Date
    endDate?: Date
    limit?: number
  } = {}): AuditEvent[] {
    let filteredEvents = [...this.events]

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId)
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(e => e.action === filters.action)
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(e => e.resource === filters.resource)
    }

    if (filters.resourceId) {
      filteredEvents = filteredEvents.filter(e => e.resourceId === filters.resourceId)
    }

    if (filters.success !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.success === filters.success)
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => 
        new Date(e.timestamp) >= filters.startDate!
      )
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(e => 
        new Date(e.timestamp) <= filters.endDate!
      )
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Apply limit
    if (filters.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit)
    }

    return filteredEvents
  }

  // Get audit statistics
  getStats(timeWindow?: number): {
    totalEvents: number
    successRate: number
    failureRate: number
    topActions: Array<{ action: string; count: number }>
    topUsers: Array<{ userId: string; userEmail?: string; count: number }>
    recentFailures: AuditEvent[]
  } {
    const now = Date.now()
    const windowStart = timeWindow ? now - timeWindow : 0
    
    const relevantEvents = this.events.filter(event => 
      !timeWindow || new Date(event.timestamp).getTime() > windowStart
    )

    const totalEvents = relevantEvents.length
    const successfulEvents = relevantEvents.filter(e => e.success).length
    const failedEvents = totalEvents - successfulEvents

    const successRate = totalEvents > 0 ? successfulEvents / totalEvents : 0
    const failureRate = totalEvents > 0 ? failedEvents / totalEvents : 0

    // Top actions
    const actionCounts = new Map<string, number>()
    relevantEvents.forEach(event => {
      actionCounts.set(event.action, (actionCounts.get(event.action) || 0) + 1)
    })
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top users
    const userCounts = new Map<string, { count: number; userEmail?: string }>()
    relevantEvents.forEach(event => {
      const existing = userCounts.get(event.userId) || { count: 0 }
      userCounts.set(event.userId, {
        count: existing.count + 1,
        userEmail: event.userEmail || existing.userEmail
      })
    })
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, data]) => ({ userId, userEmail: data.userEmail, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Recent failures
    const recentFailures = relevantEvents
      .filter(e => !e.success)
      .slice(0, 20)

    return {
      totalEvents,
      successRate,
      failureRate,
      topActions,
      topUsers,
      recentFailures
    }
  }

  private sendToExternalAuditService(event: AuditEvent) {
    // TODO: Implement external audit service integration
    // Examples:
    // - Send to SIEM system
    // - Store in dedicated audit database
    // - Send to compliance monitoring service
    
    // For now, just ensure the event is properly formatted for external consumption
    logger.debug('Audit event ready for external service', {
      eventId: event.id,
      action: event.action,
      resource: event.resource,
      userId: event.userId
    })
  }

  // Clear events (useful for testing)
  clearEvents() {
    this.events = []
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Utility function to extract request context for audit logging
export function extractAuditContext(request: Request): {
  ip?: string
  userAgent?: string
} {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}

// React hook for audit logging
export function useAuditLogger() {
  const logAuth = (
    userId: string,
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset',
    options?: {
      userEmail?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    }
  ) => {
    return auditLogger.logAuth(userId, action, options)
  }

  const logBlogAction = (
    userId: string,
    action: 'blog_create' | 'blog_update' | 'blog_delete' | 'blog_publish' | 'blog_unpublish' | 'blog_view',
    blogId: string,
    options?: {
      userEmail?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    }
  ) => {
    return auditLogger.logBlogAction(userId, action, blogId, options)
  }

  const logCategoryAction = (
    userId: string,
    action: 'category_create' | 'category_update' | 'category_delete',
    categoryId: string,
    options?: {
      userEmail?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    }
  ) => {
    return auditLogger.logCategoryAction(userId, action, categoryId, options)
  }

  const logImageAction = (
    userId: string,
    action: 'image_upload' | 'image_delete' | 'image_update',
    imageId: string,
    options?: {
      userEmail?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    }
  ) => {
    return auditLogger.logImageAction(userId, action, imageId, options)
  }

  const logSystemAction = (
    userId: string,
    action: 'settings_update' | 'system_backup' | 'system_restore' | 'data_export' | 'data_import',
    options?: {
      userEmail?: string
      success?: boolean
      error?: string
      details?: Record<string, any>
    }
  ) => {
    return auditLogger.logSystemAction(userId, action, options)
  }

  return {
    logAuth,
    logBlogAction,
    logCategoryAction,
    logImageAction,
    logSystemAction
  }
}