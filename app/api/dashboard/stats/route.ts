import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import mongoose from 'mongoose'
import BlogPost from '@/lib/models/BlogPost'
import AdminUser from '@/lib/models/AdminUser'
import ContactMessage from '@/lib/models/ContactMessage'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const cacheKey = 'dashboard:stats'
    
    const { serverCache } = await import('@/lib/cache')
    const cachedStats = serverCache.get(cacheKey)
    
    if (cachedStats) {
      return NextResponse.json(cachedStats)
    }

    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalUsers,
      totalMessages,
      unreadMessages,
      recentBlogs
    ] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      BlogPost.countDocuments({ status: 'draft' }),
      AdminUser.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'unread' }),
      BlogPost.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('id title status category createdAt author')
        .lean()
    ])

    // Get categories count
    const categories = await BlogPost.distinct('category')
    const totalCategories = categories.length

    const stats = {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalCategories,
      totalUsers,
      totalMessages,
      unreadMessages,
      recentActivity: recentBlogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        status: blog.status,
        category: blog.category,
        author: blog.author || 'Admin',
        createdAt: blog.createdAt
      }))
    }

    // Cache the stats for 1 minute
    serverCache.set(cacheKey, stats, 60 * 1000)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}