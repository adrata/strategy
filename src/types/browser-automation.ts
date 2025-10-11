/**
 * 🌐 BROWSER AUTOMATION TYPES
 * 
 * TypeScript definitions for browser automation functionality
 * Used by Playwright-based browser automation service
 */

export interface BrowserAction {
  id: string;
  type: 'navigate' | 'search' | 'extract' | 'screenshot' | 'click' | 'type' | 'scroll';
  url?: string;
  query?: string;
  selector?: string;
  text?: string;
  options?: BrowserActionOptions;
}

export interface BrowserActionOptions {
  timeout?: number;
  waitForSelector?: string;
  waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
  screenshot?: boolean;
  extractText?: boolean;
  extractLinks?: boolean;
  extractImages?: boolean;
  headers?: Record<string, string>;
  userAgent?: string;
}

export interface BrowserResult {
  success: boolean;
  data?: any;
  error?: string;
  url?: string;
  title?: string;
  content?: string;
  links?: Array<{
    text: string;
    url: string;
  }>;
  images?: Array<{
    src: string;
    alt?: string;
  }>;
  screenshot?: string; // base64 encoded
  metadata?: {
    loadTime: number;
    contentLength: number;
    statusCode: number;
  };
}

export interface WebSearchResult {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    position: number;
  }>;
  totalResults: number;
  searchTime: number;
}

export interface BrowserSession {
  id: string;
  startTime: Date;
  actions: BrowserAction[];
  results: BrowserResult[];
  isActive: boolean;
}

export interface BrowserAutomationConfig {
  headless: boolean;
  timeout: number;
  maxConcurrent: number;
  allowedDomains: string[];
  blockedDomains: string[];
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface ClaudeToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface BrowserToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// Tool definitions for Claude AI
export const BROWSER_TOOLS: BrowserToolDefinition[] = [
  {
    name: 'navigate_to_url',
    description: 'Navigate to a specific URL and extract content',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to'
        },
        extract_text: {
          type: 'boolean',
          description: 'Whether to extract text content from the page',
          default: true
        },
        extract_links: {
          type: 'boolean',
          description: 'Whether to extract links from the page',
          default: false
        },
        wait_for_selector: {
          type: 'string',
          description: 'CSS selector to wait for before extracting content'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'search_web',
    description: 'Perform a web search and return results',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10
        },
        search_engine: {
          type: 'string',
          enum: ['google', 'bing', 'duckduckgo'],
          description: 'Search engine to use',
          default: 'google'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'extract_page_content',
    description: 'Extract specific content from a webpage using CSS selectors',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to extract content from'
        },
        selectors: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'CSS selectors to extract content from'
        },
        extract_type: {
          type: 'string',
          enum: ['text', 'html', 'attributes'],
          description: 'Type of content to extract',
          default: 'text'
        }
      },
      required: ['url', 'selectors']
    }
  },
  {
    name: 'take_screenshot',
    description: 'Take a screenshot of a webpage',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to screenshot'
        },
        full_page: {
          type: 'boolean',
          description: 'Whether to capture the full page or just the viewport',
          default: false
        },
        selector: {
          type: 'string',
          description: 'CSS selector to screenshot a specific element'
        }
      },
      required: ['url']
    }
  }
];
