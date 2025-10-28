import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { serverCache } from '@/lib/cache';

// GET /api/blogs/category/[category] - Get blog posts by category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { category } = await params;
    const { searchParams } = new URL(request.url);

    if (!category) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Category parameter is required',
          details: null
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse query parameters with defaults
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search');

    // Decode the category parameter (in case it's URL encoded)
    const decodedCategory = decodeURIComponent(category);

    // Generate cache key based on query parameters
    const cacheKey = `blog:category:${decodedCategory}:${page}:${limit}:${search || 'none'}`;
    
    // Try to get from cache first (cache for 7 minutes for category queries)
    const cacheTTL = !search ? 7 * 60 * 1000 : 3 * 60 * 1000; // Less cache time for search queries
    
    const cachedResult = serverCache.get(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true
      });
      
      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=420, stale-while-revalidate=840');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Build query for published posts in the specified category
    const query: any = { 
      status: 'published',
      category: decodedCategory
    };
    
    if (search) {
      query.$and = [
        { category: decodedCategory },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } },
            { 'seo.keywords': { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute optimized queries
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .select('id title excerpt href image category date author seo.metaTitle seo.metaDescription')
        .sort({ date: -1, _id: -1 }) // Add _id for consistent sorting
        .skip(skip)
        .limit(limit)
        .lean()
        .hint({ category: 1, status: 1, date: -1 }), // Use index hint for better performance
      BlogPost.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      category: decodedCategory,
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
    response.headers.set('Cache-Control', 'public, max-age=420, stale-while-revalidate=840');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Error fetching blog posts by category:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch blog posts by category',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}