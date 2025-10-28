import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { handleServerApiError } from '@/lib/server-error-handler';
import { serverCache } from '@/lib/cache';

// GET /api/blogs - Get published blog posts for public consumption
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Generate cache key based on query parameters
    const cacheKey = `blogs:${page}:${limit}:${category || 'all'}:${search || 'none'}`;
    
    // Try to get from cache first (cache for 5 minutes for general queries, 10 minutes for first page without search)
    const cacheTTL = (!search && page === 1) ? 10 * 60 * 1000 : 5 * 60 * 1000;
    
    const cachedResult = serverCache.get(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true
      });
      
      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return response;
    }

    // Build query for published posts only
    const query: any = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { 'seo.keywords': { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute optimized queries with proper indexing
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .select('id title excerpt href image category date author seo.metaTitle seo.metaDescription')
        .sort({ date: -1, _id: -1 }) // Add _id for consistent sorting
        .skip(skip)
        .limit(limit)
        .lean()
        .hint({ status: 1, date: -1 }), // Use index hint for better performance
      BlogPost.countDocuments(query)
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

    // Cache the result
    serverCache.set(cacheKey, result, cacheTTL);

    const response = NextResponse.json({
      success: true,
      data: result
    });

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch blog posts',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}