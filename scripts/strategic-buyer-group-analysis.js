#!/usr/bin/env node

/**
 * 🎯 STRATEGIC BUYER GROUP ANALYSIS FOR WINNING VARIANT
 * 
 * Analyzes the smart buyer group for A/B testing and multi-variant testing platforms
 * Focus: $100k enterprise A/B testing platform for large companies
 * 
 * Key Pain Points:
 * - Complex A/B testing at scale
 * - Multi-variant testing across channels
 * - Data-driven decision making
 * - Conversion optimization
 * - Marketing attribution
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

/**
 * Strategic buyer group roles for A/B testing platforms
 */
const buyerGroupRoles = {
  // DECISION MAKERS - Budget authority, strategic vision
  decision: [
    'Chief Marketing Officer',
    'Chief Digital Officer', 
    'VP Marketing',
    'VP Digital',
    'VP Growth',
    'VP Product Marketing',
    'Head of Marketing',
    'Head of Digital',
    'Head of Growth',
    'Marketing Director',
    'Digital Director',
    'Growth Director'
  ],
  
  // CHAMPIONS - Day-to-day users, advocates
  champion: [
    'Marketing Manager',
    'Digital Marketing Manager',
    'Growth Marketing Manager',
    'Conversion Manager',
    'A/B Testing Manager',
    'Optimization Manager',
    'Performance Marketing Manager',
    'Marketing Operations Manager',
    'Digital Marketing Specialist',
    'Growth Marketing Specialist',
    'Marketing Analyst',
    'Digital Analyst'
  ],
  
  // STAKEHOLDERS - Influencers, implementers
  stakeholder: [
    'Product Manager',
    'Product Marketing Manager',
    'Brand Manager',
    'Content Manager',
    'Social Media Manager',
    'Email Marketing Manager',
    'Paid Media Manager',
    'SEO Manager',
    'Marketing Coordinator',
    'Digital Marketing Coordinator',
    'Marketing Assistant',
    'Digital Marketing Assistant'
  ],
  
  // BLOCKERS - Risk, compliance, technical concerns
  blocker: [
    'Chief Technology Officer',
    'VP Engineering',
    'Head of Engineering',
    'Engineering Director',
    'Technical Director',
    'IT Director',
    'Security Director',
    'Compliance Officer',
    'Legal Counsel',
    'Privacy Officer',
    'Data Protection Officer',
    'Risk Manager'
  ],
  
  // INTRODUCERS - Entry points, connectors
  introducer: [
    'Marketing Coordinator',
    'Digital Marketing Coordinator',
    'Marketing Assistant',
    'Digital Marketing Assistant',
    'Marketing Intern',
    'Digital Marketing Intern',
    'Marketing Specialist',
    'Digital Marketing Specialist',
    'Marketing Analyst',
    'Digital Analyst',
    'Growth Analyst',
    'Performance Analyst'
  ]
};

/**
 * Company-specific buyer group analysis
 */
