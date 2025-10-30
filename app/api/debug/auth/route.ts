import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get token using the same method as other APIs
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    });

    // Get all cookies for debugging
    const cookies = request.cookies.getAll();
    
    return NextResponse.json({
      success: true,
      debug: {
        hasToken: !!token,
        tokenData: token ? {
          userId: token.userId,
          email: token.email,
          role: token.role,
          status: token.status,
          hasPermissions: !!token.permissions
        } : null,
        environment: process.env.NODE_ENV,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
        availableCookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        headers: {
          authorization: request.headers.get('authorization'),
          cookie: !!request.headers.get('cookie'),
          userAgent: request.headers.get('user-agent')
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: process.env.NODE_ENV,
        hasSecret: !!process.env.NEXTAUTH_SECRET
      }
    });
  }
}