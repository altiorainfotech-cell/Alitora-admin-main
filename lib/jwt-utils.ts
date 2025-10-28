import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'seo' | 'custom'
  iat?: number
  exp?: number
}

export class JWTUtils {
  private static readonly SECRET = process.env.NEXTAUTH_SECRET!
  private static readonly EXPIRES_IN = '30d'

  /**
   * Generate a JWT token for a user
   */
  static generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.EXPIRES_IN })
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.SECRET) as TokenPayload
    } catch (error) {
      throw new Error('Invalid or expired token')
    }
  }

  /**
   * Decode a token without verification (useful for expired tokens)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload
    } catch (error) {
      return null
    }
  }

  /**
   * Check if a token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) return true
      
      const currentTime = Math.floor(Date.now() / 1000)
      return decoded.exp < currentTime
    } catch (error) {
      return true
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) return null
      
      return new Date(decoded.exp * 1000)
    } catch (error) {
      return null
    }
  }

  /**
   * Refresh a token (generate new token with same payload but extended expiration)
   */
  static refreshToken(token: string): string {
    const decoded = this.verifyToken(token)
    
    // Remove iat and exp from payload for new token
    const { iat, exp, ...payload } = decoded
    
    return this.generateToken(payload)
  }
}