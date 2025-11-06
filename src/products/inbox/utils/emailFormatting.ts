/**
 * Email Formatting Utilities
 * 
 * Provides utilities for formatting email data for display
 */

export interface EmailAddress {
  name?: string;
  email: string;
}

/**
 * Parse email address string into name and email
 * Examples:
 * - "John Doe <john@example.com>" -> { name: "John Doe", email: "john@example.com" }
 * - "john@example.com" -> { email: "john@example.com" }
 */
export function parseEmailAddress(address: string): EmailAddress {
  const match = address.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, ''),
      email: match[2].trim()
    };
  }
  return { email: address.trim() };
}

/**
 * Extract sender name from email address
 * Falls back to email address if no name found
 */
export function getSenderName(from: string): string {
  const parsed = parseEmailAddress(from);
  return parsed.name || parsed.email.split('@')[0] || from;
}

/**
 * Format timestamp relative to now
 * Examples:
 * - "09:34 AM" (today)
 * - "Yesterday"
 * - "2 days ago"
 * - "1 week ago"
 * - "Jan 15" (older dates)
 */
export function formatEmailTimestamp(date: Date | string): string {
  const emailDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - emailDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Same day
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      return `${diffMins}m ago`;
    }
    return emailDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }
  
  // Within a week
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  
  // Within a month
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  
  // Older dates - show month and day
  return emailDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Truncate email preview text
 */
export function truncateEmailPreview(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract plain text from HTML email body
 */
export function extractPlainText(html: string | null | undefined): string {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Decode HTML entities (basic common ones)
  if (typeof window !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    text = txt.value;
  } else {
    // Server-side: decode common HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  
  return text;
}

/**
 * Get email preview text from body (HTML or plain)
 */
export function getEmailPreview(body: string | null | undefined, bodyHtml: string | null | undefined): string {
  if (bodyHtml) {
    return truncateEmailPreview(extractPlainText(bodyHtml));
  }
  return truncateEmailPreview(body || '');
}

