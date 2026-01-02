#!/usr/bin/env node

/**
 * Test Organizational Behavioral Physics (OBP) System
 *
 * This demonstrates the breakthrough: predicting company buying behavior
 * from structural data by modeling organizational tensions and dynamics.
 *
 * Usage:
 *   node test-obp.js                           # Run with mock data
 *   node test-obp.js --company "Acme Corp"     # Analyze specific company
 *   node test-obp.js --domain "acme.com"       # Analyze by domain
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const fs = require('fs');
const path = require('path');
const { OBPPipeline } = require('./modules/OBPPipeline');

// Product context - what we're selling
const productContext = {
  productName: 'Adrata Compliance Automation',
  primaryProblem: 'Manual compliance processes that don\'t scale - evidence collection, policy management, continuous monitoring',
  quickWinMetric: 'SOC 2 in 4 months vs. 12-18 months manually, saving 2+ FTE hours',
  targetDepartments: ['security', 'compliance']
};

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  ORGANIZATIONAL BEHAVIORAL PHYSICS (OBP) - TEST');
  console.log('  "The Transformer Architecture for B2B Sales"');
  console.log('═'.repeat(70));
  console.log(`
  This system models organizations as physical systems with forces and tensions.
  Like physics predicts motion from forces, OBP predicts buying behavior from
  structural data - without needing expensive intent data like Bombora or G2.

  Key Insight: We don't observe what companies are researching.
  We MODEL the pressures that MAKE them research.
`);

  // Parse command line args
  const args = process.argv.slice(2);
  const companyArg = args.find(a => a.startsWith('--company'));
  const domainArg = args.find(a => a.startsWith('--domain'));

  let companyInput = { name: 'Example Company' };

  if (companyArg) {
    const idx = args.indexOf('--company');
    companyInput = { name: args[idx + 1] || 'Example Company' };
  } else if (domainArg) {
    const idx = args.indexOf('--domain');
    companyInput = { domain: args[idx + 1] || 'example.com' };
  }

  // Create pipeline
  const pipeline = new OBPPipeline({ productContext });

  // Run analysis
  const report = await pipeline.analyze(companyInput);

  if (!report.success) {
    console.error(`\n❌ Analysis failed: ${report.error}`);
    process.exit(1);
  }

  // Print formatted report
  pipeline.printReport(report);

  // Save full report to file
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `obp-report-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${outputPath}`);

  // Print actionable summary
  console.log('─'.repeat(70));
  console.log('  ACTIONABLE SUMMARY');
  console.log('─'.repeat(70));

  if (report.classification.category === 'PULL' || report.classification.category === 'HIGH_CONSIDERATION') {
    console.log(`
  ✅ HIGH PULL POTENTIAL

  ${report.champion ? `Champion: ${report.champion.name} (${report.champion.title})` : 'No champion identified'}
  ${report.champion ? `Window: ${report.champion.windowRemaining} days remaining` : ''}

  Next Steps:
  1. ${report.strategy.timing?.bestApproach === 'direct_outreach' ? 'Direct outreach recommended' : 'Warm introduction preferred'}
  2. Lead with: "${report.strategy.pitchAngle?.do || 'Quick win + ROI framing'}"
  3. Opening: "${report.strategy.openingLine || 'Reference their growth and security needs'}"
  4. Act within: ${report.strategy.timing?.daysToAct || 30} days
`);
  } else if (report.classification.category === 'CONSIDERATION') {
    console.log(`
  ⏳ MODERATE POTENTIAL - NURTURE

  The company has some tensions but no urgent driver yet.

  Next Steps:
  1. Add to nurture sequence
  2. Monitor for trigger events (new security hire, funding, enterprise deals)
  3. Re-analyze in 60-90 days
`);
  } else {
    console.log(`
  ❄️ NOT IN MARKET

  Low organizational tension detected.

  Next Steps:
  1. Deprioritize active outreach
  2. Add to long-term awareness campaign
  3. Re-analyze when funding or leadership changes occur
`);
  }

  console.log('═'.repeat(70) + '\n');
}

// Run
main().catch(console.error);
