/**
 * Direct Lead Record Refresh Test
 * 
 * Tests a specific lead record for infinite refresh loops
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WORKSPACE = 'top';
const LEAD_SLUG = 'anne-demilia-reasoner-01K9SPTJNKV33SSYECHGNMTG68';
const TEST_EMAIL = 'vleland';
const TEST_PASSWORD = 'TOPgtm01!';

async function testLeadRefresh() {
  console.log('🚀 Starting direct lead record refresh test...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📁 Workspace: ${WORKSPACE}`);
  console.log(`🔗 Lead Record: ${LEAD_SLUG}\n`);

  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to sign-in page first
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the form to be ready - the form uses #username (not email)
    console.log('   Waiting for login form...');
    await page.waitForSelector('input#username', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any animations
    
    // Fill in username (the form uses "username" field, not "email")
    console.log('   Filling username...');
    const usernameInput = await page.$('input#username');
    if (!usernameInput) {
      throw new Error('Could not find username input');
    }
    
    // Clear and type username
    await usernameInput.click({ clickCount: 3 }); // Select all
    await usernameInput.type(TEST_EMAIL, { delay: 50 });
    
    // Wait for username validation (the form validates as you type)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Fill in password
    console.log('   Filling password...');
    const passwordInput = await page.$('input#password');
    if (!passwordInput) {
      throw new Error('Could not find password input');
    }
    await passwordInput.type(TEST_PASSWORD, { delay: 50 });
    
    // Wait a bit before submitting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Submit the form
    console.log('   Submitting login form...');
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    
    // Wait for navigation after clicking submit
    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {
      console.log('   Navigation timeout, checking URL...');
    });
    
    await submitButton.click();
    await navigationPromise;
    
    // Wait for any redirects to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log(`   ✓ Login completed, current URL: ${currentUrl}\n`);
    
    // If still on sign-in page, login failed
    if (currentUrl.includes('/sign-in')) {
      throw new Error('Login failed - still on sign-in page');
    }
    
    // Now navigate to the lead record
    const recordUrl = `${BASE_URL}/${WORKSPACE}/leads/${LEAD_SLUG}`;
    console.log(`📍 Navigating to lead record: ${recordUrl}`);
    
    // Track navigation events
    let navigationCount = 0;
    const navigationUrls = [];
    
    page.on('framenavigated', () => {
      navigationCount++;
      const url = page.url();
      navigationUrls.push({ count: navigationCount, url, time: Date.now() });
      console.log(`🔄 Navigation event #${navigationCount}: ${url}`);
    });
    
    // Navigate to the record - use domcontentloaded instead of networkidle2
    // This is more reliable if the page has ongoing network activity
    console.log('   Waiting for page to load...');
    try {
      await page.goto(recordUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      // If timeout, check if we're at least on the right page
      const currentUrl = page.url();
      if (!currentUrl.includes(LEAD_SLUG)) {
        throw new Error(`Navigation failed. Current URL: ${currentUrl}`);
      }
      console.log('   Navigation timeout, but page loaded. Continuing...');
    }
    
    // Wait a bit for initial render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start monitoring immediately
    const startTime = Date.now();
    const startUrl = page.url();
    let urlChangeCount = 0;
    const urlChecks = [];
    
    console.log(`\n⏱️  Monitoring page for 10 seconds...`);
    console.log(`   Start URL: ${startUrl}\n`);
    
    // Check URL every 500ms for 10 seconds
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentUrl = page.url();
      const elapsed = Date.now() - startTime;
      urlChecks.push({ time: elapsed, url: currentUrl });
      
      if (currentUrl !== startUrl) {
        urlChangeCount++;
        console.log(`⚠️  URL changed at ${elapsed}ms: ${currentUrl}`);
      }
    }
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    // Verify results
    const finalUrl = page.url();
    console.log(`\n📊 Test Results:`);
    console.log(`   - Initial URL: ${startUrl}`);
    console.log(`   - Final URL: ${finalUrl}`);
    console.log(`   - Navigation events: ${navigationCount}`);
    console.log(`   - URL changes detected: ${urlChangeCount}`);
    console.log(`   - Elapsed time: ${elapsedTime}ms`);
    
    if (navigationCount > 0) {
      console.log(`\n   Navigation events:`);
      navigationUrls.forEach(({ count, url, time }) => {
        console.log(`     #${count} at ${time - startTime}ms: ${url}`);
      });
    }
    
    // Check results
    const urlStable = finalUrl === recordUrl || finalUrl.includes(LEAD_SLUG);
    const noExcessiveNav = navigationCount < 5; // Allow for initial load and some navigation
    const noUrlChanges = urlChangeCount === 0;
    
    const passed = urlStable && noExcessiveNav && noUrlChanges;
    
    console.log(`\n${'='.repeat(60)}`);
    if (passed) {
      console.log(`✅ TEST PASSED - No refresh loop detected!`);
      console.log(`   - URL remained stable`);
      console.log(`   - Navigation events: ${navigationCount} (< 5)`);
      console.log(`   - No URL changes during monitoring`);
    } else {
      console.log(`❌ TEST FAILED:`);
      if (!urlStable) console.log(`   - URL changed from expected`);
      if (!noExcessiveNav) console.log(`   - Excessive navigation events: ${navigationCount} (>= 5)`);
      if (!noUrlChanges) console.log(`   - URL changes detected: ${urlChangeCount}`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
    return { passed, navigationCount, urlChangeCount, finalUrl, startUrl };
    
  } catch (error) {
    console.error('❌ Test error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testLeadRefresh()
  .then((result) => {
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

