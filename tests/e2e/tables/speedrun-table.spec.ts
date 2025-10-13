/**
 * Speedrun Table E2E Tests
 * 
 * Tests the speedrun table functionality including rendering, sorting, filtering, and data accuracy
 */

import { test, expect } from '@playwright/test';

test.describe('Speedrun Table', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the speedrun section
    await page.goto('/[workspace]/pipeline?section=speedrun');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
  });

  test('should render speedrun table with correct columns', async ({ page }) => {
    // Check that all expected columns are present
    const expectedColumns = ['Rank', 'Name', 'Company', 'Status', 'Main-Seller', 'Co-Sellers', 'Last Action', 'Next Action'];
    
    for (const column of expectedColumns) {
      await expect(page.locator(`[data-testid="table-header"]:has-text("${column}")`)).toBeVisible();
    }
  });

  test('should display data in table rows', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Check that at least one row is visible
    const rows = page.locator('[data-testid="table-row"]');
    await expect(rows).toHaveCount({ min: 1 });
    
    // Check that the first row has data in key columns
    const firstRow = rows.first();
    await expect(firstRow.locator('[data-testid="rank-cell"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="name-cell"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="company-cell"]')).toBeVisible();
  });

  test('should sort by rank column', async ({ page }) => {
    // Click on the Rank column header to sort
    await page.click('[data-testid="table-header"]:has-text("Rank")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by rank (ascending)
    const rankCells = page.locator('[data-testid="rank-cell"]');
    const firstRank = await rankCells.first().textContent();
    const secondRank = await rankCells.nth(1).textContent();
    
    expect(parseInt(firstRank || '0')).toBeLessThanOrEqual(parseInt(secondRank || '0'));
  });

  test('should sort by name column', async ({ page }) => {
    // Click on the Name column header to sort
    await page.click('[data-testid="table-header"]:has-text("Name")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by name (ascending)
    const nameCells = page.locator('[data-testid="name-cell"]');
    const firstName = await nameCells.first().textContent();
    const secondName = await nameCells.nth(1).textContent();
    
    expect(firstName).toBeLessThanOrEqual(secondName || '');
  });

  test('should sort by company column', async ({ page }) => {
    // Click on the Company column header to sort
    await page.click('[data-testid="table-header"]:has-text("Company")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by company (ascending)
    const companyCells = page.locator('[data-testid="company-cell"]');
    const firstCompany = await companyCells.first().textContent();
    const secondCompany = await companyCells.nth(1).textContent();
    
    expect(firstCompany).toBeLessThanOrEqual(secondCompany || '');
  });

  test('should sort by status column', async ({ page }) => {
    // Click on the Status column header to sort
    await page.click('[data-testid="table-header"]:has-text("Status")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by status (ascending)
    const statusCells = page.locator('[data-testid="status-cell"]');
    const firstStatus = await statusCells.first().textContent();
    const secondStatus = await statusCells.nth(1).textContent();
    
    expect(firstStatus).toBeLessThanOrEqual(secondStatus || '');
  });

  test('should sort by last action column', async ({ page }) => {
    // Click on the Last Action column header to sort
    await page.click('[data-testid="table-header"]:has-text("Last Action")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by last action (ascending)
    const lastActionCells = page.locator('[data-testid="last-action-cell"]');
    const firstLastAction = await lastActionCells.first().textContent();
    const secondLastAction = await lastActionCells.nth(1).textContent();
    
    expect(firstLastAction).toBeLessThanOrEqual(secondLastAction || '');
  });

  test('should toggle sort direction when clicking same column twice', async ({ page }) => {
    // Click on the Rank column header to sort ascending
    await page.click('[data-testid="table-header"]:has-text("Rank")');
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator shows ascending
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Click on the Rank column header again to sort descending
    await page.click('[data-testid="table-header"]:has-text("Rank")');
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator shows descending
    await expect(page.locator('[data-testid="sort-indicator-desc"]')).toBeVisible();
  });

  test('should display main seller as "Me" for current user', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Check that at least one row shows "Me" in the main seller column
    const mainSellerCells = page.locator('[data-testid="main-seller-cell"]');
    const mainSellerTexts = await mainSellerCells.allTextContents();
    
    expect(mainSellerTexts.some(text => text.includes('Me'))).toBe(true);
  });

  test('should display co-sellers as comma-separated list', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Check that co-sellers are displayed as comma-separated list
    const coSellerCells = page.locator('[data-testid="co-sellers-cell"]');
    const coSellerTexts = await coSellerCells.allTextContents();
    
    // At least one co-seller cell should contain commas (indicating multiple sellers)
    expect(coSellerTexts.some(text => text.includes(','))).toBe(true);
  });

  test('should handle record selection and detail view', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Click on the first row to select it
    const firstRow = page.locator('[data-testid="table-row"]').first();
    await firstRow.click();
    
    // Check that the row is selected
    await expect(firstRow).toHaveClass(/selected/);
    
    // Check that the detail view is visible
    await expect(page.locator('[data-testid="record-detail-panel"]')).toBeVisible();
  });

  test('should handle pagination if applicable', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    
    // Check if pagination controls are visible
    const paginationControls = page.locator('[data-testid="pagination-controls"]');
    
    if (await paginationControls.isVisible()) {
      // Test pagination functionality
      const nextButton = page.locator('[data-testid="pagination-next"]');
      const prevButton = page.locator('[data-testid="pagination-prev"]');
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Check that the page has changed
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toHaveText('2');
      }
    }
  });

  test('should verify data accuracy against API response', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Get the first row's data
    const firstRow = page.locator('[data-testid="table-row"]').first();
    const rank = await firstRow.locator('[data-testid="rank-cell"]').textContent();
    const name = await firstRow.locator('[data-testid="name-cell"]').textContent();
    const company = await firstRow.locator('[data-testid="company-cell"]').textContent();
    const status = await firstRow.locator('[data-testid="status-cell"]').textContent();
    
    // Make an API request to verify the data
    const response = await page.request.get('/api/v1/speedrun');
    const apiData = await response.json();
    
    expect(response.status()).toBe(200);
    expect(apiData.data).toHaveLength({ min: 1 });
    
    // Verify that the first row's data matches the API response
    const firstApiRecord = apiData.data[0];
    expect(rank).toBe(firstApiRecord.rank.toString());
    expect(name).toBe(firstApiRecord.name);
    expect(company).toBe(firstApiRecord.company?.name || '');
    expect(status).toBe(firstApiRecord.status);
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Navigate to the speedrun section
    await page.goto('/[workspace]/pipeline?section=speedrun');
    
    // Check that loading state is shown initially
    await expect(page.locator('[data-testid="table-loading"]')).toBeVisible();
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    
    // Check that loading state is hidden
    await expect(page.locator('[data-testid="table-loading"]')).not.toBeVisible();
  });

  test('should handle empty state correctly', async ({ page }) => {
    // Mock empty response
    await page.route('/api/v1/speedrun', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: {
            total: 0,
            limit: 50,
            page: 1
          }
        })
      });
    });
    
    // Navigate to the speedrun section
    await page.goto('/[workspace]/pipeline?section=speedrun');
    
    // Wait for the empty state to appear
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 });
    
    // Check that empty state is visible
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No speedrun items found');
  });

  test('should handle error states correctly', async ({ page }) => {
    // Mock error response
    await page.route('/api/v1/speedrun', async route => {
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
    
    // Navigate to the speedrun section
    await page.goto('/[workspace]/pipeline?section=speedrun');
    
    // Wait for the error state to appear
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 10000 });
    
    // Check that error state is visible
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Failed to load speedrun data');
  });
});
