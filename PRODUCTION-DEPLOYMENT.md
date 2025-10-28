# Production Deployment Guide

This guide walks you through deploying the blog admin panel to production and integrating it with the Altiora blog.

## Prerequisites

Before deploying to production, ensure you have:

1. **MongoDB Atlas Database** - Production-ready MongoDB cluster
2. **Cloudinary Account** - For image storage and optimization
3. **Hosting Platform** - Vercel, Netlify, or similar Next.js-compatible platform
4. **Domain Name** - For the admin panel (optional but recommended)

## Environment Configuration

### 1. Production Environment Variables

Create a `.env.production` file or configure the following environment variables on your hosting platform:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=blog-admin-panel

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NextAuth Configuration
NEXTAUTH_URL=https://your-admin-domain.com
NEXTAUTH_SECRET=your_secure_nextauth_secret

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret

# Node Environment
NODE_ENV=production
```

### 2. Security Configuration

For production, ensure these security settings:

```bash
# Security Settings
SECURE_COOKIES=true
CSRF_PROTECTION=true
RATE_LIMITING=true

# Performance Settings
CACHE_TTL=3600
IMAGE_OPTIMIZATION=true
```

## Deployment Steps

### Step 1: Prepare the Admin Panel

1. **Install Dependencies**
   ```bash
   cd admin-panel-main
   npm install
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Test Production Build Locally**
   ```bash
   npm start
   ```

### Step 2: Deploy to Hosting Platform

#### Option A: Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add all required environment variables

#### Option B: Netlify Deployment

1. **Build Command**: `npm run build`
2. **Publish Directory**: `.next`
3. **Environment Variables**: Add all required variables in Netlify dashboard

#### Option C: Custom Server Deployment

1. **Upload Files** to your server
2. **Install Dependencies**: `npm install --production`
3. **Set Environment Variables** in your server configuration
4. **Start Application**: `npm start`

### Step 3: Database Setup

1. **Run Deployment Setup Script**
   ```bash
   node scripts/deploy-production.js
   ```

2. **Create Admin User**
   ```bash
   node scripts/create-admin-user.js
   ```

3. **Migrate Existing Blog Data**
   ```bash
   node scripts/migrate-blog-data.js
   ```

4. **Migrate Images to Cloudinary**
   ```bash
   node scripts/migrate-images.js
   ```

### Step 4: Update Altiora Blog Integration

1. **Update API Endpoints**
   
   In your Altiora project, update the blog data fetching to use the new API:

   ```typescript
   // Before: Static import
   // import { blogPosts } from '@/data/blog'
   
   // After: Dynamic API call
   const API_BASE_URL = 'https://your-admin-domain.com/api';
   
   export async function getBlogPosts() {
     try {
       const response = await fetch(`${API_BASE_URL}/blogs`);
       if (!response.ok) {
         throw new Error('Failed to fetch blog posts');
       }
       return await response.json();
     } catch (error) {
       console.error('Error fetching blog posts:', error);
       // Fallback to empty array or cached data
       return [];
     }
   }
   ```

2. **Update Blog Pages**
   
   Modify your blog pages to use the new API:

   ```typescript
   // In your blog page component
   import { getBlogPosts } from '@/lib/api';
   
   export default async function BlogPage() {
     const blogPosts = await getBlogPosts();
     
     return (
       <div>
         {blogPosts.map(post => (
           <BlogCard key={post.id} post={post} />
         ))}
       </div>
     );
   }
   ```

3. **Update Individual Blog Post Pages**
   
   ```typescript
   // In your [slug]/page.tsx
   export async function getBlogPost(slug: string) {
     try {
       const response = await fetch(`${API_BASE_URL}/blogs/${slug}`);
       if (!response.ok) {
         throw new Error('Blog post not found');
       }
       return await response.json();
     } catch (error) {
       console.error('Error fetching blog post:', error);
       return null;
     }
   }
   ```

### Step 5: Configure CORS and Security

