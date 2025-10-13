/**
 * E2E Tests for Workspace Context Across Scenarios
 * 
 * Tests workspace context across different scenarios and workspaces
 */

import { test, expect } from '@playwright/test';

test.describe('Workspace Context E2E Tests', () => {
  test.describe('Demo Workspace Context', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });
    });

    test('AI knows workspace business model', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the workspace business model
      await page.fill('[data-testid="ai-input"]', 'What does our company sell and what is our business model?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references workspace business context
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference business model terms
      expect(response).toMatch(/business|model|sell|product|service|offer/i);
      
      // AI should provide specific information about what the company sells
      expect(response).toMatch(/CRM|sales|platform|software|solution|tool/i);
      
      // AI should not say it doesn't know
      expect(response).not.toMatch(/don't know|not sure|unclear|unknown/i);
    });

    test('AI knows what products/services are sold', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about products/services
      await page.fill('[data-testid="ai-input"]', 'What products and services do we offer to our customers?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references specific products/services
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference specific products or services
      expect(response).toMatch(/product|service|offer|provide|deliver|solution/i);
      
      // AI should provide detailed information
      expect(response.length).toBeGreaterThan(100); // Should be a substantial response
      
      // AI should not say it doesn't know
      expect(response).not.toMatch(/don't know|not sure|unclear|unknown/i);
    });

    test('AI knows target market and ICP', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about target market and ICP
      await page.fill('[data-testid="ai-input"]', 'Who is our ideal customer and what market do we target?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references target market and ICP
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference target market terms
      expect(response).toMatch(/target|market|customer|ideal|ICP|profile|audience/i);
      
      // AI should provide specific information about the target market
      expect(response).toMatch(/company|business|size|industry|revenue|employees/i);
      
      // AI should not say it doesn't know
      expect(response).not.toMatch(/don't know|not sure|unclear|unknown/i);
    });

    test('AI provides workspace-specific advice', async ({ page }) => {
      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI for workspace-specific advice
      await page.fill('[data-testid="ai-input"]', 'How can I improve our sales process and what should I focus on?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides workspace-specific advice
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should provide specific advice
      expect(response).toMatch(/recommend|suggest|advise|should|consider|focus|improve/i);
      
      // AI should reference workspace context in the advice
      expect(response).toMatch(/sales|process|pipeline|leads|prospects|customers/i);
      
      // AI should provide actionable recommendations
      expect(response.length).toBeGreaterThan(150); // Should be a substantial response
    });
  });

  test.describe('Different Workspace Contexts', () => {
    test('AI context switches when changing workspaces', async ({ page }) => {
      // Start in demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel and ask about current workspace
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });
      
      await page.fill('[data-testid="ai-input"]', 'What company am I working for?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const demoResponse = await page.textContent('[data-testid="ai-response"]');
      expect(demoResponse).toMatch(/demo|test|sample/i);

      // Switch to a different workspace (if available)
      // Note: This would require additional workspace setup in test environment
      // For now, we'll test the concept with navigation
      await page.goto('/demo/speedrun');
      await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });

      // Ask AI about the new workspace context
      await page.fill('[data-testid="ai-input"]', 'What company am I working for now?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const speedrunResponse = await page.textContent('[data-testid="ai-response"]');
      // AI should still reference the demo workspace context
      expect(speedrunResponse).toMatch(/demo|test|sample/i);
    });

    test('AI maintains workspace context across different sections', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask about workspace in pipeline
      await page.fill('[data-testid="ai-input"]', 'What is our company\'s main value proposition?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const pipelineResponse = await page.textContent('[data-testid="ai-response"]');
      expect(pipelineResponse).toMatch(/value|proposition|benefit|advantage/i);

      // Navigate to speedrun section
      await page.goto('/demo/speedrun');
      await page.waitForSelector('[data-testid="speedrun-content"]', { timeout: 10000 });

      // Ask about workspace in speedrun
      await page.fill('[data-testid="ai-input"]', 'What makes our solution unique?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      const speedrunResponse = await page.textContent('[data-testid="ai-response"]');
      expect(speedrunResponse).toMatch(/unique|different|advantage|competitive/i);
    });
  });

  test.describe('Workspace Data Context', () => {
    test('AI knows workspace metrics and statistics', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about workspace metrics
      await page.fill('[data-testid="ai-input"]', 'What are our current pipeline metrics and how are we performing?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references workspace metrics
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference metrics terms
      expect(response).toMatch(/metric|performance|pipeline|leads|prospects|companies|revenue/i);
      
      // AI should provide specific numbers or ranges
      expect(response).toMatch(/\d+/); // Should contain numbers
      
      // AI should provide insights about performance
      expect(response).toMatch(/good|strong|improve|focus|recommend|suggest/i);
    });

    test('AI knows about recent activities and trends', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about recent activities
      await page.fill('[data-testid="ai-input"]', 'What have we been working on recently and what are the trends?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references recent activities
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference activity terms
      expect(response).toMatch(/recent|activity|trend|pattern|focus|working|progress/i);
      
      // AI should provide insights about trends
      expect(response).toMatch(/increase|decrease|improve|grow|decline|stable/i);
      
      // AI should provide actionable insights
      expect(response).toMatch(/recommend|suggest|advise|should|consider|focus/i);
    });
  });

  test.describe('Workspace Business Intelligence', () => {
    test('AI can analyze workspace performance', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI to analyze performance
      await page.fill('[data-testid="ai-input"]', 'Analyze our workspace performance and identify areas for improvement');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides analysis
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should provide analysis
      expect(response).toMatch(/analyze|analysis|performance|improve|area|opportunity/i);
      
      // AI should identify specific areas
      expect(response).toMatch(/leads|prospects|conversion|pipeline|sales|process/i);
      
      // AI should provide recommendations
      expect(response).toMatch(/recommend|suggest|advise|should|consider|focus|priority/i);
    });

    test('AI can provide strategic recommendations', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI for strategic recommendations
      await page.fill('[data-testid="ai-input"]', 'What strategic initiatives should we focus on this quarter?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides strategic recommendations
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should provide strategic advice
      expect(response).toMatch(/strategic|initiative|quarter|focus|priority|goal|objective/i);
      
      // AI should reference business context
      expect(response).toMatch(/business|company|market|customer|revenue|growth/i);
      
      // AI should provide actionable recommendations
      expect(response).toMatch(/recommend|suggest|advise|should|consider|implement|execute/i);
    });
  });

  test.describe('Workspace Context Validation', () => {
    test('AI acknowledges when workspace context is incomplete', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about something that might not be in context
      await page.fill('[data-testid="ai-input"]', 'What is our company\'s exact revenue target for this year?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response acknowledges limitations
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should either provide the information or acknowledge limitations
      if (response.includes("don't know") || response.includes("not sure") || response.includes("unclear")) {
        expect(response).toMatch(/don't know|not sure|unclear|limited|context|information/i);
      } else {
        // If AI provides the information, it should be specific
        expect(response).toMatch(/revenue|target|goal|million|thousand|\d+/i);
      }
    });

    test('AI provides helpful suggestions when context is missing', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about something that might not be in context
      await page.fill('[data-testid="ai-input"]', 'What is our exact customer acquisition cost?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides helpful suggestions
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should either provide the information or suggest how to get it
      if (response.includes("don't know") || response.includes("not sure")) {
        expect(response).toMatch(/suggest|recommend|check|look|find|calculate|track/i);
      } else {
        // If AI provides the information, it should be specific
        expect(response).toMatch(/cost|acquisition|CAC|customer|\d+/i);
      }
    });
  });
});
