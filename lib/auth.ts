import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import mongoose from "mongoose"
import AdminUser from "@/lib/models/AdminUser"
import { ActivityLogger } from "@/lib/activity-logger"
import { Role, Status } from "@/types"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authentication attempt logged
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          // Ensure MongoDB connection
          if (mongoose.connection.readyState !== 1) {
            console.log('Connecting to MongoDB...')
            await mongoose.connect(process.env.MONGODB_URI!)
            console.log('MongoDB connected')
          }

          // Authenticate user using the static method
          console.log('Authenticating user:', credentials.email)
          const user = await AdminUser.authenticate(credentials.email, credentials.password)
          console.log('Authentication result:', user ? 'success' : 'failed')

          if (!user) {
            // Log failed login attempt
            await ActivityLogger.logLoginFailed(credentials.email)
            return null
          }

          // Log successful login
          await ActivityLogger.logLogin(user.email, user._id.toString(), user.name || user.email, user.role)

          const authResult = {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            status: user.status,
            permissions: user.permissions
          }
          
          console.log('Returning auth result:', JSON.stringify(authResult, null, 2))
          return authResult
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.altiorainfotech.com' : undefined
      }
    }
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user }) {
      // JWT callback processed
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.status = user.status
        token.permissions = (user as any).permissions
        token.name = user.name
        console.log('JWT callback - storing token:', JSON.stringify({
          userId: token.userId,
          role: token.role,
          permissions: token.permissions
        }, null, 2))
      }
      return token
    },
    async session({ session, token }) {
      // Session callback processed
      if (token && token.userId) {
        session.user.id = token.userId as string
        session.user.role = token.role as any
        session.user.status = token.status as any
        session.user.permissions = token.permissions as any
        session.user.name = token.name as string
        console.log('Session callback - final session:', JSON.stringify({
          id: session.user.id,
          role: session.user.role,
          permissions: session.user.permissions
        }, null, 2))
      }
      // Session updated
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
    signOut: "/admin/login",
    error: "/admin/login",
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}