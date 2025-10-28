import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ActivityLogger } from '@/lib/activity-logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session?.user) {
      // Log logout activity
      await ActivityLogger.logLogout(
        session.user.email || '',
        session.user.id
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout logging error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}