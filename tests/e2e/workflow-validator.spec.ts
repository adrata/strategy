/**
 * 🧪 End-to-End Tests for Interactive Workflow Validator
 * 
 * Complete user journey testing with Playwright
 */
import { test, expect, Page } from '@playwright/test';

test.describe('Interactive Workflow Validator', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000/private/TOP/interactive-workflow-validator');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Initial Load', () => {
    test('should load the main interface', async () => {
      await expect(page.getByText('🎯 TOP Interactive Workflow Validator')).toBeVisible();
      await expect(page.getByText('Step-by-step validation of the buyer group generation process')).toBeVisible();
    });

    test('should display workflow controls', async () => {
      await expect(page.getByText('Workflow Controls')).toBeVisible();
      await expect(page.getByRole('button', { name: '⚡ Run All Runnable Steps' })).toBeVisible();
      await expect(page.getByRole('button', { name: '🔄 Reset Workflow' })).toBeVisible();
    });

    test('should show initial workflow state', async () => {
      await expect(page.getByText('Company: Dell Technologies')).toBeVisible();
      await expect(page.getByText('Runnable Steps: 1')).toBeVisible();
      await expect(page.getByText('Completed Steps: 0')).toBeVisible();
    });

    test('should display all workflow steps', async () => {
      await expect(page.getByText('Input Processing & Validation')).toBeVisible();
      await expect(page.getByText('Company Data Discovery')).toBeVisible();
      await expect(page.getByText('Parallel Search Execution')).toBeVisible();
      await expect(page.getByText('Seller Profile Adaptation')).toBeVisible();
    });
  });

  test.describe('Step Execution', () => {
    test('should execute a single step', async () => {
      // Click the first runnable step
      const runButton = page.getByRole('button', { name: 'Run' }).first();
      await runButton.click();

      // Should show execution log
      await expect(page.getByText(/🚀 Starting Input Processing & Validation/)).toBeVisible();
      
      // Should complete successfully
      await expect(page.getByText(/✅ Completed Input Processing & Validation/)).toBeVisible({ timeout: 10000 });
    });

    test('should show step details when selected', async () => {
      // Click on a step to select it
      await page.getByText('Input Processing & Validation').click();
      
      // Should show step details
      await expect(page.getByText('Step Details')).toBeVisible();
      await expect(page.getByText('Input Processing & Validation')).toBeVisible();
    });

    test('should handle step dependencies correctly', async () => {
      // First step should be runnable
      const firstStepRunButton = page.getByRole('button', { name: 'Run' }).first();
      await expect(firstStepRunButton).toBeEnabled();

      // Steps with dependencies should not be runnable initially
      const stepWithDependency = page.getByText('Company Data Discovery').locator('..');
      const runButton = stepWithDependency.getByRole('button', { name: 'Run' });
      await expect(runButton).not.toBeVisible();
    });
  });

  test.describe('Parallel Execution', () => {
    test('should execute parallel steps simultaneously', async () => {
      // Execute prerequisite steps first
      await page.getByRole('button', { name: 'Run' }).first().click();
      await expect(page.getByText(/✅ Completed Input Processing & Validation/)).toBeVisible({ timeout: 10000 });

      // Execute step 2
      await page.getByRole('button', { name: 'Run' }).first().click();
      await expect(page.getByText(/✅ Completed Company Data Discovery/)).toBeVisible({ timeout: 10000 });

      // Execute step 3
      await page.getByRole('button', { name: 'Run' }).first().click();
      await expect(page.getByText(/✅ Completed Search Query Generation/)).toBeVisible({ timeout: 10000 });

      // Now parallel steps should be available
      const runAllButton = page.getByRole('button', { name: '⚡ Run All Runnable Steps' });
      await runAllButton.click();

      // Should show parallel execution
      await expect(page.getByText(/⚡ Executing 2 parallel steps/)).toBeVisible();
    });

    test('should show parallel execution indicators', async () => {
      await expect(page.getByText('⚡ Parallel')).toBeVisible();
      await expect(page.getByText('➡️ Sequential')).toBeVisible();
    });
  });

  test.describe('Workflow Reset', () => {
    test('should reset all steps to pending state', async () => {
      // Execute a step first
      await page.getByRole('button', { name: 'Run' }).first().click();
      await expect(page.getByText(/✅ Completed/)).toBeVisible({ timeout: 10000 });

      // Reset workflow
      await page.getByRole('button', { name: '🔄 Reset Workflow' }).click();

      // All steps should be pending again
      await expect(page.getByText('⏳')).toBeVisible();
      await expect(page.getByText('🔄 Workflow reset')).toBeVisible();
    });
  });

  test.describe('Real-time Monitoring', () => {
    test('should show monitoring during execution', async () => {
      const runAllButton = page.getByRole('button', { name: '⚡ Run All Runnable Steps' });
      await runAllButton.click();

      // Should show monitoring is active
      await expect(page.getByText('Monitoring Active: Yes')).toBeVisible();
    });

    test('should display system metrics', async () => {
      await expect(page.getByText('System Metrics')).toBeVisible();
      await expect(page.getByText('CPU Usage')).toBeVisible();
      await expect(page.getByText('Memory Usage')).toBeVisible();
      await expect(page.getByText('API Calls/sec')).toBeVisible();
    });

    test('should show API performance data', async () => {
      await expect(page.getByText('API Performance')).toBeVisible();
      await expect(page.getByText('CoreSignal API')).toBeVisible();
      await expect(page.getByText('Perplexity API')).toBeVisible();
      await expect(page.getByText('ZeroBounce API')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle step execution errors gracefully', async () => {
      // Mock an error response
      await page.route('**/api/workflow/execute-step', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            stepId: 'step1',
            status: 'error',
            error: 'Test error message',
            duration: 0
          })
        });
      });

      // Try to execute a step
      await page.getByRole('button', { name: 'Run' }).first().click();

      // Should show error message
      await expect(page.getByText(/❌ Error in Input Processing & Validation/)).toBeVisible();
    });

    test('should handle network errors', async () => {
      // Mock network failure
      await page.route('**/api/workflow/execute-step', route => route.abort());

      // Try to execute a step
      await page.getByRole('button', { name: 'Run' }).first().click();

      // Should show error message
      await expect(page.getByText(/❌ Error in Input Processing & Validation/)).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should handle rapid user interactions', async () => {
      const runButton = page.getByRole('button', { name: 'Run' }).first();
      
      // Click multiple times rapidly
      await runButton.click();
      await runButton.click();
      await runButton.click();

      // Should handle gracefully
      await expect(page.getByText(/✅ Completed/)).toBeVisible({ timeout: 15000 });
    });

    test('should update UI responsively', async () => {
      const startTime = Date.now();
      
      await page.getByRole('button', { name: 'Run' }).first().click();
      
      // Should show immediate feedback
      await expect(page.getByText(/🚀 Starting/)).toBeVisible();
      
      const feedbackTime = Date.now() - startTime;
      expect(feedbackTime).toBeLessThan(1000); // Should show feedback within 1 second
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate buttons with Enter
      await page.keyboard.press('Enter');
      
      // Should show execution started
      await expect(page.getByText(/🚀 Starting/)).toBeVisible();
    });

    test('should have proper ARIA labels', async () => {
      // Check for proper button labels
      await expect(page.getByRole('button', { name: '⚡ Run All Runnable Steps' })).toBeVisible();
      await expect(page.getByRole('button', { name: '🔄 Reset Workflow' })).toBeVisible();
    });

    test('should have proper heading structure', async () => {
      // Check heading hierarchy
      await expect(page.getByRole('heading', { name: '🎯 TOP Interactive Workflow Validator' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Workflow Controls' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Workflow Steps' })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Should still show main elements
      await expect(page.getByText('🎯 TOP Interactive Workflow Validator')).toBeVisible();
      await expect(page.getByRole('button', { name: '⚡ Run All Runnable Steps' })).toBeVisible();
    });

    test('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Should show all elements properly
      await expect(page.getByText('Workflow Steps')).toBeVisible();
      await expect(page.getByText('System Metrics')).toBeVisible();
    });
  });

  test.describe('Complete Workflow', () => {
    test('should execute complete workflow from start to finish', async () => {
      // Execute all steps in sequence
      const runAllButton = page.getByRole('button', { name: '⚡ Run All Runnable Steps' });
      
      // Click run all multiple times to execute all steps
      for (let i = 0; i < 5; i++) {
        await runAllButton.click();
        await page.waitForTimeout(2000); // Wait for steps to complete
      }

      // Should have completed many steps
      const completedSteps = page.getByText(/✅ Completed/);
      await expect(completedSteps).toBeVisible();
    });

    test('should show final buyer group results', async () => {
      // Execute workflow to completion
      const runAllButton = page.getByRole('button', { name: '⚡ Run All Runnable Steps' });
      
      for (let i = 0; i < 5; i++) {
        await runAllButton.click();
        await page.waitForTimeout(3000);
      }

      // Should show final results
      await expect(page.getByText(/Final Report/)).toBeVisible({ timeout: 30000 });
    });
  });
});

