/**
 * 🏆 AI Chat Timeout Debug Test - Staging Environment
 * 
 * Comprehensive Puppeteer test to debug AI chat timeout issues on staging.adrata.com
 * 
 * This test:
 * 1. Authenticates on staging
 * 2. Opens AI chat panel
 * 3. Sends a message
 * 4. Monitors for timeouts (60s)
 * 5. Captures all logs (console, network, errors)
 * 6. Analyzes where the timeout occurs
 * 7. Generates detailed debug report
 */

import puppeteer, { Browser, Page, ConsoleMessage, Request, Response } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const STAGING_URL = process.env.STAGING_URL || 'https://staging.adrata.com';
const TEST_EMAIL = process.env.TEST_EMAIL || 'vleland@topengineersplus.com';
const TEST_USERNAME = process.env.TEST_USERNAME || 'vleland';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TOPgtm01!';
const WORKSPACE = process.env.TEST_WORKSPACE || 'top';

// Debug data collection
interface DebugData {
  timestamp: string;
  type: 'console' | 'network' | 'error' | 'timeout' | 'success';
  message: string;
  details?: any;
}

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  requestTime: number;
  responseTime?: number;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
}

class AIChatTimeoutDebugger {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private debugLogs: DebugData[] = [];
  private networkRequests: Map<string, NetworkRequest> = new Map();
  private startTime: number = 0;
  private aiChatRequestId: string | null = null;

  async initialize() {
    console.log('🚀 Initializing Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', (msg: ConsoleMessage) => this.handleConsole(msg));
    
    // Set up network monitoring
    this.page.on('request', (req: Request) => this.handleRequest(req));
    this.page.on('response', (res: Response) => this.handleResponse(res));
    
    // Set up error handling
    this.page.on('pageerror', (error: Error) => this.logDebug('error', `Page Error: ${error.message}`, { stack: error.stack }));
    this.page.on('requestfailed', (req: Request) => {
      this.logDebug('error', `Request Failed: ${req.url()}`, {
        method: req.method(),
        failure: req.failure()?.errorText
      });
    });

    console.log('✅ Browser initialized');
  }

  private handleConsole(msg: ConsoleMessage) {
    const text = msg.text();
    const type = msg.type();
    
    // Filter for AI chat related logs
    if (text.includes('AI') || text.includes('ai-chat') || text.includes('timeout') || 
        text.includes('STEP') || text.includes('CHAT') || text.includes('Context')) {
      this.logDebug('console', `[${type.toUpperCase()}] ${text}`, {
        type: type,
        location: msg.location()
      });
    }
  }

  private handleRequest(req: Request) {
    const url = req.url();
    const method = req.method();
    
    // Track AI chat API requests
    if (url.includes('/api/ai-chat')) {
      this.aiChatRequestId = req.headers()['x-request-id'] || `req-${Date.now()}`;
      this.logDebug('network', `🚀 AI Chat Request Started: ${method} ${url}`, {
        method,
        url,
        headers: req.headers(),
        postData: req.postData()
      });
    }

    const requestId = req.headers()['x-request-id'] || url;
    this.networkRequests.set(requestId, {
      url,
      method,
      requestTime: Date.now(),
      requestHeaders: req.headers(),
      requestBody: req.postData() ? JSON.parse(req.postData() || '{}') : undefined
    });
  }

  private async handleResponse(res: Response) {
    const url = res.url();
    const status = res.status();
    const request = res.request();
    const requestId = request.headers()['x-request-id'] || url;

    // Track AI chat API responses
    if (url.includes('/api/ai-chat')) {
      const responseTime = Date.now();
      const requestData = this.networkRequests.get(requestId);
      const duration = requestData ? responseTime - requestData.requestTime : undefined;

      this.logDebug('network', `✅ AI Chat Response: ${status} (${duration}ms)`, {
        url,
        status,
        duration,
        headers: res.headers()
      });

      // Try to capture response body for AI chat
      try {
        const responseBody = await res.text();
        const parsedBody = JSON.parse(responseBody);
        this.logDebug('network', `📦 AI Chat Response Body`, {
          success: parsedBody.success,
          hasResponse: !!parsedBody.response,
          hasReasoning: !!parsedBody.reasoning,
          error: parsedBody.error,
          responsePreview: parsedBody.response?.substring(0, 200)
        });
      } catch (e) {
        // Response might not be JSON or already consumed
      }
    }

    const requestData = this.networkRequests.get(requestId);
    if (requestData) {
      requestData.status = status;
      requestData.responseTime = Date.now();
      requestData.duration = requestData.responseTime - requestData.requestTime;
      requestData.responseHeaders = res.headers();
    }
  }

