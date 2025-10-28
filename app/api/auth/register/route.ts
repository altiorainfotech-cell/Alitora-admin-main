import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import AdminUser from '@/lib/models/AdminUser'
import { ApiResponse } from '@/types'

// Handle user registration (admin only)
export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role = 'editor' } = await request.json()

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'editor'].includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid role. Must be admin or editor' },
        { status: 400 }
      )
    }

    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!)
    }

    // Check if user already exists
    const existingUser = await AdminUser.findOne({
      $or: [{ username }, { email }]
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User with this username or email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = new AdminUser({
      email,
      password: hashedPassword,
      role,
      status: 'active'
    })

    await newUser.save()

    // Return user data without password
    const userResponse = newUser.toJSON()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User created successfully',
      data: {
        user: userResponse
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }

    // Handle duplicate key errors
    if ((error as any).code === 11000) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}