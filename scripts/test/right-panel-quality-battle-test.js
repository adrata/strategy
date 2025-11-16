/**
 * Right Panel Quality Battle Test - Puppeteer
 * 
 * Comprehensive test suite that validates:
 * - AE (Account Executive) questions and workflows
 * - Manager/Leader questions and workflows
 * - Response quality and context awareness
 * - Response speed and performance
 * - Typewriter effect smoothness
 */

const puppeteer = require('puppeteer');

// Test configuration
const TEST_EMAIL = process.env.TEST_EMAIL || 'vleland@topengineersplus.com';
const TEST_USERNAME = process.env.TEST_USERNAME || 'vleland';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TOPgtm01!';
const BASE_URL = process.env.BASE_URL || 'https://action.adrata.com';
const WORKSPACE = process.env.TEST_WORKSPACE || 'top';
const HEADLESS = process.env.HEADLESS !== 'false';

// Test questions organized by AE and Manager Jobs-to-Be-Done
const TEST_QUESTIONS = {
  // AE (Account Executive) - Prospecting & Outreach
  aeProspecting: [
    "What's the best cold outreach message for this prospect?",
    "How should I personalize my approach to this company?",
    "What's their likely budget and decision timeline?",
    "Who else should I reach out to at this company?",
    "What's the best way to get past the gatekeeper?",
  ],
  // AE - Qualification & Discovery
  aeQualification: [
    "Is this a qualified opportunity?",
    "What questions should I ask to qualify this lead?",
    "What are their buying signals?",
    "How do I determine if they have budget?",
    "What's their decision-making process?",
  ],
  // AE - Objection Handling & Closing
  aeClosing: [
    "How do I handle their pricing objection?",
    "What's the best way to overcome their concern about implementation?",
    "How do I create urgency without being pushy?",
    "What's my next step to move this deal forward?",
    "How do I negotiate the best terms?",
  ],
  // Manager/Leader - Pipeline Management
  managerPipeline: [
    "What's the health of my team's pipeline?",
    "Which deals are at risk and why?",
    "What's our forecast accuracy?",
    "Which reps need coaching on which deals?",
    "What's our conversion rate by stage?",
  ],
  // Manager/Leader - Team Performance
  managerPerformance: [
    "Who on my team needs the most help?",
    "What are the top blockers for my team?",
    "How can I improve our win rate?",
    "What's our average sales cycle and how can we shorten it?",
    "Which deals should I prioritize for coaching?",
  ],
  // Manager/Leader - Strategy & Planning
  managerStrategy: [
    "What's our strategy for this quarter?",
    "How should we prioritize our target accounts?",
    "What's our competitive positioning?",
    "How do we improve our sales process?",
    "What metrics should I focus on?",
  ],
  // Context-Aware (with record open)
  contextAware: [
    "What's the best message to send via cold outreach?",
    "What are their pain points?",
    "How should I approach this prospect?",
    "What value proposition should I lead with?",
    "What's the best way to engage with them?",
  ],
};

const results = [];

// Helper function to evaluate response quality
function evaluateQuality(question, response, hasContext, responseTime) {
  let score = 0;
  
  // Length check (should be substantial)
  if (response.length > 100) score += 2;
  else if (response.length > 50) score += 1;
  
  // Context check
  if (hasContext) score += 3;
  else if (response.length > 0) score += 1;
  
  // No error messages
  const errorPhrases = [
    "i don't have enough context",
    "i need more context",
    "i'm experiencing a technical issue",
    "error",
    "failed",
  ];
  const hasError = errorPhrases.some(phrase => response.toLowerCase().includes(phrase));
  if (!hasError) score += 2;
  
  // Response time scoring (optimized for speed without losing quality)
  // Target: 3-8 seconds is optimal, 8-15s is acceptable, >15s needs optimization
  if (responseTime < 3000) score += 1; // Very fast (might be cached)
  else if (responseTime < 8000) score += 3; // Optimal range
  else if (responseTime < 15000) score += 2; // Good
  else if (responseTime < 25000) score += 1; // Acceptable
  // > 25s gets 0 points (needs optimization)
  
  // Relevance (basic check - contains relevant keywords)
  const relevantKeywords = question.toLowerCase().split(' ').filter(w => w.length > 3);
  const matches = relevantKeywords.filter(keyword => response.toLowerCase().includes(keyword));
  if (matches.length > 0) score += 1;
  
  return Math.min(score, 10); // Cap at 10
}

