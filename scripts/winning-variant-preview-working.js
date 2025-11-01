#!/usr/bin/env node

/**
 * 🎯 WINNING VARIANT PREVIEW WORKING
 * 
 * Use CoreSignal Preview API with company IDs to get real buyer groups
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Target companies with their CoreSignal IDs
const TARGET_COMPANIES = [
  {
    name: 'Match Group',
    id: null, // We'll need to find this
    website: 'https://www.matchgroup.com',
    industry: 'Technology'
  },
  {
    name: 'Brex',
    id: null, // We'll need to find this
    website: 'https://www.brex.com',
    industry: 'Financial Technology'
  },
  {
    name: 'First Premier Bank',
    id: 7578901, // We know this works
    website: 'https://www.firstpremier.com',
    industry: 'Financial Services'
  },
  {
    name: 'Zuora',
    id: null, // We'll need to find this
    website: 'https://www.zuora.com',
    industry: 'Software'
  }
];

// Target roles for Winning Variant's $100K AI product
const TARGET_ROLES = [
  'CEO', 'CFO', 'CTO', 'CPO',
  'VP Data Science', 'VP Product', 'VP Engineering', 'VP Analytics', 'VP Finance',
  'Director Data Science', 'Director Product', 'Director Analytics', 'Director Engineering', 'Director Finance',
  'Head of Data Science', 'Head of Product', 'Head of Analytics', 'Head of Engineering', 'Head of Finance',
  'Data Scientist', 'Product Manager', 'Engineering Manager', 'Analytics Manager'
];

async function getEmployeesByCompanyId(companyId, companyName) {
  console.log(`\n🏢 Getting employees for ${companyName} (ID: ${companyId})`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: companyId
              }
            }
          ]
        }
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.length} employees`);
      return data;
    } else {
      console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      return [];
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return [];
  }
}

async function filterToBuyerGroup(employees, companyName) {
  console.log(`\n🎯 Filtering to buyer group for ${companyName}`);
  
  // Filter for relevant roles
  const relevantEmployees = employees.filter(emp => {
    const title = emp.active_experience_title?.toLowerCase() || '';
    const department = emp.active_experience_department?.toLowerCase() || '';
    
    // Check if title matches our target roles
    const titleMatch = TARGET_ROLES.some(role => 
      title.includes(role.toLowerCase())
    );
    
    // Check if department is relevant
    const departmentMatch = [
      'data science', 'product', 'engineering', 'analytics', 'finance',
      'c-suite', 'executive', 'management'
    ].some(dept => department.includes(dept));
    
    return titleMatch || departmentMatch;
  });
  
  console.log(`   📊 ${relevantEmployees.length} relevant employees found`);
  
  // Sort by influence (management level, connections, etc.)
  const sortedEmployees = relevantEmployees.sort((a, b) => {
    // Prioritize by management level
    const levelOrder = { 'c-level': 4, 'director': 3, 'manager': 2, 'senior': 1, 'specialist': 0 };
    const aLevel = levelOrder[a.active_experience_management_level?.toLowerCase()] || 0;
    const bLevel = levelOrder[b.active_experience_management_level?.toLowerCase()] || 0;
    
    if (aLevel !== bLevel) return bLevel - aLevel;
    
    // Then by connections
    return (b.connections_count || 0) - (a.connections_count || 0);
  });
  
  // Take top 4-14 members
  const buyerGroup = sortedEmployees.slice(0, 14);
  
  console.log(`   🎯 Selected ${buyerGroup.length} buyer group members`);
  
  return buyerGroup;
}

function addWinningVariantMessaging(buyerGroup, companyName) {
  console.log(`\n💬 Adding Winning Variant messaging for ${companyName}`);
  
  return buyerGroup.map((member, index) => {
    const role = member.active_experience_title || 'Employee';
    const department = member.active_experience_department || 'Unknown';
    
    // Assign buyer group roles
    let buyerRole = 'stakeholder';
    if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('cfo') || role.toLowerCase().includes('cto')) {
      buyerRole = 'decision_maker';
    } else if (role.toLowerCase().includes('vp') || role.toLowerCase().includes('director')) {
      buyerRole = 'champion';
    }
    
    // Add personalized messaging
    const messaging = {
      buyerRole,
      personalizedMessage: `Hi ${member.full_name}, I noticed your role as ${role} at ${companyName}. Given your expertise in ${department}, you'd be interested in our AI Impact Visibility Platform that helps companies measure the ROI of their AI initiatives. 95% of generative AI pilots fail - we help prove AI ROI.`,
      valueProposition: "Close the AI Impact Gap - Measure business ROI of AI initiatives",
      productFit: `Perfect for ${department} teams looking to quantify AI success`
    };
    
    return {
      ...member,
      ...messaging
    };
  });
}

async function generateBuyerGroups() {
  console.log('🎯 GENERATING WINNING VARIANT BUYER GROUPS');
  console.log('========================================');
  
  const results = {};
  
  for (const company of TARGET_COMPANIES) {
    console.log(`\n🏢 Processing ${company.name}`);
    
    if (company.id) {
      // We have the company ID, get employees
      const employees = await getEmployeesByCompanyId(company.id, company.name);
      
      if (employees.length > 0) {
        const buyerGroup = await filterToBuyerGroup(employees, company.name);
        const buyerGroupWithMessaging = addWinningVariantMessaging(buyerGroup, company.name);
        
        results[company.name] = {
          company: company,
          totalEmployees: employees.length,
          buyerGroupSize: buyerGroupWithMessaging.length,
          buyerGroup: buyerGroupWithMessaging
        };
        
        console.log(`   ✅ Generated buyer group with ${buyerGroupWithMessaging.length} members`);
      } else {
        console.log(`   ❌ No employees found for ${company.name}`);
        results[company.name] = {
          company: company,
          totalEmployees: 0,
          buyerGroupSize: 0,
          buyerGroup: []
        };
      }
    } else {
      console.log(`   ⚠️  No company ID available for ${company.name} - skipping`);
      results[company.name] = {
        company: company,
        totalEmployees: 0,
        buyerGroupSize: 0,
        buyerGroup: []
      };
    }
  }
  
  // Save results
  const outputDir = 'src/app/(workshop)/private/winning-variant/data';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'buyer-groups-preview.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  Object.entries(results).forEach(([companyName, result]) => {
    console.log(`${companyName}: ${result.buyerGroupSize} buyer group members (${result.totalEmployees} total employees)`);
  });
  
  return results;
}

// Run the generation
generateBuyerGroups().catch(console.error);
