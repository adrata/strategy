#!/usr/bin/env node

/**
 * 🎯 PREVIEW COMPANY EMPLOYEES
 * 
 * Simple script to get preview data for one company and analyze the department makeup
 * Uses CoreSignal Preview API to get 100-400 employees, then we can filter for buyer groups
 */

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import CoreSignal module
const CoreSignalModule = require('../src/platform/pipelines/modules/core/CoreSignalMultiSource.js');
const CoreSignalMultiSource = CoreSignalModule.CoreSignalMultiSource;

const companies = [
  {
    name: 'Match Group',
    website: 'https://mtch.com',
    companyId: '2496218'
  },
  {
    name: 'Brex',
    website: 'https://brex.com', 
    companyId: '21428731'
  },
  {
    name: 'First Premier Bank',
    website: 'https://firstpremier.com',
    companyId: '7578901'
  },
  {
    name: 'Zuora',
    website: 'https://zuora.com',
    companyId: '10782378'
  }
];

/**
 * Analyze department makeup from employee data
 */
function analyzeDepartmentMakeup(employees) {
  const departments = {};
  const titles = {};
  const seniority = {};
  
  employees.forEach(emp => {
    // Department analysis
    const dept = emp.department || 'Unknown';
    departments[dept] = (departments[dept] || 0) + 1;
    
    // Title analysis
    const title = emp.title || 'Unknown';
    titles[title] = (titles[title] || 0) + 1;
    
    // Seniority analysis
    const level = emp.seniority || 'Unknown';
    seniority[level] = (seniority[level] || 0) + 1;
  });
  
  return {
    departments: Object.entries(departments).sort((a, b) => b[1] - a[1]),
    titles: Object.entries(titles).sort((a, b) => b[1] - a[1]),
    seniority: Object.entries(seniority).sort((a, b) => b[1] - a[1]),
    totalEmployees: employees.length
  };
}

/**
 * Filter employees for Winning Variant buyer group
 */
function filterForBuyerGroup(employees) {
  const targetKeywords = [
    'data science', 'data scientist', 'ml', 'machine learning', 'ai', 'artificial intelligence',
    'product', 'product manager', 'product analytics', 'product marketing',
    'engineering', 'software engineer', 'data engineer', 'analytics engineer',
    'analytics', 'business intelligence', 'bi', 'data analyst', 'product analyst',
    'finance', 'cfo', 'vp finance', 'director finance', 'head finance',
    'vp', 'director', 'head', 'chief', 'senior', 'lead'
  ];
  
  return employees.filter(emp => {
    const title = (emp.title || '').toLowerCase();
    const department = (emp.department || '').toLowerCase();
    
    return targetKeywords.some(keyword => 
      title.includes(keyword) || department.includes(keyword)
    );
  });
}

/**
 * Save data to JSON and CSV
 */
