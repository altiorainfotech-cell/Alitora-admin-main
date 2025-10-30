import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import { requirePermission } from '@/lib/permission-middleware';
import Redirect from '@/lib/models/Redirect';
import { redirectSchema } from '@/lib/validations';
import { enhancedRedirectSchema, validateContentSecurity } from '@/lib/seo-validation';
import { z } from 'zod';

// GET /api/admin/seo-pages/redirects - List all redirects
export async function GET(request: NextRequest) {
  try {
    // Check permissions - require SEO read permission
    const user = await requirePermission(request, 'seo', 'read');
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const siteId = searchParams.get('siteId') || 'altiorainfotech';
    const statusCode = searchParams.get('statusCode');
    const search = searchParams.get('search');
    
    // Build query
    const query: any = { siteId };
    
    if (statusCode) {
      query.statusCode = parseInt(statusCode);
    }
    
    if (search) {
      query.$or = [
        { from: { $regex: search, $options: 'i' } },
        { to: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Redirect.countDocuments(query);
    
    // Get redirects with pagination
    const redirects = await Redirect.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    const totalPages = Math.ceil(total / limit);
    
    // Get statistics
    const stats = await Redirect.aggregate([
      { $match: { siteId } },
      {
        $group: {
          _id: '$statusCode',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusCodeStats = stats.reduce((acc: Record<number, number>, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<number, number>);
    
    return NextResponse.json({
      success: true,
      data: {
        redirects,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        statistics: {
          total,
          byStatusCode: statusCodeStats
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch redirects' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

// POST /api/admin/seo-pages/redirects - Create a new redirect
export async function POST(request: NextRequest) {
  try {
    // Check permissions - require SEO write permission
    const user = await requirePermission(request, 'seo', 'write');
    
    await connectToDatabase();
    
    const body = await request.json();
    
    // Validate input data with enhanced security
    const validatedData = enhancedRedirectSchema.parse({
      ...body,
      createdBy: user.id
    });
    
    // Additional security validation for redirect paths
    const fromSecurity = validateContentSecurity(validatedData.from);
    const toSecurity = validateContentSecurity(validatedData.to);
    
    if (!fromSecurity.isSecure || !toSecurity.isSecure) {
      const threats = [...fromSecurity.threats, ...toSecurity.threats];
      return NextResponse.json(
        { success: false, error: 'Redirect path security validation failed', threats },
        { status: 400 }
      );
    }
    
    const { siteId, from, to, statusCode, createdBy } = validatedData;
    
    // Check if redirect already exists
    const existingRedirect = await Redirect.findOne({ siteId, from });
    if (existingRedirect) {
      return NextResponse.json(
        { success: false, error: 'Redirect already exists for this source path' },
        { status: 400 }
      );
    }
    
    // Create new redirect
    const redirect = new Redirect({
      siteId,
      from,
      to,
      statusCode,
      createdBy
    });
    
    // Validate no redirect loops using the utility function
    const chainResult = await Redirect.checkRedirectChain(siteId, from, to);
    if (chainResult.isLoop) {
      return NextResponse.json(
        { success: false, error: 'Redirect would create an infinite loop' },
        { status: 400 }
      );
    }
    
    if (chainResult.hasChain && chainResult.depth >= 5) {
      return NextResponse.json(
        { success: false, error: 'Redirect chain too long (maximum 5 redirects)' },
        { status: 400 }
      );
    }
    await redirect.save();
    
    // Populate creator info for response
    await redirect.populate('createdBy', 'name email');
    
    return NextResponse.json({
      success: true,
      data: redirect,
      message: 'Redirect created successfully'
    });
  } catch (error: any) {
    console.error('Error creating redirect:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create redirect' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/seo-pages/redirects - Delete multiple redirects
export async function DELETE(request: NextRequest) {
  try {
    // Check permissions - require SEO delete permission
    const user = await requirePermission(request, 'seo', 'delete');
    
    await connectToDatabase();
    
    const body = await request.json();
    const { redirectIds, siteId = 'altiorainfotech' } = body;
    
    if (!redirectIds || !Array.isArray(redirectIds) || redirectIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Redirect IDs are required' },
        { status: 400 }
      );
    }
    
    if (redirectIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete more than 50 redirects at once' },
        { status: 400 }
      );
    }
    
    // Delete redirects
    const deleteResult = await Redirect.deleteMany({
      _id: { $in: redirectIds },
      siteId
    });
    
    return NextResponse.json({
      success: true,
      message: `${deleteResult.deletedCount} redirects deleted successfully`,
      data: {
        deletedCount: deleteResult.deletedCount,
        requestedCount: redirectIds.length
      }
    });
  } catch (error: any) {
    console.error('Error deleting redirects:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete redirects' },
      { status: 500 }
    );
  }
}