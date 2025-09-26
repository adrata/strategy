#!/usr/bin/env node

/**
 * 🔍 EMPLOYMENT DATA AUDIT SCRIPT
 * 
 * Comprehensive audit of people-company assignments to identify mismatches
 */

const https = require('https');

const WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
const USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM';

async function fetchPeopleData() {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000/api/data/unified?type=people&action=get&workspaceId=${WORKSPACE_ID}&userId=${USER_ID}`;
    
    const req = require('http').get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.data || []);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
  });
}

function extractEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

function generateCompanyEmailDomain(companyName) {
  if (!companyName) return null;
  return companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '') + '.com';
}

function analyzeEmploymentMismatches(people) {
  console.log('🔍 EMPLOYMENT DATA AUDIT RESULTS');
  console.log('=====================================\n');
  
  const mismatches = [];
  const emailDomainMismatches = [];
  const coresignalMismatches = [];
  const noEmploymentData = [];
  
  people.forEach(person => {
    const assignedCompany = person.company?.name;
    const email = person.email;
    const emailDomain = extractEmailDomain(email);
    const coresignalData = person.customFields?.coresignalData;
    const enrichedData = person.customFields?.enrichedData;
    
    // Check email domain mismatch
    if (email && assignedCompany && emailDomain) {
      const expectedDomain = generateCompanyEmailDomain(assignedCompany);
      if (emailDomain !== expectedDomain) {
        emailDomainMismatches.push({
          name: person.fullName,
          email,
          emailDomain,
          assignedCompany,
          expectedDomain,
          type: 'email_domain_mismatch'
        });
      }
    }
    
    // Check CoreSignal data mismatch
    if (coresignalData?.active_experience_company_name && assignedCompany) {
      const actualCompany = coresignalData.active_experience_company_name;
      if (actualCompany !== assignedCompany) {
        coresignalMismatches.push({
          name: person.fullName,
          assignedCompany,
          actualCompany,
          email,
          linkedin: coresignalData.linkedin_url,
          type: 'coresignal_mismatch'
        });
      }
    }
    
    // Check enriched data mismatch
    if (enrichedData?.career?.currentCompany && assignedCompany) {
      const enrichedCompany = enrichedData.career.currentCompany;
      if (enrichedCompany !== assignedCompany) {
        coresignalMismatches.push({
          name: person.fullName,
          assignedCompany,
          actualCompany: enrichedCompany,
          email,
          type: 'enriched_data_mismatch'
        });
      }
    }
    
    // Check for people with no employment verification data
    if (!coresignalData && !enrichedData?.career) {
      noEmploymentData.push({
        name: person.fullName,
        assignedCompany,
        email,
        type: 'no_employment_data'
      });
    }
  });
  
  // Generate comprehensive report
  console.log(`📊 AUDIT SUMMARY:`);
  console.log(`Total People: ${people.length}`);
  console.log(`Email Domain Mismatches: ${emailDomainMismatches.length}`);
  console.log(`CoreSignal/Enriched Data Mismatches: ${coresignalMismatches.length}`);
  console.log(`No Employment Data: ${noEmploymentData.length}`);
  console.log(`\n`);
  
  // Report email domain mismatches
  if (emailDomainMismatches.length > 0) {
    console.log('❌ EMAIL DOMAIN MISMATCHES:');
    console.log('============================');
    emailDomainMismatches.slice(0, 10).forEach(mismatch => {
      console.log(`• ${mismatch.name}`);
      console.log(`  Assigned to: ${mismatch.assignedCompany}`);
      console.log(`  Email: ${mismatch.email} (domain: ${mismatch.emailDomain})`);
      console.log(`  Expected domain: ${mismatch.expectedDomain}`);
      console.log('');
    });
    if (emailDomainMismatches.length > 10) {
      console.log(`... and ${emailDomainMismatches.length - 10} more email domain mismatches`);
    }
    console.log('');
  }
  
  // Report CoreSignal/Enriched data mismatches
  if (coresignalMismatches.length > 0) {
    console.log('❌ EMPLOYMENT DATA MISMATCHES:');
    console.log('===============================');
    coresignalMismatches.slice(0, 10).forEach(mismatch => {
      console.log(`• ${mismatch.name}`);
      console.log(`  Assigned to: ${mismatch.assignedCompany}`);
      console.log(`  Actually works at: ${mismatch.actualCompany}`);
      console.log(`  Email: ${mismatch.email}`);
      if (mismatch.linkedin) console.log(`  LinkedIn: ${mismatch.linkedin}`);
      console.log('');
    });
    if (coresignalMismatches.length > 10) {
      console.log(`... and ${coresignalMismatches.length - 10} more employment mismatches`);
    }
    console.log('');
  }
  
  // Report people with no employment data
  if (noEmploymentData.length > 0) {
    console.log('⚠️ PEOPLE WITH NO EMPLOYMENT VERIFICATION DATA:');
    console.log('================================================');
    noEmploymentData.slice(0, 10).forEach(person => {
      console.log(`• ${person.name}`);
      console.log(`  Assigned to: ${person.assignedCompany}`);
      console.log(`  Email: ${person.email}`);
      console.log('');
    });
    if (noEmploymentData.length > 10) {
      console.log(`... and ${noEmploymentData.length - 10} more people without employment data`);
    }
    console.log('');
  }
  
  // Generate recommendations
  console.log('🎯 RECOMMENDATIONS:');
  console.log('===================');
  console.log('1. Fix email domain mismatches by updating company assignments');
  console.log('2. Update company assignments based on CoreSignal/Enriched data');
  console.log('3. Implement employment verification for people without data');
  console.log('4. Add data quality checks to prevent future mismatches');
  console.log('');
  
  return {
    totalPeople: people.length,
    emailDomainMismatches,
    coresignalMismatches,
    noEmploymentData,
    summary: {
      emailMismatches: emailDomainMismatches.length,
      employmentMismatches: coresignalMismatches.length,
      noData: noEmploymentData.length
    }
  };
}

async function main() {
  try {
    console.log('🚀 Starting Employment Data Audit...\n');
    
    const people = await fetchPeopleData();
    console.log(`📊 Fetched ${people.length} people records\n`);
    
    const auditResults = analyzeEmploymentMismatches(people);
    
    console.log('✅ Audit completed successfully!');
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeEmploymentMismatches, fetchPeopleData };
