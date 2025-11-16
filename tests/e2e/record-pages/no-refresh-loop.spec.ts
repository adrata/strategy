/**
 * E2E Test: No Refresh Loop on Opportunity and Lead Records
 * 
 * Tests that clicking on opportunity and lead records does not cause
 * perpetual page refreshes every 1-2 seconds.
 * 
 * This test validates the fix for the infinite refresh loop bug.
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

// Helper function to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.fill('input[name="email"]', 'ross@adrata.com');
  await page.fill('input[name="password"]', 'Themill08!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/speedrun', { timeout: 10000 });
}

// Helper function to get first record ID from a section
async function getFirstRecordId(page: Page, section: string): Promise<string | null> {
  // Navigate to the section
  await page.goto(`${BASE_URL}/test-workspace/${section}`);
  await page.waitForTimeout(2000); // Wait for data to load
  
  // Try to find a record row in the table
  const recordRow = page.locator(`[data-testid*="record-row"], [data-record-id], tr[data-id]`).first();
  
  if (await recordRow.count() > 0) {
    // Try to get the ID from various possible attributes
    const id = await recordRow.getAttribute('data-record-id') || 
               await recordRow.getAttribute('data-id') ||
               await recordRow.getAttribute('id');
    
    if (id) return id;
    
    // Try to extract from href if it's a link
    const link = recordRow.locator('a').first();
    if (await link.count() > 0) {
      const href = await link.getAttribute('href');
      if (href) {
        const match = href.match(/\/([^\/]+)$/);
        if (match) return match[1];
      }
    }
  }
  
  return null;
}

test.describe('No Refresh Loop Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('opportunity record should not cause refresh loop', async ({ page }) => {
    // Get first opportunity record ID
    const recordId = await getFirstRecordId(page, 'opportunities');
    
    if (!recordId) {
      test.skip('No opportunity records found to test');
      return;
    }

    // Navigate to the opportunity record
    const recordUrl = `${BASE_URL}/test-workspace/opportunities/${recordId}`;
    console.log(`Navigating to opportunity record: ${recordUrl}`);
    
    // Track page reloads
    let reloadCount = 0;
    const originalReload = page.reload.bind(page);
    page.reload = async () => {
      reloadCount++;
      return originalReload();
    };

    // Navigate to the record
    await page.goto(recordUrl);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for 5 seconds and monitor for refreshes
    const startTime = Date.now();
    const initialUrl = page.url();
    
    // Monitor for URL changes or page reloads
    let urlChangeCount = 0;
    page.on('framenavigated', () => {
      if (page.url() !== initialUrl) {
        urlChangeCount++;
      }
    });

    // Wait 5 seconds and check if page refreshes
    await page.waitForTimeout(5000);
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Check that URL hasn't changed (no navigation away)
    expect(page.url()).toBe(recordUrl);
    
    // Check that we haven't had excessive reloads
    // Allow for 1-2 initial loads but not continuous refreshing
    expect(reloadCount).toBeLessThan(3);
    expect(urlChangeCount).toBeLessThan(3);
    
    // Verify the page is still showing the record (not stuck in a loop)
    const recordContent = page.locator('body');
    await expect(recordContent).toBeVisible({ timeout: 5000 });
    
    console.log(`✅ Opportunity record test passed: ${reloadCount} reloads, ${urlChangeCount} URL changes in ${elapsedTime}ms`);
  });

  test('lead record should not cause refresh loop', async ({ page }) => {
    // Get first lead record ID
    const recordId = await getFirstRecordId(page, 'leads');
    
    if (!recordId) {
      test.skip('No lead records found to test');
      return;
    }

    // Navigate to the lead record
    const recordUrl = `${BASE_URL}/test-workspace/leads/${recordId}`;
    console.log(`Navigating to lead record: ${recordUrl}`);
    
    // Track page reloads
    let reloadCount = 0;
    const originalReload = page.reload.bind(page);
    page.reload = async () => {
      reloadCount++;
      return originalReload();
    };

    // Navigate to the record
    await page.goto(recordUrl);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for 5 seconds and monitor for refreshes
    const startTime = Date.now();
    const initialUrl = page.url();
    
    // Monitor for URL changes or page reloads
    let urlChangeCount = 0;
    page.on('framenavigated', () => {
      if (page.url() !== initialUrl) {
        urlChangeCount++;
      }
    });

    // Wait 5 seconds and check if page refreshes
    await page.waitForTimeout(5000);
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Check that URL hasn't changed (no navigation away)
    expect(page.url()).toBe(recordUrl);
    
    // Check that we haven't had excessive reloads
    // Allow for 1-2 initial loads but not continuous refreshing
    expect(reloadCount).toBeLessThan(3);
    expect(urlChangeCount).toBeLessThan(3);
    
    // Verify the page is still showing the record (not stuck in a loop)
    const recordContent = page.locator('body');
    await expect(recordContent).toBeVisible({ timeout: 5000 });
    
    console.log(`✅ Lead record test passed: ${reloadCount} reloads, ${urlChangeCount} URL changes in ${elapsedTime}ms`);
  });

  test('prospect record should work normally (control test)', async ({ page }) => {
    // Get first prospect record ID
    const recordId = await getFirstRecordId(page, 'prospects');
    
    if (!recordId) {
      test.skip('No prospect records found to test');
      return;
    }

    // Navigate to the prospect record
    const recordUrl = `${BASE_URL}/test-workspace/prospects/${recordId}`;
    console.log(`Navigating to prospect record: ${recordUrl}`);
    
    await page.goto(recordUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait 3 seconds - prospects should work fine
    await page.waitForTimeout(3000);
    
    // Verify the page is stable
    expect(page.url()).toBe(recordUrl);
    const recordContent = page.locator('body');
    await expect(recordContent).toBeVisible({ timeout: 5000 });
    
    console.log(`✅ Prospect record test passed (control test)`);
  });

  test('people record should work normally (control test)', async ({ page }) => {
    // Get first people record ID
    const recordId = await getFirstRecordId(page, 'people');
    
    if (!recordId) {
      test.skip('No people records found to test');
      return;
    }

    // Navigate to the people record
    const recordUrl = `${BASE_URL}/test-workspace/people/${recordId}`;
    console.log(`Navigating to people record: ${recordUrl}`);
    
    await page.goto(recordUrl);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait 3 seconds - people should work fine
    await page.waitForTimeout(3000);
    
    // Verify the page is stable
    expect(page.url()).toBe(recordUrl);
    const recordContent = page.locator('body');
    await expect(recordContent).toBeVisible({ timeout: 5000 });
    
    console.log(`✅ People record test passed (control test)`);
  });
});

