import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import AdminUser, { IAdminUser } from '@/lib/models/AdminUser';
import { connectToDatabase } from '@/lib/mongoose';
import { validatePermissions } from '@/lib/permissions';
import { requirePermission } from '@/lib/permission-middleware';

export async function GET(request: NextRequest) {
  try {
    // Check permissions first - require read permission for users
    await requirePermission(request, 'users', 'read');
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    console.log('Query:', query);
    
    // Get total count
    const total = await AdminUser.countDocuments(query);
    console.log('Total users found:', total);
    
    // Get users with pagination
    const users = await AdminUser.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    console.log('Users retrieved:', users.length);
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permissions first - require write permission to create users
    await requirePermission(request, 'users', 'write');
    
    await connectToDatabase();
    
    const body = await request.json();
    const { email, name, password, role, status, permissions } = body;
    
    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, name, password, and role are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Validate and set permissions
    let validatedPermissions;
    if (role === 'custom' && permissions) {
      validatedPermissions = validatePermissions(permissions);
    }
    
    // Create user
    const user = new AdminUser({
      email: email.toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      role,
      status: status || 'active',
      permissions: validatedPermissions
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Admin user created successfully'
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}