// Activity logging system for admin actions
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import ActivityLog from '@/lib/models/ActivityLog'
import { headers } from 'next/headers'

export interface ActivityLogData {
  action: string
  category: 'auth' | 'user' | 'blog' | 'image' | 'category' | 'settings' | 'system'
  details?: any
  imageId?: string
  userId?: string
  userEmail?: string
  userName?: string
  userRole?: 'admin' | 'seo' | 'custom'
}

export class ActivityLogger {
  static async log(data: ActivityLogData) {
    try {
      // If no userId provided, try to get from session
      let userId = data.userId
      let userEmail = data.userEmail || ''
      let userName = data.userName || ''
      let userRole: 'admin' | 'seo' | 'custom' = data.userRole || 'custom'

      if (!userId) {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          userId = session.user.id
          userEmail = userEmail || session.user.email || ''
          userName = userName || session.user.name || session.user.email || ''
          userRole = userRole || (session.user as any).role || 'custom'
        }
      } else {
        // If userId is provided but other info is missing, try to get from session
        if (!userEmail || !userName) {
          const session = await getServerSession(authOptions)
          if (session?.user) {
            userEmail = userEmail || session.user.email || ''
            userName = userName || session.user.name || session.user.email || ''
            userRole = userRole || (session.user as any).role || 'custom'
          }
        }
      }

      if (!userId) {
        console.warn('Activity log attempted without user ID:', data.action)
        return null
      }

      // If we still don't have userEmail or userName, try to fetch from database
      if (!userEmail || !userName) {
        try {
          const AdminUser = (await import('@/lib/models/AdminUser')).default
          const user = await AdminUser.findById(userId).select('email name role')
          if (user) {
            userEmail = userEmail || user.email
            userName = userName || user.name || user.email
            userRole = userRole || user.role
          }
        } catch (dbError) {
          console.warn('Could not fetch user details from database:', dbError)
        }
      }

      // Final validation - if we still don't have required fields, use fallbacks
      if (!userEmail) {
        console.warn('Missing userEmail for activity log, using fallback')
        userEmail = 'unknown@example.com'
      }
      if (!userName) {
        console.warn('Missing userName for activity log, using fallback')
        userName = userEmail
      }

      // Get IP address and user agent
      const headersList = await headers()
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      const userAgent = headersList.get('user-agent') || 'unknown'

      // Save to database
      const logEntry = await ActivityLog.logActivity({
        userId,
        userEmail,
        userName,
        userRole,
        action: data.action,
        category: data.category,
        details: data.details || {},
        ipAddress,
        userAgent
      })

      return logEntry
    } catch (error) {
      console.error('Failed to log activity:', error)
      return null
    }
  }

  static async checkSuspiciousActivity(userId: string, action: string) {
    // Check for suspicious activity patterns
    console.log('Suspicious activity check for:', userId, action)
  }

  static async flagSuspiciousActivity(userId: string, type: string, details: any) {
    // Flag suspicious activity for review
    console.warn(`Suspicious activity detected for user ${userId}: ${type}`, details)
  }

  // Common activity logging methods
  static async logImageUpload(imageId: string, imageTitle: string, userId?: string) {
    return this.log({
      action: 'IMAGE_UPLOAD',
      category: 'image',
      details: { imageTitle },
      imageId,
      userId
    })
  }

  static async logImageDelete(imageId: string, imageTitle: string, userId?: string) {
    return this.log({
      action: 'IMAGE_DELETE',
      category: 'image',
      details: { imageTitle },
      imageId,
      userId
    })
  }

  static async logImageUpdate(imageId: string, imageTitle: string, changes: any, userId?: string) {
    return this.log({
      action: 'IMAGE_UPDATE',
      category: 'image',
      details: { imageTitle, changes },
      imageId,
      userId
    })
  }

  static async logCategoryCreate(categoryName: string, userId?: string) {
    return this.log({
      action: 'CATEGORY_CREATE',
      category: 'category',
      details: { categoryName },
      userId
    })
  }

  static async logCategoryUpdate(categoryName: string, changes: any, userId?: string) {
    return this.log({
      action: 'CATEGORY_UPDATE',
      category: 'category',
      details: { categoryName, changes },
      userId
    })
  }

  static async logCategoryDelete(categoryName: string, userId?: string) {
    return this.log({
      action: 'CATEGORY_DELETE',
      category: 'category',
      details: { categoryName },
      userId
    })
  }

  static async logUserCreate(userEmail: string, role: string, userId?: string) {
    return this.log({
      action: 'USER_CREATE',
      category: 'user',
      details: { userEmail, role },
      userId
    })
  }

  static async logUserUpdate(userEmail: string, changes: any, userId?: string) {
    return this.log({
      action: 'USER_UPDATE',
      category: 'user',
      details: { userEmail, changes },
      userId
    })
  }

  static async logUserDelete(userEmail: string, userId?: string) {
    return this.log({
      action: 'USER_DELETE',
      category: 'user',
      details: { userEmail },
      userId
    })
  }

  static async logLogin(userEmail: string, userId?: string, userName?: string, userRole?: 'admin' | 'seo' | 'custom') {
    return this.log({
      action: 'LOGIN_SUCCESS',
      category: 'auth',
      details: { userEmail },
      userId,
      userEmail,
      userName,
      userRole
    })
  }

  static async logLoginFailed(userEmail: string) {
    return this.log({
      action: 'LOGIN_FAILED',
      category: 'auth',
      details: { userEmail },
      userEmail,
      userName: userEmail // Use email as fallback for name
    })
  }

  static async logLogout(userEmail: string, userId?: string, userName?: string, userRole?: 'admin' | 'seo' | 'custom') {
    return this.log({
      action: 'LOGOUT',
      category: 'auth',
      details: { userEmail },
      userId,
      userEmail,
      userName,
      userRole
    })
  }

  static async logPasswordChange(userEmail: string, userId?: string) {
    return this.log({
      action: 'PASSWORD_CHANGE',
      category: 'auth',
      details: { userEmail },
      userId
    })
  }

  static async logSettingsUpdate(settingType: string, changes: any, userId?: string) {
    return this.log({
      action: 'SETTINGS_UPDATE',
      category: 'settings',
      details: { settingType, changes },
      userId
    })
  }
}