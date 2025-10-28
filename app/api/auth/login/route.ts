import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ActivityLogger } from '@/lib/activity-logger'
import { JWTUtils } from '@/lib/jwt-utils'
import { ApiResponse } from '@/types'

// Handle login activity logging after NextAuth authentication
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No active session found' },
        { status: 401 }
      )
    }

    // Create JWT token for API authentication
    const jwtToken = JWTUtils.generateToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role
    })

    // Log successful login activity
    try {
      await ActivityLogger.logLogin(session.user.email, session.user.id)
    } catch (logError) {
      console.error('Failed to log login activity:', logError)
      // Don't fail the response if logging fails
    }

    // Create response and set JWT token as cookie
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Login activity logged successfully'
    })

    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login activity logging error:', error)
    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Login successful (activity logging failed)' },
      { status: 200 }
    )
  }
}