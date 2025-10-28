import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import AdminUser from '@/lib/models/AdminUser';
import { connectToDatabase } from '@/lib/mongoose';
import { validatePermissions } from '@/lib/permissions';
import { requirePermission } from '@/lib/permission-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permissions first - require read permission for users
    await requirePermission(request, 'users', 'read');
    
    await connectToDatabase();
    
    const { id } = await params;
    const user = await AdminUser.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching admin user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permissions first - require write permission to update users
    await requirePermission(request, 'users', 'write');
    
    await connectToDatabase();
    
    const body = await request.json();
    const { email, name, password, role, status, permissions } = body;
    
    // Find user
    const { id } = await params;
    const user = await AdminUser.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await AdminUser.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 400 }
        );
      }
      user.email = email.toLowerCase();
    }
    
    // Update fields
    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (status) user.status = status;
    
    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }
    
    // Update permissions for custom role
    if (role === 'custom' && permissions) {
      user.permissions = validatePermissions(permissions);
    } else if (role && role !== 'custom') {
      // Reset permissions for non-custom roles (will be set by pre-save middleware)
      user.permissions = undefined;
    }
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Admin user updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permissions first - require delete permission to delete users
    await requirePermission(request, 'users', 'delete');
    
    await connectToDatabase();
    
    // Find user
    const { id } = await params;
    const user = await AdminUser.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deleting the last admin user
    const adminCount = await AdminUser.countDocuments({ 
      role: 'admin', 
      status: 'active',
      _id: { $ne: id }
    });
    
    if (user.role === 'admin' && adminCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last admin user' },
        { status: 400 }
      );
    }
    
    await AdminUser.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete user' },
      { status: error.message?.includes('Access denied') ? 403 : 500 }
    );
  }
}