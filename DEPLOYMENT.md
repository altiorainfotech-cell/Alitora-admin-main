# AI Reels Platform - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup
Ensure all required environment variables are configured in your production environment:

#### Required Variables
- `DATABASE_URL` - PostgreSQL connection string with SSL
- `JWT_SECRET` - Secure secret for JWT tokens (minimum 32 characters)
- `NEXTAUTH_SECRET` - NextAuth.js secret (minimum 32 characters)
- `NEXTAUTH_URL` - Your production domain URL

#### Optional Variables
- `UPLOAD_DIR` - File upload directory (default: `/tmp/uploads` for Vercel)
- `MAX_FILE_SIZE` - Maximum file upload size in bytes (default: 5MB)
- `NODE_ENV` - Set to `production`
- `SEED_DATABASE` - Set to `true` to seed database on first deployment

### 2. Database Setup

#### For New Deployments
1. Create a PostgreSQL database (recommended: Neon, Supabase, or Railway)
2. Set the `DATABASE_URL` environment variable
3. Run migrations: `npm run scripts/migrate-production.js`

#### For Existing Deployments
1. Backup your current database
2. Run: `npm run scripts/migrate-production.js`

### 3. Vercel Deployment

#### First Time Setup
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Link project: `vercel link`
4. Set environment variables in Vercel dashboard
5. Deploy: `vercel --prod`

#### Environment Variables in Vercel
Go to your project settings in Vercel dashboard and add:
```
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET=your-secure-jwt-secret-here
NEXTAUTH_SECRET=your-secure-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## Deployment Commands

### Quick Deployment
```bash
# Run the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Deploy to Vercel
vercel --prod
```

### Manual Deployment Steps
```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate deploy

# 4. Seed database (optional, first time only)
npx tsx prisma/seed.ts

# 5. Build application
npm run build

# 6. Deploy to Vercel
vercel --prod
```

## Post-Deployment Verification

### 1. Health Check
Visit `https://your-domain.vercel.app/api/health` to verify:
- Application is running
- Database connection is working
- All services are healthy

### 2. Admin Access
1. Visit `https://your-domain.vercel.app/admin/login`
2. Login with seeded admin credentials:
   - Email: `admin@logoipsum.com`
   - Password: `admin123`
3. Change the default password immediately

### 3. Functionality Tests
- [ ] Admin login works
- [ ] Reels CRUD operations work
- [ ] Image uploads work
- [ ] Slider management works
- [ ] Public website displays correctly
- [ ] Category filtering works
- [ ] WhatsApp integration works

## Monitoring and Maintenance

### Health Monitoring
- Health check endpoint: `/api/health`
- Monitor database response times
- Check memory usage and uptime

### Database Maintenance
```bash
# Check database status
npx prisma db pull --print

# View database in browser
npx prisma studio
```

### Logs and Debugging
- Check Vercel function logs in dashboard
- Monitor error rates and performance
- Set up alerts for critical issues

## Security Considerations

### Production Security Checklist
- [ ] Strong JWT and NextAuth secrets (32+ characters)
- [ ] Database uses SSL connections
- [ ] File uploads are validated and sanitized
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] HTTPS is enforced
- [ ] Admin credentials are changed from defaults

### Environment Security
- [ ] Environment variables are not exposed to client
- [ ] Sensitive data is not logged
- [ ] Database credentials are secure
- [ ] File upload directory has proper permissions

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify `DATABASE_URL` is correct
- Check database server is accessible
- Ensure SSL mode is configured properly

#### Build Failures
- Check all dependencies are installed
- Verify TypeScript compilation passes
- Ensure Prisma client is generated

#### File Upload Issues
- Check `UPLOAD_DIR` permissions
- Verify `MAX_FILE_SIZE` setting
- Ensure storage provider is configured

#### Authentication Problems
- Verify JWT and NextAuth secrets are set
- Check `NEXTAUTH_URL` matches your domain
- Ensure session configuration is correct

### Getting Help
1. Check Vercel deployment logs
2. Review application logs in dashboard
3. Test locally with production environment variables
4. Check database connectivity and migrations

## Rollback Procedure

### In Case of Issues
1. Revert to previous Vercel deployment
2. Restore database from backup if needed
3. Check and fix environment variables
4. Re-deploy after fixing issues

### Database Rollback
```bash
# If you need to rollback database changes
npx prisma migrate reset --force
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

## Performance Optimization

### Production Optimizations
- Images are automatically optimized by Next.js
- Static assets are cached with long TTL
- API responses include appropriate cache headers
- Database queries are optimized with Prisma

### Monitoring Performance
- Use Vercel Analytics for performance insights
- Monitor Core Web Vitals
- Track API response times
- Monitor database query performance