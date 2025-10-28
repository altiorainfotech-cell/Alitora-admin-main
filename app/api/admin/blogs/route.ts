import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { withServerErrorHandler, createSuccessResponse } from '@/lib/server-error-handler';
import { validateBlogQuery, validateBlogPostCreation, generateSlug } from '@/lib/blog-validation';
import { BlogCacheManager } from '@/lib/blog-cache';
import { QueryPerformanceMonitor, CacheMetrics } from '@/lib/performance-monitor';
import { requirePermission } from '@/lib/permission-middleware';

// GET /api/admin/blogs - List all blog posts with pagination
export const GET = withServerErrorHandler(async (request: NextRequest) => {
  // Check permissions first
  await requirePermission(request, 'blogs', 'read');
  
  // Ensure MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const queryValidation = validateBlogQuery(queryParams);
    if (!queryValidation.success) {
      throw new Error('Invalid query parameters');
    }
    
    const { page = 1, limit = 20, status, category, search } = queryValidation.data || {};

    // Generate cache key for this query
    const cacheKey = `blogs:${JSON.stringify({ page, limit, status, category, search })}`;
    
    // Try to get from cache first
    const cachedResult = BlogCacheManager.get(cacheKey);
    if (cachedResult) {
      CacheMetrics.recordHit();
      console.log('📦 Cache HIT for blog listing');
      return createSuccessResponse(cachedResult);
    }
    CacheMetrics.recordMiss();

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries with optimized projections and performance monitoring
    const [posts, total] = await Promise.all([
      QueryPerformanceMonitor.wrapQuery('blog-posts-list', () =>
        BlogPost.find(query)
          .select('id title excerpt image category date status author createdAt updatedAt href')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      ),
      QueryPerformanceMonitor.wrapQuery('blog-posts-count', () =>
        BlogPost.countDocuments(query)
      )
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    // Cache the result for 5 minutes
    BlogCacheManager.set(cacheKey, result, 300);

    const response = createSuccessResponse(result);
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
    response.headers.set('Vary', 'Accept-Encoding');
    
    return response;
}, { action: 'GET_BLOG_POSTS' });

// POST /api/admin/blogs - Create new blog post
export const POST = withServerErrorHandler(async (request: NextRequest) => {
  // Check permissions first - require write permission to create
  await requirePermission(request, 'blogs', 'write');
  
  // Ensure MongoDB connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

    const body = await request.json();
    
    // Validate and sanitize input data
    const validation = validateBlogPostCreation(body);
    if (!validation.success) {
      throw new Error('Invalid blog post data');
    }
    
    const { title, content, category, image, images, contentSections, status = 'draft', author, seo, excerpt, date } = validation.data || {};

    if (!title) {
      throw new Error('Title is required');
    }

    // Generate unique ID and href
    const slug = generateSlug(title);
    
    const year = new Date().getFullYear();
    
    // Find next number for this slug-year combination
    const existingPosts = await BlogPost.find({
      id: { $regex: `^${slug}-${year}-` }
    }).sort({ id: -1 }).limit(1);
    
    let nextNumber = 1;
    if (existingPosts.length > 0) {
      const lastId = existingPosts[0].id;
      const match = lastId.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const id = `${slug}-${year}-${nextNumber}`;
    const href = `/blog/${slug}`;

    // Create new blog post
    const blogPost = new BlogPost({
      id,
      title,
      content,
      excerpt,
      href,
      image,
      images: images || [],
      contentSections: contentSections || [],
      category,
      date: date || new Date().toISOString(),
      status,
      author,
      seo
    });

    await blogPost.save();

    // Invalidate cache after creating a new post
    BlogCacheManager.invalidateOnPostChange({ href, category });

    return createSuccessResponse(blogPost, 'Blog post created successfully', 201);
}, { action: 'CREATE_BLOG_POST' });