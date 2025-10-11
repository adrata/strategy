/**
 * 🌐 BROWSER TOOLS FOR CLAUDE AI
 * 
 * Tool definitions and utilities for browser automation
 * Used by Claude AI to perform web research and browser actions
 */

import { BrowserToolDefinition, BROWSER_TOOLS } from '@/types/browser-automation';

export class BrowserTools {
  /**
   * Get all available browser tools for Claude AI
   */
  static getTools(): BrowserToolDefinition[] {
    return BROWSER_TOOLS;
  }

  /**
   * Validate tool call parameters
   */
  static validateToolCall(toolName: string, parameters: any): boolean {
    const tool = BROWSER_TOOLS.find(t => t.name === toolName);
    if (!tool) {
      return false;
    }

    // Check required parameters
    for (const required of tool.parameters.required) {
      if (!(required in parameters)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize URL to prevent malicious requests
   */
  static sanitizeUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      // Block localhost and private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname;
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')
        ) {
          return null;
        }
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Check if domain is allowed
   */
  static isDomainAllowed(url: string, allowedDomains: string[]): boolean {
    if (allowedDomains.length === 0) {
      return true; // No restrictions
    }

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      
      return allowedDomains.some(domain => {
        if (domain.startsWith('.')) {
          // Wildcard subdomain
          return hostname.endsWith(domain) || hostname === domain.slice(1);
        }
        return hostname === domain;
      });
    } catch {
      return false;
    }
  }

  /**
   * Extract search query from user message
   */
  static extractSearchQuery(message: string): string | null {
    const searchPatterns = [
      /search for (.+)/i,
      /find (.+)/i,
      /look up (.+)/i,
      /what is (.+)/i,
      /tell me about (.+)/i,
      /get me information about (.+)/i,
      /research (.+)/i,
      /browse (.+)/i,
      /check (.+)/i
    ];

    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract URL from user message
   */
  static extractUrl(message: string): string | null {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const match = message.match(urlPattern);
    return match ? match[0] : null;
  }

  /**
   * Determine if user wants web research
   */
  static shouldPerformWebResearch(message: string): boolean {
    const researchKeywords = [
      'search', 'find', 'look up', 'research', 'browse', 'check',
      'latest', 'current', 'recent', 'news', 'update', 'information',
      'website', 'url', 'http', 'https'
    ];

    const lowerMessage = message.toLowerCase();
    return researchKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Generate tool call for web search
   */
  static generateSearchToolCall(query: string): any {
    return {
      id: `search-${Date.now()}`,
      type: 'function',
      function: {
        name: 'search_web',
        arguments: JSON.stringify({
          query: query,
          max_results: 10,
          search_engine: 'google'
        })
      }
    };
  }

  /**
   * Generate tool call for URL navigation
   */
  static generateNavigateToolCall(url: string): any {
    return {
      id: `navigate-${Date.now()}`,
      type: 'function',
      function: {
        name: 'navigate_to_url',
        arguments: JSON.stringify({
          url: url,
          extract_text: true,
          extract_links: false
        })
      }
    };
  }

  /**
   * Format browser results for Claude AI
   */
  static formatResultsForAI(results: any[]): string {
    if (!results || results.length === 0) {
      return 'No browser results available.';
    }

    let formatted = 'Web Research Results:\n\n';
    
    for (const result of results) {
      if (result.success) {
        formatted += `**${result.title || 'Web Page'}**\n`;
        formatted += `URL: ${result.url}\n`;
        
        if (result.content) {
          // Truncate content to avoid token limits
          const content = result.content.length > 2000 
            ? result.content.substring(0, 2000) + '...'
            : result.content;
          formatted += `Content: ${content}\n`;
        }
        
        if (result.links && result.links.length > 0) {
          formatted += `Links found: ${result.links.length}\n`;
        }
        
        formatted += '\n---\n\n';
      } else {
        formatted += `Error accessing ${result.url}: ${result.error}\n\n`;
      }
    }

    return formatted;
  }
}
