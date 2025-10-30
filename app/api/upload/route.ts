import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { withServerErrorHandler, createSuccessResponse } from '@/lib/server-error-handler';
import { requirePermission } from '@/lib/permission-middleware';

export const POST = withServerErrorHandler(async (request: NextRequest) => {
  // Check authentication - allow any authenticated admin user to upload images
  await requirePermission(request, 'blogs', 'write');

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Cloudinary
  const result = await uploadToCloudinary(buffer, 'blog-images');

  return createSuccessResponse({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height
  }, 'Image uploaded successfully');
}, { action: 'UPLOAD_IMAGE' });

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication using the same method as other admin APIs
    await requirePermission(request, 'blogs', 'write');

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({
        success: false,
        error: 'Public ID is required'
      }, { status: 400 });
    }

    // Delete from Cloudinary
    const { deleteFromCloudinary } = await import('@/lib/cloudinary');
    await deleteFromCloudinary(publicId);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete image'
    }, { status: 500 });
  }
}