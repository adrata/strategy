#!/usr/bin/env node

/**
 * 🎯 MATCH GROUP BUYER GROUP DISCOVERY
 * 
 * Get Match Group employees using Preview API and create buyer group
 * Company ID: 2496218
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();
const MATCH_GROUP_ID = 2496218;
const MATCH_GROUP_NAME = 'Match Group';

// Target roles for Winning Variant's $100K AI product
const TARGET_ROLES = [
  'CEO', 'CFO', 'CTO', 'CPO',
  'VP Data Science', 'VP Product', 'VP Engineering', 'VP Analytics', 'VP Finance',
  'Director Data Science', 'Director Product', 'Director Analytics', 'Director Engineering', 'Director Finance',
  'Head of Data Science', 'Head of Product', 'Head of Analytics', 'Head of Engineering', 'Head of Finance',
  'Data Scientist', 'Product Manager', 'Engineering Manager', 'Analytics Manager',
  'Data Science Manager', 'ML Manager', 'Product Analytics Manager'
];

async function getMatchGroupEmployees() {
  console.log(`🏢 Getting employees for ${MATCH_GROUP_NAME} (ID: ${MATCH_GROUP_ID})`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              term: {
                active_experience_company_id: MATCH_GROUP_ID
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
        'apikey': CORESIGNAL_API_KEY,
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

function filterToBuyerGroup(employees, companyName) {
  console.log(`\n🎯 Filtering to buyer group for ${companyName}`);
  
  // Filter for relevant roles and departments
  const relevantEmployees = employees.filter(emp => {
    const title = emp.active_experience_title?.toLowerCase() || '';
    const department = emp.active_experience_department?.toLowerCase() || '';
    const managementLevel = emp.active_experience_management_level?.toLowerCase() || '';
    
    // Check if title matches our target roles
    const titleMatch = TARGET_ROLES.some(role => 
      title.includes(role.toLowerCase())
    );
    
    // Check if department is relevant for AI/ML/Data
    const departmentMatch = [
      'data science', 'product', 'engineering', 'analytics', 'finance',
      'c-suite', 'executive', 'management', 'technology', 'research'
    ].some(dept => department.includes(dept));
    
    // Check if management level is appropriate
    const levelMatch = [
      'c-level', 'director', 'manager', 'senior', 'head'
    ].some(level => managementLevel.includes(level));
    
    return titleMatch || departmentMatch || levelMatch;
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
  
  // Take top 4-14 members (we'll take all available since we only have 4)
  const buyerGroup = sortedEmployees.slice(0, 14);
  
  console.log(`   🎯 Selected ${buyerGroup.length} buyer group members`);
  
  return buyerGroup;
}

function addWinningVariantMessaging(buyerGroup, companyName) {
  console.log(`\n💬 Adding Winning Variant messaging for ${companyName}`);
  
  return buyerGroup.map((member, index) => {
    const role = member.active_experience_title || 'Employee';
    const department = member.active_experience_department || 'Unknown';
    const managementLevel = member.active_experience_management_level || 'Unknown';
    
    // Assign buyer group roles based on title and level
    let buyerRole = 'stakeholder';
    if (role.toLowerCase().includes('ceo') || role.toLowerCase().includes('cfo') || 
        role.toLowerCase().includes('cto') || role.toLowerCase().includes('cpo')) {
      buyerRole = 'decision_maker';
    } else if (role.toLowerCase().includes('vp') || role.toLowerCase().includes('director') ||
               role.toLowerCase().includes('head') || managementLevel === 'c-level') {
      buyerRole = 'champion';
    } else if (role.toLowerCase().includes('manager')) {
      buyerRole = 'champion';
    }
    
    // Add personalized messaging for Match Group's AI/ML context
    const messaging = {
      buyerRole,
      personalizedMessage: `Hi ${member.full_name}, I noticed your role as ${role} at ${companyName}. Given your expertise in ${department}, you'd be interested in our AI Impact Visibility Platform that helps companies measure the ROI of their AI initiatives. 95% of generative AI pilots fail - we help prove AI ROI.`,
      valueProposition: "Close the AI Impact Gap - Measure business ROI of AI initiatives",
      productFit: `Perfect for ${department} teams looking to quantify AI success`,
      winningVariantContext: "Match Group's AI-powered recommendation systems and user matching algorithms would benefit from ROI measurement"
    };
    
    return {
      ...member,
      ...messaging
    };
  });
}

async function generateMatchGroupBuyerGroup() {
  console.log('🎯 MATCH GROUP BUYER GROUP DISCOVERY');
  console.log('==================================');
  console.log('Finding buyer group for Match Group using Preview API');
  console.log('');
  
  // Get all employees
  const employees = await getMatchGroupEmployees();
  
  if (employees.length === 0) {
    console.log('❌ No employees found for Match Group');
    return null;
  }
  
  // Filter to buyer group
  const buyerGroup = filterToBuyerGroup(employees, MATCH_GROUP_NAME);
  
  if (buyerGroup.length === 0) {
    console.log('❌ No relevant buyer group members found');
    return null;
  }
  
  // Add Winning Variant messaging
  const buyerGroupWithMessaging = addWinningVariantMessaging(buyerGroup, MATCH_GROUP_NAME);
  
  // Create result object
  const result = {
    company: {
      name: MATCH_GROUP_NAME,
      id: MATCH_GROUP_ID,
      website: 'https://www.matchgroup.com',
      industry: 'Technology'
    },
    totalEmployees: employees.length,
    buyerGroupSize: buyerGroupWithMessaging.length,
    buyerGroup: buyerGroupWithMessaging
  };
  
  // Save results
  const outputDir = 'src/app/(locker)/private/winning-variant/data';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'match-group-buyer-group.json');
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  // Display summary
  console.log('\n📊 MATCH GROUP BUYER GROUP SUMMARY');
  console.log('==================================');
  console.log(`Total employees found: ${employees.length}`);
  console.log(`Buyer group members: ${buyerGroupWithMessaging.length}`);
  console.log('\nBuyer group members:');
  buyerGroupWithMessaging.forEach((member, index) => {
    console.log(`${index + 1}. ${member.full_name} - ${member.active_experience_title}`);
    console.log(`   Role: ${member.buyerRole}`);
    console.log(`   Department: ${member.active_experience_department}`);
    console.log(`   Management Level: ${member.active_experience_management_level}`);
  });
  
  return result;
}

// Run the generation
generateMatchGroupBuyerGroup().catch(console.error);