const companyAnalysis = {
  'Match Group': {
    industry: 'Online Dating',
    companySize: 'Large (3000+ employees)',
    buyerGroupFocus: 'User acquisition, conversion optimization, subscription growth',
    keyDepartments: ['Marketing', 'Product', 'Growth', 'Data Science'],
    painPoints: [
      'Optimizing user onboarding flows',
      'A/B testing dating app features', 
      'Conversion rate optimization for subscriptions',
      'Multi-variant testing across mobile/web'
    ],
    idealBuyerGroup: {
      decision: ['CMO', 'VP Growth', 'VP Product Marketing'],
      champion: ['Growth Marketing Manager', 'Conversion Manager', 'A/B Testing Manager'],
      stakeholder: ['Product Manager', 'Brand Manager', 'Content Manager'],
      blocker: ['CTO', 'VP Engineering', 'Privacy Officer'],
      introducer: ['Marketing Analyst', 'Growth Analyst', 'Digital Marketing Specialist']
    }
  },
  
  'Brex': {
    industry: 'FinTech',
    companySize: 'Medium-Large (1000+ employees)',
    buyerGroupFocus: 'B2B marketing, lead generation, conversion optimization',
    keyDepartments: ['Marketing', 'Sales', 'Product', 'Growth'],
    painPoints: [
      'B2B lead generation optimization',
      'Sales funnel conversion testing',
      'Multi-channel attribution',
      'Enterprise customer acquisition'
    ],
    idealBuyerGroup: {
      decision: ['CMO', 'VP Marketing', 'Head of Growth'],
      champion: ['Growth Marketing Manager', 'Performance Marketing Manager', 'Marketing Operations Manager'],
      stakeholder: ['Product Marketing Manager', 'Brand Manager', 'Content Manager'],
      blocker: ['CTO', 'VP Engineering', 'Compliance Officer'],
      introducer: ['Marketing Analyst', 'Growth Analyst', 'Digital Marketing Specialist']
    }
  },
  
  'First Premier Bank': {
    industry: 'Banking',
    companySize: 'Medium (1000-5000 employees)',
    buyerGroupFocus: 'Digital banking, customer acquisition, regulatory compliance',
    keyDepartments: ['Marketing', 'Digital', 'Compliance', 'Risk'],
    painPoints: [
      'Digital banking experience optimization',
      'Customer onboarding testing',
      'Regulatory compliance in testing',
      'Multi-channel customer journey optimization'
    ],
    idealBuyerGroup: {
      decision: ['CMO', 'Chief Digital Officer', 'VP Marketing'],
      champion: ['Digital Marketing Manager', 'Conversion Manager', 'Marketing Operations Manager'],
      stakeholder: ['Product Manager', 'Brand Manager', 'Content Manager'],
      blocker: ['CTO', 'Compliance Officer', 'Risk Manager', 'Legal Counsel'],
      introducer: ['Digital Marketing Specialist', 'Marketing Analyst', 'Digital Analyst']
    }
  },
  
  'Zuora': {
    industry: 'SaaS/Subscription Management',
    companySize: 'Medium-Large (1000+ employees)',
    buyerGroupFocus: 'B2B SaaS marketing, subscription optimization, enterprise sales',
    keyDepartments: ['Marketing', 'Product', 'Sales', 'Growth'],
    painPoints: [
      'B2B SaaS conversion optimization',
      'Subscription funnel testing',
      'Enterprise customer acquisition',
      'Multi-variant testing for complex sales cycles'
    ],
    idealBuyerGroup: {
      decision: ['CMO', 'VP Marketing', 'VP Product Marketing'],
      champion: ['Growth Marketing Manager', 'Performance Marketing Manager', 'Marketing Operations Manager'],
      stakeholder: ['Product Marketing Manager', 'Brand Manager', 'Content Manager'],
      blocker: ['CTO', 'VP Engineering', 'Compliance Officer'],
      introducer: ['Marketing Analyst', 'Growth Analyst', 'Digital Marketing Specialist']
    }
  }
};

/**
 * Search for executives with specific roles
 */
