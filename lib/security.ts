import { createHash, randomBytes } from 'crypto'

/**
 * Security utilities for the application
 */

// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://va.vercel-scripts.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.whatsapp.com', 'https://wa.me'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

/**
 * Generate Content Security Policy header value
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a password or sensitive data
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || randomBytes(16).toString('hex')
  return createHash('sha256').update(data + actualSalt).digest('hex')
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const computedHash = hashData(data, salt)
  return computedHash === hash
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '_') // Replace .. first
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100)
}

/**
 * Validate URL for security
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase()
      
      // Block localhost
      if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
        return false
      }
      
      // Block private IP ranges
      const privateRanges = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^fc00:/,
        /^fe80:/
      ]
      
      if (privateRanges.some(range => range.test(hostname))) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Rate limiting key generator
 */
export function generateRateLimitKey(
  identifier: string, 
  action: string, 
  window?: string
): string {
  const windowSuffix = window ? `:${window}` : ''
  return `rate_limit:${identifier}:${action}${windowSuffix}`
}

/**
 * Enhanced XSS protection and input sanitization
 */
export function sanitizeInput(
  input: string, 
  options: {
    maxLength?: number
    allowHtml?: boolean
    allowUrls?: boolean
    strictMode?: boolean
  } = {}
): string {
  const { maxLength = 1000, allowHtml = false, allowUrls = true, strictMode = false } = options
  
  let sanitized = input.trim()
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Enhanced XSS protection
  if (!allowHtml) {
    // Remove script-related content first
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/vbscript:/gi, '')
    sanitized = sanitized.replace(/data:/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=[^>\s]*/gi, '')
    
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')
    
    // Remove HTML entities that could be used for XSS
    sanitized = sanitized.replace(/&[#\w]+;/g, '')
  }
  
  // Strict mode for additional security
  if (strictMode) {
    // Remove special characters that could be used in attacks
    sanitized = sanitized.replace(/[<>'"&]/g, '')
    sanitized = sanitized.replace(/\\/g, '')
    sanitized = sanitized.replace(/\{|\}/g, '')
  }
  
  // Validate URLs if present
  if (!allowUrls) {
    // Remove URLs
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '')
    sanitized = sanitized.replace(/ftp:\/\/[^\s]+/g, '')
  }
  
  // Remove null bytes, control characters, and unicode control chars
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  
  // Remove potential SQL injection patterns (more targeted)
  sanitized = sanitized.replace(/[';]/g, '') // Remove quotes and semicolons
  sanitized = sanitized.replace(/\|\s*\w/g, '') // Remove pipe followed by word (command)
  sanitized = sanitized.replace(/`[^`]*`/g, '') // Remove backtick commands
  
  return sanitized
}

/**
 * Sanitize HTML content while preserving safe tags
 */
export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
  const allowed = [...defaultAllowedTags, ...allowedTags]
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/javascript:/gi, '')
  sanitized = sanitized.replace(/vbscript:/gi, '')
  sanitized = sanitized.replace(/data:/gi, '')
  
  // Remove all tags except allowed ones
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    return allowed.includes(tagName.toLowerCase()) ? match : ''
  })
  
  return sanitized
}

/**
 * Check if request is from a bot/crawler
 */
export function isBotRequest(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http-client/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Generate nonce for inline scripts/styles
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

/**
 * Validate file extension against allowed types
 */
export function isAllowedFileType(
  filename: string, 
  allowedExtensions: string[]
): boolean {
  const extension = filename.toLowerCase().split('.').pop()
  return extension ? allowedExtensions.includes(`.${extension}`) : false
}

/**
 * Check for suspicious file patterns and potential malware
 */
export function hasSuspiciousFilePattern(filename: string): boolean {
  const suspiciousPatterns = [
    // Executable files
    /\.(php|js|html|htm|asp|aspx|jsp|exe|bat|cmd|sh|ps1|vbs|jar|com|scr|pif|msi)$/i,
    // Path traversal
    /\.\./,
    // Invalid characters
    /[<>:"|?*]/,
    // Windows reserved names
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    // Hidden files or ending with dot
    /^\./,
    /\.$/,
    // Double extensions (common malware technique)
    /\.(jpg|png|gif|pdf)\.(exe|scr|bat|cmd|com|pif)$/i,
    // Suspicious patterns in filename
    /payload/i,
    /shell/i,
    /backdoor/i,
    /virus/i,
    /trojan/i,
    /malware/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(filename))
}

/**
 * Enhanced file content validation for malware detection
 */
export function scanFileContent(buffer: Buffer, filename: string): {
  isSafe: boolean
  threats: string[]
  confidence: number
} {
  const threats: string[] = []
  let confidence = 1.0
  
  // Convert buffer to string for pattern matching
  const content = buffer.toString('binary')
  const hexContent = buffer.toString('hex')
  
  // Check for executable signatures
  const executableSignatures = [
    { pattern: /^MZ/, name: 'Windows Executable (PE)', risk: 'high' },
    { pattern: /^\x7fELF/, name: 'Linux Executable (ELF)', risk: 'high' },
    { pattern: /^\xca\xfe\xba\xbe/, name: 'Java Class File', risk: 'medium' },
    { pattern: /^PK\x03\x04.*\.jar/, name: 'Java Archive', risk: 'medium' },
    { pattern: /^Rar!/, name: 'RAR Archive', risk: 'low' },
    { pattern: /^PK/, name: 'ZIP Archive', risk: 'low' }
  ]
  
  executableSignatures.forEach(sig => {
    if (sig.pattern.test(content)) {
      threats.push(`Detected ${sig.name}`)
      if (sig.risk === 'high') confidence -= 0.5
      else if (sig.risk === 'medium') confidence -= 0.3
      else confidence -= 0.1
    }
  })
  
  // Check for script content in image files
  if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const scriptPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /<\?php/i,
      /<%/,
      /eval\(/i,
      /exec\(/i,
      /system\(/i,
      /shell_exec/i,
      /base64_decode/i
    ]
    
    scriptPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Embedded script content detected')
        confidence -= 0.4
      }
    })
  }
  
  // Check for suspicious hex patterns
  const suspiciousHexPatterns = [
    /4d5a90/, // MZ header
    /504b0304/, // ZIP header with suspicious content
    /89504e47/, // PNG header (check if it's really PNG)
  ]
  
  // Validate image headers match file extensions
  if (filename.match(/\.(jpg|jpeg)$/i) && !hexContent.startsWith('ffd8ff')) {
    threats.push('JPEG header mismatch')
    confidence -= 0.3
  }
  
  if (filename.match(/\.png$/i) && !hexContent.startsWith('89504e47')) {
    threats.push('PNG header mismatch')
    confidence -= 0.3
  }
  
  if (filename.match(/\.gif$/i) && !hexContent.startsWith('474946')) {
    threats.push('GIF header mismatch')
    confidence -= 0.3
  }
  
  // Check file size anomalies
  if (buffer.length > 50 * 1024 * 1024) { // 50MB
    threats.push('Unusually large file size')
    confidence -= 0.2
  }
  
  if (buffer.length < 100 && filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
    threats.push('Suspiciously small image file')
    confidence -= 0.3
  }
  
  // For very small valid headers, don't flag as suspicious
  if (buffer.length >= 4 && filename.match(/\.(jpg|jpeg)$/i) && hexContent.startsWith('ffd8ff')) {
    // Valid JPEG with minimal size, remove small file threat
    const smallFileIndex = threats.indexOf('Suspiciously small image file')
    if (smallFileIndex > -1) {
      threats.splice(smallFileIndex, 1)
      confidence += 0.3
    }
  }
  
  return {
    isSafe: confidence > 0.5 && threats.length === 0,
    threats,
    confidence: Math.max(0, confidence)
  }
}

/**
 * Generate secure headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
}