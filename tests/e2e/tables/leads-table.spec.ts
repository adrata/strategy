/**
 * Leads Table E2E Tests
 * 
 * Tests the leads table functionality including rendering, sorting, filtering, search, and data accuracy
 */

import { test, expect } from '@playwright/test';

test.describe('Leads Table', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the leads section
    await page.goto('/[workspace]/pipeline?section=leads');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
  });

  test('should render leads table with correct columns', async ({ page }) => {
    // Check that all expected columns are present
    const expectedColumns = ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'];
    
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
    await expect(firstRow.locator('[data-testid="name-cell"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="company-cell"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="title-cell"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="email-cell"]')).toBeVisible();
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

  test('should sort by title column', async ({ page }) => {
    // Click on the Title column header to sort
    await page.click('[data-testid="table-header"]:has-text("Title")');
    
    // Wait for the sort to complete
    await page.waitForTimeout(1000);
    
    // Check that the sort indicator is visible
    await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
    
    // Verify that the data is sorted by title (ascending)
    const titleCells = page.locator('[data-testid="title-cell"]');
    const firstTitle = await titleCells.first().textContent();
    const secondTitle = await titleCells.nth(1).textContent();
    
    expect(firstTitle).toBeLessThanOrEqual(secondTitle || '');
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

  test('should search functionality work correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Get the first row's name for searching
    const firstRow = page.locator('[data-testid="table-row"]').first();
    const searchTerm = await firstRow.locator('[data-testid="name-cell"]').textContent();
    
    if (searchTerm && searchTerm.trim()) {
      // Enter search term
      await page.fill('[data-testid="search-input"]', searchTerm);
      
      // Wait for search to complete
      await page.waitForTimeout(1000);
      
      // Check that the search results are filtered
      const filteredRows = page.locator('[data-testid="table-row"]');
      await expect(filteredRows).toHaveCount({ min: 1 });
      
      // Verify that all visible rows contain the search term
      const nameCells = page.locator('[data-testid="name-cell"]');
      const nameTexts = await nameCells.allTextContents();
      
      nameTexts.forEach(name => {
        expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    }
  });

  test('should filter by status (should show LEAD status only)', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Check that all visible rows have LEAD status
    const statusCells = page.locator('[data-testid="status-cell"]');
    const statusTexts = await statusCells.allTextContents();
    
    statusTexts.forEach(status => {
      expect(status).toBe('LEAD');
    });
  });

  test('should filter by priority', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Click on the priority filter
    await page.click('[data-testid="priority-filter"]');
    
    // Select HIGH priority
    await page.click('[data-testid="priority-filter-option-HIGH"]');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Check that all visible rows have HIGH priority
    const priorityCells = page.locator('[data-testid="priority-cell"]');
    const priorityTexts = await priorityCells.allTextContents();
    
    priorityTexts.forEach(priority => {
      expect(priority).toBe('HIGH');
    });
  });

  test('should filter by company', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Get the first row's company for filtering
    const firstRow = page.locator('[data-testid="table-row"]').first();
    const companyName = await firstRow.locator('[data-testid="company-cell"]').textContent();
    
    if (companyName && companyName.trim()) {
      // Click on the company filter
      await page.click('[data-testid="company-filter"]');
      
      // Select the company
      await page.click(`[data-testid="company-filter-option-${companyName}"]`);
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible rows have the selected company
      const companyCells = page.locator('[data-testid="company-cell"]');
      const companyTexts = await companyCells.allTextContents();
      
      companyTexts.forEach(company => {
        expect(company).toBe(companyName);
      });
    }
  });

  test('should handle record creation and table update', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Get initial row count
    const initialRows = page.locator('[data-testid="table-row"]');
    const initialCount = await initialRows.count();
    
    // Click on the create new lead button
    await page.click('[data-testid="create-lead-button"]');
    
    // Fill in the form
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'Lead');
    await page.fill('[data-testid="email-input"]', 'test.lead@example.com');
    await page.fill('[data-testid="company-input"]', 'Test Company');
    await page.fill('[data-testid="title-input"]', 'Test Title');
    
    // Submit the form
    await page.click('[data-testid="submit-button"]');
    
    // Wait for the form to submit and table to update
    await page.waitForTimeout(2000);
    
    // Check that the table has been updated with the new record
    const updatedRows = page.locator('[data-testid="table-row"]');
    const updatedCount = await updatedRows.count();
    
    expect(updatedCount).toBe(initialCount + 1);
    
    // Check that the new record is visible
    await expect(page.locator('[data-testid="name-cell"]:has-text("Test Lead")')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    
    // Check if pagination controls are visible
    const paginationControls = page.locator('[data-testid="pagination-controls"]');
    
    if (await paginationControls.isVisible()) {
      // Test pagination functionality
      const nextButton = page.locator('[data-testid="pagination-next"]');
      const prevButton = page.locator('[data-testid="pagination-prev"]');
      
      if (await nextButton.isVisible()) {
        // Go to next page
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Check that the page has changed
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toHaveText('2');
        
        // Go back to previous page
        if (await prevButton.isVisible()) {
          await prevButton.click();
          await page.waitForTimeout(1000);
          
          // Check that we're back to page 1
          await expect(currentPage).toHaveText('1');
        }
      }
    }
  });

  test('should verify data accuracy against API response', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Get the first row's data
    const firstRow = page.locator('[data-testid="table-row"]').first();
    const name = await firstRow.locator('[data-testid="name-cell"]').textContent();
    const company = await firstRow.locator('[data-testid="company-cell"]').textContent();
    const title = await firstRow.locator('[data-testid="title-cell"]').textContent();
    const email = await firstRow.locator('[data-testid="email-cell"]').textContent();
    
    // Make an API request to verify the data
    const response = await page.request.get('/api/v1/people?section=leads');
    const apiData = await response.json();
    
    expect(response.status()).toBe(200);
    expect(apiData.people).toHaveLength({ min: 1 });
    
    // Verify that the first row's data matches the API response
    const firstApiRecord = apiData.people[0];
    expect(name).toBe(firstApiRecord.fullName);
    expect(company).toBe(firstApiRecord.company?.name || '');
    expect(title).toBe(firstApiRecord.jobTitle || '');
    expect(email).toBe(firstApiRecord.email || '');
  });

  test('should handle loading states correctly', async ({ page }) => {
    // Navigate to the leads section
    await page.goto('/[workspace]/pipeline?section=leads');
    
    // Check that loading state is shown initially
    await expect(page.locator('[data-testid="table-loading"]')).toBeVisible();
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    
    // Check that loading state is hidden
    await expect(page.locator('[data-testid="table-loading"]')).not.toBeVisible();
  });

  test('should handle empty state correctly', async ({ page }) => {
    // Mock empty response
    await page.route('/api/v1/people?section=leads', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          people: [],
          meta: {
            total: 0,
            limit: 100,
            page: 1
          }
        })
      });
    });
    
    // Navigate to the leads section
    await page.goto('/[workspace]/pipeline?section=leads');
    
    // Wait for the empty state to appear
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 });
    
    // Check that empty state is visible
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No leads found');
  });

  test('should handle error states correctly', async ({ page }) => {
    // Mock error response
    await page.route('/api/v1/people?section=leads', async route => {
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
    
    // Navigate to the leads section
    await page.goto('/[workspace]/pipeline?section=leads');
    
    // Wait for the error state to appear
    await page.waitForSelector('[data-testid="error-state"]', { timeout: 10000 });
    
    // Check that error state is visible
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-state"]')).toContainText('Failed to load leads data');
  });

  test('should clear filters correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
    
    // Apply a filter
    await page.click('[data-testid="priority-filter"]');
    await page.click('[data-testid="priority-filter-option-HIGH"]');
    await page.waitForTimeout(1000);
    
    // Check that filter is applied
    const filteredRows = page.locator('[data-testid="table-row"]');
    const filteredCount = await filteredRows.count();
    
    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');
    await page.waitForTimeout(1000);
    
    // Check that all rows are visible again
    const clearedRows = page.locator('[data-testid="table-row"]');
    const clearedCount = await clearedRows.count();
    
    expect(clearedCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