  private logDebug(type: DebugData['type'], message: string, details?: any) {
    const logEntry: DebugData = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    this.debugLogs.push(logEntry);
    
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    console.log(`[${elapsed}ms] [${type.toUpperCase()}] ${message}`);
    if (details) {
      console.log('  Details:', JSON.stringify(details, null, 2));
    }
  }

  async authenticate() {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🔐 Authenticating on staging...');
    this.logDebug('console', 'Navigating to sign-in page');

    await this.page.goto(`${STAGING_URL}/sign-in`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.page.waitForTimeout(2000);

    // Fill in credentials
    const emailInput = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="Email" i], input[placeholder*="Username" i], input[name="username"]');
    if (emailInput) {
      await emailInput.type(TEST_USERNAME);
      this.logDebug('console', 'Entered username');
    }

    const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.type(TEST_PASSWORD);
      this.logDebug('console', 'Entered password');
    }

    // Click sign in button
    const loginButton = await this.page.$('button:has-text("Start"), button:has-text("Sign In"), button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      this.logDebug('console', 'Clicked sign-in button');
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await this.page.waitForTimeout(3000);
      
      this.logDebug('console', 'Authentication complete');
    }
  }

  async navigateToSpeedrun() {
    if (!this.page) throw new Error('Page not initialized');

    console.log('📊 Navigating to Speedrun page...');
    const speedrunUrl = `${STAGING_URL}/${WORKSPACE}/speedrun`;
    
    this.logDebug('console', `Navigating to: ${speedrunUrl}`);
    await this.page.goto(speedrunUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await this.page.waitForTimeout(3000);
    this.logDebug('console', 'Speedrun page loaded');
  }

  async openAIPanel() {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🤖 Opening AI panel...');
    
    // Try multiple selectors for AI panel toggle
    const aiPanelSelectors = [
      '[data-testid="ai-panel-toggle"]',
      '[data-testid="right-panel-toggle"]',
      '[aria-label*="AI" i]',
      'button:has-text("AI")',
      'button[aria-label*="chat" i]',
      '.right-panel-toggle',
      '#ai-panel-toggle'
    ];

    for (const selector of aiPanelSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          this.logDebug('console', `Clicked AI panel toggle: ${selector}`);
          await this.page.waitForTimeout(2000);
          return;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Fallback: try keyboard shortcut (Cmd/Ctrl + K)
    try {
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('k');
      await this.page.keyboard.up('Meta');
      await this.page.waitForTimeout(2000);
      this.logDebug('console', 'Opened AI panel via keyboard shortcut');
    } catch (e) {
      this.logDebug('error', 'Failed to open AI panel', { error: e });
      throw new Error('Could not open AI panel');
    }
  }

  async sendAIMessage(message: string) {
    if (!this.page) throw new Error('Page not initialized');

    console.log(`💬 Sending AI message: "${message}"`);
    this.startTime = Date.now();
    this.logDebug('console', `Starting AI chat request: "${message}"`);

    // Set up network request monitoring BEFORE sending
    let aiChatRequestStarted = false;
    let aiChatRequestCompleted = false;
    let aiChatRequestFailed = false;
    let aiChatRequestDuration = 0;
    let aiChatRequestStartTime = 0;

    // Enhanced network monitoring for this specific request
    const requestHandler = (req: Request) => {
      if (req.url().includes('/api/ai-chat')) {
        aiChatRequestStarted = true;
        aiChatRequestStartTime = Date.now();
        this.logDebug('network', `🚀 AI Chat Request Detected: ${req.method()} ${req.url()}`, {
          headers: req.headers(),
          postData: req.postData()
        });
      }
    };

    const responseHandler = async (res: Response) => {
      if (res.url().includes('/api/ai-chat')) {
        aiChatRequestCompleted = true;
        aiChatRequestDuration = Date.now() - aiChatRequestStartTime;
        this.logDebug('network', `✅ AI Chat Response: ${res.status()} (${aiChatRequestDuration}ms)`, {
          url: res.url(),
          status: res.status(),
          headers: res.headers()
        });

        // Try to get response body
        try {
          const body = await res.text();
          const parsed = JSON.parse(body);
          this.logDebug('network', `📦 AI Chat Response Body`, {
            success: parsed.success,
            hasResponse: !!parsed.response,
            error: parsed.error,
            responsePreview: parsed.response?.substring(0, 200)
          });
        } catch (e) {
          // Body might not be JSON or already consumed
        }
      }
    };

    const failedHandler = (req: Request) => {
      if (req.url().includes('/api/ai-chat')) {
        aiChatRequestFailed = true;
        this.logDebug('error', `❌ AI Chat Request Failed`, {
          url: req.url(),
          failure: req.failure()?.errorText
        });
      }
    };

    this.page.on('request', requestHandler);
    this.page.on('response', responseHandler);
    this.page.on('requestfailed', failedHandler);

    // Find message input
    const inputSelectors = [
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="type" i]',
      'input[type="text"][placeholder*="message" i]',
      '[data-testid="ai-chat-input"]',
      '.chat-input',
      'textarea'
    ];

    let inputElement = null;
    for (const selector of inputSelectors) {
      try {
        inputElement = await this.page.$(selector);
        if (inputElement) {
          this.logDebug('console', `Found input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!inputElement) {
      throw new Error('Could not find AI chat input');
    }

    // Type message
    await inputElement.type(message);
    this.logDebug('console', 'Typed message into input');

    await this.page.waitForTimeout(500);

    // Find and click send button
    const sendSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button[aria-label*="send" i]',
      '[data-testid="send-button"]',
      'button[type="button"]:has(svg)'
    ];

    for (const selector of sendSelectors) {
      try {
        const sendButton = await this.page.$(selector);
        if (sendButton) {
          await sendButton.click();
          this.logDebug('console', `Clicked send button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    // Wait a moment for request to start
    await this.page.waitForTimeout(1000);

    if (!aiChatRequestStarted) {
      this.logDebug('error', '⚠️ AI Chat request was not detected in network!', {
        possibleReasons: [
          'Request blocked by CORS',
          'Request failed before reaching server',
          'Request sent to different URL',
          'Network monitoring issue'
        ]
      });
    }

    // Monitor for response or timeout
    const timeout = 70000; // 70 seconds (slightly longer than 60s timeout)
    const checkInterval = 1000; // Check every second
    let elapsed = 0;
    let responseReceived = false;

    while (elapsed < timeout && !responseReceived) {
      await this.page.waitForTimeout(checkInterval);
      elapsed += checkInterval;

      // Check if request completed
      if (aiChatRequestCompleted) {
        this.logDebug('success', `✅ AI Chat request completed after ${aiChatRequestDuration}ms`);
        responseReceived = true;
        break;
      }

      if (aiChatRequestFailed) {
        this.logDebug('error', `❌ AI Chat request failed after ${elapsed}ms`);
        responseReceived = true;
        break;
      }

      // Check for response in chat UI
      const responseSelectors = [
        '[data-testid="ai-response"]',
        '.ai-message',
        '.assistant-message',
        '[class*="message"][class*="assistant"]'
      ];

      for (const selector of responseSelectors) {
        try {
          const responseElement = await this.page.$(selector);
          if (responseElement) {
            const text = await responseElement.textContent();
            if (text && text.length > 10) {
              this.logDebug('success', `✅ AI Response received in UI after ${elapsed}ms`, {
                responsePreview: text.substring(0, 200)
              });
              responseReceived = true;
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Check for timeout error message
      const errorSelectors = [
        'text="Request timeout"',
        'text="timeout"',
        '[class*="error"]',
        '[class*="timeout"]'
      ];

      for (const selector of errorSelectors) {
        try {
          const errorElement = await this.page.$(selector);
          if (errorElement) {
            const text = await errorElement.textContent();
            if (text && text.toLowerCase().includes('timeout')) {
              this.logDebug('timeout', `❌ Timeout detected in UI after ${elapsed}ms`, {
                errorMessage: text
              });
              responseReceived = true; // Stop monitoring
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Log progress every 5 seconds with detailed status
      if (elapsed % 5000 === 0) {
        this.logDebug('console', `⏳ Still waiting... (${elapsed}ms elapsed)`, {
          requestStarted: aiChatRequestStarted,
          requestCompleted: aiChatRequestCompleted,
          requestFailed: aiChatRequestFailed,
          requestDuration: aiChatRequestDuration || 'N/A'
        });
      }

      // Check if we're past 60 seconds - this is the critical timeout
      if (elapsed >= 60000 && !aiChatRequestCompleted && !aiChatRequestFailed) {
        this.logDebug('timeout', `⚠️ CRITICAL: Request has exceeded 60s timeout!`, {
          elapsed: elapsed,
          requestStarted: aiChatRequestStarted,
          requestDuration: aiChatRequestDuration || 'N/A',
          status: 'Request appears to be hanging on server'
        });
      }
    }

    // Clean up listeners
    this.page.off('request', requestHandler);
    this.page.off('response', responseHandler);
    this.page.off('requestfailed', failedHandler);

    if (!responseReceived && elapsed >= timeout) {
      this.logDebug('timeout', `❌ TIMEOUT: No response after ${elapsed}ms`, {
        timeout: timeout,
        elapsed: elapsed,
        requestStarted: aiChatRequestStarted,
        requestCompleted: aiChatRequestCompleted,
        requestFailed: aiChatRequestFailed,
        requestDuration: aiChatRequestDuration || 'N/A'
      });
    }

    return { 
      responseReceived, 
      elapsed,
      requestStarted: aiChatRequestStarted,
      requestCompleted: aiChatRequestCompleted,
      requestFailed: aiChatRequestFailed,
      requestDuration: aiChatRequestDuration
    };
  }

  async generateReport() {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `ai-chat-timeout-debug-${timestamp}.json`);

    const report = {
      testInfo: {
        stagingUrl: STAGING_URL,
        timestamp: new Date().toISOString(),
        totalDuration: this.startTime ? Date.now() - this.startTime : 0
      },
      debugLogs: this.debugLogs,
      networkRequests: Array.from(this.networkRequests.values()),
      aiChatRequest: this.networkRequests.get(this.aiChatRequestId || '') || null,
      summary: {
        totalLogs: this.debugLogs.length,
        consoleLogs: this.debugLogs.filter(l => l.type === 'console').length,
        networkLogs: this.debugLogs.filter(l => l.type === 'network').length,
        errors: this.debugLogs.filter(l => l.type === 'error').length,
        timeouts: this.debugLogs.filter(l => l.type === 'timeout').length,
        success: this.debugLogs.filter(l => l.type === 'success').length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Debug report saved to: ${reportPath}`);

    // Also generate a human-readable summary
    const summaryPath = path.join(reportDir, `ai-chat-timeout-summary-${timestamp}.txt`);
    let summary = `AI Chat Timeout Debug Report\n`;
    summary += `================================\n\n`;
    summary += `Test URL: ${STAGING_URL}\n`;
    summary += `Timestamp: ${new Date().toISOString()}\n`;
    summary += `Total Duration: ${report.testInfo.totalDuration}ms\n\n`;
    summary += `Summary:\n`;
    summary += `- Total Logs: ${report.summary.totalLogs}\n`;
    summary += `- Console Logs: ${report.summary.consoleLogs}\n`;
    summary += `- Network Requests: ${report.summary.networkLogs}\n`;
    summary += `- Errors: ${report.summary.errors}\n`;
    summary += `- Timeouts: ${report.summary.timeouts}\n`;
    summary += `- Success: ${report.summary.success}\n\n`;

    summary += `\nKey Events:\n`;
    summary += `------------\n`;
    this.debugLogs.forEach(log => {
      if (log.type === 'timeout' || log.type === 'error' || log.type === 'success' || 
          (log.type === 'network' && log.message.includes('AI Chat'))) {
        summary += `[${log.timestamp}] ${log.message}\n`;
        if (log.details) {
          summary += `  ${JSON.stringify(log.details, null, 2)}\n`;
        }
      }
    });

    fs.writeFileSync(summaryPath, summary);
    console.log(`📝 Summary saved to: ${summaryPath}`);

    return { reportPath, summaryPath };
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main test execution
async function runDebugTest() {
  const debugger = new AIChatTimeoutDebugger();

  try {
    await debugger.initialize();
    await debugger.authenticate();
    await debugger.navigateToSpeedrun();
    await debugger.openAIPanel();
    
    // Send a test message
    const result = await debugger.sendAIMessage('What can you tell me about the current record?');
    
    console.log('\n📊 Test Results:');
    console.log(`- Response Received: ${result.responseReceived}`);
    console.log(`- Elapsed Time: ${result.elapsed}ms`);
    console.log(`- Request Started: ${result.requestStarted}`);
    console.log(`- Request Completed: ${result.requestCompleted}`);
    console.log(`- Request Failed: ${result.requestFailed}`);
    console.log(`- Request Duration: ${result.requestDuration || 'N/A'}ms`);
    
    // Analysis
    console.log('\n🔍 Analysis:');
    if (!result.requestStarted) {
      console.log('❌ Request never started - check network/CORS issues');
    } else if (result.requestFailed) {
      console.log('❌ Request failed - check server logs');
    } else if (result.requestDuration && result.requestDuration >= 60000) {
      console.log('❌ Request exceeded 60s timeout - server is hanging');
      console.log('   Check Vercel logs for where it stopped');
    } else if (result.requestCompleted && result.requestDuration) {
      console.log(`✅ Request completed in ${result.requestDuration}ms`);
    } else if (!result.requestCompleted && result.elapsed >= 60000) {
      console.log('❌ Request hanging - no response after 60s');
      console.log('   This suggests the serverless function is timing out');
      console.log('   Check Vercel logs for the last log entry before timeout');
    }

    // Generate report
    await debugger.generateReport();

  } catch (error) {
    console.error('❌ Test failed:', error);
    await debugger.generateReport();
    throw error;
  } finally {
    await debugger.cleanup();
  }
}

// Run the test
if (require.main === module) {
  runDebugTest()
    .then(() => {
      console.log('\n✅ Debug test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Debug test failed:', error);
      process.exit(1);
    });
}

export { runDebugTest, AIChatTimeoutDebugger };

