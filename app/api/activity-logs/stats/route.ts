import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import ActivityLog from '@/lib/models/ActivityLog'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const userSession = session.user as any

    // Only admin users can see stats
    if (userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get activity stats
    const [
      totalActivities,
      activitiesByCategory,
      activitiesByRole,
      recentLogins,
      topUsers
    ] = await Promise.all([
      // Total activities in the period
      ActivityLog.countDocuments({
        timestamp: { $gte: startDate }
      }),
      
      // Activities by category
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Activities by user role
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$userRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Recent login activities
      ActivityLog.countDocuments({
        action: 'LOGIN_SUCCESS',
        timestamp: { $gte: startDate }
      }),
      
      // Top active users
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { 
          $group: { 
            _id: { userId: '$userId', userName: '$userName', userEmail: '$userEmail' },
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    return NextResponse.json({
      totalActivities,
      activitiesByCategory,
      activitiesByRole,
      recentLogins,
      topUsers,
      period: `${days} days`
    })
  } catch (error) {
    console.error('Activity stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}