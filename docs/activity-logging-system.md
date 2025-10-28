# Activity Logging System

## Overview

The activity logging system tracks all user actions within the admin panel, providing comprehensive audit trails and monitoring capabilities.

## Features

### For Admin Users
- **Full Access**: View all user activities across the system
- **Advanced Filtering**: Filter by user, role, category, action, and date range
- **Export Functionality**: Export activity logs to CSV format
- **Statistics Dashboard**: View activity statistics and trends
- **Real-time Monitoring**: Monitor user activities as they happen

### For SEO Users
- **Limited Access**: View their own activities and some system activities
- **7-Day History**: Access to activities from the last 7 days
- **Basic Filtering**: Filter by category and date within their permitted scope

### For Custom Users
- **Personal Activities Only**: View only their own login/logout activities
- **7-Day History**: Limited to the last 7 days
- **Authentication Focus**: Only see auth-related activities (login, logout)

## Activity Categories

1. **Authentication (`auth`)**
   - Login success/failure
   - Logout
   - Password changes

2. **User Management (`user`)**
   - User creation, updates, deletion
   - Role changes
   - Permission modifications

3. **Blog Management (`blog`)**
   - Blog post creation, updates, deletion
   - Publishing/unpublishing actions

4. **Image Management (`image`)**
   - Image uploads, updates, deletion
   - Image optimization actions

5. **Category Management (`category`)**
   - Category creation, updates, deletion

6. **Settings (`settings`)**
   - System settings changes
   - Configuration updates

7. **System (`system`)**
   - System-level activities
   - Maintenance actions

## API Endpoints

### GET `/api/activity-logs`
Retrieve activity logs with filtering and pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `category` - Filter by category
- `action` - Filter by action
- `userId` - Filter by user ID (admin only)
- `userRole` - Filter by user role (admin only)
- `startDate` - Filter from date
- `endDate` - Filter to date

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### GET `/api/activity-logs/stats`
Get activity statistics (admin only).

**Query Parameters:**
- `days` - Number of days to analyze (default: 30)

**Response:**
```json
{
  "totalActivities": 1250,
  "activitiesByCategory": [...],
  "activitiesByRole": [...],
  "recentLogins": 45,
  "topUsers": [...],
  "period": "30 days"
}
```

## Usage Examples

### Logging Activities

```javascript
import { ActivityLogger } from '@/lib/activity-logger'

// Log a user login
await ActivityLogger.logLogin('user@example.com', 'user-id')

// Log a blog post creation
await ActivityLogger.log({
  action: 'BLOG_CREATE',
  category: 'blog',
  details: { title: 'New Blog Post', slug: 'new-blog-post' },
  userId: 'user-id'
})

// Log an image upload
await ActivityLogger.logImageUpload('image-id', 'Image Title', 'user-id')
```

### Retrieving Activities

```javascript
import ActivityLog from '@/lib/models/ActivityLog'

// Get user's activities
const userActivities = await ActivityLog.getUserActivities('user-id', {
  page: 1,
  limit: 20,
  category: 'auth'
})

// Get all activities (admin only)
const allActivities = await ActivityLog.getAllActivities({
  page: 1,
  limit: 50,
  userRole: 'admin',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
})
```

## Database Schema

### ActivityLog Collection

```javascript
{
  _id: ObjectId,
  userId: String,           // User who performed the action
  userEmail: String,        // User's email
  userName: String,         // User's display name
  userRole: String,         // User's role (admin, seo, custom)
  action: String,           // Action performed
  category: String,         // Category of action
  details: Object,          // Additional details about the action
  ipAddress: String,        // IP address of the user
  userAgent: String,        // User agent string
  timestamp: Date,          // When the action occurred
  createdAt: Date,          // Document creation time
  updatedAt: Date           // Document update time
}
```

### Indexes

- `{ userId: 1, timestamp: -1 }` - For user-specific queries
- `{ category: 1, timestamp: -1 }` - For category filtering
- `{ userRole: 1, timestamp: -1 }` - For role-based filtering
- `{ action: 1, timestamp: -1 }` - For action filtering

## Security Considerations

1. **Access Control**: Activities are filtered based on user roles and permissions
2. **Data Retention**: Consider implementing data retention policies for old logs
3. **Sensitive Data**: Avoid logging sensitive information like passwords
4. **IP Tracking**: IP addresses are logged for security auditing
5. **Rate Limiting**: Consider rate limiting for activity log API endpoints

## Performance Optimization

1. **Indexing**: Proper database indexes for efficient querying
2. **Pagination**: All queries use pagination to limit response size
3. **Caching**: Consider caching frequently accessed statistics
4. **Archiving**: Archive old logs to maintain performance

## Monitoring and Alerts

The system can be extended to include:
- Real-time alerts for suspicious activities
- Automated reports for administrators
- Integration with external monitoring systems
- Anomaly detection for unusual patterns

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live activity feeds
2. **Advanced Analytics**: More detailed statistics and trends
3. **Custom Alerts**: User-defined alert rules
4. **Data Visualization**: Charts and graphs for activity patterns
5. **Integration**: Connect with external audit systems