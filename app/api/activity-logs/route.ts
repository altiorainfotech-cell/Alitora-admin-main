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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category') || undefined
    const action = searchParams.get('action') || undefined
    const userId = searchParams.get('userId') || undefined
    const userRole = searchParams.get('userRole') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const userSession = session.user as any

    // Check permissions based on user role
    if (userSession.role === 'admin') {
      // Admin can see all activities
      const result = await ActivityLog.getAllActivities({
        page,
        limit,
        userId,
        userRole,
        category,
        action,
        startDate,
        endDate
      })
      
      return NextResponse.json(result)
    } else if (userSession.role === 'seo' || userSession.role === 'custom') {
      // SEO and custom users can only see their own activities
      // For non-admin users, limit to last 7 days and only auth activities
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const result = await ActivityLog.getUserActivities(userSession.id, {
        page,
        limit,
        category: userSession.role === 'custom' ? 'auth' : category, // Custom users only see auth logs
        action,
        startDate: startDate && startDate > sevenDaysAgo ? startDate : sevenDaysAgo,
        endDate
      })
      
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  } catch (error) {
    console.error('Activity logs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}