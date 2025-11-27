/**
 * AI Panel Data Access Verification E2E Tests
 * 
 * Comprehensive E2E tests to verify the AI panel can access all record types
 * and generates personalized responses that reference actual database fields.
 * 
 * This test suite covers:
 * - Speedrun prospects
 * - Person records
 * - Company records
 * - Lead records
 * - Prospect records
 * - Opportunity records
 * - List view context
 * 
 * @see docs/AI_DATA_ACCESS_SUMMARY.md for data access documentation
 */

import { test, expect, Page } from '@playwright/test';

// Forbidden phrases that indicate AI lacks context - the AI should NEVER use these
const FORBIDDEN_PHRASES = [
  "I don't have enough context",
  "I need more information",
  "I don't have visibility into",
  "I don't have access to",
  "I can't see",
  "I'm not able to see",
  "without knowing",
  "without more details",
  "could you provide more",
  "I would need to know",
  "I don't have specific",
  "limited context",
  "I'm unable to access",
  "I cannot access"
];

// Helper to check if AI response contains forbidden phrases
function containsForbiddenPhrase(response: string): string | null {
  const lowerResponse = response.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lowerResponse.includes(phrase.toLowerCase())) {
      return phrase;
    }
  }
  return null;
}

// Helper to interact with AI panel
async function sendAIQuery(page: Page, query: string): Promise<string> {
  // Wait for AI input to be ready
  await page.waitForSelector('[data-testid="ai-input"]', { timeout: 10000 });
  
  // Clear any existing text and type the query
  await page.fill('[data-testid="ai-input"]', query);
  await page.press('[data-testid="ai-input"]', 'Enter');
  
  // Wait for AI response with extended timeout
  await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });
  
  // Wait a bit for streaming to complete
  await page.waitForTimeout(2000);
  
  // Get the response text
  const response = await page.textContent('[data-testid="ai-response"]');
  return response || '';
}

// Helper to open AI panel if not already open
async function ensureAIPanelOpen(page: Page): Promise<void> {
  const aiPanel = await page.$('[data-testid="ai-panel"]');
  if (!aiPanel || !(await aiPanel.isVisible())) {
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-panel"]', { timeout: 5000 });
  }
}

