# Activity Logs Database Storage

## Overview

All activity log data is permanently stored in your MongoDB database in the `activitylogs` collection. This ensures complete audit trails and historical tracking of all user actions.

## Database Collection: `activitylogs`

### Document Structure

Each activity log entry is stored as a MongoDB document with the following structure:

```javascript
{
  _id: ObjectId("..."),                    // Unique document ID
  userId: "user-id-123",                   // ID of user who performed action
  userEmail: "user@example.com",           // Email of the user
  userName: "John Doe",                    // Display name of the user
  userRole: "admin",                       // Role: admin, seo, or custom
  action: "LOGIN_SUCCESS",                 // Specific action performed
  category: "auth",                        // Category: auth, user, blog, image, category, settings, system
  details: {                               // Additional context about the action
    userAgent: "Mozilla/5.0...",
    loginMethod: "credentials",
    // ... other relevant details
  },
  ipAddress: "192.168.1.100",             // IP address of the user
  userAgent: "Mozilla/5.0 (Windows NT...)", // Browser/client information
  timestamp: ISODate("2024-01-15T10:30:00Z"), // When the action occurred
  createdAt: ISODate("2024-01-15T10:30:00Z"),  // Document creation time
  updatedAt: ISODate("2024-01-15T10:30:00Z")   // Document update time
}
```

### Database Indexes

For optimal query performance, the following indexes are automatically created:

```javascript
// Single field indexes
{ userId: 1, timestamp: -1 }     // User-specific queries with time sorting
{ category: 1, timestamp: -1 }   // Category filtering with time sorting
{ userRole: 1, timestamp: -1 }   // Role-based filtering with time sorting
{ action: 1, timestamp: -1 }     // Action filtering with time sorting

// Individual field indexes
{ userId: 1 }                    // Fast user lookups
{ action: 1 }                    // Fast action lookups
{ category: 1 }                  // Fast category lookups
{ timestamp: 1 }                 // Time-based queries
```

## Data Persistence Examples

### 1. Login Activity
```javascript
// When a user logs in successfully
{
  userId: "64f1a2b3c4d5e6f7g8h9i0j1",
  userEmail: "admin@company.com",
  userName: "Admin User",
  userRole: "admin",
  action: "LOGIN_SUCCESS",
  category: "auth",
  details: {
    userEmail: "admin@company.com",
    loginTime: "2024-01-15T10:30:00Z"
  },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  timestamp: "2024-01-15T10:30:00Z"
}
```

### 2. Blog Post Creation
```javascript
// When a user creates a blog post
{
  userId: "64f1a2b3c4d5e6f7g8h9i0j1",
  userEmail: "editor@company.com",
  userName: "Content Editor",
  userRole: "seo",
  action: "BLOG_CREATE",
  category: "blog",
  details: {
    title: "New Blog Post About Technology",
    slug: "new-blog-post-about-technology",
    status: "published",
    categories: ["Technology", "Innovation"]
  },
  ipAddress: "192.168.1.105",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  timestamp: "2024-01-15T14:22:15Z"
}
```

### 3. User Management Activity
```javascript
// When an admin creates a new user
{
  userId: "64f1a2b3c4d5e6f7g8h9i0j1",
  userEmail: "admin@company.com",
  userName: "Admin User",
  userRole: "admin",
  action: "USER_CREATE",
  category: "user",
  details: {
    userEmail: "newuser@company.com",
    role: "seo",
    permissions: {
      blogs: "full",
      staff: "read"
    }
  },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  timestamp: "2024-01-15T16:45:30Z"
}
```

## Query Examples

### Retrieve User's Activities
```javascript
// Get all activities for a specific user
db.activitylogs.find({ userId: "user-id-123" })
  .sort({ timestamp: -1 })
  .limit(50)

// Get user's login activities only
db.activitylogs.find({ 
  userId: "user-id-123",
  category: "auth",
  action: { $in: ["LOGIN_SUCCESS", "LOGOUT"] }
}).sort({ timestamp: -1 })
```

### Admin Queries
```javascript
// Get all activities in the last 7 days
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
db.activitylogs.find({ 
  timestamp: { $gte: sevenDaysAgo }
}).sort({ timestamp: -1 })

// Get activities by category
db.activitylogs.find({ category: "user" })
  .sort({ timestamp: -1 })

// Get failed login attempts
db.activitylogs.find({ 
  action: "LOGIN_FAILED",
  timestamp: { $gte: sevenDaysAgo }
})
```

### Statistics Queries
```javascript
// Count activities by category
db.activitylogs.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Most active users
db.activitylogs.aggregate([
  { 
    $group: { 
      _id: { userId: "$userId", userName: "$userName" },
      count: { $sum: 1 },
      lastActivity: { $max: "$timestamp" }
    } 
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

## Data Retention and Management

### Automatic Cleanup (Optional)
You can implement automatic cleanup of old logs:

```javascript
// Delete logs older than 1 year
const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
db.activitylogs.deleteMany({ 
  timestamp: { $lt: oneYearAgo }
})
```

### Archiving Strategy
For long-term storage, consider:

1. **Monthly Archives**: Move old logs to archive collections
2. **Compressed Storage**: Use MongoDB's compression features
3. **External Backup**: Regular backups to external storage

## Verification Commands

### Check Database Connection
```bash
npm run verify:activity-logs
```

### Manual Database Inspection
```javascript
// Connect to MongoDB and check the collection
use your-database-name
db.activitylogs.countDocuments()
db.activitylogs.find().limit(5).sort({ timestamp: -1 })
```

## Security Considerations

1. **Access Control**: Only authorized users can query activity logs
2. **Data Encryption**: MongoDB supports encryption at rest
3. **Network Security**: Use secure connections (SSL/TLS)
4. **Audit Trail**: The logs themselves create an audit trail
5. **Backup Strategy**: Regular backups ensure data preservation

## Performance Optimization

1. **Indexes**: Proper indexing for fast queries
2. **Pagination**: All queries use pagination to limit memory usage
3. **Aggregation**: Use MongoDB aggregation for complex analytics
4. **Caching**: Cache frequently accessed statistics
5. **Sharding**: For very large datasets, consider sharding

The activity logging system ensures that every user action is permanently recorded in your MongoDB database, providing complete audit trails for compliance, security monitoring, and user behavior analysis.