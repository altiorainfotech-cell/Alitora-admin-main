import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export const uploadToCloudinary = async (
  file: File | Buffer | string,
  folder: string = 'staff'
): Promise<CloudinaryUploadResult> => {
  try {
    let uploadData: string;
    
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      uploadData = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } else if (Buffer.isBuffer(file)) {
      uploadData = `data:image/jpeg;base64,${file.toString('base64')}`;
    } else {
      uploadData = file as string;
    }

    const result = await cloudinary.uploader.upload(
      uploadData,
      {
        folder: `altiora/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};



// Get responsive image URLs
export const getResponsiveImageUrls = (publicId: string, options?: any) => {
  const baseUrl = cloudinary.url(publicId, { 
    secure: true,
    quality: 'auto',
    fetch_format: 'auto'
  });
  
  return {
    mobile: cloudinary.url(publicId, { width: 400, crop: 'scale', quality: 'auto', fetch_format: 'auto' }),
    tablet: cloudinary.url(publicId, { width: 800, crop: 'scale', quality: 'auto', fetch_format: 'auto' }),
    desktop: cloudinary.url(publicId, { width: 1200, crop: 'scale', quality: 'auto', fetch_format: 'auto' }),
    original: baseUrl
  };
};

// Validate image file
export const validateImageFile = (file: File): { success: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' };
  }
  
  if (file.size > maxSize) {
    return { success: false, error: 'File size too large. Maximum size is 10MB.' };
  }
  
  return { success: true };
};

// Generate SEO image URL
export const generateSEOImageUrl = (publicId: string, options?: any) => {
  return cloudinary.url(publicId, {
    width: 1200,
    height: 630,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  });
};

// Type definitions
export interface BlogImageUploadOptions {
  folder?: string;
  blogPostId?: string;
  isFeaturedImage?: boolean;
  generateThumbnails?: boolean;
  tags?: string[];
  quality?: string;
}

export interface ImageValidationResult {
  success: boolean;
  error?: string;
}

export default cloudinary;