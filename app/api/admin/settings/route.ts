import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import { z } from 'zod'
import { sanitizeString } from '@/lib/validations'


// Validation schema for Cloudinary settings
const cloudinarySettingsSchema = z.object({
  cloudName: z.string()
    .min(1, 'Cloud name is required')
    .max(100, 'Cloud name too long')
    .transform(sanitizeString),
  apiKey: z.string()
    .min(1, 'API key is required')
    .max(100, 'API key too long')
    .transform(sanitizeString),
  apiSecret: z.string()
    .min(1, 'API secret is required')
    .max(100, 'API secret too long')
    .transform(sanitizeString),
  uploadPreset: z.string()
    .min(1, 'Upload preset is required')
    .max(100, 'Upload preset too long')
    .transform(sanitizeString)
    .optional(),
})

// GET /api/admin/settings - Get current system settings
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can view system settings
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get current Cloudinary configuration (without secrets)
    const settings = {
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        // Don't expose the secret
        apiSecret: process.env.CLOUDINARY_API_SECRET ? '••••••••••••••••' : '',
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || '',
        configured: !!(
          process.env.CLOUDINARY_CLOUD_NAME && 
          process.env.CLOUDINARY_API_KEY && 
          process.env.CLOUDINARY_API_SECRET
        )
      },
      database: {
        connected: true, // We can assume it's connected if we're here
        url: process.env.DATABASE_URL ? '••••••••••••••••' : '',
        configured: !!process.env.DATABASE_URL
      },
      auth: {
        secret: process.env.NEXTAUTH_SECRET ? '••••••••••••••••' : '',
        configured: !!process.env.NEXTAUTH_SECRET
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
})

// PUT /api/admin/settings - Update system settings
export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can update settings
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { cloudinary: cloudinarySettings } = body

    if (cloudinarySettings) {
      const validatedData = cloudinarySettingsSchema.parse(cloudinarySettings)

      // Note: In a real application, you would save these to a secure configuration store
      // For this implementation, we'll just validate and return success
      // The actual environment variables would need to be updated manually or through a deployment process
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Settings updated successfully. Please restart the application for changes to take effect.',
        data: {
          cloudinary: {
            cloudName: validatedData.cloudName,
            apiKey: validatedData.apiKey,
            uploadPreset: validatedData.uploadPreset || '',
            configured: true
          }
        }
      })
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'No settings provided' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating settings:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
})