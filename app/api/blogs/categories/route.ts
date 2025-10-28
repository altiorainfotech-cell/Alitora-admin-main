import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import BlogPost from '@/lib/models/BlogPost';
import { serverCache } from '@/lib/cache';

// GET /api/blogs/categories - Get all categories with post counts from blog posts
export async function GET(request: NextRequest) {
  try {
    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const cacheKey = 'blog:categories:active';
    
    // Try to get from cache first (cache for 10 minutes since categories don't change often)
    const cachedCategories = serverCache.get(cacheKey);
    if (cachedCategories) {
      const response = NextResponse.json({
        success: true,
        data: cachedCategories,
        cached: true
      });
      
      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Get categories from published blog posts
    const categoriesWithCounts = await BlogPost.aggregate([
      {
        $match: { status: 'published' }
      },
      {
        $group: {
          _id: '$category',
          postCount: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          slug: { $toLower: { $replaceAll: { input: '$_id', find: ' ', replacement: '-' } } },
          postCount: 1,
          _id: 0
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    // Cache for 10 minutes
    serverCache.set(cacheKey, categoriesWithCounts, 10 * 60 * 1000);

    const response = NextResponse.json({
      success: true,
      data: categoriesWithCounts
    });

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch blog categories',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}