/**
 * Server-safe HTML sanitization utility
 * Provides XSS protection without external dependencies
 */

// Simple HTML tag and attribute whitelist
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
]);

const ALLOWED_ATTRIBUTES = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
]);

const URL_REGEX = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Basic HTML sanitization using regex patterns
 * This is a simplified version that handles common XSS vectors
 */
export function sanitizeHtmlContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let sanitized = content;

  // Remove script tags and their content (case insensitive, handles various formats)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<script[^>]*>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove on* event handlers (more comprehensive)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove javascript: URLs (case insensitive)
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
  
  // Remove vbscript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']vbscript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']vbscript:[^"']*["']/gi, 'src=""');
  
  // Remove data: URLs except for images
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[^"']*["']/gi, 'src=""');
  
  // Remove potentially dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'meta', 'link', 'base'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove any remaining script-like content
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');

  return sanitized.trim();
}

/**
 * Remove all HTML tags and return plain text
 */
export function sanitizeTextContent(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');

  return sanitized.trim();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove any potential javascript: or data: schemes (except data:image)
  if (url.toLowerCase().startsWith('javascript:')) {
    return '#';
  }
  
  if (url.toLowerCase().startsWith('data:') && !url.toLowerCase().startsWith('data:image/')) {
    return '#';
  }

  // Basic URL validation
  if (!URL_REGEX.test(url)) {
    return '#';
  }

  return url;
}