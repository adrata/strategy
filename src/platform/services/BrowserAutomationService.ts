/**
 * 🌐 BROWSER AUTOMATION SERVICE
 * 
 * Playwright-based browser automation for AI web research
 * Provides web navigation, content extraction, and search capabilities
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { 
  BrowserAction, 
  BrowserResult, 
  WebSearchResult, 
  BrowserAutomationConfig,
  BrowserSession 
} from '@/types/browser-automation';

export class BrowserAutomationService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private sessions: Map<string, BrowserSession> = new Map();
  private config: BrowserAutomationConfig;

  constructor() {
    this.config = {
      headless: process.env.BROWSER_HEADLESS === 'true',
      timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
      maxConcurrent: parseInt(process.env.BROWSER_MAX_CONCURRENT || '3'),
      allowedDomains: process.env.BROWSER_ALLOWED_DOMAINS?.split(',') || [],
      blockedDomains: process.env.BROWSER_BLOCKED_DOMAINS?.split(',') || [],
      userAgent: process.env.BROWSER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: {
        width: 1280,
        height: 720
      }
    };
  }

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: this.config.userAgent,
        viewport: this.config.viewport,
        ignoreHTTPSErrors: true
      });

      console.log('🌐 Browser automation service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Create a new browser session
   */
  async createSession(): Promise<string> {
    await this.initialize();
    
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: BrowserSession = {
      id: sessionId,
      startTime: new Date(),
      actions: [],
      results: [],
      isActive: true
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Navigate to a URL and extract content
   */
  async navigateToUrl(
    sessionId: string, 
    url: string, 
    options: any = {}
  ): Promise<BrowserResult> {
    const startTime = Date.now();
    
    try {
      if (!this.context) {
        await this.initialize();
      }

      // Validate URL
      const sanitizedUrl = this.sanitizeUrl(url);
      if (!sanitizedUrl) {
        return {
          success: false,
          error: 'Invalid or blocked URL',
          url
        };
      }

      // Check domain restrictions
      if (!this.isDomainAllowed(sanitizedUrl)) {
        return {
          success: false,
          error: 'Domain not allowed',
          url: sanitizedUrl
        };
      }

      const page = await this.context!.newPage();
      
      // Set timeout
      page.setDefaultTimeout(this.config.timeout);

      // Navigate to URL
      const response = await page.goto(sanitizedUrl, {
        waitUntil: options.waitForLoadState || 'domcontentloaded'
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Extract content
      const title = await page.title();
      let content = '';
      let links: any[] = [];
      let images: any[] = [];

      if (options.extractText !== false) {
        content = await page.evaluate(() => {
          // Remove script and style elements
          const scripts = document.querySelectorAll('script, style');
          scripts.forEach(el => el.remove());
          
          // Get main content
          const main = document.querySelector('main') || 
                      document.querySelector('article') || 
                      document.querySelector('.content') ||
                      document.body;
          
          return main ? main.innerText : document.body.innerText;
        });
      }

      if (options.extractLinks) {
        links = await page.evaluate(() => {
          const linkElements = document.querySelectorAll('a[href]');
          return Array.from(linkElements).map(link => ({
            text: link.textContent?.trim() || '',
            url: link.getAttribute('href') || ''
          })).filter(link => link.text && link.url);
        });
      }

      if (options.extractImages) {
        images = await page.evaluate(() => {
          const imgElements = document.querySelectorAll('img[src]');
          return Array.from(imgElements).map(img => ({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || ''
          })).filter(img => img.src);
        });
      }

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (options.screenshot) {
        const screenshotBuffer = await page.screenshot({
          fullPage: options.fullPage || false,
          type: 'png'
        });
        screenshot = screenshotBuffer.toString('base64');
      }

      await page.close();

      const loadTime = Date.now() - startTime;

      return {
        success: true,
        url: sanitizedUrl,
        title,
        content: content.substring(0, 10000), // Limit content size
        links,
        images,
        screenshot,
        metadata: {
          loadTime,
          contentLength: content.length,
          statusCode: response?.status() || 0
        }
      };

    } catch (error) {
      console.error('❌ Navigation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      };
    }
  }

  /**
   * Perform web search
   */
  async searchWeb(
    sessionId: string, 
    query: string, 
    options: any = {}
  ): Promise<WebSearchResult> {
    const startTime = Date.now();
    
    try {
      // Use Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${options.maxResults || 10}`;
      
      const result = await this.navigateToUrl(sessionId, searchUrl, {
        extractText: false,
        extractLinks: true,
        waitForSelector: '#search'
      });

      if (!result.success) {
        return {
          query,
          results: [],
          totalResults: 0,
          searchTime: Date.now() - startTime
        };
      }

      // Parse search results from Google
      const searchResults = await this.parseGoogleSearchResults(result.links || [], query);

      return {
        query,
        results: searchResults,
        totalResults: searchResults.length,
        searchTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Search error:', error);
      return {
        query,
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract content using CSS selectors
   */
  async extractContent(
    sessionId: string,
    url: string,
    selectors: string[],
    extractType: 'text' | 'html' | 'attributes' = 'text'
  ): Promise<BrowserResult> {
    try {
      const result = await this.navigateToUrl(sessionId, url, {
        extractText: false
      });

      if (!result.success) {
        return result;
      }

      // Navigate to the page and extract using selectors
      if (!this.context) {
        await this.initialize();
      }

      const page = await this.context!.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const extractedData: any = {};

      for (const selector of selectors) {
        try {
          if (extractType === 'text') {
            extractedData[selector] = await page.textContent(selector);
          } else if (extractType === 'html') {
            extractedData[selector] = await page.innerHTML(selector);
          } else if (extractType === 'attributes') {
            const element = await page.$(selector);
            if (element) {
              extractedData[selector] = await element.evaluate(el => {
                const attrs: any = {};
                for (const attr of el.attributes) {
                  attrs[attr.name] = attr.value;
                }
                return attrs;
              });
            }
          }
        } catch (error) {
          extractedData[selector] = null;
        }
      }

      await page.close();

      return {
        success: true,
        url,
        data: extractedData
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      };
    }
  }

  /**
   * Take screenshot of a webpage
   */
  async takeScreenshot(
    sessionId: string,
    url: string,
    options: any = {}
  ): Promise<BrowserResult> {
    try {
      if (!this.context) {
        await this.initialize();
      }

      const page = await this.context!.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      let screenshotBuffer: Buffer;

      if (options.selector) {
        const element = await page.$(options.selector);
        if (element) {
          screenshotBuffer = await element.screenshot({ type: 'png' });
        } else {
          throw new Error('Element not found');
        }
      } else {
        screenshotBuffer = await page.screenshot({
          fullPage: options.fullPage || false,
          type: 'png'
        });
      }

      await page.close();

      return {
        success: true,
        url,
        screenshot: screenshotBuffer.toString('base64')
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      };
    }
  }

  /**
   * Clean up browser resources
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.sessions.clear();
    console.log('🧹 Browser automation service cleaned up');
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Close a specific session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
    }
  }

  // Private helper methods

  private sanitizeUrl(url: string): string | null {
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

  private isDomainAllowed(url: string): boolean {
    if (this.config.allowedDomains.length === 0) {
      return true; // No restrictions
    }

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      
      return this.config.allowedDomains.some(domain => {
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

  private parseGoogleSearchResults(links: any[], query: string): any[] {
    // Filter out Google's own links and extract search results
    const searchResults = links
      .filter(link => {
        const url = link.url;
        return url && 
               !url.includes('google.com') && 
               !url.includes('youtube.com/watch') &&
               !url.startsWith('/') &&
               url.startsWith('http');
      })
      .slice(0, 10) // Limit to 10 results
      .map((link, index) => ({
        title: link.text,
        url: link.url,
        snippet: `Search result for "${query}"`,
        position: index + 1
      }));

    return searchResults;
  }
}

// Export singleton instance
export const browserAutomationService = new BrowserAutomationService();
