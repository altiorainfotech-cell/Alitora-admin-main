# Admin Role-Based Access Control (RBAC) System

## Overview

The admin panel now includes a comprehensive role-based access control system that allows fine-grained permission management for different types of admin users.

## User Roles

### 1. Admin
- **Full Access**: Complete administrative privileges
- **Permissions**: Can access all sections and perform all actions
- **Use Case**: System administrators and owners

### 2. SEO Manager
- **Blog Management**: Full access to blog posts (create, edit, delete, publish)
- **Limited Access**: Read-only access to staff, messages, and activity logs
- **Restricted**: Cannot access user management or settings
- **Use Case**: Content managers and SEO specialists

### 3. Custom
- **Configurable**: Permissions can be customized per user
- **Granular Control**: Each section can be set to none, read, write, or full access
- **Use Case**: Specialized roles with specific requirements

## Permission Levels

### None
- No access to the section
- Section will not appear in navigation

### Read
- View-only access
- Can see data but cannot modify

### Write
- Can view and modify data
- Cannot delete items

### Full
- Complete access including delete operations
- All CRUD operations allowed

## Admin Panel Sections

1. **Dashboard**: Always accessible to all users
2. **Blog Posts**: Manage blog content and SEO
3. **Staff Management**: Manage team member profiles
4. **Admin Users**: Manage admin user accounts and permissions
5. **Messages**: View and manage contact form submissions
6. **Activity Logs**: View system activity and audit trails
7. **Settings**: System configuration and preferences

## Implementation Features

### Security
- Password hashing with bcrypt
- JWT-based authentication
- Permission middleware for API routes
- CSRF protection
- Rate limiting

### User Management
- Create, edit, and delete admin users
- Role assignment with automatic permission defaults
- Custom permission configuration for flexible roles
- Account status management (active/inactive)

### Navigation
- Dynamic sidebar based on user permissions
- Hidden sections for unauthorized users
- Permission-based component rendering

## Getting Started

### 1. Create First Admin User

Run the setup script to create your first admin user:

```bash
node scripts/create-admin.js
```

Default credentials:
- Email: admin@example.com
- Password: admin123

**Important**: Change the password after first login!

### 2. Access Admin Panel

Navigate to `/admin/login` and use the credentials above.

### 3. Create Additional Users

1. Go to Admin Users section
2. Click "Add Admin User"
3. Fill in user details
4. Select appropriate role:
   - Choose "Admin" for full access
   - Choose "SEO" for content management
   - Choose "Custom" for specific permissions
5. Configure custom permissions if needed
6. Save the user

## API Endpoints

### User Management
- `GET /api/admin/users` - List admin users
- `POST /api/admin/users` - Create new admin user
- `GET /api/admin/users/[id]` - Get specific user
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Permission Middleware
All admin API routes are protected with permission middleware that checks:
- User authentication
- Account status (active/inactive)
- Specific permission for the requested action

## Usage Examples

### Creating an SEO Manager
```typescript
const seoUser = {
  email: "seo@company.com",
  name: "SEO Manager",
  password: "secure-password",
  role: "seo",
  status: "active"
  // Permissions automatically set based on role
}
```

### Creating a Custom User
```typescript
const customUser = {
  email: "editor@company.com",
  name: "Content Editor",
  password: "secure-password",
  role: "custom",
  status: "active",
  permissions: {
    dashboard: true,
    blogs: "write",      // Can create and edit blogs
    staff: "read",       // Can view staff but not edit
    users: "none",       // No access to user management
    messages: "read",    // Can view messages
    settings: "none",    // No access to settings
    activity: "read"     // Can view activity logs
  }
}
```

### Permission Checking in Components
```typescript
import PermissionGate from '@/app/admin/components/PermissionGate'

// Show content only if user can write to blogs
<PermissionGate page="blogs" action="write">
  <CreateBlogButton />
</PermissionGate>

// Show content only if user can access the page
<PermissionGate page="users" requireAccess>
  <UserManagementSection />
</PermissionGate>
```

## Best Practices

### Security
1. Always use strong passwords
2. Regularly review user permissions
3. Deactivate unused accounts
4. Monitor activity logs for suspicious behavior

### User Management
1. Use descriptive names for custom roles
2. Follow principle of least privilege
3. Document custom permission configurations
4. Regular permission audits

### Development
1. Always check permissions in components
2. Use permission middleware for API routes
3. Test with different user roles
4. Handle permission errors gracefully

## Troubleshooting

### Common Issues

1. **User can't access section**: Check role permissions and account status
2. **API returns 403**: Verify permission middleware and user permissions
3. **Navigation items missing**: Ensure user has at least read access to sections

### Debug Tips

1. Check browser console for permission errors
2. Verify JWT token contains correct user data
3. Test API endpoints with different user roles
4. Review middleware logs for permission checks

## Migration from Old System

If upgrading from the previous admin system:

1. Run the admin user creation script
2. Migrate existing admin users to new schema
3. Update any hardcoded role checks in components
4. Test all admin functionality with different roles

## Future Enhancements

Potential improvements for the RBAC system:

1. **Role Templates**: Predefined permission sets for common roles
2. **Time-based Permissions**: Temporary access grants
3. **IP Restrictions**: Location-based access control
4. **Audit Trails**: Detailed permission change logging
5. **Bulk Operations**: Mass user management tools
6. **API Keys**: Service account authentication
7. **Two-Factor Authentication**: Enhanced security
8. **Permission Inheritance**: Hierarchical permission structures