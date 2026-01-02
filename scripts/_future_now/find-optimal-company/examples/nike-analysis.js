#!/usr/bin/env node

/**
 * Nike OBP Analysis - Realistic Example
 *
 * Nike is a Fortune 500 public company (~75,000 employees).
 * This shows how OBP would analyze them and reveal why they're
 * likely NOT a good Adrata target.
 *
 * The value of OBP: It tells you WHO to pursue AND who to skip.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const { OBPPipeline } = require('../modules/OBPPipeline');

// Realistic Nike org data
const nikeOrgData = {
  name: 'Nike, Inc.',
  company_name: 'Nike, Inc.',
  industry: 'Apparel & Footwear',
  employees_count: 75000,
  employees_count_change_yearly_percentage: 2, // Mature, slow growth
  founded_year: 1964,
  last_funding_round_type: 'Public (NYSE: NKE)',
  last_funding_round_date: null, // N/A - public company

  // Realistic Nike security/compliance org
  employees: [
    // CISO - tenured, not new
    {
      name: 'Robert Martinez',
      title: 'Chief Information Security Officer',
      start_date: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 3 years
      employment_history: [
        { company_name: 'Target Corporation', title: 'VP of Security', start_date: '2015-01-01', end_date: '2021-01-01' },
        { company_name: 'General Electric', title: 'Director of Security', start_date: '2010-01-01', end_date: '2015-01-01' }
      ]
    },
    // Large security team (50+ people at a company this size)
    ...Array.from({ length: 50 }, (_, i) => ({
      name: `Security Team Member ${i + 1}`,
      title: ['Security Engineer', 'Security Analyst', 'SOC Analyst', 'GRC Analyst', 'Security Architect'][i % 5],
      start_date: new Date(Date.now() - (Math.random() * 5 + 1) * 365 * 24 * 60 * 60 * 1000).toISOString()
    })),
    // Large compliance team (SOX compliance for public company)
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Compliance Team Member ${i + 1}`,
      title: ['Compliance Analyst', 'Internal Auditor', 'SOX Compliance', 'Risk Analyst'][i % 4],
      start_date: new Date(Date.now() - (Math.random() * 5 + 1) * 365 * 24 * 60 * 60 * 1000).toISOString()
    })),
    // Executive team - all tenured
    { name: 'John Donahoe', title: 'CEO', start_date: '2020-01-01' },
    { name: 'Matthew Friend', title: 'CFO', start_date: '2020-04-01' },
    { name: 'Engineering VP', title: 'VP of Engineering', start_date: '2018-01-01' },
    // Large engineering org
    ...Array.from({ length: 500 }, (_, i) => ({
      name: `Engineer ${i + 1}`,
      title: ['Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Engineering Manager'][i % 4],
      start_date: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString()
    }))
  ]
};

// Product context - Adrata compliance automation
const productContext = {
  productName: 'Adrata Compliance Automation',
  primaryProblem: 'Manual SOC 2/ISO compliance processes that don\'t scale',
  quickWinMetric: 'SOC 2 in 4 months vs. 12-18 months manually',
  targetDepartments: ['security', 'compliance']
};

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  NIKE OBP ANALYSIS - REALISTIC EXAMPLE');
  console.log('═'.repeat(70));
  console.log(`
  Nike is a Fortune 500 public company with ~75,000 employees.
  Let's see what OBP reveals about them as an Adrata target.
`);

  // Create pipeline with custom product context
  const pipeline = new OBPPipeline({ productContext });

  // Override the fetchOrgData to use our realistic Nike data
  pipeline.fetchOrgData = async () => nikeOrgData;

  // Run analysis
  const report = await pipeline.analyze({ name: 'Nike, Inc.' });

  if (!report.success) {
    console.error(`\n❌ Analysis failed: ${report.error}`);
    return;
  }

  // Print report
  pipeline.printReport(report);

  // Key insight
  console.log('─'.repeat(70));
  console.log('  KEY INSIGHT: WHY NIKE IS NOT A GOOD ADRATA TARGET');
  console.log('─'.repeat(70));
  console.log(`
  OBP reveals the structural reasons Nike is likely NOT in market:

  1. NO RATIO TENSION
     - Security:Company ratio is ${report.tensions.ratio.score}/100
     - They have ~50 security + 30 compliance = 80 people
     - That's a healthy 1:937 ratio for a company this size
     - They're NOT drowning - no need for force multipliers

  2. NO LEADERSHIP TENSION
     - CISO has been there 3+ years - NOT in prove-myself window
     - No "ratio shock" - came from similar enterprise (Target, GE)
     - No urgency to make changes to build credibility

  3. NO GROWTH TENSION
     - 2% YoY growth - they're not scaling rapidly
     - Security can keep pace with the business
     - No "attack surface growing faster than defense" dynamic

  4. NO RESOURCE TENSION
     - Public company - different buying dynamics entirely
     - SOX compliance already required and mature
     - Budget is not the constraint - RFP process is

  5. DIFFERENT COMPLIANCE NEEDS
     - They need SOX, not SOC 2
     - They have internal audit teams already
     - Adrata's value prop doesn't fit their use case

  THE VERDICT: SKIP NIKE

  OBP Score: ${report.pullScore}/100 (${report.classification.category})

  This is why OBP is valuable - it doesn't just find good targets,
  it helps you AVOID spending cycles on companies that won't buy.
`);

  console.log('═'.repeat(70));
  console.log('  NOW LET\'S COMPARE TO A GOOD TARGET');
  console.log('═'.repeat(70));
}

main().catch(console.error);
