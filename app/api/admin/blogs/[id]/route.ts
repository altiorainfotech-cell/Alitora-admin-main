import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { validateBlogPostUpdate, generateSlug } from '@/lib/blog-validation';
import { BlogCacheManager } from '@/lib/blog-cache';
import {
  withServerErrorHandler,
  createNotFoundError,
  createSuccessResponse
} from '@/lib/server-error-handler';
import { requirePermission } from '@/lib/permission-middleware';

// GET /api/admin/blogs/:id - Get specific blog post
export const GET = withServerErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  // Check permissions first
  await requirePermission(request, 'blogs', 'read');
  
  // Ensure MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  const { id } = await context.params;

  // Try to find by custom id first, then by MongoDB _id as fallback
  let blogPost = await BlogPost.findOne({ id }).lean();
  if (!blogPost && mongoose.Types.ObjectId.isValid(id)) {
    blogPost = await BlogPost.findById(id).lean();
  }

  if (!blogPost) {
    throw createNotFoundError('Blog post');
  }

  return createSuccessResponse(blogPost);
}, { action: 'GET_BLOG_POST' });

// PUT /api/admin/blogs/:id - Update existing blog post
export const PUT = withServerErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  // Check permissions first - require write permission to update
  await requirePermission(request, 'blogs', 'write');
  
  // Ensure MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  const { id } = await context.params;
  const body = await request.json();

  // Validate and sanitize input data
  const validation = validateBlogPostUpdate(body);
  if (!validation.success) {
    throw new Error('Validation failed');
  }

  // Find existing blog post by custom id first, then by MongoDB _id as fallback
  let existingPost = await BlogPost.findOne({ id });
  if (!existingPost && mongoose.Types.ObjectId.isValid(id)) {
    existingPost = await BlogPost.findById(id);
  }

  if (!existingPost) {
    throw createNotFoundError('Blog post');
  }

  // Extract validated updatable fields
  const {
    title,
    content,
    excerpt,
    image,
    images,
    contentSections,
    category,
    status,
    author,
    seo,
    date
  } = validation.data!;

  // Update fields if provided
  if (title !== undefined) existingPost.title = title;
  if (content !== undefined) existingPost.content = content;
  if (excerpt !== undefined) existingPost.excerpt = excerpt;
  if (image !== undefined) existingPost.image = image;
  if (images !== undefined) existingPost.images = images;
  if (contentSections !== undefined) existingPost.contentSections = contentSections;
  if (category !== undefined) existingPost.category = category;
  if (status !== undefined) existingPost.status = status;
  if (author !== undefined) existingPost.author = author;
  if (seo !== undefined) existingPost.seo = seo;
  if (date !== undefined) existingPost.date = date;

  // If title changed, update href (but keep the same id)
  if (title && title !== existingPost.title) {
    const slug = generateSlug(title);
    existingPost.href = `/blog/${slug}`;
  }

  await existingPost.save();

  // Invalidate cache after updating the post
  BlogCacheManager.invalidateOnPostChange({
    href: existingPost.href,
    category: existingPost.category
  });

  return createSuccessResponse(existingPost, 'Blog post updated successfully');
}, { action: 'UPDATE_BLOG_POST' });

// DELETE /api/admin/blogs/:id - Delete blog post
export const DELETE = withServerErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  // Check permissions first - require delete permission to delete
  await requirePermission(request, 'blogs', 'delete');
  
  // Ensure MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  const { id } = await context.params;

  // Try to delete by custom id first, then by MongoDB _id as fallback
  let deletedPost = await BlogPost.findOneAndDelete({ id });
  if (!deletedPost && mongoose.Types.ObjectId.isValid(id)) {
    deletedPost = await BlogPost.findByIdAndDelete(id);
  }

  if (!deletedPost) {
    throw createNotFoundError('Blog post');
  }

  // Invalidate cache after deleting the post
  BlogCacheManager.invalidateOnPostChange({
    href: deletedPost.href,
    category: deletedPost.category
  });

  return createSuccessResponse({ id: deletedPost.id }, 'Blog post deleted successfully');
}, { action: 'DELETE_BLOG_POST' });