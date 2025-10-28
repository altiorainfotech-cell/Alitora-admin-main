# MongoDB Setup Guide

This document explains how to set up and use MongoDB with the blog admin panel.

## Prerequisites

1. **MongoDB Installation**: You need MongoDB running either locally or have access to a MongoDB Atlas cluster.

### Option 1: Local MongoDB Installation

#### macOS (using Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Ubuntu/Debian
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### Windows
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env.local` file

## Environment Configuration

Update your `.env.local` file with your MongoDB connection details:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/blog-admin-panel
MONGODB_DB_NAME=blog-admin-panel

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blog-admin-panel?retryWrites=true&w=majority
MONGODB_DB_NAME=blog-admin-panel
```

## Database Setup

Once MongoDB is running and configured:

1. **Test the connection**:
   ```bash
   npm run db:test
   ```

2. **Initialize the database** (creates indexes, default admin user, and categories):
   ```bash
   npm run db:setup
   ```

## Database Schema

The system uses three main collections:

### BlogPosts Collection
- Stores all blog post data
- Includes content, metadata, SEO information
- Indexed for performance on status, date, category, and author

### AdminUsers Collection
- Stores admin user accounts
- Passwords are hashed using bcrypt
- Supports role-based access (admin/editor)

### Categories Collection
- Stores blog post categories
- Auto-generates slugs from names
- Supports color theming

## Default Data

After running `npm run db:setup`, the following default data is created:

### Default Admin User
- **Username**: admin
- **Password**: admin123
- **Role**: admin

⚠️ **Important**: Change the default password after first login!

### Default Categories
- Technology
- Web Development
- AI & Machine Learning
- Blockchain
- News

## Database Operations

### Connecting to the Database
```typescript
import { getDatabase } from '../lib/mongodb';

const db = await getDatabase();
```

### Using Models
```typescript
import { BlogPost, AdminUser, Category } from '../lib/models';

// Create a new blog post
const post = new BlogPost({
  id: 'my-first-post-2024-1',
  title: 'My First Post',
  content: 'This is the content...',
  // ... other fields
});
await post.save();

// Find published posts
const publishedPosts = await BlogPost.findPublished();
```

### Validation
All models include built-in validation. You can also use the Zod schemas:

```typescript
import { createBlogPostSchema } from '../lib/blog-validation';

const result = createBlogPostSchema.safeParse(postData);
if (!result.success) {
  console.error('Validation errors:', result.error.errors);
}
```

## Troubleshooting

### Connection Issues
1. Ensure MongoDB is running
2. Check your connection string in `.env.local`
3. For Atlas, ensure your IP is whitelisted
4. Verify database name and credentials

### Permission Issues
1. Ensure the MongoDB user has read/write permissions
2. For local MongoDB, ensure the service is running with proper permissions

### Index Issues
If you encounter index-related errors, you can rebuild them:
```bash
npm run db:setup
```

## Performance Considerations

The database setup includes optimized indexes for:
- Blog post queries by status and date
- Category-based filtering
- Text search across blog content
- User authentication lookups

## Security

- Passwords are hashed using bcrypt with salt rounds of 12
- Sensitive data is excluded from JSON serialization
- Input validation is enforced at the model level
- Connection strings should never be committed to version control