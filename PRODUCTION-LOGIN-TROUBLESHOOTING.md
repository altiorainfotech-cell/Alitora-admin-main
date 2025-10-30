# Production Login Troubleshooting Guide

## Current Admin Credentials
- **Email**: `admin@altiorainfotech.com`
- **Password**: `admin123`
- **Role**: admin
- **Status**: active

## Common Production Login Issues & Solutions

### 1. Environment Variables Issues

#### Problem: NEXTAUTH_URL Mismatch
Your `.env.local` has `NEXTAUTH_URL=http://localhost:3001` which won't work in production.

#### Solution:
Set the correct production environment variables in your deployment platform:

```bash
# For Vercel - add these in your Vercel dashboard
NEXTAUTH_URL=https://your-production-domain.vercel.app
NEXTAUTH_SECRET=YnO41+NK5Xz+HlCdsT0VZ+l1IaWFudbVyzNtIpQJeG4=
JWT_SECRET=VA82sRLWBYekBSMfHqb2p8hv9K7nxBI442h4vy74LpY
MONGODB_URI=mongodb+srv://altiora:Altiora%40123@altiora.2vbkmol.mongodb.net/?retryWrites=true&w=majority&appName=Altiora
NODE_ENV=production
```

### 2. Database Connection Issues

#### Problem: MongoDB Connection Timeout
Production environments may have different network configurations.

#### Solution:
1. Ensure MongoDB Atlas allows connections from your deployment platform
2. Check if the connection string includes proper SSL settings
3. Verify the database name is correct: `blog-admin-panel`

### 3. Session/Cookie Issues

#### Problem: Cookies not working across domains
NextAuth cookies might not be set properly in production.

#### Solution:
1. Ensure `NEXTAUTH_URL` matches your exact production domain
2. Check if your domain supports HTTPS (required for secure cookies)
3. Verify cookie settings in browser dev tools

### 4. Build/Deployment Issues

#### Problem: Environment variables not loaded during build
Some platforms require environment variables at build time.

#### Solution:
1. Set environment variables in your deployment platform before building
2. Ensure `.env.production` is not in `.gitignore` if needed
3. Check build logs for environment variable loading

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# In your production environment, verify these are set:
echo $NEXTAUTH_URL
echo $MONGODB_URI
echo $NEXTAUTH_SECRET
```

### Step 2: Test Database Connection
Create a simple API endpoint to test MongoDB connection:

```javascript
// pages/api/test-db.js
import mongoose from 'mongoose'

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }
    res.status(200).json({ success: true, message: 'Database connected' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}
```

### Step 3: Check NextAuth Configuration
Visit `/api/auth/providers` to see if NextAuth is configured correctly.

### Step 4: Enable Debug Mode
Temporarily enable debug mode in production:

```javascript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... other config
  debug: true, // Enable for debugging
  // ... rest of config
}
```

### Step 5: Check Browser Console
Look for JavaScript errors in the browser console during login attempts.

## Platform-Specific Solutions

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all required environment variables
3. Redeploy the application
4. Check Function logs in Vercel dashboard

### Netlify
1. Go to Site Settings → Environment Variables
2. Add all required environment variables
3. Trigger a new deploy
4. Check Function logs

### Railway/Render
1. Add environment variables in the dashboard
2. Redeploy the service
3. Check application logs

## Testing Production Login

### Method 1: Direct API Test
```bash
curl -X POST https://your-domain.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@altiorainfotech.com","password":"admin123"}'
```

### Method 2: Browser Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Attempt login
4. Check for failed requests or error responses

## Emergency Access

If you're completely locked out, you can:

1. **Reset Admin Password** (run locally with production DB):
```bash
node scripts/reset-admin-password.js
```

2. **Create New Admin User**:
```bash
node scripts/create-admin.js
```

3. **Check User Status**:
```bash
node scripts/list-admin-users.js
```

## Security Considerations

1. **Change Default Password**: After successful login, immediately change the password
2. **Use Strong Secrets**: Ensure JWT_SECRET and NEXTAUTH_SECRET are strong (32+ characters)
3. **Enable HTTPS**: Production should always use HTTPS
4. **Monitor Failed Attempts**: Check activity logs for suspicious login attempts

## Contact Information

If issues persist:
1. Check deployment platform logs
2. Verify all environment variables are set correctly
3. Test database connectivity separately
4. Ensure the production domain matches NEXTAUTH_URL exactly