1. **Update CORS Settings**
   
   In your admin panel's `next.config.js`:

   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/api/blogs/:path*',
           headers: [
             {
               key: 'Access-Control-Allow-Origin',
               value: 'https://your-altiora-domain.com',
             },
             {
               key: 'Access-Control-Allow-Methods',
               value: 'GET, OPTIONS',
             },
             {
               key: 'Access-Control-Allow-Headers',
               value: 'Content-Type',
             },
           ],
         },
       ];
     },
   };
   
   module.exports = nextConfig;
   ```

2. **Configure Rate Limiting**
   
   The admin panel includes built-in rate limiting for API endpoints.

### Step 6: Testing and Verification

1. **Health Check**
   ```bash
   curl https://your-admin-domain.com/api/health
   ```

2. **Test Public API Endpoints**
   ```bash
   curl https://your-admin-domain.com/api/blogs
   curl https://your-admin-domain.com/api/blogs/categories
   ```

3. **Test Admin Panel**
   - Visit `https://your-admin-domain.com/admin/login`
   - Log in with your admin credentials
   - Create a test blog post
   - Verify it appears on the Altiora blog

4. **Test Image Upload**
   - Upload an image in the admin panel
   - Verify it's stored in Cloudinary
   - Check that it displays correctly

## Post-Deployment Checklist

- [ ] Admin panel is accessible and functional
- [ ] Database connection is working
- [ ] Cloudinary integration is working
- [ ] All existing blog posts are migrated
- [ ] All images are migrated to Cloudinary
- [ ] Altiora blog displays dynamic content
- [ ] New blog posts created in admin appear on Altiora blog
- [ ] Image uploads work correctly
- [ ] Authentication system is secure
- [ ] API endpoints are properly secured
- [ ] Health check endpoint responds correctly
- [ ] CORS is configured for Altiora domain
- [ ] SSL certificates are properly configured
- [ ] Monitoring and logging are set up

## Monitoring and Maintenance

### Health Monitoring

Set up monitoring for:
- `/api/health` endpoint
- Database connectivity
- Cloudinary service status
- API response times

### Backup Strategy

1. **Database Backups**
   - MongoDB Atlas provides automatic backups
   - Consider additional backup strategies for critical data

2. **Image Backups**
   - Cloudinary provides redundant storage
   - Consider backup policies for uploaded images

### Performance Optimization

1. **Caching**
   - API responses are cached for better performance
   - Configure CDN for static assets

2. **Database Optimization**
   - Monitor query performance
   - Ensure proper indexing

3. **Image Optimization**
   - Cloudinary automatically optimizes images
   - Use responsive image URLs

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MongoDB URI and credentials
   - Verify network connectivity
   - Check IP whitelist in MongoDB Atlas

2. **Cloudinary Upload Failures**
   - Verify API credentials
   - Check file size limits
   - Ensure proper CORS configuration

3. **Authentication Issues**
   - Verify JWT secret configuration
   - Check session timeout settings
   - Ensure HTTPS is properly configured

4. **API Endpoint Errors**
   - Check CORS configuration
   - Verify environment variables
   - Monitor rate limiting

### Logs and Debugging

1. **Application Logs**
   - Check hosting platform logs
   - Monitor error rates and patterns

2. **Database Logs**
   - Monitor MongoDB Atlas logs
   - Check for slow queries

3. **Cloudinary Logs**
   - Monitor upload success rates
   - Check for quota limits

## Support and Maintenance

For ongoing support and maintenance:

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update environment configurations as needed

2. **Performance Monitoring**
   - Monitor API response times
   - Track database performance
   - Monitor image loading times

3. **Security Audits**
   - Regular security reviews
   - Update authentication mechanisms
   - Monitor for suspicious activity

## Rollback Plan

In case of deployment issues:

1. **Database Rollback**
   - Restore from MongoDB Atlas backup
   - Revert to previous data migration state

2. **Application Rollback**
   - Revert to previous deployment
   - Restore previous environment configuration

3. **Altiora Blog Rollback**
   - Revert to static blog data
   - Update API endpoints to fallback

Remember to test the rollback procedure in a staging environment before production deployment.