test.describe('AI Panel Data Access - Person Records', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pipeline people section
    await page.goto('/demo/pipeline/people');
    await page.waitForLoadState('networkidle');
    
    // Wait for people list to load
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
  });

  test('AI can access person basic data (name, title, company)', async ({ page }) => {
    // Click on first person to open detail view
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get the person's displayed information
    const personName = await page.textContent('[data-testid="record-name"]');
    const personCompany = await page.textContent('[data-testid="record-company"]');
    
    // Open AI panel and ask about the person
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Tell me about this person');
    
    // Verify AI uses the person's name
    if (personName) {
      expect(response).toContain(personName);
    }
    
    // Verify AI uses the company name
    if (personCompany) {
      expect(response).toContain(personCompany);
    }
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can access person intelligence data', async ({ page }) => {
    // Click on first person to open detail view
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Open AI panel and ask about intelligence
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'What is their influence level and how should I engage with them?');
    
    // Verify AI provides engagement advice (uses intelligence data)
    expect(response).toMatch(/influence|engage|approach|strategy|decision|power/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI writes personalized cold email with record data', async ({ page }) => {
    // Click on first person
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get the person's displayed information
    const personName = await page.textContent('[data-testid="record-name"]');
    const personCompany = await page.textContent('[data-testid="record-company"]');
    
    // Open AI panel and request a cold email
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Write me a cold email to this person');
    
    // Verify email is personalized with name
    if (personName) {
      expect(response).toContain(personName.split(' ')[0]); // First name at minimum
    }
    
    // Verify email references the company
    if (personCompany) {
      expect(response).toContain(personCompany);
    }
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Data Access - Company Records', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pipeline companies section
    await page.goto('/demo/pipeline/companies');
    await page.waitForLoadState('networkidle');
    
    // Wait for companies list to load
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
  });

  test('AI can access company basic data (name, industry, size)', async ({ page }) => {
    // Click on first company to open detail view
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get the company's displayed information
    const companyName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel and ask about the company
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Tell me about this company');
    
    // Verify AI uses the company name
    if (companyName) {
      expect(response).toContain(companyName);
    }
    
    // Verify AI mentions industry or business context
    expect(response).toMatch(/industry|business|sector|operates|company|organization/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can access company intelligence data', async ({ page }) => {
    // Click on first company
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Open AI panel and ask about business challenges
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'What are their business challenges and priorities?');
    
    // Verify AI provides business context
    expect(response).toMatch(/challenge|priority|focus|goal|objective|strategy/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can recommend who to target at company', async ({ page }) => {
    // Click on first company
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get the company name
    const companyName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Who should I target at this company?');
    
    // Verify AI references the company
    if (companyName) {
      expect(response).toContain(companyName);
    }
    
    // Verify AI provides targeting advice
    expect(response).toMatch(/target|contact|reach|decision|maker|executive|role/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Data Access - Speedrun Records', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Speedrun
    await page.goto('/demo/speedrun');
    await page.waitForLoadState('networkidle');
    
    // Wait for speedrun content to load
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 15000 });
  });

  test('AI knows about speedrun prospect in detail view', async ({ page }) => {
    // Wait for prospect list
    await page.waitForSelector('[data-testid="prospect-item"]', { timeout: 10000 });
    
    // Click on first prospect
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 10000 });
    
    // Get prospect info
    const prospectName = await page.textContent('[data-testid="prospect-name"]');
    const prospectCompany = await page.textContent('[data-testid="prospect-company"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Tell me about this prospect');
    
    // Verify AI uses the prospect's name
    if (prospectName) {
      expect(response).toContain(prospectName);
    }
    
    // Verify AI uses the company name
    if (prospectCompany) {
      expect(response).toContain(prospectCompany);
    }
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI provides personalized outreach advice for speedrun prospect', async ({ page }) => {
    // Wait for prospect list
    await page.waitForSelector('[data-testid="prospect-item"]', { timeout: 10000 });
    
    // Click on first prospect
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 10000 });
    
    // Get prospect info
    const prospectName = await page.textContent('[data-testid="prospect-name"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'How should I approach this prospect?');
    
    // Verify AI uses the prospect's name
    if (prospectName) {
      expect(response).toContain(prospectName);
    }
    
    // Verify AI provides approach advice
    expect(response).toMatch(/approach|strategy|engage|outreach|contact|reach/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Data Access - List View Context', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pipeline leads section
    await page.goto('/demo/pipeline/leads');
    await page.waitForLoadState('networkidle');
    
    // Wait for list to load
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
  });

  test('AI knows about list view records and count', async ({ page }) => {
    // Open AI panel from list view (no record selected)
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'How many records am I viewing?');
    
    // Verify AI acknowledges the list context
    expect(response).toMatch(/\d+|records|leads|viewing|list|page/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can summarize visible records in list', async ({ page }) => {
    // Open AI panel from list view
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Summarize the current list of leads');
    
    // Verify AI provides a summary
    expect(response).toMatch(/leads|records|list|showing|viewing|total/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can prioritize contacts from list', async ({ page }) => {
    // Open AI panel from list view
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Who should I contact first from this list?');
    
    // Verify AI provides prioritization advice
    expect(response).toMatch(/first|priority|recommend|suggest|start|contact/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Data Access - Lead Records', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pipeline leads section
    await page.goto('/demo/pipeline/leads');
    await page.waitForLoadState('networkidle');
    
    // Wait for leads list to load
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
  });

  test('AI can access lead data and suggest next actions', async ({ page }) => {
    // Click on first lead
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get lead info
    const leadName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'What should my next action be with this lead?');
    
    // Verify AI uses the lead's name
    if (leadName) {
      expect(response).toContain(leadName);
    }
    
    // Verify AI provides action advice
    expect(response).toMatch(/action|next|follow|up|contact|call|email|recommend/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Data Access - Opportunity Records', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pipeline opportunities section
    await page.goto('/demo/pipeline/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Wait for opportunities list to load
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
  });

  test('AI can access opportunity data (stage, value, close date)', async ({ page }) => {
    // Click on first opportunity
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Get opportunity info
    const oppName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'Tell me about this opportunity and its status');
    
    // Verify AI uses the opportunity name
    if (oppName) {
      expect(response).toContain(oppName);
    }
    
    // Verify AI references opportunity-specific data
    expect(response).toMatch(/stage|value|close|deal|opportunity|pipeline/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });

  test('AI can advise on moving opportunity forward', async ({ page }) => {
    // Click on first opportunity
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const response = await sendAIQuery(page, 'How can I move this deal forward?');
    
    // Verify AI provides deal advancement advice
    expect(response).toMatch(/move|forward|advance|next|stage|action|close/i);
    
    // Verify no forbidden phrases
    const forbidden = containsForbiddenPhrase(response);
    expect(forbidden).toBeNull();
  });
});

test.describe('AI Panel Context Updates', () => {
  test('AI context updates when navigating between records', async ({ page }) => {
    // Navigate to pipeline people
    await page.goto('/demo/pipeline/people');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
    
    // Click on first record
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    const firstName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel and ask about first record
    await ensureAIPanelOpen(page);
    const firstResponse = await sendAIQuery(page, 'Tell me about this person');
    
    if (firstName) {
      expect(firstResponse).toContain(firstName);
    }
    
    // Navigate back to list
    await page.click('[data-testid="back-to-list"]');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 10000 });
    
    // Click on second record
    const recordItems = await page.$$('[data-testid="record-item"]');
    if (recordItems.length > 1) {
      await recordItems[1].click();
      await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
      
      const secondName = await page.textContent('[data-testid="record-name"]');
      
      // Ask AI about this record
      const secondResponse = await sendAIQuery(page, 'Tell me about this person');
      
      // Verify AI now references the second record
      if (secondName) {
        expect(secondResponse).toContain(secondName);
      }
      
      // If names are different, verify context actually changed
      if (firstName && secondName && firstName !== secondName) {
        expect(secondResponse).not.toContain(firstName);
      }
    }
  });

  test('AI context updates when switching between sections', async ({ page }) => {
    // Start in people section
    await page.goto('/demo/pipeline/people');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
    
    // Click on a person
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    const personName = await page.textContent('[data-testid="record-name"]');
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    const personResponse = await sendAIQuery(page, 'Tell me about this record');
    
    if (personName) {
      expect(personResponse).toContain(personName);
    }
    
    // Navigate to companies section
    await page.goto('/demo/pipeline/companies');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
    
    // Click on a company
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    const companyName = await page.textContent('[data-testid="record-name"]');
    
    // Ask AI about this company
    const companyResponse = await sendAIQuery(page, 'Tell me about this record');
    
    // Verify AI now knows about the company
    if (companyName) {
      expect(companyResponse).toContain(companyName);
    }
    
    // Verify context changed from person to company
    if (personName && companyName && personName !== companyName) {
      expect(companyResponse).not.toContain(personName);
    }
  });
});

