/**
 * 🧪 TEST SCRIPT FOR 5BARS BUYER GROUP ANALYSIS
 * 
 * Simple test to verify the analysis works correctly
 */

const FiveBarsBuyerGroupAnalyzer = require('./analyze-5bars-buyer-group-comprehensive.js');

async function testAnalysis() {
  console.log('🧪 Testing 5Bars Buyer Group Analysis...');
  console.log('=====================================');
  
  try {
    // Check environment variables
    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY environment variable not set');
      process.exit(1);
    }
    
    console.log('✅ Environment variables configured');
    console.log(`🔑 API Key length: ${process.env.CORESIGNAL_API_KEY.length}`);
    
    // Create analyzer instance
    const analyzer = new FiveBarsBuyerGroupAnalyzer();
    
    // Run the analysis
    console.log('\n🚀 Starting analysis...');
    await analyzer.execute();
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAnalysis();
