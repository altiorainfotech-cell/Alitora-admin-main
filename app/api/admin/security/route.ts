import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { SecurityAuditor } from '@/lib/security-audit'
import { ApiResponse } from '@/types'

// GET /api/admin/security - Get security metrics and report
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can view security metrics
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const report = SecurityAuditor.generateSecurityReport()
    const metrics = SecurityAuditor.getMetrics()

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        report,
        metrics: {
          ...metrics,
          uniqueIPs: Array.from(metrics.uniqueIPs),
          userAgents: Object.fromEntries(metrics.userAgents),
          endpoints: Object.fromEntries(metrics.endpoints)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching security metrics:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch security metrics' },
      { status: 500 }
    )
  }
})

// POST /api/admin/security/reset - Reset security metrics
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can reset security metrics
    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    SecurityAuditor.resetMetrics()

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Security metrics reset successfully'
    })
  } catch (error) {
    console.error('Error resetting security metrics:', error)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to reset security metrics' },
      { status: 500 }
    )
  }
})