function saveData(company, employees, analysis, buyerGroup) {
  const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save full JSON data
  const jsonFile = path.join(outputDir, `${company.name.toLowerCase().replace(/\s+/g, '-')}-preview-data.json`);
  const jsonData = {
    company: company,
    employees: employees,
    analysis: analysis,
    buyerGroup: buyerGroup,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
  console.log(`📁 Full data saved to: ${jsonFile}`);
  
  // Save buyer group CSV
  if (buyerGroup.length > 0) {
    const csvFile = path.join(outputDir, `${company.name.toLowerCase().replace(/\s+/g, '-')}-buyer-group.csv`);
    const csvHeaders = 'Name,Title,Department,Email,LinkedIn,Seniority,Source\n';
    const csvRows = buyerGroup.map(emp => 
      `"${emp.name}","${emp.title}","${emp.department}","${emp.email}","${emp.linkedin}","${emp.seniority}","${emp.source}"`
    ).join('\n');
    
    fs.writeFileSync(csvFile, csvHeaders + csvRows);
    console.log(`📊 Buyer group CSV saved to: ${csvFile}`);
  }
  
  return { jsonFile, csvFile: buyerGroup.length > 0 ? path.join(outputDir, `${company.name.toLowerCase().replace(/\s+/g, '-')}-buyer-group.csv`) : null };
}

/**
 * Main function to preview one company
 */
async function previewCompanyEmployees(companyName) {
  console.log(`🎯 PREVIEWING EMPLOYEES FOR: ${companyName}`);
  console.log('=' .repeat(60));
  
  const company = companies.find(c => c.name === companyName);
  if (!company) {
    console.log(`❌ Company not found: ${companyName}`);
    console.log(`Available companies: ${companies.map(c => c.name).join(', ')}`);
    return;
  }
  
  console.log(`🏢 Company: ${company.name}`);
  console.log(`🌐 Website: ${company.website}`);
  console.log(`🆔 Company ID: ${company.companyId}`);
  console.log('');
  
  try {
    // Initialize CoreSignal
    const coresignal = new CoreSignalMultiSource({
      CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
      CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
    });
    
    console.log('🔍 Step 1: Getting preview data from CoreSignal...');
    
    // Use the working approach: direct company ID API call
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${company.companyId}`, {
      headers: { 'apikey': process.env.CORESIGNAL_API_KEY }
    });

    if (!response.ok) {
      throw new Error(`Company data collection failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.key_executives || data.key_executives.length === 0) {
      console.log('❌ No key executives found');
      return;
    }
    
    console.log(`✅ Found ${data.key_executives.length} key executives`);
    
    // Convert to our format
    const employees = data.key_executives.map(exec => ({
      id: exec.id || exec.parent_id,
      name: exec.name || exec.member_full_name || 'Unknown',
      title: exec.title || exec.member_position_title || 'Unknown',
      email: exec.email || exec.member_professional_email || '',
      linkedin: exec.linkedin || exec.member_linkedin_url || '',
      company: company.name,
      department: exec.department || 'Unknown',
      seniority: exec.seniority || 'Unknown',
      source: 'coresignal-keyexecutives'
    }));
    
    if (!employees || employees.length === 0) {
      console.log('❌ No employees found in preview');
      return;
    }
    
    console.log(`✅ Found ${employees.length} employees in preview`);
    console.log('');
    
    console.log('📊 Step 2: Analyzing department makeup...');
    const analysis = analyzeDepartmentMakeup(employees);
    
    console.log(`📈 Department Distribution:`);
    analysis.departments.slice(0, 10).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} employees`);
    });
    console.log('');
    
    console.log(`📈 Top Titles:`);
    analysis.titles.slice(0, 15).forEach(([title, count]) => {
      console.log(`   ${title}: ${count} employees`);
    });
    console.log('');
    
    console.log(`📈 Seniority Levels:`);
    analysis.seniority.forEach(([level, count]) => {
      console.log(`   ${level}: ${count} employees`);
    });
    console.log('');
    
    console.log('🎯 Step 3: Filtering for Winning Variant buyer group...');
    const buyerGroup = filterForBuyerGroup(employees);
    
    console.log(`✅ Found ${buyerGroup.length} potential buyer group members`);
    console.log('');
    
    if (buyerGroup.length > 0) {
      console.log('👥 Buyer Group Members:');
      buyerGroup.slice(0, 20).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - ${emp.title} (${emp.department})`);
      });
      
      if (buyerGroup.length > 20) {
        console.log(`   ... and ${buyerGroup.length - 20} more`);
      }
      console.log('');
    }
    
    console.log('💾 Step 4: Saving data...');
    const files = saveData(company, employees, analysis, buyerGroup);
    
    console.log('');
    console.log('🎉 PREVIEW COMPLETE!');
    console.log('=' .repeat(60));
    console.log(`✅ Company: ${company.name}`);
    console.log(`✅ Total employees: ${employees.length}`);
    console.log(`✅ Buyer group candidates: ${buyerGroup.length}`);
    console.log(`📁 Data saved to: ${files.jsonFile}`);
    if (files.csvFile) {
      console.log(`📊 CSV saved to: ${files.csvFile}`);
    }
    
    return {
      company: company,
      employees: employees,
      analysis: analysis,
      buyerGroup: buyerGroup,
      files: files
    };
    
  } catch (error) {
    console.error(`❌ Error previewing ${companyName}:`, error.message);
    console.error(error.stack);
  }
}

// Run the script
if (require.main === module) {
  const companyName = process.argv[2];
  
  if (!companyName) {
    console.log('Usage: node preview-company-employees.js <company-name>');
    console.log('');
    console.log('Available companies:');
    companies.forEach(c => console.log(`  - ${c.name}`));
    console.log('');
    console.log('Example: node preview-company-employees.js "First Premier Bank"');
    process.exit(1);
  }
  
  previewCompanyEmployees(companyName).catch(console.error);
}

module.exports = { previewCompanyEmployees };
