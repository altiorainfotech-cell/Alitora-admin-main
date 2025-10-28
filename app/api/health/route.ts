import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function GET() {
  try {
    // Test MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // Simple ping to test connection
    await mongoose.connection.db?.admin().ping()
    
    // Check environment variables
    const envCheck = {
      hasDatabase: !!process.env.MONGODB_URI,
      hasNextAuth: !!process.env.NEXTAUTH_SECRET,
      hasCloudinary: !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      )
    }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: 'connected',
        readyState: mongoose.connection.readyState
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          readyState: mongoose.connection.readyState
        }
      },
      { status: 500 }
    )
  }
}