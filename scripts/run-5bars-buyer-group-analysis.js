/**
 * 🚀 QUICK RUNNER FOR 5BARS BUYER GROUP ANALYSIS
 * 
 * Simple script to run the comprehensive buyer group analysis
 */

const FiveBarsBuyerGroupAnalyzer = require('./analyze-5bars-buyer-group-comprehensive.js');

async function runAnalysis() {
  console.log('🚀 Starting 5Bars Buyer Group Analysis...');
  console.log('=====================================');
  
  try {
    const analyzer = new FiveBarsBuyerGroupAnalyzer();
    await analyzer.execute();
    
    console.log('\n🎉 Analysis completed successfully!');
    console.log('Check the generated JSON file for detailed results.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
runAnalysis();
