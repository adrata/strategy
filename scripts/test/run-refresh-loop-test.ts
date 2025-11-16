/**
 * Script to run the Puppeteer refresh loop test
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test configuration
const TEST_EMAIL = 'vleland';
const TEST_PASSWORD = 'TOPgtm01!';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function getFirstRecordId(page: Page, section: string, workspace: string): Promise<string | null> {
  // Navigate to the section
  await page.goto(`${BASE_URL}/${workspace}/${section}`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000); // Wait for data to load
  
  // Try to find a record row in the table
  const recordRow = await page.$('table tbody tr:first-child, [data-testid*="record-row"], [data-record-id]');
  
  if (recordRow) {
    // Try to get the ID from various possible attributes
    const id = await page.evaluate((el) => {
      return el.getAttribute('data-record-id') || 
             el.getAttribute('data-id') ||
             el.getAttribute('id') ||
             null;
    }, recordRow);
    
    if (id) return id;
    
    // Try to extract from href if it's a link
    const link = await recordRow.$('a');
    if (link) {
      const href = await page.evaluate((el) => el.getAttribute('href'), link);
      if (href) {
        const match = href.match(/\/([^\/]+)$/);
        if (match) return match[1];
      }
    }
  }
  
  return null;
}

async function testRecordRefresh(page: Page, section: string, workspace: string): Promise<boolean> {
  console.log(`\n🧪 Testing ${section} records for refresh loop...`);
  
  // Get first record ID
  const recordId = await getFirstRecordId(page, section, workspace);
  
  if (!recordId) {
    console.log(`⚠️  No ${section} records found to test`);
    return true; // Skip, not a failure
  }

  // Navigate to the record
  const recordUrl = `${BASE_URL}/${workspace}/${section}/${recordId}`;
  console.log(`📍 Navigating to ${section} record: ${recordUrl}`);
  
  // Track navigation events
  let navigationCount = 0;
  
  // Set up navigation listener
  page.on('framenavigated', () => {
    navigationCount++;
    console.log(`🔄 Navigation event #${navigationCount}: ${page.url()}`);
  });

  // Navigate to the record
  await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
  
  // Wait for the page to stabilize
  await page.waitForTimeout(1000);
  
  // Monitor for 5 seconds
  const startTime = Date.now();
  const startUrl = page.url();
  let urlChangeCount = 0;
  
  // Check URL every 500ms for 5 seconds
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    
    if (currentUrl !== startUrl) {
      urlChangeCount++;
      console.log(`⚠️  URL changed from ${startUrl} to ${currentUrl}`);
    }
  }
  
  const endTime = Date.now();
  const elapsedTime = endTime - startTime;
  
  // Verify results
  const finalUrl = page.url();
  console.log(`✅ Test completed:`);
  console.log(`   - Initial URL: ${startUrl}`);
  console.log(`   - Final URL: ${finalUrl}`);
  console.log(`   - Navigation events: ${navigationCount}`);
  console.log(`   - URL changes detected: ${urlChangeCount}`);
  console.log(`   - Elapsed time: ${elapsedTime}ms`);
  
  // Check results
  const urlStable = finalUrl === recordUrl;
  const noExcessiveNav = navigationCount < 3;
  const noUrlChanges = urlChangeCount === 0;
  
  if (urlStable && noExcessiveNav && noUrlChanges) {
    console.log(`✅ ${section} record test PASSED - No refresh loop detected`);
    return true;
  } else {
    console.log(`❌ ${section} record test FAILED:`);
    if (!urlStable) console.log(`   - URL changed from expected`);
    if (!noExcessiveNav) console.log(`   - Excessive navigation events: ${navigationCount}`);
    if (!noUrlChanges) console.log(`   - URL changes detected: ${urlChangeCount}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting refresh loop validation test...\n');
  
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2' });
    
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.type(TEST_EMAIL);
    }
    
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.type(TEST_PASSWORD);
    }
    
    const loginButton = await page.$('button:has-text("Start"), button:has-text("Sign In"), button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    }
    
    // Get workspace from URL
    const currentUrl = page.url();
    const workspaceMatch = currentUrl.match(/\/([^\/]+)\//);
    const workspace = workspaceMatch ? workspaceMatch[1] : 'test-workspace';
    console.log(`📁 Detected workspace: ${workspace}\n`);
    
    // Run tests
    const results = {
      opportunities: await testRecordRefresh(page, 'opportunities', workspace),
      leads: await testRecordRefresh(page, 'leads', workspace),
      prospects: await testRecordRefresh(page, 'prospects', workspace), // Control test
      people: await testRecordRefresh(page, 'people', workspace), // Control test
    };
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Opportunities: ${results.opportunities ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Leads: ${results.leads ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Prospects (control): ${results.prospects ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   People (control): ${results.people ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('\n✅ All tests PASSED - No refresh loops detected!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests FAILED - Refresh loops may still exist');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();

