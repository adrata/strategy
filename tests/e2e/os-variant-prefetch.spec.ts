/**
 * E2E Tests: OS Variant Pre-fetching
 * 
 * Tests that pre-fetching works correctly for all OS variants:
 * - acquisition-os
 * - retention-os
 * - expansion-os
 * 
 * This test verifies:
 * 1. Pre-fetching is triggered after login for OS variant paths
 * 2. Data is cached in localStorage correctly
 * 3. OS type parameter is passed to APIs
 * 4. Section detection works for OS variant paths
 */

import { test, expect } from '@playwright/test';

// Test credentials - should be set via environment variables in CI
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@adrata.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'adrata';

test.describe('OS Variant Pre-fetching E2E Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage and cookies before each test
    await context.clearCookies();
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Acquisition OS Pre-fetching', () => {
    test('pre-fetches data when logging in to acquisition-os/leads', async ({ page }) => {
      // Intercept network requests to verify pre-fetching
      const prefetchRequests: string[] = [];
      const apiCalls: Array<{ url: string; headers: Record<string, string> }> = [];

      // Monitor fetch requests
      await page.route('**/api/**', async (route) => {
        const url = route.request().url();
        const headers = route.request().headers();
        
        apiCalls.push({ url, headers });
        
        // Continue with the actual request
        await route.continue();
      });

      // Fill in login form
      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);
      
      // Mock successful authentication with acquisition-os redirect
      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/acquisition-os/leads`,
          }),
        });
      });

      // Submit form
      await page.getByRole('button', { name: 'Start' }).click();

      // Wait for redirect to start (pre-fetch happens before redirect)
      await page.waitForTimeout(1000); // Give time for pre-fetch to start

      // Check that pre-fetch requests were made
      const countsApiCall = apiCalls.find(call => call.url.includes('/api/data/counts'));
      const sectionApiCall = apiCalls.find(call => 
        call.url.includes('/api/v1/people') && call.url.includes('section=leads')
      );

      expect(countsApiCall, 'Counts API should be called for pre-fetch').toBeDefined();
      expect(sectionApiCall, 'Section API should be called for pre-fetch').toBeDefined();
      
      // Verify OS type parameter is included
      if (sectionApiCall) {
        expect(sectionApiCall.url).toContain('osType=acquisition');
      }

      // Check localStorage for cached data
      const cachedCounts = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k.startsWith('adrata-counts-'));
        return key ? localStorage.getItem(key) : null;
      });

      const cachedSection = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => 
          k.includes('leads') || k.includes('section')
        );
        return key ? localStorage.getItem(key) : null;
      });

      expect(cachedCounts, 'Counts should be cached in localStorage').toBeTruthy();
      expect(cachedSection, 'Section data should be cached in localStorage').toBeTruthy();
    });

    test('pre-fetches with correct osType for acquisition-os/prospects', async ({ page }) => {
      const apiCalls: string[] = [];

      await page.route('**/api/**', async (route) => {
        apiCalls.push(route.request().url());
        await route.continue();
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/acquisition-os/prospects`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      const prospectsCall = apiCalls.find(url => 
        url.includes('/api/v1/people') && 
        url.includes('section=prospects') &&
        url.includes('osType=acquisition')
      );

      expect(prospectsCall, 'Prospects API should be called with osType=acquisition').toBeDefined();
    });
  });

  test.describe('Retention OS Pre-fetching', () => {
    test('pre-fetches data when logging in to retention-os/clients', async ({ page }) => {
      const apiCalls: string[] = [];

      await page.route('**/api/**', async (route) => {
        apiCalls.push(route.request().url());
        await route.continue();
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/retention-os/clients`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      // Check for clients API call with retention OS type
      const clientsCall = apiCalls.find(url => 
        (url.includes('/api/v1/companies') || url.includes('/api/v1/people')) &&
        (url.includes('clients') || url.includes('status=CLIENT')) &&
        url.includes('osType=retention')
      );

      expect(clientsCall, 'Clients API should be called with osType=retention').toBeDefined();

      // Verify localStorage cache
      const cachedData = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return keys.filter(k => k.includes('clients') || k.includes('section'));
      });

      expect(cachedData.length, 'Section data should be cached').toBeGreaterThan(0);
    });
  });

  test.describe('Expansion OS Pre-fetching', () => {
    test('pre-fetches data when logging in to expansion-os/prospects', async ({ page }) => {
      const apiCalls: string[] = [];

      await page.route('**/api/**', async (route) => {
        apiCalls.push(route.request().url());
        await route.continue();
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/expansion-os/prospects`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      const prospectsCall = apiCalls.find(url => 
        url.includes('/api/v1/people') && 
        url.includes('section=prospects') &&
        url.includes('osType=expansion')
      );

      expect(prospectsCall, 'Prospects API should be called with osType=expansion').toBeDefined();
    });

    test('pre-fetches opportunities for expansion-os', async ({ page }) => {
      const apiCalls: string[] = [];

      await page.route('**/api/**', async (route) => {
        apiCalls.push(route.request().url());
        await route.continue();
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/expansion-os/opportunities`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      const opportunitiesCall = apiCalls.find(url => 
        url.includes('/api/v1/people') && 
        url.includes('section=opportunities') &&
        url.includes('osType=expansion')
      );

      expect(opportunitiesCall, 'Opportunities API should be called with osType=expansion').toBeDefined();
    });
  });

  test.describe('Pre-fetch Cache Verification', () => {
    test('caches counts data with correct workspace ID', async ({ page }) => {
      const workspaceId = 'test-workspace-id';

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: workspaceId,
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/acquisition-os/leads`,
          }),
        });
      });

      // Mock counts API response
      await page.route('**/api/data/counts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              leads: 10,
              prospects: 5,
              opportunities: 3,
            },
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(2000); // Wait for pre-fetch to complete

      // Check localStorage for cached counts
      const cachedCounts = await page.evaluate((wsId) => {
        const key = `adrata-counts-${wsId}`;
        const cached = localStorage.getItem(key);
        return cached ? JSON.parse(cached) : null;
      }, workspaceId);

      expect(cachedCounts, 'Counts should be cached').toBeTruthy();
      expect(cachedCounts.data, 'Cached counts should have data').toBeTruthy();
      expect(cachedCounts.ts, 'Cached counts should have timestamp').toBeTruthy();
    });

    test('caches section data with correct section name', async ({ page }) => {
      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/acquisition-os/leads`,
          }),
        });
      });

      // Mock section API response
      await page.route('**/api/v1/people**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: '1', name: 'Test Person 1' },
              { id: '2', name: 'Test Person 2' },
            ],
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(2000);

      // Check for cached section data
      const cachedSections = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return keys
          .filter(k => k.includes('section') || k.includes('leads'))
          .map(k => ({ key: k, data: localStorage.getItem(k) }));
      });

      expect(cachedSections.length, 'Section data should be cached').toBeGreaterThan(0);
    });
  });

  test.describe('Path Detection', () => {
    test('correctly detects OS type from acquisition-os path', async ({ page }) => {
      const detectedPaths: string[] = [];

      // Monitor console logs for path detection
      page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('[AUTH PREFETCH] Detected section and OS from path')) {
          detectedPaths.push(text);
        }
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/acquisition-os/leads`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      // Verify path detection occurred
      expect(detectedPaths.length, 'Path detection should be logged').toBeGreaterThan(0);
    });

    test('handles nested OS variant paths correctly', async ({ page }) => {
      const apiCalls: string[] = [];

      await page.route('**/api/**', async (route) => {
        apiCalls.push(route.request().url());
        await route.continue();
      });

      await page.getByLabel('Username or Email').fill(TEST_EMAIL);
      await page.getByLabel('Password').fill(TEST_PASSWORD);

      await page.route('**/api/auth/sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session: {
              user: {
                id: 'test-user-id',
                email: TEST_EMAIL,
                activeWorkspaceId: 'test-workspace-id',
              },
            },
            redirectTo: `/${TEST_WORKSPACE}/retention-os/clients`,
          }),
        });
      });

      await page.getByRole('button', { name: 'Start' }).click();
      await page.waitForTimeout(1000);

      // Verify retention OS type is detected and used
      const retentionCall = apiCalls.find(url => url.includes('osType=retention'));
      expect(retentionCall, 'Retention OS type should be detected and used').toBeDefined();
    });
  });
});

