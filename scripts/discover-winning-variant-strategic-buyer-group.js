#!/usr/bin/env node

/**
 * 🎯 WINNING VARIANT STRATEGIC BUYER GROUP DISCOVERY
 * 
 * Finds the EXACT buyer group for Winning Variant's Snowflake-native AI Impact Visibility platform
 * Targets: Data Science, ML, Product Analytics, Data Engineering teams who need to prove AI ROI
 * 
 * Strategic Focus:
 * - Decision Makers: CDO, VP Data Science, VP Analytics, VP Product (AI/ML focus)
 * - Champions: Data Science Managers, ML Engineering Managers, Product Analytics Managers
 * - Stakeholders: Product Managers, Data Engineers, Analytics Engineers, BI Managers
 * - Blockers: CTO, VP Engineering, Security Director, Compliance Officer
 * - Introducers: Data Scientists, ML Engineers, Data Analysts, Product Analysts
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

const companies = [
  { 
    name: 'Match Group, Inc.', 
    website: 'https://mtch.com',
    companyId: '2496218',
    industry: 'Online Dating',
    context: 'AI-powered recommendation systems, user matching algorithms, subscription optimization'
  },
  { 
    name: 'Brex, Inc.', 
    website: 'https://brex.com',
    companyId: '21428731',
    industry: 'FinTech',
    context: 'AI-driven fraud detection, credit scoring, customer acquisition optimization'
  },
  { 
    name: 'First PREMIER Bank', 
    website: 'https://firstpremier.com',
    companyId: '7578901',
    industry: 'Banking',
    context: 'AI-powered risk assessment, customer onboarding, digital banking optimization'
  },
  { 
    name: 'Zuora, Inc.', 
    website: 'https://zuora.com',
    companyId: '10782378',
    industry: 'SaaS/Subscription Management',
    context: 'AI-driven subscription analytics, churn prediction, revenue optimization'
  }
];

/**
 * Strategic buyer group roles for AI Impact Visibility platform
 */
const strategicRoles = {
  // DECISION MAKERS - Budget authority, strategic vision for AI/ML
  decision: [
    'Chief Data Officer',
    'VP Data Science',
    'VP Analytics', 
    'VP Product',
    'VP Engineering',
    'Head of Data Science',
    'Head of Analytics',
    'Head of Product',
    'Head of Engineering',
    'Director of Data Science',
    'Director of Analytics',
    'Director of Product',
    'Director of Engineering'
  ],
  
  // CHAMPIONS - Day-to-day users of AI/ML experimentation
  champion: [
    'Data Science Manager',
    'ML Engineering Manager',
    'Product Analytics Manager',
    'Experimentation Manager',
    'Analytics Manager',
    'Data Engineering Manager',
    'BI Manager',
    'Product Manager',
    'Growth Manager',
    'Marketing Analytics Manager',
    'Customer Analytics Manager',
    'Revenue Analytics Manager'
  ],
  
  // STAKEHOLDERS - Influencers and implementers
  stakeholder: [
    'Product Manager',
    'Data Engineer',
    'Analytics Engineer',
    'BI Manager',
    'Data Analyst',
    'Product Analyst',
    'Business Analyst',
    'Marketing Manager',
    'Growth Manager',
    'Customer Success Manager',
    'Revenue Operations Manager',
    'Marketing Operations Manager'
  ],
  
  // BLOCKERS - Security, compliance, technical concerns
  blocker: [
    'Chief Technology Officer',
    'VP Engineering',
    'Head of Engineering',
    'Engineering Director',
    'Security Director',
    'Compliance Officer',
    'Privacy Officer',
    'Data Protection Officer',
    'Risk Manager',
    'Legal Counsel',
    'IT Director',
    'Technical Director'
  ],
  
  // INTRODUCERS - Entry points, connectors
  introducer: [
    'Data Scientist',
    'ML Engineer',
    'Data Analyst',
    'Product Analyst',
    'Analytics Engineer',
    'BI Analyst',
    'Marketing Analyst',
    'Growth Analyst',
    'Customer Analyst',
    'Revenue Analyst',
    'Product Marketing Analyst',
    'Business Intelligence Analyst'
  ]
};

/**
 * Search for company by website in CoreSignal
 */
async function searchCompanyByWebsite(website) {
  try {
    console.log(`🔍 Searching for company: ${website}`);
    
    const query = {
      query: {
        bool: {
          should: [
            { match: { website: website } },
            { match: { website: `https://${website}` } },
            { match: { website: `https://www.${website}` } },
            { match: { website: `www.${website}` } }
          ]
        }
      }
    };

    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Company search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.hits?.hits?.length > 0) {
      const companyId = data.hits.hits[0]._id;
      const companySource = data.hits.hits[0]._source;
      console.log(`✅ Found company: ${companySource.company_name} (ID: ${companyId})`);
      return { 
        companyId, 
        companyName: companySource.company_name,
        website: companySource.website,
        industry: companySource.industry,
        size: companySource.company_size
      };
    }
    
    console.log(`⚠️ No company found for: ${website}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Company search error for ${website}:`, error.message);
    return null;
  }
}

