import { NextRequest } from 'next/server'

interface SecurityAuditResult {
  score: number // 0-100
  issues: SecurityIssue[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface SecurityIssue {
  type: 'vulnerability' | 'misconfiguration' | 'policy_violation' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details?: any
  remediation?: string
}

interface SecurityMetrics {
  requestCount: number
  errorRate: number
  suspiciousRequests: number
  blockedRequests: number
  averageResponseTime: number
  uniqueIPs: Set<string>
  userAgents: Map<string, number>
  endpoints: Map<string, number>
}

/**
 * Security audit and monitoring system
 */
export class SecurityAuditor {
  private static metrics: SecurityMetrics = {
    requestCount: 0,
    errorRate: 0,
    suspiciousRequests: 0,
    blockedRequests: 0,
    averageResponseTime: 0,
    uniqueIPs: new Set(),
    userAgents: new Map(),
    endpoints: new Map()
  }

  private static suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|where|into)\b)/i,
    /(\b(or|and)\b.*=.*\b(or|and)\b)/i,
    /(\'|\").*(\bor\b|\band\b).*(\=|like)/i,

    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["\'][^"\']*["\']/gi,

    // Path traversal
    /\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,

    // Command injection (very specific patterns to avoid false positives)
    /;\s*(rm|ls|cat|wget|curl|nc|bash|sh|cmd|powershell)/gi, // Semicolon followed by commands
    /\|\s*(rm|ls|cat|wget|curl|nc|bash|sh|cmd|powershell)/gi, // Pipe followed by commands
    /\$\([^)]*\)/g, // Command substitution
    /`[^`]*`/g, // Backtick command execution

    // LDAP injection (very specific to avoid URL parameter false positives)
    /\(\s*\|\s*\(/g, // LDAP OR operator in nested parentheses
    /\(\s*&\s*\(/g, // LDAP AND operator in nested parentheses

    // XXE patterns
    /<!ENTITY/gi,
    /SYSTEM\s+["\'][^"\']*["\']/gi
  ]

  /**
   * Audit a request for security issues
   */
  static auditRequest(request: NextRequest): SecurityAuditResult {
    const issues: SecurityIssue[] = []
    let score = 100

    // Skip intensive security checks in development mode
    if (process.env.NODE_ENV === 'development') {
      return {
        score: 100,
        issues: [],
        recommendations: [],
        riskLevel: 'low'
      }
    }

    // Update metrics
    this.updateMetrics(request)

    // Check for suspicious patterns in URL
    const url = new URL(request.url)
    const pathname = url.pathname
    const queryString = url.search

    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(pathname) || pattern.test(queryString)) {
        issues.push({
          type: 'suspicious_activity',
          severity: 'high',
          description: 'Suspicious pattern detected in URL',
          details: { pattern: pattern.source, url: request.url },
          remediation: 'Block request and investigate source'
        })
        score -= 20
      }
    })

    // Check headers for security issues
    const headerIssues = this.auditHeaders(request)
    issues.push(...headerIssues)
    score -= headerIssues.length * 5

    // Check user agent
    const userAgent = request.headers.get('user-agent') || ''
    const userAgentIssues = this.auditUserAgent(userAgent)
    issues.push(...userAgentIssues)
    score -= userAgentIssues.length * 10

    // Check for rate limiting violations
    const rateLimitIssues = this.checkRateLimiting(request)
    issues.push(...rateLimitIssues)
    score -= rateLimitIssues.length * 15

    // Check for geographic anomalies
    const geoIssues = this.checkGeographicAnomalies(request)
    issues.push(...geoIssues)
    score -= geoIssues.length * 5

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(score, issues)

    return {
      score: Math.max(0, score),
      issues,
      recommendations: this.generateRecommendations(issues),
      riskLevel
    }
  }

  /**
   * Update security metrics
   */
  private static updateMetrics(request: NextRequest): void {
    this.metrics.requestCount++

    const ip = this.getClientIP(request)
    this.metrics.uniqueIPs.add(ip)

    const userAgent = request.headers.get('user-agent') || 'unknown'
    this.metrics.userAgents.set(userAgent, (this.metrics.userAgents.get(userAgent) || 0) + 1)

    const pathname = new URL(request.url).pathname
    this.metrics.endpoints.set(pathname, (this.metrics.endpoints.get(pathname) || 0) + 1)
  }

  /**
   * Audit request headers
   */
  private static auditHeaders(request: NextRequest): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Check for missing security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ]

    securityHeaders.forEach(header => {
      if (!request.headers.get(header)) {
        issues.push({
          type: 'misconfiguration',
          severity: 'medium',
          description: `Missing security header: ${header}`,
          remediation: `Add ${header} header to response`
        })
      }
    })

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip'
    ]

    suspiciousHeaders.forEach(header => {
      const value = request.headers.get(header)
      if (value && this.isSuspiciousIP(value)) {
        issues.push({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `Suspicious IP in ${header} header`,
          details: { header, value },
          remediation: 'Investigate IP source and consider blocking'
        })
      }
    })

    return issues
  }

  /**
   * Audit user agent string
   */
  private static auditUserAgent(userAgent: string): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // Check for bot/crawler patterns
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

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      issues.push({
        type: 'policy_violation',
        severity: 'low',
        description: 'Automated bot detected',
        details: { userAgent },
        remediation: 'Apply bot-specific rate limiting'
      })
    }

    // Check for suspicious user agents
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /burp/i,
      /acunetix/i,
      /nessus/i,
      /openvas/i,
      /masscan/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      issues.push({
        type: 'suspicious_activity',
        severity: 'high',
        description: 'Security scanning tool detected',
        details: { userAgent },
        remediation: 'Block IP immediately and investigate'
      })
    }

    // Check for empty or very short user agents
    if (!userAgent || userAgent.length < 10) {
      issues.push({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Missing or suspicious user agent',
        details: { userAgent },
        remediation: 'Require valid user agent or apply stricter validation'
      })
    }

    return issues
  }

  /**
   * Check for rate limiting violations
   */
  private static checkRateLimiting(request: NextRequest): SecurityIssue[] {
    const issues: SecurityIssue[] = []
    const ip = this.getClientIP(request)

    // Check if IP has made too many requests recently
    const recentRequests = this.getRecentRequestCount(ip)
    if (recentRequests > 100) { // Threshold for suspicious activity
      issues.push({
        type: 'suspicious_activity',
        severity: 'high',
        description: 'Excessive request rate detected',
        details: { ip, requestCount: recentRequests },
        remediation: 'Apply aggressive rate limiting or temporary IP block'
      })
    }

    return issues
  }

  /**
   * Check for geographic anomalies
   */
  private static checkGeographicAnomalies(request: NextRequest): SecurityIssue[] {
    const issues: SecurityIssue[] = []

    // This would typically integrate with a GeoIP service
    // For now, we'll check for known problematic IP ranges
    const ip = this.getClientIP(request)

    if (this.isFromHighRiskCountry(ip)) {
      issues.push({
        type: 'policy_violation',
        severity: 'medium',
        description: 'Request from high-risk geographic location',
        details: { ip },
        remediation: 'Apply additional verification or monitoring'
      })
    }

    return issues
  }

  /**
   * Calculate overall risk level
   */
  private static calculateRiskLevel(score: number, issues: SecurityIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length

    if (criticalIssues > 0 || score < 30) return 'critical'
    if (highIssues > 2 || score < 50) return 'high'
    if (highIssues > 0 || score < 70) return 'medium'
    return 'low'
  }

  /**
   * Generate security recommendations
   */
  private static generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = []

    if (issues.some(i => i.type === 'vulnerability')) {
      recommendations.push('Patch identified vulnerabilities immediately')
    }

    if (issues.some(i => i.type === 'misconfiguration')) {
      recommendations.push('Review and update security configuration')
    }

    if (issues.some(i => i.type === 'suspicious_activity')) {
      recommendations.push('Investigate suspicious activity and consider blocking sources')
    }

    if (issues.some(i => i.severity === 'critical' || i.severity === 'high')) {
      recommendations.push('Implement immediate security measures')
      recommendations.push('Enable enhanced monitoring and alerting')
    }

    return recommendations
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    return forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'
  }

  /**
   * Check if IP is suspicious
   */
  private static isSuspiciousIP(ip: string): boolean {
    // Check for private IP ranges that shouldn't be in forwarded headers
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ]

    return privateRanges.some(range => range.test(ip))
  }

  /**
   * Get recent request count for IP (simplified implementation)
   */
  private static getRecentRequestCount(ip: string): number {
    // This would typically use a proper time-series database
    // For now, return a mock value based on metrics
    return Math.floor(Math.random() * 150)
  }

  /**
   * Check if IP is from high-risk country
   */
  private static isFromHighRiskCountry(ip: string): boolean {
    // This would typically integrate with a GeoIP service
    // For now, return false as we don't have real geo data
    return false
  }

  /**
   * Get current security metrics
   */
  static getMetrics(): SecurityMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset security metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorRate: 0,
      suspiciousRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      uniqueIPs: new Set(),
      userAgents: new Map(),
      endpoints: new Map()
    }
  }

  /**
   * Generate security report
   */
  static generateSecurityReport(): {
    summary: string
    metrics: SecurityMetrics
    topThreats: string[]
    recommendations: string[]
  } {
    const metrics = this.getMetrics()

    return {
      summary: `Processed ${metrics.requestCount} requests from ${metrics.uniqueIPs.size} unique IPs`,
      metrics,
      topThreats: [
        'SQL Injection attempts',
        'XSS attacks',
        'Bot traffic',
        'Rate limit violations'
      ],
      recommendations: [
        'Enable WAF protection',
        'Implement advanced rate limiting',
        'Add bot detection',
        'Monitor for anomalous patterns'
      ]
    }
  }
}