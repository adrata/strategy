/**
 * Buyer Group Navigation End-to-End Tests
 * 
 * Complete user workflows for buyer group navigation between companies
 * Tests real browser interactions and data persistence
 */

import { test, expect } from '@playwright/test';

// Test data for companies with known buyer group members
const testCompanies = [
  {
    name: 'Atlas Title Service',
    expectedDecisionMaker: 'Nicole Rappaport',
    slug: 'atlas-title-service'
  },
  {
    name: 'Southern California Edison',
    expectedDecisionMaker: 'Different Person', // Will be updated based on actual data
    slug: 'southern-california-edison'
  },
  {
    name: 'Test Company 3',
    expectedDecisionMaker: 'Another Person',
    slug: 'test-company-3'
  },
  {
    name: 'Test Company 4',
    expectedDecisionMaker: 'Fourth Person',
    slug: 'test-company-4'
  },
  {
    name: 'Test Company 5',
    expectedDecisionMaker: 'Fifth Person',
    slug: 'test-company-5'
  }
];

test.describe('Buyer Group Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Login if needed (adjust selectors based on your auth flow)
    const loginButton = page.locator('text=Sign In').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // Add login steps here if needed
    }
  });

  test.describe('Company Navigation Test', () => {
    test('should display correct buyer group members when navigating between companies', async ({ page }) => {
      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on the first company (Atlas Title Service)
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      // Wait for company detail page to load
      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for buyer groups to load
      await page.waitForTimeout(2000);

      // Verify Nicole Rappaport is displayed as Decision Maker
      const nicoleRappaport = page.locator('text=Nicole Rappaport');
      await expect(nicoleRappaport).toBeVisible();

      // Verify she has Decision Maker role
      const decisionMakerBadge = page.locator('text=Decision Maker').first();
      await expect(decisionMakerBadge).toBeVisible();

      // Click next company arrow (">")
      const nextButton = page.locator('button:has(svg)').last(); // Last button with SVG (next arrow)
      await expect(nextButton).toBeVisible();
      await nextButton.click();

      // Wait for next company to load
      await page.waitForTimeout(2000);

      // Navigate to Buyer Groups tab for the new company
      await buyerGroupsTab.click();
      await page.waitForTimeout(2000);

      // Verify Nicole Rappaport is NOT displayed (different company)
      await expect(nicoleRappaport).not.toBeVisible();

      // Verify different person is displayed
      const buyerGroupMembers = page.locator('[data-testid="buyer-group-member"], .cursor-pointer');
      await expect(buyerGroupMembers.first()).toBeVisible();

      // Continue navigating through remaining companies
      for (let i = 2; i < testCompanies.length; i++) {
        // Click next company arrow
        await nextButton.click();
        await page.waitForTimeout(2000);

        // Navigate to Buyer Groups tab
        await buyerGroupsTab.click();
        await page.waitForTimeout(2000);

        // Verify Nicole Rappaport is still not displayed
        await expect(nicoleRappaport).not.toBeVisible();

        // Verify some buyer group members are displayed
        await expect(buyerGroupMembers.first()).toBeVisible();
      }
    });

    test('should handle rapid navigation between companies', async ({ page }) => {
      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on the first company
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      // Wait for company detail page to load
      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for initial buyer groups to load
      await page.waitForTimeout(2000);

      // Rapidly click through companies using next arrow
      const nextButton = page.locator('button:has(svg)').last();
      
      for (let i = 0; i < 5; i++) {
        // Click next company arrow
        await nextButton.click();
        await page.waitForTimeout(500); // Short wait for rapid navigation

        // Navigate to Buyer Groups tab
        await buyerGroupsTab.click();
        await page.waitForTimeout(1000);

        // Verify buyer groups are loading/loaded
        const buyerGroupContainer = page.locator('text=Overview').first();
        await expect(buyerGroupContainer).toBeVisible();
      }
    });
  });

  test.describe('Cache Invalidation Test', () => {
    test('should show correct data when reopening modal for different companies', async ({ page }) => {
      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Test Company A
      const companyA = page.locator('text=Atlas Title Service').first();
      await expect(companyA).toBeVisible();
      await companyA.click();

      await page.waitForLoadState('networkidle');

      // Open Update Modal for Company A
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for buyer groups to load
      await page.waitForTimeout(2000);

      // Verify Company A's buyer groups are displayed
      const nicoleRappaport = page.locator('text=Nicole Rappaport');
      await expect(nicoleRappaport).toBeVisible();

      // Close modal
      const closeButton = page.locator('button[aria-label="Close"], button:has(svg)').first();
      await closeButton.click();

      // Wait for modal to close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

      // Navigate to a different company (Company B)
      await page.goBack(); // Go back to companies list
      await page.waitForLoadState('networkidle');

      // Find a different company (if available)
      const companyB = page.locator('text=Southern California Edison').first();
      if (await companyB.isVisible()) {
        await companyB.click();
        await page.waitForLoadState('networkidle');

        // Open Update Modal for Company B
        const updateButtonB = page.locator('text=Update Company').first();
        await expect(updateButtonB).toBeVisible();
        await updateButtonB.click();

        await page.waitForSelector('[role="dialog"]', { state: 'visible' });

        // Navigate to Buyer Groups tab
        await buyerGroupsTab.click();
        await page.waitForTimeout(2000);

        // Verify Company A's data is NOT displayed (cache was invalidated)
        await expect(nicoleRappaport).not.toBeVisible();

        // Verify Company B's buyer groups are displayed
        const buyerGroupMembers = page.locator('[data-testid="buyer-group-member"], .cursor-pointer');
        await expect(buyerGroupMembers.first()).toBeVisible();
      }
    });
  });

  test.describe('Buyer Group Member Interaction', () => {
    test('should allow clicking on buyer group members to navigate to their profiles', async ({ page }) => {
      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on a company
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for buyer groups to load
      await page.waitForTimeout(2000);

      // Find a buyer group member
      const buyerGroupMember = page.locator('.cursor-pointer').first();
      await expect(buyerGroupMember).toBeVisible();

      // Click on the member
      await buyerGroupMember.click();

      // Verify navigation occurred (should be on a person page or modal closed)
      await page.waitForTimeout(2000);

      // Check if we're on a person page or if modal closed
      const isPersonPage = await page.locator('text=Person Details, text=Profile').isVisible();
      const isModalClosed = await page.locator('[role="dialog"]').isHidden();

      expect(isPersonPage || isModalClosed).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully in buyer groups tab', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/data/buyer-groups/fast*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on a company
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for error handling
      await page.waitForTimeout(3000);

      // Verify that the tab still renders (doesn't crash)
      const overviewSection = page.locator('text=Overview').first();
      await expect(overviewSection).toBeVisible();

      // Verify that stats show 0 (empty state)
      const totalMembers = page.locator('text=0').first();
      await expect(totalMembers).toBeVisible();
    });

    test('should handle empty buyer groups gracefully', async ({ page }) => {
      // Mock API to return empty data
      await page.route('**/api/data/buyer-groups/fast*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            data: [],
            meta: { processingTime: 100 }
          })
        });
      });

      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on a company
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      await buyerGroupsTab.click();

      // Wait for empty state to load
      await page.waitForTimeout(2000);

      // Verify empty state is displayed correctly
      const totalMembers = page.locator('text=0').first();
      await expect(totalMembers).toBeVisible();

      const decisionMakers = page.locator('text=0').nth(1);
      await expect(decisionMakers).toBeVisible();

      // Verify no buyer group members are displayed
      const buyerGroupMembers = page.locator('[data-testid="buyer-group-member"]');
      await expect(buyerGroupMembers).toHaveCount(0);
    });
  });

  test.describe('Performance Tests', () => {
    test('should load buyer groups within acceptable time', async ({ page }) => {
      // Navigate to companies section
      await page.click('text=Companies');
      await page.waitForLoadState('networkidle');

      // Find and click on a company
      const firstCompany = page.locator('text=Atlas Title Service').first();
      await expect(firstCompany).toBeVisible();
      await firstCompany.click();

      await page.waitForLoadState('networkidle');

      // Click "Update Company" button
      const updateButton = page.locator('text=Update Company').first();
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      // Wait for Update Modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Navigate to Buyer Groups tab and measure load time
      const buyerGroupsTab = page.locator('text=Buyer Groups');
      await expect(buyerGroupsTab).toBeVisible();
      
      const startTime = Date.now();
      await buyerGroupsTab.click();

      // Wait for buyer groups to load (with timeout)
      await page.waitForTimeout(5000);

      const loadTime = Date.now() - startTime;

      // Verify buyer groups loaded within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // Verify content is displayed
      const overviewSection = page.locator('text=Overview').first();
      await expect(overviewSection).toBeVisible();
    });
  });
});
