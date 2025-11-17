/**
 * Isolated Record Context Test
 * 
 * This test isolates each step of the record context flow to identify where it breaks:
 * 1. Page loads with record
 * 2. selectedRecord is set in PipelineDetailPage
 * 3. RecordContextProvider receives and stores the record
 * 4. RightPanel can access the record context
 * 5. AI chat request includes the record context
 */

const puppeteer = require('puppeteer');

const TEST_EMAIL = 'vleland@topengineersplus.com';
const TEST_PASSWORD = 'TOPgtm01!';
const BASE_URL = 'http://localhost:3000';
const RECORD_URL = `${BASE_URL}/top/speedrun/camille-murdock-01K9T0K41GN6Y4RJP6FJFDT742`;

async function runTest() {
  console.log('🚀 Starting isolated record context test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[AI CONTEXT]') || 
        text.includes('[RecordContext]') || 
        text.includes('[RightPanel]') ||
        text.includes('selectedRecord') ||
        text.includes('currentRecord')) {
      console.log(`[BROWSER] ${text}`);
    }
  });
  
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await page.goto(`${BASE_URL}/sign-in`);
    await page.waitForSelector('input[placeholder*="username"]', { timeout: 10000 });
    await page.type('input[placeholder*="username"]', TEST_EMAIL);
    await page.type('input[placeholder*="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Start")');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Step 1: Logged in successfully\n');
    
    // Step 2: Navigate to record page
    console.log('Step 2: Navigating to record page...');
    await page.goto(RECORD_URL);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Wait for record to load
    await page.waitForTimeout(3000);
    console.log('✅ Step 2: Record page loaded\n');
    
    // Step 3: Check if selectedRecord is set
    console.log('Step 3: Checking if selectedRecord is set in PipelineDetailPage...');
    const selectedRecordCheck = await page.evaluate(() => {
      // Look for the AI CONTEXT log
      return {
        message: 'Check browser console for [AI CONTEXT] selectedRecord changed logs'
      };
    });
    console.log(selectedRecordCheck);
    await page.waitForTimeout(2000);
    console.log('✅ Step 3: Check browser console above\n');
    
    // Step 4: Check if RecordContext has the record
    console.log('Step 4: Checking if RecordContextProvider has the record...');
    await page.waitForTimeout(2000);
    console.log('✅ Step 4: Check browser console above for [RecordContext] Setting current record\n');
    
    // Step 5: Open AI panel and check context
    console.log('Step 5: Opening AI panel and sending test message...');
    const chatInput = await page.waitForSelector('textarea[placeholder*="Think"]', { timeout: 10000 });
    await chatInput.type('Test message - checking record context');
    
    // Capture network request
    let aiChatRequest = null;
    page.on('request', request => {
      if (request.url().includes('/api/ai-chat')) {
        const postData = request.postData();
        if (postData) {
          try {
            const data = JSON.parse(postData);
            aiChatRequest = {
              hasCurrentRecord: !!data.currentRecord,
              recordId: data.currentRecord?.id,
              recordName: data.currentRecord?.name || data.currentRecord?.fullName,
              recordType: data.recordType,
              fieldCount: data.currentRecord ? Object.keys(data.currentRecord).length : 0
            };
            console.log('\n📤 AI Chat Request Data:', JSON.stringify(aiChatRequest, null, 2));
          } catch (e) {
            console.error('Failed to parse request data:', e);
          }
        }
      }
    });
    
    await page.click('button[aria-label="Send"]');
    
    // Wait for request to be sent
    await page.waitForTimeout(3000);
    
    if (aiChatRequest) {
      console.log('\n✅ Step 5: AI Chat request captured');
      console.log('📊 Request Analysis:');
      console.log(`  - Has currentRecord: ${aiChatRequest.hasCurrentRecord ? '✅ YES' : '❌ NO'}`);
      if (aiChatRequest.hasCurrentRecord) {
        console.log(`  - Record ID: ${aiChatRequest.recordId}`);
        console.log(`  - Record Name: ${aiChatRequest.recordName}`);
        console.log(`  - Record Type: ${aiChatRequest.recordType}`);
        console.log(`  - Field Count: ${aiChatRequest.fieldCount}`);
      }
    } else {
      console.log('❌ Step 5: Failed to capture AI Chat request');
    }
    
    // Final analysis
    console.log('\n' + '='.repeat(80));
    console.log('FINAL ANALYSIS');
    console.log('='.repeat(80));
    
    if (aiChatRequest && aiChatRequest.hasCurrentRecord) {
      console.log('✅ SUCCESS: Record context is being sent to the AI!');
      console.log(`   Record: ${aiChatRequest.recordName} (ID: ${aiChatRequest.recordId})`);
      console.log(`   Fields: ${aiChatRequest.fieldCount}`);
    } else {
      console.log('❌ FAILURE: Record context is NOT being sent to the AI!');
      console.log('\n🔍 Debugging Steps:');
      console.log('1. Check browser console for [AI CONTEXT] logs');
      console.log('2. Check browser console for [RecordContext] logs');
      console.log('3. Check browser console for [RightPanel] logs');
      console.log('4. Check if selectedRecord is set in PipelineDetailPage');
      console.log('5. Check if RecordContextProvider is receiving the record');
    }
    
    console.log('\nPress Ctrl+C to close the browser and exit...');
    await new Promise(() => {}); // Keep browser open
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest().catch(console.error);

