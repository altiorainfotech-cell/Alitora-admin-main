import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { withServerErrorHandler, createSuccessResponse } from '@/lib/server-error-handler';
import { checkPermission } from '@/lib/permission-middleware';

export const POST = withServerErrorHandler(async (request: NextRequest) => {
  // Check basic authentication - allow any authenticated admin user to upload images
  const { authorized, error } = await checkPermission(request, 'blogs', 'write');
  if (!authorized) {
    throw new Error(error || 'Authentication required');
  }

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

export const DELETE = withServerErrorHandler(async (request: NextRequest) => {
  // Check basic authentication - allow any authenticated admin user to delete images
  const { authorized, error } = await checkPermission(request, 'blogs', 'write');
  if (!authorized) {
    throw new Error(error || 'Authentication required');
  }

  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get('publicId');

  if (!publicId) {
    throw new Error('Public ID is required');
  }

  // Delete from Cloudinary
  const { deleteFromCloudinary } = await import('@/lib/cloudinary');
  await deleteFromCloudinary(publicId);

  return createSuccessResponse(null, 'Image deleted successfully');
}, { action: 'DELETE_IMAGE' });