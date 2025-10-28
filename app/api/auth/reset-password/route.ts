import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import AdminUser from '@/lib/models/AdminUser'
import crypto from 'crypto'

// Simple password reset (without email functionality for now)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Find user by email
    const user = await AdminUser.findOne({ email })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent.'
      })
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'Account is disabled' },
        { status: 403 }
      )
    }

    // For now, just return success message
    // In a real implementation, you would:
    // 1. Generate reset token
    // 2. Store it in database with expiry
    // 3. Send email with reset link

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}