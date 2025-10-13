/**
 * Comprehensive E2E Tests for All Table Sections
 * 
 * Tests all table sections (prospects, opportunities, companies, people) with common functionality
 */

import { test, expect } from '@playwright/test';

const TABLE_SECTIONS = [
  { section: 'prospects', expectedColumns: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'] },
  { section: 'opportunities', expectedColumns: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'] },
  { section: 'companies', expectedColumns: ['Company', 'Last Action', 'Next Action', 'Industry', 'Size', 'Revenue'] },
  { section: 'people', expectedColumns: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'] }
];

test.describe('All Table Sections', () => {
  for (const { section, expectedColumns } of TABLE_SECTIONS) {
    test.describe(`${section} table`, () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to the section
        await page.goto(`/[workspace]/pipeline?section=${section}`);
        
        // Wait for the table to load
        await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
      });

      test(`should render ${section} table with correct columns`, async ({ page }) => {
        // Check that all expected columns are present
        for (const column of expectedColumns) {
          await expect(page.locator(`[data-testid="table-header"]:has-text("${column}")`)).toBeVisible();
        }
      });

      test(`should display data in ${section} table rows`, async ({ page }) => {
        // Wait for data to load
        await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
        
        // Check that at least one row is visible
        const rows = page.locator('[data-testid="table-row"]');
        await expect(rows).toHaveCount({ min: 1 });
        
        // Check that the first row has data in key columns
        const firstRow = rows.first();
        await expect(firstRow.locator('[data-testid="name-cell"]')).toBeVisible();
        await expect(firstRow.locator('[data-testid="company-cell"]')).toBeVisible();
      });

      test(`should sort by name column in ${section} table`, async ({ page }) => {
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

      test(`should sort by company column in ${section} table`, async ({ page }) => {
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

      test(`should search functionality work in ${section} table`, async ({ page }) => {
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

      test(`should handle record selection in ${section} table`, async ({ page }) => {
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

      test(`should handle pagination in ${section} table`, async ({ page }) => {
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

      test(`should verify data accuracy against API response for ${section}`, async ({ page }) => {
        // Wait for data to load
        await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
        
        // Get the first row's data
        const firstRow = page.locator('[data-testid="table-row"]').first();
        const name = await firstRow.locator('[data-testid="name-cell"]').textContent();
        const company = await firstRow.locator('[data-testid="company-cell"]').textContent();
        
        // Make an API request to verify the data
        const apiEndpoint = section === 'companies' ? '/api/v1/companies' : '/api/v1/people';
        const queryParams = section === 'companies' ? '' : `?section=${section}`;
        const response = await page.request.get(`${apiEndpoint}${queryParams}`);
        const apiData = await response.json();
        
        expect(response.status()).toBe(200);
        
        // Verify that the first row's data matches the API response
        const firstApiRecord = apiData.people?.[0] || apiData.data?.[0];
        if (firstApiRecord) {
          expect(name).toBe(firstApiRecord.fullName || firstApiRecord.name);
          expect(company).toBe(firstApiRecord.company?.name || '');
        }
      });

      test(`should handle loading states correctly in ${section} table`, async ({ page }) => {
        // Navigate to the section
        await page.goto(`/[workspace]/pipeline?section=${section}`);
        
        // Check that loading state is shown initially
        await expect(page.locator('[data-testid="table-loading"]')).toBeVisible();
        
        // Wait for the table to load
        await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
        
        // Check that loading state is hidden
        await expect(page.locator('[data-testid="table-loading"]')).not.toBeVisible();
      });

      test(`should handle empty state correctly in ${section} table`, async ({ page }) => {
        // Mock empty response
        const apiEndpoint = section === 'companies' ? '/api/v1/companies' : '/api/v1/people';
        const queryParams = section === 'companies' ? '' : `?section=${section}`;
        
        await page.route(`${apiEndpoint}${queryParams}`, async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              people: [],
              data: [],
              meta: {
                total: 0,
                limit: 100,
                page: 1
              }
            })
          });
        });
        
        // Navigate to the section
        await page.goto(`/[workspace]/pipeline?section=${section}`);
        
        // Wait for the empty state to appear
        await page.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 });
        
        // Check that empty state is visible
        await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="empty-state"]')).toContainText(`No ${section} found`);
      });

      test(`should handle error states correctly in ${section} table`, async ({ page }) => {
        // Mock error response
        const apiEndpoint = section === 'companies' ? '/api/v1/companies' : '/api/v1/people';
        const queryParams = section === 'companies' ? '' : `?section=${section}`;
        
        await page.route(`${apiEndpoint}${queryParams}`, async route => {
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
        
        // Navigate to the section
        await page.goto(`/[workspace]/pipeline?section=${section}`);
        
        // Wait for the error state to appear
        await page.waitForSelector('[data-testid="error-state"]', { timeout: 10000 });
        
        // Check that error state is visible
        await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-state"]')).toContainText(`Failed to load ${section} data`);
      });
    });
  }

  // Section-specific tests
  test.describe('Opportunities Table Specific Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/[workspace]/pipeline?section=opportunities');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    });

    test('should sort by amount column', async ({ page }) => {
      // Click on the Amount column header to sort
      await page.click('[data-testid="table-header"]:has-text("Amount")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by amount (ascending)
      const amountCells = page.locator('[data-testid="amount-cell"]');
      const firstAmount = await amountCells.first().textContent();
      const secondAmount = await amountCells.nth(1).textContent();
      
      // Parse amounts (remove currency symbols and commas)
      const firstAmountValue = parseFloat(firstAmount?.replace(/[$,]/g, '') || '0');
      const secondAmountValue = parseFloat(secondAmount?.replace(/[$,]/g, '') || '0');
      
      expect(firstAmountValue).toBeLessThanOrEqual(secondAmountValue);
    });

    test('should sort by stage column', async ({ page }) => {
      // Click on the Stage column header to sort
      await page.click('[data-testid="table-header"]:has-text("Stage")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by stage (ascending)
      const stageCells = page.locator('[data-testid="stage-cell"]');
      const firstStage = await stageCells.first().textContent();
      const secondStage = await stageCells.nth(1).textContent();
      
      expect(firstStage).toBeLessThanOrEqual(secondStage || '');
    });

    test('should sort by close date column', async ({ page }) => {
      // Click on the Close Date column header to sort
      await page.click('[data-testid="table-header"]:has-text("Close Date")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by close date (ascending)
      const closeDateCells = page.locator('[data-testid="close-date-cell"]');
      const firstCloseDate = await closeDateCells.first().textContent();
      const secondCloseDate = await closeDateCells.nth(1).textContent();
      
      expect(firstCloseDate).toBeLessThanOrEqual(secondCloseDate || '');
    });

    test('should filter by stage', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
      
      // Click on the stage filter
      await page.click('[data-testid="stage-filter"]');
      
      // Select a stage
      await page.click('[data-testid="stage-filter-option-proposal"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible rows have the selected stage
      const stageCells = page.locator('[data-testid="stage-cell"]');
      const stageTexts = await stageCells.allTextContents();
      
      stageTexts.forEach(stage => {
        expect(stage).toBe('proposal');
      });
    });

    test('should filter by amount range', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
      
      // Click on the amount filter
      await page.click('[data-testid="amount-filter"]');
      
      // Select an amount range
      await page.click('[data-testid="amount-filter-option-100000-500000"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible rows have amounts in the selected range
      const amountCells = page.locator('[data-testid="amount-cell"]');
      const amountTexts = await amountCells.allTextContents();
      
      amountTexts.forEach(amount => {
        const amountValue = parseFloat(amount?.replace(/[$,]/g, '') || '0');
        expect(amountValue).toBeGreaterThanOrEqual(100000);
        expect(amountValue).toBeLessThanOrEqual(500000);
      });
    });
  });

  test.describe('Companies Table Specific Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/[workspace]/pipeline?section=companies');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    });

    test('should sort by industry column', async ({ page }) => {
      // Click on the Industry column header to sort
      await page.click('[data-testid="table-header"]:has-text("Industry")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by industry (ascending)
      const industryCells = page.locator('[data-testid="industry-cell"]');
      const firstIndustry = await industryCells.first().textContent();
      const secondIndustry = await industryCells.nth(1).textContent();
      
      expect(firstIndustry).toBeLessThanOrEqual(secondIndustry || '');
    });

    test('should sort by size column', async ({ page }) => {
      // Click on the Size column header to sort
      await page.click('[data-testid="table-header"]:has-text("Size")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by size (ascending)
      const sizeCells = page.locator('[data-testid="size-cell"]');
      const firstSize = await sizeCells.first().textContent();
      const secondSize = await sizeCells.nth(1).textContent();
      
      expect(firstSize).toBeLessThanOrEqual(secondSize || '');
    });

    test('should sort by revenue column', async ({ page }) => {
      // Click on the Revenue column header to sort
      await page.click('[data-testid="table-header"]:has-text("Revenue")');
      
      // Wait for the sort to complete
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by revenue (ascending)
      const revenueCells = page.locator('[data-testid="revenue-cell"]');
      const firstRevenue = await revenueCells.first().textContent();
      const secondRevenue = await revenueCells.nth(1).textContent();
      
      // Parse revenues (remove currency symbols and commas)
      const firstRevenueValue = parseFloat(firstRevenue?.replace(/[$,]/g, '') || '0');
      const secondRevenueValue = parseFloat(secondRevenue?.replace(/[$,]/g, '') || '0');
      
      expect(firstRevenueValue).toBeLessThanOrEqual(secondRevenueValue);
    });

    test('should filter by industry', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
      
      // Click on the industry filter
      await page.click('[data-testid="industry-filter"]');
      
      // Select an industry
      await page.click('[data-testid="industry-filter-option-Technology"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible rows have the selected industry
      const industryCells = page.locator('[data-testid="industry-cell"]');
      const industryTexts = await industryCells.allTextContents();
      
      industryTexts.forEach(industry => {
        expect(industry).toBe('Technology');
      });
    });

    test('should filter by company size', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
      
      // Click on the company size filter
      await page.click('[data-testid="company-size-filter"]');
      
      // Select a size
      await page.click('[data-testid="company-size-filter-option-medium"]');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Check that all visible rows have the selected size
      const sizeCells = page.locator('[data-testid="size-cell"]');
      const sizeTexts = await sizeCells.allTextContents();
      
      sizeTexts.forEach(size => {
        expect(size).toBe('medium');
      });
    });
  });
});
