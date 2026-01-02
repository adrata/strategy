#!/usr/bin/env node

/**
 * Good vs Bad Target Comparison
 *
 * Shows how OBP differentiates between:
 * 1. Nike (Fortune 500) - NOT IN MARKET
 * 2. Ramp (Series D FinTech) - HIGH PULL
 *
 * This is the power of OBP: Know WHO to pursue and WHO to skip.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const { OrganizationalTensionCalculator } = require('../modules/OrganizationalTensionCalculator');
const { BehavioralPhysicsEngine } = require('../modules/BehavioralPhysicsEngine');

// Nike - Fortune 500, mature, NOT a good target
const nikeData = {
  name: 'Nike, Inc.',
  industry: 'Apparel & Footwear',
  employees_count: 75000,
  employees_count_change_yearly_percentage: 2,
  last_funding_round_type: 'Public',
  employees: [
    // Tenured CISO (3+ years)
    {
      name: 'Robert Martinez',
      title: 'Chief Information Security Officer',
      start_date: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      employment_history: [
        { company_name: 'Target Corporation', title: 'VP of Security' }
      ]
    },
    // Large security team
    ...Array.from({ length: 50 }, (_, i) => ({
      name: `Security ${i}`,
      title: 'Security Engineer',
      start_date: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
    })),
    // Large compliance team
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Compliance ${i}`,
      title: 'Compliance Analyst',
      start_date: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
    }))
  ]
};

// Ramp - Series D FinTech, growing fast, GREAT target
const rampData = {
  name: 'Ramp Financial',
  industry: 'Financial Technology',
  employees_count: 800,
  employees_count_change_yearly_percentage: 85, // Hypergrowth
  last_funding_round_type: 'Series D',
  last_funding_round_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  employees: [
    // NEW Head of Security - just joined from Stripe!
    {
      name: 'Jessica Wong',
      title: 'Head of Security',
      start_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
      employment_history: [
        { company_name: 'Stripe', title: 'Security Engineering Lead' },
        { company_name: 'Square', title: 'Senior Security Engineer' }
      ]
    },
    // Small security team for company size (understaffed!)
    ...Array.from({ length: 5 }, (_, i) => ({
      name: `Security ${i}`,
      title: 'Security Engineer',
      start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
    })),
    // Large engineering team (creates ratio imbalance)
    ...Array.from({ length: 200 }, (_, i) => ({
      name: `Engineer ${i}`,
      title: 'Software Engineer',
      start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })),
    // Executives
    { name: 'Eric Glyman', title: 'CEO', start_date: '2019-01-01' },
    { name: 'Finance Leader', title: 'CFO', start_date: '2022-01-01' }
  ]
};

async function analyze(data) {
  const calculator = new OrganizationalTensionCalculator({});
  const physics = new BehavioralPhysicsEngine({});

  const tensions = await calculator.calculateTensions(data);
  const behaviors = await physics.predictBehavior(tensions);

  return { tensions, behaviors };
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  OBP: GOOD TARGET vs BAD TARGET');
  console.log('═'.repeat(70));

  // Analyze Nike
  console.log('\n' + '─'.repeat(70));
  console.log('  NIKE (Fortune 500, Public)');
  console.log('─'.repeat(70));

  const nike = await analyze(nikeData);

  console.log(`
  PULL Score: ${nike.tensions.compositeTension}/100
  Classification: ${nike.tensions.classification.category}
  Buying Probability: ${Math.round(nike.behaviors.buyingProbability * 100)}%

  TENSIONS:
  ├── Ratio: ${nike.tensions.tensions.ratio.score}/100 (${nike.tensions.tensions.ratio.score > 50 ? '⚠️ understaffed' : '✅ adequate'})
  ├── Leadership: ${nike.tensions.tensions.leadership.score}/100 (${nike.tensions.tensions.leadership.champions?.length || 0} champions)
  ├── Growth: ${nike.tensions.tensions.growth.score}/100 (${nikeData.employees_count_change_yearly_percentage}% growth)
  ├── Resource: ${nike.tensions.tensions.resource.score}/100 (${nike.tensions.tensions.resource.fundingStage})
  └── Reporting: ${nike.tensions.tensions.reporting.score}/100

  CHAMPION: ${nike.behaviors.champion.identified ? nike.behaviors.champion.name : '❌ No champion identified'}

  WHY NOT IN MARKET:
  • CISO is tenured (3+ years) - no prove-yourself window
  • Public company - SOX compliance, not SOC 2
  • 2% growth - security can keep pace
  • Large compliance team already exists
  `);

  // Analyze Ramp
  console.log('─'.repeat(70));
  console.log('  RAMP (Series D FinTech, Hypergrowth)');
  console.log('─'.repeat(70));

  const ramp = await analyze(rampData);

  console.log(`
  PULL Score: ${ramp.tensions.compositeTension}/100
  Classification: ${ramp.tensions.classification.category}
  Buying Probability: ${Math.round(ramp.behaviors.buyingProbability * 100)}%

  TENSIONS:
  ├── Ratio: ${ramp.tensions.tensions.ratio.score}/100 (${ramp.tensions.tensions.ratio.score > 50 ? '⚠️ understaffed' : '✅ adequate'})
  ├── Leadership: ${ramp.tensions.tensions.leadership.score}/100 (${ramp.tensions.tensions.leadership.champions?.length || 0} champions)
  ├── Growth: ${ramp.tensions.tensions.growth.score}/100 (${rampData.employees_count_change_yearly_percentage}% growth)
  ├── Resource: ${ramp.tensions.tensions.resource.score}/100 (${ramp.tensions.tensions.resource.fundingStage})
  └── Reporting: ${ramp.tensions.tensions.reporting.score}/100

  CHAMPION: ${ramp.behaviors.champion.identified ? `✅ ${ramp.behaviors.champion.name} (${ramp.behaviors.champion.title})` : 'None'}
  ${ramp.behaviors.champion.identified ? `
  CHAMPION PROFILE:
  ├── Tenure: ${ramp.behaviors.champion.tenureDays} days
  ├── Window Remaining: ${ramp.behaviors.champion.windowRemaining} days
  ├── Previous: ${ramp.behaviors.champion.previousCompany}
  └── Insight: Came from Stripe - knows what "good" looks like
  ` : ''}
  WHY THIS IS A PULL COMPANY:
  • NEW Head of Security (35 days) - in prove-yourself window
  • Came from STRIPE - experiencing "ratio shock"
  • 85% growth - security drowning (1:160 ratio vs healthy 1:50)
  • Series D + 90 days post-funding = deployment pressure
  • FinTech = enterprise customers requiring SOC 2
  `);

  // Summary
  console.log('═'.repeat(70));
  console.log('  SUMMARY: THE PHYSICS OF BUYING');
  console.log('═'.repeat(70));
  console.log(`
  ┌─────────────────────────┬────────────────────┬────────────────────┐
  │                         │       NIKE         │       RAMP         │
  ├─────────────────────────┼────────────────────┼────────────────────┤
  │ PULL Score              │    ${nike.tensions.compositeTension.toString().padStart(2)}/100          │    ${ramp.tensions.compositeTension.toString().padStart(2)}/100          │
  │ Classification          │ ${nike.tensions.classification.category.padEnd(18)} │ ${ramp.tensions.classification.category.padEnd(18)} │
  │ Buying Probability      │ ${(Math.round(nike.behaviors.buyingProbability * 100) + '%').padEnd(18)} │ ${(Math.round(ramp.behaviors.buyingProbability * 100) + '%').padEnd(18)} │
  │ Champion                │ ${(nike.behaviors.champion.identified ? 'Yes' : 'No').padEnd(18)} │ ${(ramp.behaviors.champion.identified ? 'Yes' : 'No').padEnd(18)} │
  │ Action Window           │ ${('None').padEnd(18)} │ ${(ramp.behaviors.champion.windowRemaining + ' days').padEnd(18)} │
  ├─────────────────────────┼────────────────────┼────────────────────┤
  │ VERDICT                 │ ❌ SKIP            │ ✅ PURSUE NOW      │
  └─────────────────────────┴────────────────────┴────────────────────┘

  THE PHYSICS:

  Nike has no TENSION → No MOTION → Won't buy
  • Equilibrium state - all forces balanced
  • No champion with urgency
  • No growth pressure
  • No funding pressure

  Ramp has HIGH TENSION → Strong MOTION → Will buy soon
  • Disequilibrium - multiple forces pushing toward purchase
  • Champion in 55-day window from Stripe (knows the answer)
  • 85% growth creating ratio shock
  • Series D pressure to professionalize

  This is Organizational Behavioral Physics:
  Predict buying behavior from structural forces.
`);

  console.log('═'.repeat(70) + '\n');
}

main().catch(console.error);
