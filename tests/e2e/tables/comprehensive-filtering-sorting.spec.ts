/**
 * Comprehensive E2E Tests for All Table Filtering and Sorting
 * 
 * Tests all 9 filter types and sorting functionality across all table sections
 */

import { test, expect } from '@playwright/test';

const TABLE_SECTIONS = [
  { section: 'speedrun', hasPriority: true, hasTimezone: true },
  { section: 'leads', hasPriority: true, hasTimezone: true },
  { section: 'prospects', hasPriority: true, hasTimezone: false },
  { section: 'opportunities', hasPriority: true, hasTimezone: false },
  { section: 'companies', hasPriority: false, hasTimezone: false },
  { section: 'people', hasPriority: false, hasTimezone: false },
  { section: 'clients', hasPriority: false, hasTimezone: false },
  { section: 'partners', hasPriority: false, hasTimezone: false }
];

test.describe('Comprehensive Table Filtering and Sorting', () => {
  for (const { section, hasPriority, hasTimezone } of TABLE_SECTIONS) {
    test.describe(`${section} table filtering and sorting`, () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to the section
        await page.goto(`/[workspace]/pipeline?section=${section}`);
        
        // Wait for the table to load
        await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
        
        // Wait for data to load
        await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
      });

      // ===== SEARCH FILTER TESTS =====
      test(`should filter by search term in ${section}`, async ({ page }) => {
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

      test(`should clear search filter in ${section}`, async ({ page }) => {
        // Enter a search term
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForTimeout(1000);
        
        // Clear the search
        await page.fill('[data-testid="search-input"]', '');
        await page.waitForTimeout(1000);
        
        // Verify all rows are visible again
        const allRows = page.locator('[data-testid="table-row"]');
        await expect(allRows).toHaveCount({ min: 1 });
      });

      // ===== VERTICAL/INDUSTRY FILTER TESTS =====
      test(`should filter by vertical/industry in ${section}`, async ({ page }) => {
        // Click on the vertical filter dropdown
        await page.click('[data-testid="vertical-filter"]');
        
        // Select an industry option
        const industryOption = page.locator('[data-testid="vertical-filter-option"]').first();
        if (await industryOption.isVisible()) {
          const industryValue = await industryOption.textContent();
          await industryOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows have the selected industry
          const industryCells = page.locator('[data-testid="industry-cell"]');
          if (await industryCells.first().isVisible()) {
            const industryTexts = await industryCells.allTextContents();
            industryTexts.forEach(industry => {
              expect(industry.toLowerCase()).toContain(industryValue?.toLowerCase() || '');
            });
          }
        }
      });

      // ===== STATUS FILTER TESTS =====
      test(`should filter by status in ${section}`, async ({ page }) => {
        // Click on the status filter dropdown
        await page.click('[data-testid="status-filter"]');
        
        // Select a status option
        const statusOption = page.locator('[data-testid="status-filter-option"]').first();
        if (await statusOption.isVisible()) {
          const statusValue = await statusOption.textContent();
          await statusOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows have the selected status
          const statusCells = page.locator('[data-testid="status-cell"]');
          if (await statusCells.first().isVisible()) {
            const statusTexts = await statusCells.allTextContents();
            statusTexts.forEach(status => {
              expect(status.toLowerCase()).toContain(statusValue?.toLowerCase() || '');
            });
          }
        }
      });

      // ===== PRIORITY FILTER TESTS (if applicable) =====
      if (hasPriority) {
        test(`should filter by priority in ${section}`, async ({ page }) => {
          // Click on the priority filter dropdown
          await page.click('[data-testid="priority-filter"]');
          
          // Select a priority option
          const priorityOption = page.locator('[data-testid="priority-filter-option-high"]');
          if (await priorityOption.isVisible()) {
            await priorityOption.click();
            
            // Wait for filter to apply
            await page.waitForTimeout(1000);
            
            // Verify that all visible rows have high priority
            const priorityCells = page.locator('[data-testid="priority-cell"]');
            if (await priorityCells.first().isVisible()) {
              const priorityTexts = await priorityCells.allTextContents();
              priorityTexts.forEach(priority => {
                expect(priority.toLowerCase()).toContain('high');
              });
            }
          }
        });
      }

      // ===== REVENUE FILTER TESTS =====
      test(`should filter by revenue in ${section}`, async ({ page }) => {
        // Click on the revenue filter dropdown
        await page.click('[data-testid="revenue-filter"]');
        
        // Select a revenue option
        const revenueOption = page.locator('[data-testid="revenue-filter-option-medium"]');
        if (await revenueOption.isVisible()) {
          await revenueOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows have medium revenue
          const revenueCells = page.locator('[data-testid="revenue-cell"]');
          if (await revenueCells.first().isVisible()) {
            const revenueTexts = await revenueCells.allTextContents();
            revenueTexts.forEach(revenue => {
              // Check if revenue is in the medium range ($10M-$100M)
              const revenueValue = parseFloat(revenue?.replace(/[$,]/g, '') || '0');
              expect(revenueValue).toBeGreaterThanOrEqual(10000000);
              expect(revenueValue).toBeLessThanOrEqual(100000000);
            });
          }
        }
      });

      // ===== LAST CONTACTED FILTER TESTS =====
      test(`should filter by last contacted in ${section}`, async ({ page }) => {
        // Click on the last contacted filter dropdown
        await page.click('[data-testid="last-contacted-filter"]');
        
        // Select a time option
        const timeOption = page.locator('[data-testid="last-contacted-filter-option-week"]');
        if (await timeOption.isVisible()) {
          await timeOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows were contacted within the last week
          const lastContactCells = page.locator('[data-testid="last-contact-cell"]');
          if (await lastContactCells.first().isVisible()) {
            const contactTexts = await lastContactCells.allTextContents();
            contactTexts.forEach(contact => {
              // Check if contact was within the last week
              expect(contact.toLowerCase()).toMatch(/today|yesterday|\d+ days ago|this week/);
            });
          }
        }
      });

      // ===== TIMEZONE FILTER TESTS (if applicable) =====
      if (hasTimezone) {
        test(`should filter by timezone in ${section}`, async ({ page }) => {
          // Click on the timezone filter dropdown
          await page.click('[data-testid="timezone-filter"]');
          
          // Select a timezone option
          const timezoneOption = page.locator('[data-testid="timezone-filter-option"]').first();
          if (await timezoneOption.isVisible()) {
            const timezoneValue = await timezoneOption.textContent();
            await timezoneOption.click();
            
            // Wait for filter to apply
            await page.waitForTimeout(1000);
            
            // Verify that all visible rows have the selected timezone
            const timezoneCells = page.locator('[data-testid="timezone-cell"]');
            if (await timezoneCells.first().isVisible()) {
              const timezoneTexts = await timezoneCells.allTextContents();
              timezoneTexts.forEach(timezone => {
                expect(timezone.toLowerCase()).toContain(timezoneValue?.toLowerCase() || '');
              });
            }
          }
        });
      }

      // ===== COMPANY SIZE FILTER TESTS =====
      test(`should filter by company size in ${section}`, async ({ page }) => {
        // Click on the company size filter dropdown
        await page.click('[data-testid="company-size-filter"]');
        
        // Select a size option
        const sizeOption = page.locator('[data-testid="company-size-filter-option-medium"]');
        if (await sizeOption.isVisible()) {
          await sizeOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows have medium company size
          const sizeCells = page.locator('[data-testid="company-size-cell"]');
          if (await sizeCells.first().isVisible()) {
            const sizeTexts = await sizeCells.allTextContents();
            sizeTexts.forEach(size => {
              expect(size.toLowerCase()).toContain('medium');
            });
          }
        }
      });

      // ===== LOCATION FILTER TESTS =====
      test(`should filter by location in ${section}`, async ({ page }) => {
        // Click on the location filter dropdown
        await page.click('[data-testid="location-filter"]');
        
        // Select a location option
        const locationOption = page.locator('[data-testid="location-filter-option"]').first();
        if (await locationOption.isVisible()) {
          const locationValue = await locationOption.textContent();
          await locationOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // Verify that all visible rows have the selected location
          const locationCells = page.locator('[data-testid="location-cell"]');
          if (await locationCells.first().isVisible()) {
            const locationTexts = await locationCells.allTextContents();
            locationTexts.forEach(location => {
              expect(location.toLowerCase()).toContain(locationValue?.toLowerCase() || '');
            });
          }
        }
      });

      // ===== MULTIPLE FILTERS TESTS =====
      test(`should apply multiple filters together in ${section}`, async ({ page }) => {
        // Apply search filter
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForTimeout(500);
        
        // Apply status filter
        await page.click('[data-testid="status-filter"]');
        const statusOption = page.locator('[data-testid="status-filter-option"]').first();
        if (await statusOption.isVisible()) {
          await statusOption.click();
          await page.waitForTimeout(500);
        }
        
        // Apply industry filter
        await page.click('[data-testid="vertical-filter"]');
        const industryOption = page.locator('[data-testid="vertical-filter-option"]').first();
        if (await industryOption.isVisible()) {
          await industryOption.click();
          await page.waitForTimeout(500);
        }
        
        // Verify that filters are applied together
        const filteredRows = page.locator('[data-testid="table-row"]');
        await expect(filteredRows).toHaveCount({ min: 0 }); // Could be 0 if no matches
        
        // Clear all filters
        await page.click('[data-testid="clear-filters"]');
        await page.waitForTimeout(1000);
        
        // Verify all rows are visible again
        const allRows = page.locator('[data-testid="table-row"]');
        await expect(allRows).toHaveCount({ min: 1 });
      });

      // ===== SORTING TESTS =====
      test(`should sort by name column in ${section}`, async ({ page }) => {
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
        
        // Click again to sort descending
        await page.click('[data-testid="table-header"]:has-text("Name")');
        await page.waitForTimeout(1000);
        
        // Check that the sort indicator shows descending
        await expect(page.locator('[data-testid="sort-indicator-desc"]')).toBeVisible();
        
        // Verify that the data is sorted by name (descending)
        const firstNameDesc = await nameCells.first().textContent();
        const secondNameDesc = await nameCells.nth(1).textContent();
        
        expect(firstNameDesc).toBeGreaterThanOrEqual(secondNameDesc || '');
      });

      test(`should sort by company column in ${section}`, async ({ page }) => {
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

      test(`should sort by rank column in ${section}`, async ({ page }) => {
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
        
        const firstRankValue = parseInt(firstRank || '0', 10);
        const secondRankValue = parseInt(secondRank || '0', 10);
        
        expect(firstRankValue).toBeLessThanOrEqual(secondRankValue);
      });

      test(`should sort by last action column in ${section}`, async ({ page }) => {
        // Click on the Last Action column header to sort
        await page.click('[data-testid="table-header"]:has-text("Last Action")');
        
        // Wait for the sort to complete
        await page.waitForTimeout(1000);
        
        // Check that the sort indicator is visible
        await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
        
        // Verify that the data is sorted by last action (ascending - oldest first)
        const lastActionCells = page.locator('[data-testid="last-action-cell"]');
        const firstAction = await lastActionCells.first().textContent();
        const secondAction = await lastActionCells.nth(1).textContent();
        
        // For date sorting, we expect chronological order
        expect(firstAction).toBeLessThanOrEqual(secondAction || '');
      });

      // ===== COMBINED FILTERS + SORTING TESTS =====
      test(`should apply filters and sorting together in ${section}`, async ({ page }) => {
        // Apply a filter first
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForTimeout(1000);
        
        // Then apply sorting
        await page.click('[data-testid="table-header"]:has-text("Name")');
        await page.waitForTimeout(1000);
        
        // Verify both filter and sort are applied
        const filteredRows = page.locator('[data-testid="table-row"]');
        await expect(filteredRows).toHaveCount({ min: 0 });
        
        // Verify sort indicator is visible
        await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
        
        // Verify that filtered results are sorted
        const nameCells = page.locator('[data-testid="name-cell"]');
        if (await nameCells.count() > 1) {
          const firstName = await nameCells.first().textContent();
          const secondName = await nameCells.nth(1).textContent();
          expect(firstName).toBeLessThanOrEqual(secondName || '');
        }
      });

      // ===== FILTER STATE PERSISTENCE TESTS =====
      test(`should maintain filter state when navigating in ${section}`, async ({ page }) => {
        // Apply a filter
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForTimeout(1000);
        
        // Click on a record to navigate to detail view
        const firstRow = page.locator('[data-testid="table-row"]').first();
        if (await firstRow.isVisible()) {
          await firstRow.click();
          await page.waitForTimeout(1000);
          
          // Navigate back to the list
          await page.click('[data-testid="back-button"]');
          await page.waitForTimeout(1000);
          
          // Verify that the filter is still applied
          const searchInput = page.locator('[data-testid="search-input"]');
          await expect(searchInput).toHaveValue('test');
        }
      });

      // ===== PERFORMANCE TESTS =====
      test(`should handle large datasets efficiently in ${section}`, async ({ page }) => {
        // Measure time to load and render table
        const startTime = Date.now();
        
        // Wait for table to be fully loaded
        await page.waitForSelector('[data-testid="table-row"]', { timeout: 10000 });
        
        const loadTime = Date.now() - startTime;
        
        // Table should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
        
        // Apply a filter and measure filter time
        const filterStartTime = Date.now();
        await page.fill('[data-testid="search-input"]', 'test');
        await page.waitForTimeout(1000);
        const filterTime = Date.now() - filterStartTime;
        
        // Filter should apply within 2 seconds
        expect(filterTime).toBeLessThan(2000);
      });
    });
  }

  // ===== SECTION-SPECIFIC TESTS =====
  test.describe('Speedrun-specific tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/[workspace]/pipeline?section=speedrun');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    });

    test('should sort by rank with proper direction toggle', async ({ page }) => {
      // Click on the Rank column header to sort ascending
      await page.click('[data-testid="table-header"]:has-text("Rank")');
      await page.waitForTimeout(1000);
      
      // Verify ascending sort (1, 2, 3...)
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      const rankCells = page.locator('[data-testid="rank-cell"]');
      const firstRank = await rankCells.first().textContent();
      const secondRank = await rankCells.nth(1).textContent();
      
      const firstRankValue = parseInt(firstRank || '0', 10);
      const secondRankValue = parseInt(secondRank || '0', 10);
      
      expect(firstRankValue).toBeLessThanOrEqual(secondRankValue);
      
      // Click again to sort descending
      await page.click('[data-testid="table-header"]:has-text("Rank")');
      await page.waitForTimeout(1000);
      
      // Verify descending sort (50, 49, 48...)
      await expect(page.locator('[data-testid="sort-indicator-desc"]')).toBeVisible();
      
      const firstRankDesc = await rankCells.first().textContent();
      const secondRankDesc = await rankCells.nth(1).textContent();
      
      const firstRankValueDesc = parseInt(firstRankDesc || '0', 10);
      const secondRankValueDesc = parseInt(secondRankDesc || '0', 10);
      
      expect(firstRankValueDesc).toBeGreaterThanOrEqual(secondRankValueDesc);
    });
  });

  test.describe('Opportunities-specific tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/[workspace]/pipeline?section=opportunities');
      await page.waitForSelector('[data-testid="pipeline-table"]', { timeout: 10000 });
    });

    test('should sort by amount column', async ({ page }) => {
      // Click on the Amount column header to sort
      await page.click('[data-testid="table-header"]:has-text("Amount")');
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
      await page.waitForTimeout(1000);
      
      // Check that the sort indicator is visible
      await expect(page.locator('[data-testid="sort-indicator-asc"]')).toBeVisible();
      
      // Verify that the data is sorted by stage (ascending)
      const stageCells = page.locator('[data-testid="stage-cell"]');
      const firstStage = await stageCells.first().textContent();
      const secondStage = await stageCells.nth(1).textContent();
      
      expect(firstStage).toBeLessThanOrEqual(secondStage || '');
    });
  });
});