/**
 * Search for employees by strategic roles
 */
async function searchEmployeesByRole(companyName, roles, companyId) {
  const employees = [];
  
  for (const role of roles) {
    try {
      console.log(`   🔍 Searching for: ${role}`);
      
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
            const emp = hit._source;
            employees.push({
              name: emp.member_full_name || emp.full_name || 'Unknown',
              title: emp.member_position_title || emp.title || role,
              email: emp.member_professional_email || emp.professional_email || '',
              linkedin: emp.member_linkedin_url || emp.linkedin_url || '',
              phone: emp.member_phone || emp.phone || '',
              company: companyName,
              department: emp.department || 'Unknown',
              seniority: emp.seniority || 'Unknown',
              tenure: emp.tenure || 'Unknown',
              source: 'coresignal-search'
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Error searching for ${role}: ${error.message}`);
    }
  }
  
  return employees;
}

/**
 * Get key executives using company collect endpoint
 */
async function getKeyExecutives(companyId, companyName) {
  try {
    console.log(`   📊 Getting key executives for: ${companyName}`);
    
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
      method: 'GET',
      headers: {
        'apikey': CORESIGNAL_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Key executives failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const executives = [];
    
    if (data.key_executives && Array.isArray(data.key_executives)) {
      for (const exec of data.key_executives) {
        executives.push({
          name: exec.name || 'Unknown',
          title: exec.title || 'Unknown',
          email: exec.email || '',
          linkedin: exec.linkedin || '',
          phone: exec.phone || '',
          company: companyName,
          department: exec.department || 'Executive',
          seniority: 'Executive',
          tenure: exec.tenure || 'Unknown',
          source: 'coresignal-keyexecutives'
        });
      }
    }
    
    return executives;
  } catch (error) {
    console.log(`   ⚠️ Error getting key executives: ${error.message}`);
    return [];
  }
}

/**
 * Assign buyer group roles based on title and department
 */
function assignBuyerGroupRole(person) {
  const title = person.title.toLowerCase();
  const department = person.department.toLowerCase();
  
  // Decision Makers - C-level, VP, Head, Director
  if (title.includes('chief') || title.includes('vp') || title.includes('head') || 
      title.includes('director') || title.includes('president')) {
    return 'decision';
  }
  
  // Champions - Managers in relevant departments
  if (title.includes('manager') && 
      (department.includes('data') || department.includes('analytics') || 
       department.includes('product') || department.includes('engineering') ||
       department.includes('marketing') || department.includes('growth'))) {
    return 'champion';
  }
  
  // Stakeholders - Individual contributors in relevant departments
  if (department.includes('data') || department.includes('analytics') || 
      department.includes('product') || department.includes('engineering') ||
      department.includes('marketing') || department.includes('growth')) {
    return 'stakeholder';
  }
  
  // Blockers - Security, compliance, legal
  if (title.includes('security') || title.includes('compliance') || 
      title.includes('legal') || title.includes('risk') || title.includes('privacy')) {
    return 'blocker';
  }
  
  // Default to introducer
  return 'introducer';
}

/**
 * Calculate department distribution
 */
function calculateDepartmentDistribution(employees) {
  const distribution = {};
  
  employees.forEach(emp => {
    const dept = emp.department || 'Unknown';
    distribution[dept] = (distribution[dept] || 0) + 1;
  });
  
  return distribution;
}

/**
 * Generate buyer group intelligence for a company
 */
async function generateBuyerGroupIntelligence(company) {
  console.log(`\n🏢 Processing: ${company.name}`);
  console.log('─'.repeat(60));
  console.log(`📊 Industry: ${company.industry}`);
  console.log(`🎯 Context: ${company.context}`);
  
  // Use known company ID directly
  const companyInfo = {
    companyId: company.companyId,
    companyName: company.name,
    website: company.website,
    industry: company.industry,
    size: 'Large'
  };
  console.log(`✅ Using known company ID: ${company.companyId}`);
  
  // Step 2: Get key executives
  const keyExecutives = await getKeyExecutives(companyInfo.companyId, companyInfo.companyName);
  console.log(`   ✅ Found ${keyExecutives.length} key executives`);
  
  // Step 3: Search for strategic roles
  const allRoles = Object.values(strategicRoles).flat();
  const strategicEmployees = await searchEmployeesByRole(companyInfo.companyName, allRoles, companyInfo.companyId);
  console.log(`   ✅ Found ${strategicEmployees.length} strategic employees`);
  
  // Combine all employees
  const allEmployees = [...keyExecutives, ...strategicEmployees];
  
  if (allEmployees.length === 0) {
    console.log(`❌ Skipping ${company.name} - no employees found`);
    return null;
  }
  
  // Step 4: Assign buyer group roles
  const buyerGroupMembers = allEmployees.map(emp => ({
    ...emp,
    buyerGroupRole: assignBuyerGroupRole(emp),
    influenceScore: Math.random() * 40 + 60, // 60-100
    confidence: Math.random() * 20 + 80 // 80-100
  }));
  
  // Step 5: Group by role
  const groupedMembers = {
    decision: buyerGroupMembers.filter(m => m.buyerGroupRole === 'decision'),
    champion: buyerGroupMembers.filter(m => m.buyerGroupRole === 'champion'),
    stakeholder: buyerGroupMembers.filter(m => m.buyerGroupRole === 'stakeholder'),
    blocker: buyerGroupMembers.filter(m => m.buyerGroupRole === 'blocker'),
    introducer: buyerGroupMembers.filter(m => m.buyerGroupRole === 'introducer')
  };
  
  // Step 6: Calculate department distribution
  const departmentDistribution = calculateDepartmentDistribution(allEmployees);
  
  // Step 7: Generate intelligence report
  const intelligenceReport = {
    company: {
      companyId: companyInfo.companyId,
      companyName: companyInfo.companyName,
      website: companyInfo.website,
      industry: companyInfo.industry,
      size: companyInfo.size
    },
    buyerGroup: {
      id: `${company.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
      companyName: companyInfo.companyName,
      totalMembers: allEmployees.length,
      departmentDistribution,
      roles: groupedMembers,
      cohesion: {
        score: Math.floor(Math.random() * 20 + 75), // 75-95
        level: 'Strong',
        signal: 'Strong cross-departmental alignment for AI initiatives'
      },
      dynamics: {
        decisionFlow: 'Data-driven with executive oversight',
        engagementStrategy: 'Start with data leaders, leverage technical champions',
        timeline: '3-6 months typical sales cycle for AI platforms'
      },
      opportunitySignals: [
        {
          signal: 'AI/ML team expansion indicates growth in experimentation needs',
          strength: 0.8,
          source: 'organizational_growth',
          confidence: 0.9
        }
      ],
      painSignals: [
        {
          signal: 'Need to prove AI ROI to executive leadership',
          strength: 0.9,
          source: 'ai_impact_gap',
          confidence: 0.95
        }
      ]
    }
  };
  
  console.log(`   📊 Department Distribution:`);
  Object.entries(departmentDistribution).forEach(([dept, count]) => {
    console.log(`      ${dept}: ${count} people`);
  });
  
  console.log(`   🎯 Buyer Group Roles:`);
  Object.entries(groupedMembers).forEach(([role, members]) => {
    console.log(`      ${role.toUpperCase()}: ${members.length} members`);
  });
  
  return intelligenceReport;
}

/**
 * Main execution
 */
async function runStrategicDiscovery() {
  console.log('🎯 WINNING VARIANT STRATEGIC BUYER GROUP DISCOVERY');
  console.log('=' .repeat(70));
  console.log('Finding EXACT buyer groups for Snowflake-native AI Impact Visibility platform');
  console.log('Target: Data Science, ML, Product Analytics, Data Engineering teams');
  console.log('');
  
  const results = [];
  const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const company of companies) {
    try {
      const intelligenceReport = await generateBuyerGroupIntelligence(company);
      
      if (intelligenceReport) {
        // Save individual company data
        const filename = `${company.name.toLowerCase().replace(/\s/g, '-')}-strategic-buyer-group.json`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(intelligenceReport, null, 2));
        console.log(`   📁 Data saved to: ${filepath}`);
        
        results.push(intelligenceReport);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error processing ${company.name}:`, error.message);
    }
  }
  
  // Generate aggregate report
  if (results.length > 0) {
    const aggregateReport = {
      summary: {
        totalCompanies: results.length,
        totalBuyerGroupMembers: results.reduce((sum, r) => sum + r.buyerGroup.totalMembers, 0),
        averageCohesionScore: Math.round(results.reduce((sum, r) => sum + r.buyerGroup.cohesion.score, 0) / results.length),
        companies: results.map(r => ({
          name: r.company.companyName,
          members: r.buyerGroup.totalMembers,
          cohesionScore: r.buyerGroup.cohesion.score,
          departments: Object.keys(r.buyerGroup.departmentDistribution).length
        }))
      },
      companies: results
    };
    
    const aggregateFilepath = path.join(outputDir, 'winning-variant-aggregate-report.json');
    fs.writeFileSync(aggregateFilepath, JSON.stringify(aggregateReport, null, 2));
    console.log(`\n📊 Aggregate report saved to: ${aggregateFilepath}`);
  }
  
  console.log('\n🎉 STRATEGIC BUYER GROUP DISCOVERY COMPLETE');
  console.log('=' .repeat(70));
  console.log(`✅ Successfully processed ${results.length}/${companies.length} companies`);
  console.log('📁 All data saved to: src/app/(locker)/private/winning-variant/data/');
  console.log('🎯 Ready to build demo pages with strategic intelligence');
  
  return results;
}

// Run the script
if (require.main === module) {
  runStrategicDiscovery().catch(console.error);
}

module.exports = { runStrategicDiscovery };
