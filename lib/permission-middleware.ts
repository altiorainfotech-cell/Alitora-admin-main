import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { hasPermission, canAccessPage } from './permissions';
import { IPermissions } from './models/AdminUser';

export type PermissionAction = 'read' | 'write' | 'delete';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'seo' | 'custom';
  permissions?: IPermissions;
}

export async function checkPermission(
  request: NextRequest,
  page: keyof IPermissions,
  action: PermissionAction = 'read'
): Promise<{ authorized: boolean; user?: AuthenticatedUser; error?: string }> {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    });
    
    if (!token || !token.userId) {
      return { authorized: false, error: 'Not authenticated' };
    }

    const user: AuthenticatedUser = {
      id: token.userId as string,
      email: token.email as string,
      role: token.role as 'admin' | 'seo' | 'custom',
      permissions: token.permissions as IPermissions
    };
    
    if (user.role === 'admin') {
      return { authorized: true, user };
    }

    // Check if user can access the page
    if (!canAccessPage(user.permissions, user.role, page)) {
      return { authorized: false, error: 'Access denied to this page' };
    }

    // Check specific action permission
    if (!hasPermission(user.permissions, user.role, page, action)) {
      return { authorized: false, error: `Insufficient permissions for ${action} action` };
    }

    return { authorized: true, user };
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: 'Permission check failed' };
  }
}

export function createPermissionMiddleware(
  page: keyof IPermissions,
  action: PermissionAction = 'read'
) {
  return async (request: NextRequest) => {
    const { authorized, error } = await checkPermission(request, page, action);
    
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: error || 'Access denied' },
        { status: 403 }
      );
    }
    
    return null; // Continue to the actual handler
  };
}

export async function requirePermission(
  request: NextRequest,
  page: keyof IPermissions,
  action: PermissionAction = 'read'
): Promise<AuthenticatedUser> {
  const { authorized, user, error } = await checkPermission(request, page, action);
  
  if (!authorized || !user) {
    throw new Error(error || 'Access denied');
  }
  
  return user;
}