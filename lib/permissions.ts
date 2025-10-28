import { IPermissions } from './models/AdminUser';

export type PermissionLevel = 'none' | 'read' | 'write' | 'full';
export type PermissionAction = 'read' | 'write' | 'delete';

export const PERMISSION_LEVELS: Record<PermissionLevel, { label: string; value: PermissionLevel; description: string }> = {
  none: {
    label: 'No Access',
    value: 'none',
    description: 'Cannot access this section'
  },
  read: {
    label: 'Read Only',
    value: 'read',
    description: 'Can view but not modify'
  },
  write: {
    label: 'Read & Write',
    value: 'write',
    description: 'Can view and modify but not delete'
  },
  full: {
    label: 'Full Access',
    value: 'full',
    description: 'Can view, modify, and delete'
  }
};

export const ADMIN_PAGES = {
  dashboard: { label: 'Dashboard', description: 'Main admin dashboard' },
  blogs: { label: 'Blog Posts', description: 'Manage blog posts and content' },
  staff: { label: 'Staff Management', description: 'Manage team members' },
  users: { label: 'User Management', description: 'Manage admin users and permissions' },
  messages: { label: 'Messages', description: 'View and manage contact messages' },
  settings: { label: 'Settings', description: 'Account settings and preferences' },
  activity: { label: 'Activity Logs', description: 'View system activity and audit logs' }
};

export const DEFAULT_PERMISSIONS: Record<'admin' | 'seo' | 'custom', IPermissions> = {
  admin: {
    dashboard: true,
    blogs: 'full',
    staff: 'full',
    users: 'full',
    messages: 'full',
    settings: 'full',
    activity: 'full'
  },
  seo: {
    dashboard: true,
    blogs: 'full',
    staff: 'read',
    users: 'none',
    messages: 'read',
    settings: 'full',
    activity: 'read'
  },
  custom: {
    dashboard: true,
    blogs: 'none',
    staff: 'none',
    users: 'none',
    messages: 'none',
    settings: 'full',
    activity: 'none'
  }
};

export function hasPermission(
  permissions: IPermissions | undefined,
  role: 'admin' | 'seo' | 'custom',
  page: keyof IPermissions,
  action: PermissionAction
): boolean {
  // Admin always has full access
  if (role === 'admin') return true;
  
  // If no permissions object, deny access (except for admins handled above)
  if (!permissions) return false;
  
  // Get permission level for the page
  const permission = permissions[page];
  if (!permission || permission === 'none') return false;
  
  // Handle dashboard permission (boolean)
  if (page === 'dashboard') {
    return permission === true;
  }
  
  // Check if the permission level allows the action
  switch (action) {
    case 'read':
      return ['read', 'write', 'full'].includes(permission as string);
    case 'write':
      return ['write', 'full'].includes(permission as string);
    case 'delete':
      return permission === 'full';
    default:
      return false;
  }
}

export function canAccessPage(
  permissions: IPermissions | undefined,
  role: 'admin' | 'seo' | 'custom',
  page: keyof IPermissions
): boolean {
  if (page === 'dashboard') return true; // Everyone can access dashboard
  if (role === 'admin') return true; // Admin can access all pages
  return hasPermission(permissions, role, page, 'read');
}

export function getPermissionDescription(level: PermissionLevel): string {
  return PERMISSION_LEVELS[level]?.description || 'Unknown permission level';
}

export function validatePermissions(permissions: Partial<IPermissions>): IPermissions {
  const validatedPermissions: IPermissions = {
    dashboard: true, // Dashboard is always accessible
    blogs: 'none',
    staff: 'none',
    users: 'none',
    messages: 'none',
    settings: 'full', // Settings is always accessible to all users
    activity: 'none'
  };

  // Validate each permission
  Object.keys(ADMIN_PAGES).forEach(page => {
    const pageKey = page as keyof IPermissions;
    if (pageKey === 'dashboard') return; // Skip dashboard validation
    if (pageKey === 'settings') return; // Skip settings validation - always full access
    
    const permission = permissions[pageKey];
    if (permission && Object.keys(PERMISSION_LEVELS).includes(permission)) {
      validatedPermissions[pageKey] = permission as PermissionLevel;
    }
  });

  return validatedPermissions;
}