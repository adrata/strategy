/**
 * E2E Tests for Record Page Error Scenarios
 * 
 * Tests error handling, edge cases, and failure scenarios for all record pages
 */

import { test, expect } from '@playwright/test';

test.describe('Record Page Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workspace
    await page.goto('/test-workspace');
    
    // Wait for authentication
    await page.waitForSelector('[data-testid="workspace-loaded"]', { timeout: 10000 });
  });

  test.describe('Invalid Record ID Handling', () => {
    test('should handle 404 errors for non-existent people records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/people/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Person not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('not found');
    });

    test('should handle 404 errors for non-existent company records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/companies/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Company not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/companies/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('not found');
    });

    test('should handle 404 errors for non-existent lead records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/leads/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Lead not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/leads/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
    });

    test('should handle 404 errors for non-existent prospect records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/prospects/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Prospect not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/prospects/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
    });

    test('should handle 404 errors for non-existent opportunity records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/opportunities/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Opportunity not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/opportunities/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
    });

    test('should handle 404 errors for non-existent client records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/clients/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Client not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/clients/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
    });

    test('should handle 404 errors for non-existent speedrun records', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/speedrun/non-existent-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Speedrun record not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/speedrun/non-existent-id');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
    });
  });

  test.describe('Authentication Errors', () => {
    test('should handle 401 unauthorized errors', async ({ page }) => {
      // Mock 401 response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized access',
            code: 'UNAUTHORIZED'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show unauthorized error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('unauthorized');
    });

    test('should handle 403 forbidden errors', async ({ page }) => {
      // Mock 403 response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Access forbidden',
            code: 'FORBIDDEN'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show forbidden error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('forbidden');
    });
  });

  test.describe('Network Errors', () => {
    test('should handle network connection failures', async ({ page }) => {
      // Mock network failure
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.abort('failed');
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show network error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('network');
    });

    test('should handle timeout errors', async ({ page }) => {
      // Mock timeout
      await page.route('/api/v1/people/test-person-id', async route => {
        // Simulate timeout by not responding
        await new Promise(resolve => setTimeout(resolve, 10000));
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show timeout error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('timeout');
    });

    test('should handle server errors (500)', async ({ page }) => {
      // Mock 500 response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show server error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('server error');
    });
  });

  test.describe('Data Validation Errors', () => {
    test('should handle invalid record ID format', async ({ page }) => {
      await page.goto('/test-workspace/pipeline/people/invalid-id-format');
      
      // Should show validation error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('invalid');
    });

    test('should handle malformed API responses', async ({ page }) => {
      // Mock malformed response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show parsing error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-container"]')).toContainText('parsing');
    });

    test('should handle missing required fields', async ({ page }) => {
      // Mock response with missing fields
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-person-id'
              // Missing required fields like fullName, email, etc.
            }
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should handle missing fields gracefully
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow retry after network error', async ({ page }) => {
      let requestCount = 0;
      
      // Mock first request to fail, second to succeed
      await page.route('/api/v1/people/test-person-id', async route => {
        requestCount++;
        if (requestCount === 1) {
          await route.abort('failed');
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'test-person-id',
                fullName: 'John Doe',
                email: 'john@example.com'
              }
            })
          });
        }
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show error initially
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      
      // Click retry button
      await page.click('[data-testid="retry-button"]');
      
      // Should load successfully on retry
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should allow navigation away from error state', async ({ page }) => {
      // Mock error response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Person not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show error
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      
      // Navigate to different record
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      
      // Should load new record successfully
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty record data', async ({ page }) => {
      // Mock empty response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should handle empty data gracefully
      await expect(page.locator('[data-testid="no-record-message"]')).toBeVisible();
    });

    test('should handle very large record data', async ({ page }) => {
      // Mock large response
      const largeData = {
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@example.com',
        notes: 'A'.repeat(10000), // Very large notes field
        customFields: Array.from({ length: 100 }, (_, i) => ({
          name: `field${i}`,
          value: 'A'.repeat(1000)
        }))
      };

      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: largeData
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should handle large data without crashing
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });

    test('should handle special characters in record data', async ({ page }) => {
      // Mock response with special characters
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-person-id',
              fullName: 'José María O\'Connor-Smith',
              email: 'josé.maría@example.com',
              notes: 'Special chars: <>&"\'`'
            }
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should handle special characters correctly
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="record-name"]')).toContainText('José María');
    });

    test('should handle concurrent navigation requests', async ({ page }) => {
      // Mock slow response
      await page.route('/api/v1/people/test-person-id', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-person-id',
              fullName: 'John Doe',
              email: 'john@example.com'
            }
          })
        });
      });

      // Start navigation
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Immediately navigate to different record
      await page.goto('/test-workspace/pipeline/companies/test-company-id');
      
      // Should handle concurrent requests gracefully
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should handle JavaScript disabled gracefully', async ({ page }) => {
      // Disable JavaScript
      await page.setJavaScriptEnabled(false);
      
      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show fallback content
      await expect(page.locator('body')).toContainText('JavaScript is required');
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Should eventually load
      await expect(page.locator('[data-testid="record-page-container"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Error Message Display', () => {
    test('should display user-friendly error messages', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Person not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show user-friendly error message
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('The record you are looking for could not be found');
    });

    test('should provide helpful error actions', async ({ page }) => {
      // Mock 404 response
      await page.route('/api/v1/people/test-person-id', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Person not found',
            code: 'NOT_FOUND'
          })
        });
      });

      await page.goto('/test-workspace/pipeline/people/test-person-id');
      
      // Should show helpful actions
      await expect(page.locator('[data-testid="error-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="back-button"]')).toBeVisible();
    });
  });
});
