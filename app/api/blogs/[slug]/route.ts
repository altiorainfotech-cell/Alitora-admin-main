import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { serverCache } from '@/lib/cache';

// GET /api/blogs/[slug] - Get individual blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_SLUG',
          message: 'Blog post slug is required',
          details: null
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Generate cache key for this specific post
    const cacheKey = `blog:post:${slug}`;
    
    // Try to get from cache first (cache for 15 minutes since individual posts change less frequently)
    const cachedPost = serverCache.get(cacheKey);
    if (cachedPost) {
      const response = NextResponse.json({
        success: true,
        data: cachedPost,
        cached: true
      });
      
      // Add cache headers for individual posts (longer cache time)
      response.headers.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Find published blog post by href (which contains the slug)
    const post = await BlogPost.findOne({
      href: `/blog/${slug}`,
      status: 'published'
    })
    .lean()
    .hint({ href: 1, status: 1 }); // Use index hint for better performance

    if (!post) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Blog post not found',
          details: null
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Cache the post for 15 minutes
    serverCache.set(cacheKey, post, 15 * 60 * 1000);

    const response = NextResponse.json({
      success: true,
      data: post
    });

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch blog post',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}