/**
 * URL formatting utilities for smart display of long URLs
 * Provides intelligent truncation while preserving readability
 */

export interface UrlFormatOptions {
  maxLength?: number;
  showProtocol?: boolean;
  preserveEnding?: number;
  ellipsis?: string;
}

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns The domain part of the URL
 */
export function getUrlDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}

/**
 * Extracts the path from a URL
 * @param url - The URL to extract path from
 * @returns The path part of the URL (including query params and hash)
 */
export function getUrlPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search + urlObj.hash;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/https?:\/\/[^\/]+(.*)/);
    return match ? match[1] : '';
  }
}

/**
 * Truncates a URL with smart middle ellipsis
 * Preserves the beginning (protocol + domain) and ending of the URL
 * @param url - The URL to truncate
 * @param maxLength - Maximum length of the truncated URL
 * @param options - Additional formatting options
 * @returns The truncated URL string
 */
export function truncateUrl(url: string, maxLength: number = 50, options: UrlFormatOptions = {}): string {
  if (!url || url.length <= maxLength) {
    return url;
  }

  const {
    showProtocol = false,
    preserveEnding = 15,
    ellipsis = '...'
  } = options;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    
    // If the domain alone is too long, truncate it
    if (domain.length > maxLength - ellipsis.length) {
      return domain.substring(0, maxLength - ellipsis.length) + ellipsis;
    }

    // Calculate how much space we have for the path
    const protocolPart = showProtocol ? `${urlObj.protocol}//` : '';
    const domainPart = domain;
    const availableForPath = maxLength - protocolPart.length - domainPart.length - ellipsis.length;
    
    if (availableForPath <= 0) {
      return protocolPart + domainPart + ellipsis;
    }

    // If path is short enough, show it all
    if (path.length <= availableForPath) {
      return protocolPart + domainPart + path;
    }

    // Truncate the path in the middle
    const pathStart = Math.max(0, availableForPath - preserveEnding);
    const pathEnd = path.length - preserveEnding;
    
    if (pathStart >= pathEnd) {
      // Not enough space for meaningful truncation, just show the end
      return protocolPart + domainPart + ellipsis + path.substring(path.length - availableForPath + ellipsis.length);
    }

    const truncatedPath = path.substring(0, pathStart) + ellipsis + path.substring(pathEnd);
    return protocolPart + domainPart + truncatedPath;

  } catch {
    // If URL parsing fails, use simple truncation
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - ellipsis.length) + ellipsis;
  }
}

/**
 * Formats a URL for display with smart truncation
 * @param url - The URL to format
 * @param options - Formatting options
 * @returns Formatted URL string for display
 */
export function formatUrlForDisplay(url: string, options: UrlFormatOptions = {}): string {
  if (!url || url.trim() === '' || url === '-') {
    return '-';
  }

  const {
    maxLength = 60,
    showProtocol = false,
    preserveEnding = 20,
    ellipsis = '...'
  } = options;

  // Clean up the URL
  const cleanUrl = url.trim();
  
  // If it's already short enough, return as is
  if (cleanUrl.length <= maxLength) {
    return cleanUrl;
  }

  return truncateUrl(cleanUrl, maxLength, {
    showProtocol,
    preserveEnding,
    ellipsis
  });
}

/**
 * Gets a friendly display name for a URL
 * @param url - The URL to get display name for
 * @returns A friendly display name
 */
export function getUrlDisplayName(url: string): string {
  if (!url || url.trim() === '' || url === '-') {
    return '-';
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    // Special handling for common platforms
    if (domain.includes('linkedin.com')) {
      if (urlObj.pathname.includes('/sales/lead/')) {
        return 'LinkedIn Navigator';
      }
      return 'LinkedIn Profile';
    }
    
    if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return 'Twitter Profile';
    }
    
    if (domain.includes('facebook.com')) {
      return 'Facebook Profile';
    }
    
    if (domain.includes('instagram.com')) {
      return 'Instagram Profile';
    }
    
    if (domain.includes('youtube.com')) {
      return 'YouTube Channel';
    }
    
    if (domain.includes('github.com')) {
      return 'GitHub Profile';
    }
    
    // For other URLs, return the domain
    return domain;
    
  } catch {
    // If URL parsing fails, return the original URL
    return url;
  }
}

/**
 * Determines if a URL should be truncated based on length
 * @param url - The URL to check
 * @param threshold - Length threshold for truncation
 * @returns True if the URL should be truncated
 */
export function shouldTruncateUrl(url: string, threshold: number = 50): boolean {
  return url && url.length > threshold;
}