test.describe('AI Panel - No Missing Context Warnings', () => {
  test('AI never says "I don\'t have access" when viewing a record', async ({ page }) => {
    // Navigate to pipeline people
    await page.goto('/demo/pipeline/people');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
    
    // Click on first record
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    
    // Try multiple queries that might trigger "missing context" responses
    const queries = [
      'Tell me about this person',
      'What do you know about them?',
      'Give me their contact information',
      'What company do they work for?',
      'What is their role?'
    ];
    
    for (const query of queries) {
      const response = await sendAIQuery(page, query);
      
      // Check for forbidden phrases
      const forbidden = containsForbiddenPhrase(response);
      expect(forbidden, `Query "${query}" triggered forbidden phrase: "${forbidden}"`).toBeNull();
    }
  });

  test('AI never says "I need more information" when viewing a company', async ({ page }) => {
    // Navigate to pipeline companies
    await page.goto('/demo/pipeline/companies');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="record-list"]', { timeout: 15000 });
    
    // Click on first record
    await page.click('[data-testid="record-item"]:first-child');
    await page.waitForSelector('[data-testid="record-detail"]', { timeout: 10000 });
    
    // Open AI panel
    await ensureAIPanelOpen(page);
    
    // Try queries that might trigger "missing context" responses
    const queries = [
      'Tell me about this company',
      'What industry are they in?',
      'How big is this company?',
      'What challenges do they face?'
    ];
    
    for (const query of queries) {
      const response = await sendAIQuery(page, query);
      
      // Check for forbidden phrases
      const forbidden = containsForbiddenPhrase(response);
      expect(forbidden, `Query "${query}" triggered forbidden phrase: "${forbidden}"`).toBeNull();
    }
  });
});

