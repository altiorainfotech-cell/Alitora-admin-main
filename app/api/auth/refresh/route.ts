import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import AdminUser from '@/lib/models/AdminUser'
import { JWTUtils } from '@/lib/jwt-utils'
import { ApiResponse } from '@/types'

// Handle token refresh
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    // Check if token is expired
    if (JWTUtils.isTokenExpired(token)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Token has expired' },
        { status: 401 }
      )
    }

    // Verify token and get user info
    let decoded
    try {
      decoded = JWTUtils.verifyToken(token)
    } catch (tokenError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }

    // Verify user still exists and is active
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

    // Generate new token
    const newToken = JWTUtils.generateToken({
      userId: user._id?.toString() || '',
      email: user.email,
      role: user.role
    })

    // Set new token in cookie
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          id: user._id?.toString(),
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    })

    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}