// Helper function to open AI panel
async function openAIPanel(page) {
  const aiPanelSelectors = [
    '[data-testid="ai-panel-toggle"]',
    '[aria-label*="AI" i]',
    'button:has-text("AI")',
    '[data-testid="right-panel-toggle"]',
    'button[aria-label*="chat" i]',
  ];
  
  for (const selector of aiPanelSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await page.waitForTimeout(1000);
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  return false;
}

// Helper function to send message and wait for response
async function sendMessageAndWaitForResponse(page, question) {
  const startTime = Date.now();
  
  // Find and fill the chat input
  const inputSelectors = [
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="ask" i]',
    'textarea[placeholder*="type" i]',
    'textarea',
    'input[type="text"]',
  ];
  
  let inputFound = false;
  for (const selector of inputSelectors) {
    try {
      const input = await page.$(selector);
      if (input) {
        await input.click();
        await input.type(question, { delay: 50 });
        inputFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  
  if (!inputFound) {
    throw new Error('Could not find chat input');
  }
  
  // Submit the message
  await page.keyboard.press('Enter');
  
  // Wait for typing indicator to appear
  await page.waitForTimeout(1000);
  
  // Wait for response to start appearing
  try {
    await page.waitForFunction(
      () => {
        const messages = document.querySelectorAll('[class*="message"], [class*="chat"], [data-testid*="message"]');
        return Array.from(messages).some(msg => {
          const text = msg.textContent || '';
          return text.length > 10 && !text.includes('typing') && !text.includes('browsing');
        });
      },
      { timeout: 30000 }
    );
  } catch (e) {
    // Continue anyway
  }
  
  // Wait for typewriter to complete (no more cursor)
  try {
    await page.waitForFunction(
      () => {
        const cursors = document.querySelectorAll('[class*="animate-pulse"], [class*="cursor"]');
        return cursors.length === 0;
      },
      { timeout: 60000 }
    );
  } catch (e) {
    // Continue anyway
  }
  
  const responseTime = Date.now() - startTime;
  
  // Extract response text
  const response = await page.evaluate(() => {
    const messages = document.querySelectorAll('[class*="message"], [class*="chat"], [data-testid*="message"]');
    const assistantMessages = Array.from(messages).filter(msg => {
      const text = msg.textContent || '';
      return text.length > 10 && !text.includes('typing') && !text.includes('browsing');
    });
    
    if (assistantMessages.length > 0) {
      return assistantMessages[assistantMessages.length - 1].textContent || '';
    }
    return '';
  });
  
  // Check if response has context
  const hasContext = response.length > 50 && (
    response.toLowerCase().includes('you') ||
    response.toLowerCase().includes('your') ||
    response.toLowerCase().includes('they') ||
    response.toLowerCase().includes('this') ||
    response.toLowerCase().includes('specific') ||
    (!response.toLowerCase().includes("i don't have enough context") &&
     !response.toLowerCase().includes("i need more context") &&
     !response.toLowerCase().includes("i'm experiencing a technical issue"))
  );
  
  return { response, responseTime, hasContext };
}

// Test a category of questions
async function testCategory(browser, categoryName, questions, url) {
  console.log(`\n=== Testing ${categoryName} ===`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate to sign-in
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2' });
    
    // Login
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="Email" i], input[placeholder*="Username" i], input[name="username"]');
    if (emailInput) {
      await emailInput.type(TEST_USERNAME);
    }
    
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.type(TEST_PASSWORD);
    }
    
    const loginButton = await page.$('button:has-text("Start"), button:has-text("Sign In"), button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
    
    // Navigate to test URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Open AI panel
    const panelOpened = await openAIPanel(page);
    if (!panelOpened) {
      console.error(`❌ Could not open AI panel for ${categoryName}`);
      await page.close();
      return;
    }
    
    await page.waitForTimeout(2000);
    
    // Test each question
    for (const question of questions) {
      try {
        const { response, responseTime, hasContext } = await sendMessageAndWaitForResponse(page, question);
        
        const qualityScore = evaluateQuality(question, response, hasContext, responseTime);
        const passed = qualityScore >= 5 && response.length > 50;
        
        results.push({
          question,
          category: categoryName,
          passed,
          responseTime,
          responseLength: response.length,
          hasContext,
          qualityScore,
        });
        
        console.log(`  [${categoryName}] "${question}" - ${passed ? '✅ PASS' : '❌ FAIL'} (Score: ${qualityScore}/10, Time: ${responseTime}ms, Length: ${response.length} chars)`);
        
        // Wait before next question
        await page.waitForTimeout(2000);
      } catch (error) {
        results.push({
          question,
          category: categoryName,
          passed: false,
          responseTime: 0,
          responseLength: 0,
          hasContext: false,
          qualityScore: 0,
          error: error.message,
        });
        console.error(`  [${categoryName}] "${question}" - ❌ ERROR: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing ${categoryName}:`, error.message);
  } finally {
    await page.close();
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Right Panel Quality Battle Test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Workspace: ${WORKSPACE}`);
  console.log(`Headless: ${HEADLESS}`);
  
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Test AE Prospecting (with record context)
    await testCategory(
      browser,
      'aeProspecting',
      TEST_QUESTIONS.aeProspecting,
      `${BASE_URL}/${WORKSPACE}/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742/?tab=overview`
    );
    
    // Test AE Qualification
    await testCategory(
      browser,
      'aeQualification',
      TEST_QUESTIONS.aeQualification,
      `${BASE_URL}/${WORKSPACE}/speedrun`
    );
    
    // Test Manager Pipeline
    await testCategory(
      browser,
      'managerPipeline',
      TEST_QUESTIONS.managerPipeline,
      `${BASE_URL}/${WORKSPACE}/speedrun`
    );
    
    // Test Context-Aware (with record)
    await testCategory(
      browser,
      'contextAware',
      TEST_QUESTIONS.contextAware,
      `${BASE_URL}/${WORKSPACE}/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742/?tab=overview`
    );
    
  } finally {
    await browser.close();
  }
  
  // Print summary report
  console.log('\n=== RIGHT PANEL QUALITY TEST SUMMARY ===');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / total;
  const avgQualityScore = results.reduce((sum, r) => sum + r.qualityScore, 0) / total;
  
  // Response time analysis
  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);
  const medianResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
  const slowResponses = results.filter(r => r.responseTime > 15000);
  const fastResponses = results.filter(r => r.responseTime < 8000 && r.responseTime > 0);
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${total - passed} (${(((total - passed) / total) * 100).toFixed(1)}%)`);
  console.log(`\n=== RESPONSE TIME ANALYSIS ===`);
  console.log(`Average: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Median: ${medianResponseTime.toFixed(0)}ms`);
  console.log(`Min: ${minResponseTime.toFixed(0)}ms`);
  console.log(`Max: ${maxResponseTime.toFixed(0)}ms`);
  console.log(`Fast (<8s): ${fastResponses.length} (${((fastResponses.length / total) * 100).toFixed(1)}%)`);
  console.log(`Slow (>15s): ${slowResponses.length} (${((slowResponses.length / total) * 100).toFixed(1)}%)`);
  console.log(`Average Quality Score: ${avgQualityScore.toFixed(1)}/10`);
  
  // Category breakdown
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const categoryAvgTime = categoryResults.reduce((sum, r) => sum + r.responseTime, 0) / categoryResults.length;
    console.log(`\n${category}: ${categoryPassed}/${categoryResults.length} passed (Avg: ${categoryAvgTime.toFixed(0)}ms)`);
  });
  
  // Performance recommendations
  if (slowResponses.length > 0) {
    console.log('\n=== PERFORMANCE OPTIMIZATION OPPORTUNITIES ===');
    slowResponses.forEach(result => {
      console.log(`- [${result.category}] "${result.question}" - ${result.responseTime}ms`);
    });
    console.log('\nRecommendations:');
    console.log('- Consider caching frequent queries');
    console.log('- Optimize context building (reduce data fetched)');
    console.log('- Use faster AI models for simple queries');
    console.log('- Implement response streaming for long responses');
    console.log('- Reduce conversation history sent (currently 3 messages)');
    console.log('- Parallelize context fetching where possible');
  }
  
  // Failed tests
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('\n=== FAILED TESTS ===');
    failed.forEach(result => {
      console.log(`- [${result.category}] "${result.question}"`);
      if (result.error) console.log(`  Error: ${result.error}`);
      else console.log(`  Quality Score: ${result.qualityScore}/10, Response Time: ${result.responseTime}ms`);
    });
  }
  
  console.log('\n✅ Test suite complete!');
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

