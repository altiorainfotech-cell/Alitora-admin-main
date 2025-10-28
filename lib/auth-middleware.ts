import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import AdminUser from '@/lib/models/AdminUser'
import { JWTUtils } from '@/lib/jwt-utils'
import { ApiResponse } from '@/types'

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'seo' | 'custom'
  status: 'active' | 'inactive'
}

export function withAuth<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | ApiResponse>> => {
    try {
      // Get token from cookie
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Verify JWT token
      let decoded
      try {
        decoded = JWTUtils.verifyToken(token)
      } catch (tokenError) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Ensure MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!)
      }

      // Get fresh user data from database
      const user = await AdminUser.findById(decoded.userId).select('-password')

      if (!user) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.status !== 'active') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Account is disabled' },
          { status: 403 }
        )
      }

      const authenticatedUser: AuthenticatedUser = {
        id: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status
      }

      return await handler(request, authenticatedUser)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withOptionalAuth<T = any>(
  handler: (request: NextRequest, user?: AuthenticatedUser) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    try {
      // Get token from cookie
      const token = request.cookies.get('auth-token')?.value

      if (!token) {
        return await handler(request, undefined)
      }

      // Verify JWT token
      let decoded
      try {
        decoded = JWTUtils.verifyToken(token)
      } catch (tokenError) {
        return await handler(request, undefined)
      }

      // Ensure MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!)
      }

      // Get fresh user data from database
      const user = await AdminUser.findById(decoded.userId).select('-password')

      if (!user || user.status !== 'active') {
        return await handler(request, undefined)
      }

      const authenticatedUser: AuthenticatedUser = {
        id: String(user._id),
        email: user.email,
        role: user.role,
        status: user.status
      }

      return await handler(request, authenticatedUser)
    } catch (error) {
      console.error('Optional authentication middleware error:', error)
      return await handler(request, undefined)
    }
  }
}

export function withAdminAuth<T = any>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse<T>>
) {
  return withAuth<T>(async (request: NextRequest, user: AuthenticatedUser) => {
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      ) as NextResponse<T>
    }

    return await handler(request, user)
  })
}