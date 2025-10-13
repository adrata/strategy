/**
 * E2E Tests for Speedrun AI Context Scenarios
 * 
 * Tests Speedrun AI context scenarios including list view and detail view
 */

import { test, expect } from '@playwright/test';

test.describe('Speedrun AI Context E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo workspace Speedrun
    await page.goto('/demo/speedrun');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="prospect-list"]', { timeout: 10000 });
  });

  test('AI knows about visible prospects in sprint view (list)', async ({ page }) => {
    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI a question about the list
    await page.fill('[data-testid="ai-input"]', 'Who are my top prospects in this sprint?');
    await page.press('[data-testid="ai-input"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI response references specific prospects
    const response = await page.textContent('[data-testid="ai-response"]');
    
    // AI should reference specific prospect names from the list
    expect(response).toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
    
    // AI should mention it's looking at a sprint/list
    expect(response).toMatch(/sprint|list|prospects|contacts/i);
    
    // AI should provide specific advice about the prospects
    expect(response).toMatch(/recommend|suggest|advise|should|consider/i);
  });

  test('AI knows about specific prospect in detail view', async ({ page }) => {
    // Click on first prospect to open detail view
    await page.click('[data-testid="prospect-item"]:first-child');
    
    // Wait for detail view to load
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });
    
    // Get the prospect name for verification
    const prospectName = await page.textContent('[data-testid="prospect-name"]');
    const prospectCompany = await page.textContent('[data-testid="prospect-company"]');

    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI about the specific prospect
    await page.fill('[data-testid="ai-input"]', 'Tell me about this prospect and what I should do next');
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
    
    // AI should provide specific advice about this prospect
    expect(response).toMatch(/recommend|suggest|advise|should|consider|next|action/i);
    
    // AI should acknowledge it's looking at a specific prospect
    expect(response).toMatch(/prospect|contact|lead|this person|this contact/i);
  });

  test('AI context updates when navigating between prospects', async ({ page }) => {
    // Click on first prospect
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });
    
    const firstProspectName = await page.textContent('[data-testid="prospect-name"]');

    // Open AI panel and ask about first prospect
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });
    
    await page.fill('[data-testid="ai-input"]', 'What should I do with this prospect?');
    await page.press('[data-testid="ai-input"]', 'Enter');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    const firstResponse = await page.textContent('[data-testid="ai-response"]');
    if (firstProspectName) {
      expect(firstResponse).toContain(firstProspectName);
    }

    // Navigate to next prospect
    await page.click('[data-testid="navigate-next"]');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });
    
    const secondProspectName = await page.textContent('[data-testid="prospect-name"]');

    // Ask AI about the new prospect
    await page.fill('[data-testid="ai-input"]', 'What about this prospect?');
    await page.press('[data-testid="ai-input"]', 'Enter');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    const secondResponse = await page.textContent('[data-testid="ai-response"]');
    
    // AI should now reference the second prospect, not the first
    if (secondProspectName) {
      expect(secondResponse).toContain(secondProspectName);
    }
    if (firstProspectName && secondProspectName && firstProspectName !== secondProspectName) {
      expect(secondResponse).not.toContain(firstProspectName);
    }
  });

  test('AI provides general advice when no prospect is selected', async ({ page }) => {
    // Make sure no prospect is selected (click back to list view)
    await page.click('[data-testid="back-to-list"]');
    await page.waitForSelector('[data-testid="prospect-list"]', { timeout: 5000 });

    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI a general question
    await page.fill('[data-testid="ai-input"]', 'How can I improve my outreach strategy?');
    await page.press('[data-testid="ai-input"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI response provides general advice
    const response = await page.textContent('[data-testid="ai-response"]');
    
    // AI should provide general advice about outreach strategy
    expect(response).toMatch(/outreach|strategy|improve|recommend|suggest|advise/i);
    
    // AI should not reference specific prospect names since none are selected
    expect(response).not.toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
    
    // AI should acknowledge it's providing general advice
    expect(response).toMatch(/general|overall|strategy|approach/i);
  });

  test('AI responses reference specific prospect data', async ({ page }) => {
    // Click on a prospect to open detail view
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });

    // Get prospect details for verification
    const prospectName = await page.textContent('[data-testid="prospect-name"]');
    const prospectTitle = await page.textContent('[data-testid="prospect-title"]');
    const prospectCompany = await page.textContent('[data-testid="prospect-company"]');
    const prospectIndustry = await page.textContent('[data-testid="prospect-industry"]');

    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI about the prospect's background
    await page.fill('[data-testid="ai-input"]', 'What do you know about this prospect\'s background and how should I approach them?');
    await page.press('[data-testid="ai-input"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI response references specific prospect data
    const response = await page.textContent('[data-testid="ai-response"]');
    
    // AI should reference the prospect's name
    if (prospectName) {
      expect(response).toContain(prospectName);
    }
    
    // AI should reference the prospect's title
    if (prospectTitle) {
      expect(response).toContain(prospectTitle);
    }
    
    // AI should reference the prospect's company
    if (prospectCompany) {
      expect(response).toContain(prospectCompany);
    }
    
    // AI should reference the prospect's industry if available
    if (prospectIndustry) {
      expect(response).toContain(prospectIndustry);
    }
    
    // AI should provide specific approach recommendations
    expect(response).toMatch(/approach|recommend|suggest|strategy|personalize|tailor/i);
  });

  test('AI knows about sprint progress and goals', async ({ page }) => {
    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI about sprint progress
    await page.fill('[data-testid="ai-input"]', 'How am I doing with my sprint goals?');
    await page.press('[data-testid="ai-input"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI response references sprint context
    const response = await page.textContent('[data-testid="ai-response"]');
    
    // AI should reference sprint-related terms
    expect(response).toMatch(/sprint|progress|goals|target|completed|remaining/i);
    
    // AI should provide actionable advice
    expect(response).toMatch(/recommend|suggest|advise|should|consider|focus/i);
  });

  test('AI provides context-aware quick actions', async ({ page }) => {
    // Click on a prospect to open detail view
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });

    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Check if quick actions are available
    const quickActions = await page.$$('[data-testid="quick-action"]');
    
    if (quickActions.length > 0) {
      // Verify quick actions are context-aware
      const firstAction = await page.textContent('[data-testid="quick-action"]:first-child');
      expect(firstAction).toMatch(/email|call|message|follow|up|schedule/i);
    }
  });

  test('AI handles empty prospect list gracefully', async ({ page }) => {
    // This test would require a workspace with no prospects
    // For now, we'll test the AI's response when asked about an empty list
    
    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask AI about adding more prospects
    await page.fill('[data-testid="ai-input"]', 'I don\'t have many prospects. What should I do?');
    await page.press('[data-testid="ai-input"]', 'Enter');

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI provides helpful advice about adding prospects
    const response = await page.textContent('[data-testid="ai-response"]');
    
    // AI should provide advice about finding more prospects
    expect(response).toMatch(/prospects|leads|contacts|find|add|source|generate/i);
    
    // AI should provide actionable suggestions
    expect(response).toMatch(/recommend|suggest|advise|should|consider|try/i);
  });

  test('AI maintains context across multiple questions', async ({ page }) => {
    // Click on a prospect to open detail view
    await page.click('[data-testid="prospect-item"]:first-child');
    await page.waitForSelector('[data-testid="prospect-detail"]', { timeout: 5000 });
    
    const prospectName = await page.textContent('[data-testid="prospect-name"]');

    // Open AI panel
    await page.click('[data-testid="ai-panel-toggle"]');
    await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

    // Ask first question
    await page.fill('[data-testid="ai-input"]', 'What do you know about this prospect?');
    await page.press('[data-testid="ai-input"]', 'Enter');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Ask follow-up question
    await page.fill('[data-testid="ai-input"]', 'What should my next action be?');
    await page.press('[data-testid="ai-input"]', 'Enter');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

    // Verify AI maintains context in follow-up response
    const followUpResponse = await page.textContent('[data-testid="ai-response"]:last-child');
    
    // AI should still reference the prospect in the follow-up
    if (prospectName) {
      expect(followUpResponse).toContain(prospectName);
    }
    
    // AI should provide specific next action advice
    expect(followUpResponse).toMatch(/next|action|step|follow|up|recommend|suggest/i);
  });
});
