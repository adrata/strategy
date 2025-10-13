/**
 * E2E Tests for Speedrun-Specific Workflows
 * 
 * Tests sprint view rendering, person navigation in sprint mode, power dialer, and activity tracking
 */

import { test, expect } from '@playwright/test';

test.describe('Speedrun Workflows E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workspace
    await page.goto('/test-workspace');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="workspace-loaded"]', { timeout: 10000 });
  });

  test.describe('Sprint View Rendering', () => {
    test('should render sprint page without crashing', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      
      // Wait for sprint page to load
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check that sprint page renders without errors
      expect(await page.locator('[data-testid="sprint-page-container"]')).toBeVisible();
    });

    test('should display sprint leaderboard correctly', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check that leaderboard is displayed
      await expect(page.locator('[data-testid="sprint-leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="sprint-stats"]')).toBeVisible();
    });

    test('should show sprint progress and metrics', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check that sprint metrics are displayed
      await expect(page.locator('[data-testid="sprint-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="sprint-timer"]')).toBeVisible();
      await expect(page.locator('[data-testid="sprint-score"]')).toBeVisible();
    });

    test('should display sprint participants', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check that participants are displayed
      await expect(page.locator('[data-testid="sprint-participants"]')).toBeVisible();
      await expect(page.locator('[data-testid="participant-list"]')).toBeVisible();
    });
  });

  test.describe('Person Navigation in Sprint Mode', () => {
    test('should navigate between people in sprint mode', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Click on first person in sprint
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      // Should navigate to person detail
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      expect(await page.locator('[data-testid="speedrun-record-template"]')).toBeVisible();
    });

    test('should show sprint context in person view', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Should show sprint context
      await expect(page.locator('[data-testid="sprint-context"]')).toBeVisible();
      await expect(page.locator('[data-testid="sprint-timer"]')).toBeVisible();
    });

    test('should handle sprint navigation controls', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Test sprint navigation controls
      const nextPersonButton = page.locator('[data-testid="sprint-next-person"]');
      const prevPersonButton = page.locator('[data-testid="sprint-prev-person"]');
      
      if (await nextPersonButton.isVisible()) {
        await nextPersonButton.click();
        await page.waitForTimeout(1000);
      }
      
      if (await prevPersonButton.isVisible()) {
        await prevPersonButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Should maintain sprint context
      await expect(page.locator('[data-testid="sprint-context"]')).toBeVisible();
    });

    test('should track sprint progress during navigation', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Check that progress is tracked
      await expect(page.locator('[data-testid="sprint-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-count"]')).toBeVisible();
    });
  });

  test.describe('Power Dialer Functionality', () => {
    test('should open power dialer from speedrun record', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Click power dialer button
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      // Should open power dialer
      await expect(page.locator('[data-testid="power-dialer"]')).toBeVisible();
    });

    test('should display contacts in power dialer', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open power dialer
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      await expect(page.locator('[data-testid="power-dialer"]')).toBeVisible();
      
      // Should show contacts
      await expect(page.locator('[data-testid="dialer-contacts"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-list"]')).toBeVisible();
    });

    test('should handle phone calls in power dialer', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open power dialer
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      await expect(page.locator('[data-testid="power-dialer"]')).toBeVisible();
      
      // Click on a contact to call
      const contactItem = page.locator('[data-testid="contact-item-0"]');
      await contactItem.click();
      
      // Should initiate call
      await expect(page.locator('[data-testid="call-status"]')).toBeVisible();
    });

    test('should close power dialer', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open power dialer
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      await expect(page.locator('[data-testid="power-dialer"]')).toBeVisible();
      
      // Close power dialer
      const closeButton = page.locator('[data-testid="close-dialer"]');
      await closeButton.click();
      
      // Should close dialer
      await expect(page.locator('[data-testid="power-dialer"]')).not.toBeVisible();
    });
  });

  test.describe('Activity Tracking', () => {
    test('should track sprint activities', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Perform an action (e.g., complete action)
      const completeButton = page.locator('[data-testid="complete-button"]');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        // Fill in action details
        await page.fill('[data-testid="action-notes"]', 'Sprint completion');
        await page.selectOption('[data-testid="action-outcome"]', 'positive');
        
        // Complete the action
        await page.click('[data-testid="complete-action"]');
        
        // Should track activity
        await expect(page.locator('[data-testid="activity-tracker"]')).toBeVisible();
      }
    });

    test('should display today activity panel', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Should show today's activity
      await expect(page.locator('[data-testid="today-activity-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-summary"]')).toBeVisible();
    });

    test('should update activity in real-time', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Perform action
      const completeButton = page.locator('[data-testid="complete-button"]');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        await page.fill('[data-testid="action-notes"]', 'Real-time test');
        await page.click('[data-testid="complete-action"]');
        
        // Should update activity in real-time
        await expect(page.locator('[data-testid="activity-update"]')).toBeVisible();
      }
    });

    test('should show activity history', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Click on activity tab
      const activityTab = page.locator('[data-testid="tab-activity"]');
      await activityTab.click();
      
      // Should show activity history
      await expect(page.locator('[data-testid="activity-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible();
    });
  });

  test.describe('Sprint Performance Metrics', () => {
    test('should display sprint performance metrics', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check performance metrics
      await expect(page.locator('[data-testid="sprint-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
    });

    test('should track sprint leaderboard updates', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check leaderboard
      await expect(page.locator('[data-testid="sprint-leaderboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="leaderboard-entries"]')).toBeVisible();
    });

    test('should show sprint achievements', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check achievements
      await expect(page.locator('[data-testid="sprint-achievements"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievement-badges"]')).toBeVisible();
    });
  });

  test.describe('Sprint Navigation and Controls', () => {
    test('should handle sprint start/stop controls', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Check sprint controls
      await expect(page.locator('[data-testid="sprint-controls"]')).toBeVisible();
      
      // Test start sprint
      const startButton = page.locator('[data-testid="start-sprint-button"]');
      if (await startButton.isVisible()) {
        await startButton.click();
        await expect(page.locator('[data-testid="sprint-timer"]')).toBeVisible();
      }
    });

    test('should handle sprint pause/resume', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Start sprint first
      const startButton = page.locator('[data-testid="start-sprint-button"]');
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Test pause
        const pauseButton = page.locator('[data-testid="pause-sprint-button"]');
        if (await pauseButton.isVisible()) {
          await pauseButton.click();
          await expect(page.locator('[data-testid="sprint-paused"]')).toBeVisible();
        }
      }
    });

    test('should handle sprint reset', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Test reset sprint
      const resetButton = page.locator('[data-testid="reset-sprint-button"]');
      if (await resetButton.isVisible()) {
        await resetButton.click();
        
        // Should confirm reset
        await expect(page.locator('[data-testid="reset-confirmation"]')).toBeVisible();
        
        // Confirm reset
        const confirmReset = page.locator('[data-testid="confirm-reset"]');
        await confirmReset.click();
        
        // Should reset sprint
        await expect(page.locator('[data-testid="sprint-reset"]')).toBeVisible();
      }
    });
  });

  test.describe('Sprint Error Handling', () => {
    test('should handle sprint data loading errors', async ({ page }) => {
      // Mock error response for sprint data
      await page.route('/api/v1/speedrun/sprint', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Failed to load sprint data',
            code: 'INTERNAL_ERROR'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('Failed to load sprint data');
    });

    test('should handle power dialer errors', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Mock error for power dialer
      await page.route('/api/v1/speedrun/power-dialer', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Power dialer service unavailable',
            code: 'SERVICE_UNAVAILABLE'
          })
        });
      });
      
      // Try to open power dialer
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      // Should show error
      await expect(page.locator('[data-testid="dialer-error"]')).toBeVisible();
    });

    test('should handle activity tracking errors', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Mock error for activity tracking
      await page.route('/api/v1/speedrun/activity', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Activity tracking failed',
            code: 'TRACKING_ERROR'
          })
        });
      });
      
      // Navigate to person detail
      const firstPerson = page.locator('[data-testid="sprint-person-0"]');
      await firstPerson.click();
      
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Try to complete action
      const completeButton = page.locator('[data-testid="complete-button"]');
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        await page.fill('[data-testid="action-notes"]', 'Test activity');
        await page.click('[data-testid="complete-action"]');
        
        // Should show tracking error
        await expect(page.locator('[data-testid="tracking-error"]')).toBeVisible();
      }
    });
  });

  test.describe('Sprint Mobile Experience', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/test-workspace/pipeline/speedrun/sprint');
      await page.waitForSelector('[data-testid="sprint-page-container"]', { timeout: 10000 });
      
      // Should be visible on mobile
      await expect(page.locator('[data-testid="sprint-page-container"]')).toBeVisible();
    });

    test('should handle mobile power dialer', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/test-workspace/pipeline/speedrun/test-speedrun-id');
      await page.waitForSelector('[data-testid="speedrun-record-template"]', { timeout: 10000 });
      
      // Open power dialer on mobile
      const powerDialerButton = page.locator('[data-testid="power-dialer-button"]');
      await powerDialerButton.click();
      
      // Should work on mobile
      await expect(page.locator('[data-testid="power-dialer"]')).toBeVisible();
    });
  });
});
