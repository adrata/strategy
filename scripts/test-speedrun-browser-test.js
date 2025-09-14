#!/usr/bin/env node

/**
 * Speedrun Browser Test Script
 * 
 * Uses Puppeteer to test actual data loading in the browser
 * after JavaScript execution
 */

const puppeteer = require('puppeteer');

async function testSpeedrunViewsInBrowser() {
  console.log('🧪 Testing Speedrun Views in Browser...\n');
  
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    const views = [
      { name: 'Actions', url: '/pipeline/speedrun?view=actions' },
      { name: 'Insights', url: '/pipeline/speedrun?view=insights' },
      { name: 'Targets', url: '/pipeline/speedrun?view=targets' },
      { name: 'Calendar', url: '/pipeline/speedrun?view=calendar' }
    ];
    
    const results = {};
    
    for (const view of views) {
      console.log(`📋 Testing ${view.name} View in Browser...`);
      
      try {
        // Navigate to the page
        await page.goto(`http://localhost:3000${view.url}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for the page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for loading states
        const loadingElements = await page.$$('[class*="animate-spin"], [class*="Loading"]');
        const isLoading = loadingElements.length > 0;
        
        // Check for empty states
        const emptyText = await page.evaluate(() => {
          const body = document.body.innerText;
          return body.includes('No speedrun yet') || 
                 body.includes('No data available') ||
                 body.includes('No prospects ready') ||
                 body.includes('No actions available');
        });
        
        // Check for actual data content
        const dataElements = await page.$$('.bg-white.border.rounded-lg, [data-testid*="speedrun"], .speedrun-item');
        const hasDataElements = dataElements.length > 0;
        
        // Check for specific view content
        let viewSpecificContent = false;
        let contentDetails = '';
        
        switch (view.name.toLowerCase()) {
          case 'actions':
            const actionElements = await page.$$('[class*="action"], [class*="SalesAction"]');
            viewSpecificContent = actionElements.length > 0;
            contentDetails = `${actionElements.length} action elements`;
            break;
            
          case 'insights':
            const insightElements = await page.$$('[class*="insight"], [class*="InsightsTable"]');
            viewSpecificContent = insightElements.length > 0;
            contentDetails = `${insightElements.length} insight elements`;
            break;
            
          case 'targets':
            const prospectElements = await page.$$('[class*="prospect"], [class*="person"]');
            viewSpecificContent = prospectElements.length > 0;
            contentDetails = `${prospectElements.length} prospect elements`;
            break;
            
          case 'calendar':
            const calendarElements = await page.$$('[class*="schedule"], [class*="calendar"], [class*="timeBlock"]');
            viewSpecificContent = calendarElements.length > 0;
            contentDetails = `${calendarElements.length} calendar elements`;
            break;
        }
        
        // Get page title and URL
        const title = await page.title();
        const currentUrl = page.url();
        
        results[view.name.toLowerCase()] = {
          success: true,
          title,
          url: currentUrl,
          isLoading,
          isEmpty: emptyText,
          hasDataElements,
          viewSpecificContent,
          contentDetails,
          loadingElementsCount: loadingElements.length,
          dataElementsCount: dataElements.length
        };
        
        console.log(`✅ ${view.name}: Page loaded successfully`);
        console.log(`  📄 Title: ${title}`);
        console.log(`  🔗 URL: ${currentUrl}`);
        console.log(`  ⏳ Loading: ${isLoading ? 'Yes' : 'No'} (${loadingElements.length} elements)`);
        console.log(`  📊 Data Elements: ${dataElements.length}`);
        console.log(`  🎯 View Content: ${viewSpecificContent ? 'Yes' : 'No'}`);
        if (viewSpecificContent) {
          console.log(`    Details: ${contentDetails}`);
        }
        console.log(`  📝 Empty State: ${emptyText ? 'Yes' : 'No'}`);
        
      } catch (error) {
        results[view.name.toLowerCase()] = {
          success: false,
          error: error.message
        };
        console.log(`❌ ${view.name}: ${error.message}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary Report
    console.log('\n📊 Browser Test Results:');
    console.log('========================');
    
    Object.entries(results).forEach(([view, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const info = result.success ? 
        `(${result.title})` : 
        `(${result.error})`;
      
      console.log(`${status} ${view.toUpperCase()}: ${info}`);
      
      if (result.success) {
        if (result.isLoading) {
          console.log(`  ⏳ Still loading (${result.loadingElementsCount} loading elements)`);
        }
        
        if (result.isEmpty) {
          console.log(`  ⚠️  Shows empty state`);
        }
        
        if (result.hasDataElements) {
          console.log(`  📊 Has data elements (${result.dataElementsCount})`);
        }
        
        if (result.viewSpecificContent) {
          console.log(`  🎯 Has view-specific content: ${result.contentDetails}`);
        } else {
          console.log(`  ⚠️  No view-specific content detected`);
        }
      }
    });
    
    const allPassed = Object.values(results).every(r => r.success);
    const allHaveContent = Object.values(results).every(r => r.success && r.viewSpecificContent);
    const allFinishedLoading = Object.values(results).every(r => r.success && !r.isLoading);
    
    console.log(`\n${allPassed ? '🎉 All browser tests passed!' : '⚠️  Some browser tests failed.'}`);
    console.log(`${allHaveContent ? '🎉 All views have specific content!' : '⚠️  Some views missing specific content.'}`);
    console.log(`${allFinishedLoading ? '🎉 All views finished loading!' : '⚠️  Some views still loading.'}`);
    
    // Detailed Analysis
    console.log('\n📋 Detailed Browser Analysis:');
    console.log('=============================');
    
    Object.entries(results).forEach(([view, result]) => {
      if (result.success) {
        console.log(`\n${view.toUpperCase()}:`);
        console.log(`  Title: ${result.title}`);
        console.log(`  URL: ${result.url}`);
        console.log(`  Loading Elements: ${result.loadingElementsCount}`);
        console.log(`  Data Elements: ${result.dataElementsCount}`);
        console.log(`  View-Specific Content: ${result.viewSpecificContent ? 'Yes' : 'No'}`);
        if (result.viewSpecificContent) {
          console.log(`  Content Details: ${result.contentDetails}`);
        }
        console.log(`  Empty State: ${result.isEmpty ? 'Yes' : 'No'}`);
        console.log(`  Still Loading: ${result.isLoading ? 'Yes' : 'No'}`);
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Browser test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  console.log('Make sure the development server is running at http://localhost:3000\n');
  console.log('Note: This test requires Puppeteer. Install with: npm install puppeteer\n');
  
  testSpeedrunViewsInBrowser()
    .then(() => {
      console.log('\n✅ Browser test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Browser test failed:', error);
      process.exit(1);
    });
}

module.exports = { testSpeedrunViewsInBrowser };
