import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { ApiResponse } from '@/types'
import { z } from 'zod'
import { sanitizeString } from '@/lib/validations'
import { v2 as cloudinary } from 'cloudinary'

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
    .max(100, 'Upload preset too long')
    .transform(sanitizeString)
    .optional(),
})

// POST /api/admin/settings/validate-cloudinary - Validate Cloudinary configuration
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can validate settings
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = cloudinarySettingsSchema.parse(body)

    // Test Cloudinary configuration
    try {
      // Configure cloudinary with provided settings
      cloudinary.config({
        cloud_name: validatedData.cloudName,
        api_key: validatedData.apiKey,
        api_secret: validatedData.apiSecret,
      })

      // Test the configuration by making a simple API call
      const result = await cloudinary.api.ping()
      
      if (result.status === 'ok') {
        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Cloudinary configuration is valid and connected successfully',
          data: {
            cloudName: validatedData.cloudName,
            status: 'connected'
          }
        })
      } else {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cloudinary configuration test failed' },
          { status: 400 }
        )
      }
    } catch (cloudinaryError: any) {
      console.error('Cloudinary validation error:', cloudinaryError)
      
      let errorMessage = 'Invalid Cloudinary configuration'
      if (cloudinaryError.message) {
        if (cloudinaryError.message.includes('Invalid API key') || cloudinaryError.message.includes('401')) {
          errorMessage = 'Invalid API key or secret'
        } else if (cloudinaryError.message.includes('cloud name') || cloudinaryError.message.includes('404')) {
          errorMessage = 'Invalid cloud name'
        } else if (cloudinaryError.message.includes('network') || cloudinaryError.message.includes('timeout')) {
          errorMessage = 'Network error - please check your connection'
        } else {
          errorMessage = cloudinaryError.message
        }
      }

      return NextResponse.json<ApiResponse>(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Error validating Cloudinary settings:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to validate settings' },
      { status: 500 }
    )
  }
})