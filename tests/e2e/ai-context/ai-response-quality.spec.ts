/**
 * E2E Tests for AI Response Quality with Context
 * 
 * Tests that AI responses use context appropriately and provide high-quality advice
 */

import { test, expect } from '@playwright/test';

test.describe('AI Response Quality E2E Tests', () => {
  test.describe('Context-Aware Responses', () => {
    test('AI references specific record names from list view', async ({ page }) => {
      // Navigate to demo workspace leads
      await page.goto('/demo/pipeline/leads');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="lead-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about the list
      await page.fill('[data-testid="ai-input"]', 'Who should I contact first from this list?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response references specific names
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference specific names from the list
      expect(response).toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
      
      // AI should provide specific reasoning
      expect(response).toMatch(/because|since|due to|given|considering|based on/i);
      
      // AI should provide actionable advice
      expect(response).toMatch(/contact|reach out|call|email|message|follow up/i);
    });

    test('AI provides advice specific to current record', async ({ page }) => {
      // Navigate to demo workspace leads
      await page.goto('/demo/pipeline/leads');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first lead to open detail view
      await page.click('[data-testid="lead-row"]:first-child');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });
      
      // Get lead details for verification
      const leadName = await page.textContent('[data-testid="lead-name"]');
      const leadCompany = await page.textContent('[data-testid="lead-company"]');
      const leadTitle = await page.textContent('[data-testid="lead-title"]');

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI for specific advice
      await page.fill('[data-testid="ai-input"]', 'What is the best approach to engage this person?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response is specific to the current record
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference the specific lead
      if (leadName) {
        expect(response).toContain(leadName);
      }
      if (leadCompany) {
        expect(response).toContain(leadCompany);
      }
      if (leadTitle) {
        expect(response).toContain(leadTitle);
      }
      
      // AI should provide specific engagement advice
      expect(response).toMatch(/approach|engage|strategy|personalize|tailor|specific/i);
      
      // AI should provide actionable recommendations
      expect(response).toMatch(/recommend|suggest|advise|should|consider|try|use/i);
    });

    test('AI acknowledges when context is incomplete', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI about something that requires specific context
      await page.fill('[data-testid="ai-input"]', 'What is the best time to contact this person?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI acknowledges context limitations
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should acknowledge it doesn't have specific context
      expect(response).toMatch(/don't have|not sure|unclear|limited|context|information|specific/i);
      
      // AI should provide helpful suggestions
      expect(response).toMatch(/suggest|recommend|advise|should|consider|try|check/i);
      
      // AI should offer to help with available information
      expect(response).toMatch(/help|assist|support|available|can|will/i);
    });

    test('AI suggestions align with workspace business model', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI for business advice
      await page.fill('[data-testid="ai-input"]', 'How can I improve our sales process?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response aligns with business model
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference business-relevant terms
      expect(response).toMatch(/sales|process|pipeline|leads|prospects|customers|revenue/i);
      
      // AI should provide business-focused recommendations
      expect(response).toMatch(/improve|optimize|enhance|streamline|efficiency|effectiveness/i);
      
      // AI should reference CRM or sales tools
      expect(response).toMatch(/CRM|system|tool|platform|software|solution/i);
    });

    test('AI compares prospects to ICP correctly', async ({ page }) => {
      // Navigate to demo workspace prospects
      await page.goto('/demo/pipeline/prospects');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="prospect-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI to compare prospects to ICP
      await page.fill('[data-testid="ai-input"]', 'Which prospects best match our ideal customer profile?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response provides ICP comparison
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // AI should reference ICP terms
      expect(response).toMatch(/ideal|customer|profile|ICP|match|fit|criteria|target/i);
      
      // AI should reference specific prospect names
      expect(response).toMatch(/John|Jane|Bob|Smith|Doe|Johnson/i);
      
      // AI should provide reasoning for the comparison
      expect(response).toMatch(/because|since|due to|given|considering|based on|matches|fits/i);
      
      // AI should provide specific recommendations
      expect(response).toMatch(/recommend|suggest|advise|should|consider|prioritize|focus/i);
    });
  });

  test.describe('Response Quality Metrics', () => {
    test('AI responses are comprehensive and detailed', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a complex question
      await page.fill('[data-testid="ai-input"]', 'Analyze our current pipeline and provide a comprehensive strategy for improvement');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response is comprehensive
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // Response should be substantial (at least 200 characters)
      expect(response.length).toBeGreaterThan(200);
      
      // Response should contain multiple actionable points
      const actionableWords = (response.match(/recommend|suggest|advise|should|consider|try|implement|focus|prioritize/gi) || []).length;
      expect(actionableWords).toBeGreaterThan(2);
      
      // Response should reference multiple aspects of the business
      expect(response).toMatch(/pipeline|leads|prospects|sales|process|strategy|improvement/i);
    });

    test('AI responses are actionable and specific', async ({ page }) => {
      // Navigate to demo workspace leads
      await page.goto('/demo/pipeline/leads');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="lead-row"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI for specific actionable advice
      await page.fill('[data-testid="ai-input"]', 'What specific actions should I take this week to improve my lead conversion?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response is actionable
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // Response should contain specific actions
      expect(response).toMatch(/call|email|message|follow up|schedule|meeting|demo|proposal/i);
      
      // Response should reference timeframes
      expect(response).toMatch(/week|today|tomorrow|this week|next week|immediately|soon/i);
      
      // Response should provide specific steps
      expect(response).toMatch(/step|first|then|next|after|before|start|begin/i);
      
      // Response should be actionable
      expect(response).toMatch(/should|recommend|suggest|advise|consider|try|implement/i);
    });

    test('AI responses maintain professional tone', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a business question
      await page.fill('[data-testid="ai-input"]', 'How can I improve our sales performance?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response maintains professional tone
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // Response should not contain casual language
      expect(response).not.toMatch(/hey|yo|dude|bro|lol|haha|omg|wtf/i);
      
      // Response should contain professional language
      expect(response).toMatch(/recommend|suggest|advise|consider|analyze|evaluate|implement/i);
      
      // Response should be well-structured
      expect(response).toMatch(/\.|,|;|:|!|\?/); // Should contain proper punctuation
    });

    test('AI responses are relevant to the question asked', async ({ page }) => {
      // Navigate to demo workspace
      await page.goto('/demo/pipeline');
      await page.waitForSelector('[data-testid="pipeline-content"]', { timeout: 10000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a specific question
      await page.fill('[data-testid="ai-input"]', 'What is the best time to send follow-up emails?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response is relevant to the question
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // Response should address the specific question about timing
      expect(response).toMatch(/time|timing|when|schedule|send|email|follow up/i);
      
      // Response should provide specific time recommendations
      expect(response).toMatch(/morning|afternoon|evening|weekday|weekend|business hours/i);
      
      // Response should be relevant to email marketing
      expect(response).toMatch(/email|message|communication|response|engagement/i);
    });
  });

  test.describe('Context Integration Quality', () => {
    test('AI seamlessly integrates multiple context sources', async ({ page }) => {
      // Navigate to demo workspace leads
      await page.goto('/demo/pipeline/leads');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first lead to open detail view
      await page.click('[data-testid="lead-row"]:first-child');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask AI a question that requires multiple context sources
      await page.fill('[data-testid="ai-input"]', 'Based on this lead and our business model, what is the best approach to convert them?');
      await page.press('[data-testid="ai-input"]', 'Enter');

      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI response integrates multiple context sources
      const response = await page.textContent('[data-testid="ai-response"]');
      
      // Response should reference the specific lead
      expect(response).toMatch(/this lead|this person|this contact|this prospect/i);
      
      // Response should reference business model
      expect(response).toMatch(/business|model|company|solution|product|service/i);
      
      // Response should provide integrated advice
      expect(response).toMatch(/approach|strategy|recommend|suggest|advise|should|consider/i);
      
      // Response should be coherent and well-integrated
      expect(response.length).toBeGreaterThan(150);
    });

    test('AI maintains context consistency across conversation', async ({ page }) => {
      // Navigate to demo workspace leads
      await page.goto('/demo/pipeline/leads');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      
      // Click on first lead to open detail view
      await page.click('[data-testid="lead-row"]:first-child');
      await page.waitForSelector('[data-testid="lead-detail"]', { timeout: 5000 });
      
      const leadName = await page.textContent('[data-testid="lead-name"]');

      // Open AI panel
      await page.click('[data-testid="ai-panel-toggle"]');
      await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

      // Ask first question
      await page.fill('[data-testid="ai-input"]', 'Tell me about this lead');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Ask follow-up question
      await page.fill('[data-testid="ai-input"]', 'What should my next step be?');
      await page.press('[data-testid="ai-input"]', 'Enter');
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

      // Verify AI maintains context consistency
      const followUpResponse = await page.textContent('[data-testid="ai-response"]:last-child');
      
      // AI should still reference the lead in the follow-up
      if (leadName) {
        expect(followUpResponse).toContain(leadName);
      }
      
      // AI should provide contextually relevant next steps
      expect(followUpResponse).toMatch(/next|step|action|follow|up|recommend|suggest/i);
      
      // AI should maintain conversation flow
      expect(followUpResponse).toMatch(/this|lead|person|contact|prospect/i);
    });

    test('AI provides contextually appropriate responses for different scenarios', async ({ page }) => {
      // Test different scenarios and verify appropriate responses
      const scenarios = [
        {
          url: '/demo/pipeline/leads',
          question: 'Who are my top leads?',
          expectedContext: ['leads', 'top', 'best', 'priority']
        },
        {
          url: '/demo/pipeline/prospects',
          question: 'Which prospects should I focus on?',
          expectedContext: ['prospects', 'focus', 'prioritize', 'conversion']
        },
        {
          url: '/demo/speedrun',
          question: 'How is my sprint going?',
          expectedContext: ['sprint', 'progress', 'outreach', 'workflow']
        }
      ];

      for (const scenario of scenarios) {
        await page.goto(scenario.url);
        await page.waitForSelector('[data-testid="pipeline-content"], [data-testid="speedrun-content"]', { timeout: 10000 });

        // Open AI panel
        await page.click('[data-testid="ai-panel-toggle"]');
        await page.waitForSelector('[data-testid="ai-input"]', { timeout: 5000 });

        // Ask scenario-specific question
        await page.fill('[data-testid="ai-input"]', scenario.question);
        await page.press('[data-testid="ai-input"]', 'Enter');
        await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });

        // Verify AI response is contextually appropriate
        const response = await page.textContent('[data-testid="ai-response"]');
        
        // AI should reference scenario-specific context
        for (const expectedContext of scenario.expectedContext) {
          expect(response).toMatch(new RegExp(expectedContext, 'i'));
        }
        
        // AI should provide relevant advice
        expect(response).toMatch(/recommend|suggest|advise|should|consider/i);
      }
    });
  });
});
