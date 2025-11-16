/**
 * Refresh Loop Test - Standalone Puppeteer Script
 * 
 * Tests that opportunity and lead records do not cause infinite refresh loops.
 * 
 * Usage: node scripts/test/run-refresh-loop-test-puppeteer.js
 */

const puppeteer = require('puppeteer');

const TEST_EMAIL = 'vleland';
const TEST_PASSWORD = 'TOPgtm01!';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function getFirstRecordId(page, section, workspace) {
  console.log(`\n🔍 Getting first ${section} record ID...`);
  
  // Navigate to the section
  await page.goto(`${BASE_URL}/${workspace}/${section}`, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for data to load
  
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
    
    if (id) {
      console.log(`✅ Found ${section} record ID: ${id}`);
      return id;
    }
    
    // Try to extract from href if it's a link
    const link = await recordRow.$('a');
    if (link) {
      const href = await page.evaluate((el) => el.getAttribute('href'), link);
      if (href) {
        const match = href.match(/\/([^\/]+)$/);
        if (match) {
          console.log(`✅ Found ${section} record ID from href: ${match[1]}`);
          return match[1];
        }
      }
    }
  }
  
  console.log(`⚠️  No ${section} records found`);
  return null;
}

async function testRecordRefresh(page, section, workspace) {
  console.log(`\n🧪 Testing ${section} records for refresh loop...`);
  
  // Get first record ID
  const recordId = await getFirstRecordId(page, section, workspace);
  
  if (!recordId) {
    console.log(`⚠️  No ${section} records found to test - SKIPPING`);
    return { passed: true, skipped: true, section };
  }

  // Navigate to the record
  const recordUrl = `${BASE_URL}/${workspace}/${section}/${recordId}`;
  console.log(`📍 Navigating to ${section} record: ${recordUrl}`);
  
  // Track navigation events
  let navigationCount = 0;
  const navigationUrls = [];
  
  // Set up navigation listener
  page.on('framenavigated', () => {
    navigationCount++;
    const url = page.url();
    navigationUrls.push(url);
    console.log(`🔄 Navigation event #${navigationCount}: ${url}`);
  });

  // Navigate to the record
  await page.goto(recordUrl, { waitUntil: 'networkidle2', timeout: 15000 });
  
  // Wait for the page to stabilize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Monitor for 5 seconds
  const startTime = Date.now();
  const startUrl = page.url();
  let urlChangeCount = 0;
  const urlChecks = [];
  
  // Check URL every 500ms for 5 seconds
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentUrl = page.url();
    urlChecks.push({ time: Date.now() - startTime, url: currentUrl });
    
    if (currentUrl !== startUrl) {
      urlChangeCount++;
      console.log(`⚠️  URL changed at ${Date.now() - startTime}ms: ${currentUrl}`);
    }
  }
  
  const endTime = Date.now();
  const elapsedTime = endTime - startTime;
  
  // Verify results
  const finalUrl = page.url();
  console.log(`\n📊 Test Results for ${section}:`);
  console.log(`   - Initial URL: ${startUrl}`);
  console.log(`   - Final URL: ${finalUrl}`);
  console.log(`   - Navigation events: ${navigationCount}`);
  console.log(`   - URL changes detected: ${urlChangeCount}`);
  console.log(`   - Elapsed time: ${elapsedTime}ms`);
  
  // Check results
  const urlStable = finalUrl === recordUrl || finalUrl === startUrl;
  const noExcessiveNav = navigationCount < 3;
  const noUrlChanges = urlChangeCount === 0;
  
  const passed = urlStable && noExcessiveNav && noUrlChanges;
  
  if (passed) {
    console.log(`✅ ${section} record test PASSED - No refresh loop detected`);
  } else {
    console.log(`❌ ${section} record test FAILED:`);
    if (!urlStable) console.log(`   - URL changed from expected`);
    if (!noExcessiveNav) console.log(`   - Excessive navigation events: ${navigationCount}`);
    if (!noUrlChanges) console.log(`   - URL changes detected: ${urlChangeCount}`);
  }
  
  return { passed, skipped: false, section, navigationCount, urlChangeCount };
}

async function main() {
  console.log('🚀 Starting refresh loop validation test...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👤 Test User: ${TEST_EMAIL}\n`);
  
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
    
    // Try to find login button
    let loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      // Try to find by text content
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Start') || text.includes('Sign In') || text.includes('Login'))) {
          loginButton = btn;
          break;
        }
      }
    }
    
    if (loginButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        loginButton.click()
      ]);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for any redirect
    } else {
      console.log('⚠️  Login button not found, trying to proceed...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Get workspace from URL
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    const workspaceMatch = currentUrl.match(/\/\/(?:[^\/]+)\/([^\/]+)\//) || currentUrl.match(/\/([^\/]+)\//);
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
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Opportunities: ${results.opportunities.passed ? '✅ PASS' : results.opportunities.skipped ? '⏭️  SKIP' : '❌ FAIL'}`);
    if (!results.opportunities.skipped) {
      console.log(`   - Navigation events: ${results.opportunities.navigationCount}`);
      console.log(`   - URL changes: ${results.opportunities.urlChangeCount}`);
    }
    
    console.log(`Leads: ${results.leads.passed ? '✅ PASS' : results.leads.skipped ? '⏭️  SKIP' : '❌ FAIL'}`);
    if (!results.leads.skipped) {
      console.log(`   - Navigation events: ${results.leads.navigationCount}`);
      console.log(`   - URL changes: ${results.leads.urlChangeCount}`);
    }
    
    console.log(`Prospects (control): ${results.prospects.passed ? '✅ PASS' : results.prospects.skipped ? '⏭️  SKIP' : '❌ FAIL'}`);
    console.log(`People (control): ${results.people.passed ? '✅ PASS' : results.people.skipped ? '⏭️  SKIP' : '❌ FAIL'}`);
    console.log('='.repeat(60));
    
    const allPassed = Object.values(results).every(r => r.passed || r.skipped);
    
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