async function searchExecutivesByRole(companyName, roles, companyId) {
  const executives = [];
  
  for (const role of roles) {
    try {
      const query = {
        query: {
          bool: {
            must: [
              { match: { company_name: companyName } },
              { match: { active_experience_title: role } }
            ]
          }
        }
      };

      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY
        },
        body: JSON.stringify(query)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hits?.hits?.length > 0) {
          for (const hit of data.hits.hits) {
            const exec = hit._source;
            executives.push({
              name: exec.member_full_name || exec.full_name || 'Unknown',
              title: exec.member_position_title || exec.title || role,
              email: exec.member_professional_email || exec.professional_email || '',
              linkedin: exec.member_linkedin_url || exec.linkedin_url || '',
              company: companyName,
              role: role,
              source: 'coresignal-search'
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Error searching for ${role}: ${error.message}`);
    }
  }
  
  return executives;
}

/**
 * Generate strategic buyer group analysis
 */
async function generateStrategicAnalysis() {
  console.log('🎯 STRATEGIC BUYER GROUP ANALYSIS FOR WINNING VARIANT');
  console.log('=' .repeat(70));
  console.log('Analyzing smart buyer groups for A/B testing platform ($100k enterprise)');
  console.log('');
  
  const companies = [
    { name: 'Match Group', website: 'mtch.com' },
    { name: 'Brex', website: 'brex.com' },
    { name: 'First Premier Bank', website: 'firstpremier.com' },
    { name: 'Zuora', website: 'zuora.com' }
  ];
  
  const results = {};
  
  for (const company of companies) {
    console.log(`🏢 Analyzing: ${company.name}`);
    console.log('─'.repeat(50));
    
    const analysis = companyAnalysis[company.name];
    if (!analysis) {
      console.log(`   ⚠️ No analysis available for ${company.name}`);
      continue;
    }
    
    console.log(`   📊 Industry: ${analysis.industry}`);
    console.log(`   👥 Company Size: ${analysis.companySize}`);
    console.log(`   🎯 Focus: ${analysis.buyerGroupFocus}`);
    console.log(`   📋 Key Departments: ${analysis.keyDepartments.join(', ')}`);
    console.log(`   🔥 Pain Points:`);
    analysis.painPoints.forEach(pain => console.log(`      • ${pain}`));
    
    console.log(`   🎯 Ideal Buyer Group:`);
    for (const [role, titles] of Object.entries(analysis.idealBuyerGroup)) {
      console.log(`      ${role.toUpperCase()}: ${titles.join(', ')}`);
    }
    
    // Search for actual executives
    console.log(`   🔍 Searching for executives...`);
    const allRoles = Object.values(analysis.idealBuyerGroup).flat();
    const executives = await searchExecutivesByRole(company.name, allRoles, null);
    
    if (executives.length > 0) {
      console.log(`   ✅ Found ${executives.length} executives`);
      
      // Group by role
      const groupedExecutives = {
        decision: executives.filter(e => analysis.idealBuyerGroup.decision.some(role => e.title.includes(role.split(' ')[0]))),
        champion: executives.filter(e => analysis.idealBuyerGroup.champion.some(role => e.title.includes(role.split(' ')[0]))),
        stakeholder: executives.filter(e => analysis.idealBuyerGroup.stakeholder.some(role => e.title.includes(role.split(' ')[0]))),
        blocker: executives.filter(e => analysis.idealBuyerGroup.blocker.some(role => e.title.includes(role.split(' ')[0]))),
        introducer: executives.filter(e => analysis.idealBuyerGroup.introducer.some(role => e.title.includes(role.split(' ')[0])))
      };
      
      for (const [role, execs] of Object.entries(groupedExecutives)) {
        if (execs.length > 0) {
          console.log(`      ${role.toUpperCase()}: ${execs.length} found`);
          execs.slice(0, 3).forEach(exec => {
            console.log(`         • ${exec.name} - ${exec.title}`);
          });
        }
      }
    } else {
      console.log(`   ⚠️ No executives found for ${company.name}`);
    }
    
    results[company.name] = {
      analysis,
      executives: executives.length,
      groupedExecutives: executives.length > 0 ? groupedExecutives : null
    };
    
    console.log('');
  }
  
  console.log('🎉 STRATEGIC BUYER GROUP ANALYSIS COMPLETE');
  console.log('=' .repeat(70));
  console.log('Key Insights:');
  console.log('• Focus on Marketing, Growth, and Digital teams');
  console.log('• Decision makers: CMO, VP Marketing, VP Growth');
  console.log('• Champions: Growth Marketing, Conversion, A/B Testing Managers');
  console.log('• Blockers: CTO, Engineering, Compliance teams');
  console.log('• Pain points: Conversion optimization, multi-variant testing, attribution');
  
  return results;
}

// Run the script
if (require.main === module) {
  generateStrategicAnalysis().catch(console.error);
}

module.exports = { generateStrategicAnalysis };
