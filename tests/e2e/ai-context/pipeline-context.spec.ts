/**
 * E2E Tests for Pipeline AI Context Scenarios
 * 
 * Tests Pipeline AI context scenarios including leads, prospects, and companies
 */

import { test, expect } from '@playwright/test';

test.describe('Pipeline AI Context E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo workspace Pipeline
    await page.goto('/demo/pipeline');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });
  });

  test.describe('Leads Context', () => {
    test('AI knows about visible leads in list view', async ({ page }) => {
      // Navigate to leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Wait for data to load
      await page.waitForSelector('[data-testid="lead-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a question about the leads list
      await page.fill('[data-testid="ai-input"]', 'Who are my top 3 leads?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references specific leads
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference specific lead names from the list
      expect(response).toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
      
      // AI should mention it's looking at leads
      expect(response).toMatch(/leads|list|top|best/i);
      
      // AI should provide specific advice about the leads
      expect(response).toMatch(/recommend|suggest|advise|should|consider/i);
    });

    test('AI knows about specific lead in detail view', async ({ page }) => {
      // Navigate to leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first lead to open detail view
      await page.click('[data-testid="lead-row"]:first-child');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });
      
      // Get the lead name and company for verification
      const leadName = await page.textContent('[data-testid="lead-name"]');
      const leadCompany = await page.textContent('[data-testid="lead-company"]');

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the specific lead
      await page.fill('[data-testid="ai-input"]', 'Tell me about this lead and what I should do next');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references the specific lead
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference the specific lead name and company
      if (leadName) {
        expect(response).toContain(leadName);
      }
      if (leadCompany) {
        expect(response).toContain(leadCompany);
      }
      
      // AI should provide specific advice about this lead
      expect(response).toMatch(/recommend|suggest|advise|should|consider|next|action/i);
    });
  });

  test.describe('Prospects Context', () => {
    test('AI knows about visible prospects in list view', async ({ page }) => {
      // Navigate to prospects section
      await page.click('[data-testid="prospects-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Wait for data to load
      await page.waitForSelector('[data-testid="prospect-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a question about the prospects list
      await page.fill('[data-testid="ai-input"]', 'Which prospects should I prioritize this week?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references specific prospects
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference specific prospect names from the list
      expect(response).toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
      
      // AI should mention it's looking at prospects
      expect(response).toMatch(/prospects|prioritize|week|focus/i);
      
      // AI should provide specific advice about the prospects
      expect(response).toMatch(/recommend|suggest|advise|should|consider/i);
    });

    test('AI knows about specific prospect in detail view', async ({ page }) => {
      // Navigate to prospects section
      await page.click('[data-testid="prospects-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first prospect to open detail view
      await page.click('[data-testid="prospect-row"]:first-child');
      await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });
      
      // Get the prospect name and company for verification
      const prospectName = await page.textContent('[data-testid="prospect-name"]');
      const prospectCompany = await page.textContent('[data-testid="prospect-company"]');

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the specific prospect
      await page.fill('[data-testid="ai-input"]', 'What\'s the best approach for this prospect?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references the specific prospect
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference the specific prospect name and company
      if (prospectName) {
        expect(response).toContain(prospectName);
      }
      if (prospectCompany) {
        expect(response).toContain(prospectCompany);
      }
      
      // AI should provide specific approach recommendations
      expect(response).toMatch(/approach|recommend|suggest|strategy|personalize|tailor/i);
    });
  });

  test.describe('Companies Context', () => {
    test('AI can compare companies to ICP', async ({ page }) => {
      // Navigate to companies section
      await page.click('[data-testid="companies-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Wait for data to load
      await page.waitForSelector('[data-testid="company-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI to compare companies to ICP
      await page.fill('[data-testid="ai-input"]', 'Which companies best match our ideal customer profile?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references companies and ICP
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference specific company names
      expect(response).toMatch(/Acme|Tech|Startup|Corp|Inc|LLC/i);
      
      // AI should mention ICP-related terms
      expect(response).toMatch(/ideal|customer|profile|ICP|match|fit|criteria/i);
      
      // AI should provide specific recommendations
      expect(response).toMatch(/recommend|suggest|advise|should|consider|best|top/i);
    });

    test('AI knows about specific company in detail view', async ({ page }) => {
      // Navigate to companies section
      await page.click('[data-testid="companies-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first company to open detail view
      await page.click('[data-testid="company-row"]:first-child');
      await page.waitForSelector('[data-testid="company-detail"]', { timeout: 5000 });
      
      // Get the company name and industry for verification
      const companyName = await page.textContent('[data-testid="company-name"]');
      const companyIndustry = await page.textContent('[data-testid="company-industry"]');

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the specific company
      await page.fill('[data-testid="ai-input"]', 'Tell me about this company and how it fits our target market');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references the specific company
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference the specific company name
      if (companyName) {
        expect(response).toContain(companyName);
      }
      
      // AI should reference the company's industry if available
      if (companyIndustry) {
        expect(response).toContain(companyIndustry);
      }
      
      // AI should provide market fit analysis
      expect(response).toMatch(/market|fit|target|ideal|customer|profile|ICP/i);
    });
  });

  test.describe('Navigation Context', () => {
    test('AI context updates when navigating between records', async ({ page }) => {
      // Navigate to leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first lead
      await page.click('[data-testid="lead-row"]:first-child');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });
      
      const firstLeadName = await page.textContent('[data-testid="lead-name"]');

      // Open AI panel and ask about first lead
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });
      
      await page.fill('[data-testid="ai-input"]', 'What should I do with this lead?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const firstResponse = await page.textContent('[data-testid="ai-response"]');
      if (firstLeadName) {
        expect(firstResponse).toContain(firstLeadName);
      }

      // Navigate to next lead
      await page.click('[data-testid="navigate-next"]');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });
      
      const secondLeadName = await page.textContent('[data-testid="lead-name"]');

      // Ask AI about the new lead
      await page.fill('[data-testid="ai-input"]', 'What about this lead?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const secondResponse = await page.textContent('[data-testid="ai-response"]');
      
      // AI should now reference the second lead, not the first
      if (secondLeadName) {
        expect(secondResponse).toContain(secondLeadName);
      }
      if (firstLeadName && secondLeadName && firstLeadName !== secondLeadName) {
        expect(secondResponse).not.toContain(firstLeadName);
      }
    });

    test('AI context updates when switching between sections', async ({ page }) => {
      // Start in leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });

      // Open AI panel and ask about leads
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });
      
      await page.fill('[data-testid="ai-input"]', 'What should I focus on in my leads?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const leadsResponse = await page.textContent('[data-testid="ai-response"]');
      expect(leadsResponse).toMatch(/leads|lead/i);

      // Switch to prospects section
      await page.click('[data-testid="prospects-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });

      // Ask AI about prospects
      await page.fill('[data-testid="ai-input"]', 'What about my prospects?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const prospectsResponse = await page.textContent('[data-testid="ai-response"]');
      expect(prospectsResponse).toMatch(/prospects|prospect/i);
    });
  });

  test.describe('Filtering and Search Context', () => {
    test('AI knows about applied filters', async ({ page }) => {
      // Navigate to leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });

      // Apply a filter
      await page.click('[data-testid="filter-button"]');
      await page.selectOption('[data-testid="status-filter"]', 'active');
      await page.click('[data-testid="apply-filters"]');

      // Wait for filtered results
      await page.waitForSelector('[data-testid="lead-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the filtered results
      await page.fill('[data-testid="ai-input"]', 'What do you see in my current view?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response acknowledges the filter
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should mention active leads or the filter
      expect(response).toMatch(/active|filter|current|view|showing/i);
    });

    test('AI knows about search results', async ({ page }) => {
      // Navigate to leads section
      await page.click('[data-testid="leads-tab"]');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });

      // Perform a search
      await page.fill('[data-testid="search-input"]', 'John');
      await page.press('[data-testid="search-input"]', 'Enter');

      // Wait for search results
      await page.waitForSelector('[data-testid="lead-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the search results
      await page.fill('[data-testid="ai-input"]', 'What do you see in my search results?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response acknowledges the search
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should mention John or the search
      expect(response).toMatch(/John|search|results|found/i);
    });
  });

  test.describe('Cross-Section Analysis', () => {
    test('AI can analyze across different sections', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI to analyze across sections
      await page.fill('[data-testid="ai-input"]', 'Give me an overview of my entire pipeline');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides comprehensive analysis
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should mention multiple sections
      expect(response).toMatch(/pipeline|leads|prospects|companies|overview|summary/i);
      
      // AI should provide actionable insights
      expect(response).toMatch(/recommend|suggest|advise|should|consider|focus|priority/i);
    });

    test('AI can compare records across sections', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI to compare across sections
      await page.fill('[data-testid="ai-input"]', 'How do my leads compare to my prospects?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides comparison
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should mention both leads and prospects
      expect(response).toMatch(/leads|prospects|compare|comparison|difference|similar/i);
      
      // AI should provide insights about the comparison
      expect(response).toMatch(/recommend|suggest|advise|should|consider|insight/i);
    });
  });
});
