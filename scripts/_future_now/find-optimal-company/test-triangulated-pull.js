#!/usr/bin/env node

/**
 * Test Triangulated PULL Detection
 *
 * This demonstrates the NexusLogistics pattern for finding blocked demand.
 *
 * Usage:
 *   node test-triangulated-pull.js                          # Test with mock data
 *   node test-triangulated-pull.js --company "Acme Corp"    # Test specific company
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { TriangulatedPullDetector } = require('./modules/TriangulatedPullDetector');

// Example product context (Adrata compliance automation)
const productContext = {
  productName: 'Adrata Compliance Automation',
  primaryProblem: 'Manual compliance processes that don\'t scale',
  relevantRoles: [
    'VP of Security',
    'VP of Engineering',
    'CISO',
    'Head of Compliance',
    'Director of Security',
    'CTO'
  ]
};

// Companies known for advanced compliance/automation approaches
const advancedCompetitors = [
  'Stripe',
  'Square',
  'Plaid',
  'Flexport',
  'Rippling',
  'Gusto',
  'Vanta',
  'Drata'
];

// Manual roles that indicate "throwing bodies at the problem"
const manualRolePatterns = [
  'data entry',
  'compliance analyst', // junior manual role
  'audit clerk',
  'documentation specialist',
  'manual review',
  'processor'
];

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  TRIANGULATED PULL DETECTION TEST');
  console.log('='.repeat(70));

  const detector = new TriangulatedPullDetector({
    productContext,
    advancedCompetitors,
    manualRolePatterns,
    relevantLeadershipTitles: ['VP', 'Director', 'Head of', 'Chief', 'CISO', 'CTO']
  });

  // Get company from args or use test company
  const args = process.argv.slice(2);
  const companyArg = args.find(a => a.startsWith('--company'));
  let companyName = 'Test Company';

  if (companyArg) {
    const idx = args.indexOf('--company');
    companyName = args[idx + 1] || companyName;
  }

  console.log(`\n   Testing with: ${companyName}\n`);

  // Run detection
  const result = await detector.detectPull({ name: companyName });

  // Display results
  console.log('\n' + '─'.repeat(70));
  console.log('  PULL ANALYSIS RESULTS');
  console.log('─'.repeat(70));

  console.log(`
  Company: ${result.company}
  PULL Score: ${result.pullScore}/100
  Classification: ${result.classification}

  Scores:
    - Champion Score: ${result.scores.champion}
    - Bad Option Score: ${result.scores.badOptions}
    - Pain Trigger Score: ${result.scores.pain}
    - Timeline Score: ${result.scores.timeline}
`);

  if (result.champion) {
    console.log('  CHAMPION DETECTED:');
    console.log(`    Name: ${result.champion.name}`);
    console.log(`    Title: ${result.champion.title}`);
    console.log(`    Tenure: ${result.champion.tenure}`);
    console.log(`    Previous: ${result.champion.previousTitle} at ${result.champion.previousCompany}`);
    if (result.champion.insight) {
      console.log(`    Insight: ${result.champion.insight}`);
    }
    console.log('');
  }

  if (result.badOption) {
    console.log('  BAD OPTION DETECTED:');
    console.log(`    Hiring: ${result.badOption.hiring}`);
    console.log(`    Urgent Posts: ${result.badOption.urgentCount}`);
    console.log(`    Limitation: ${result.badOption.limitation}`);
    console.log('');
  }

  if (result.timeline) {
    console.log('  TIMELINE PRESSURE:');
    result.timeline.pressures.forEach(p => {
      console.log(`    - ${p}`);
    });
    console.log('');
  }

  if (result.narrative) {
    console.log('─'.repeat(70));
    console.log('  PULL NARRATIVE:');
    console.log('─'.repeat(70));
    console.log(`\n${result.narrative}\n`);
  }

  if (result.pitchAngle) {
    console.log('  PITCH STRATEGY:');
    console.log(`    DO: ${result.pitchAngle.do}`);
    console.log(`    AVOID: ${result.pitchAngle.avoid}`);
    console.log('');
  }

  // Save full results
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, 'output', `pull-analysis-${Date.now()}.json`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n   Full results saved to: ${outputPath}`);

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run
main().catch(console.error);
