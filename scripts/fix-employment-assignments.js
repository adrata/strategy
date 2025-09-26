#!/usr/bin/env node

/**
 * 🔧 EMPLOYMENT ASSIGNMENT FIX SCRIPT
 * 
 * Automatically fixes people-company assignments based on employment verification data
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

function generateCompanyNameFromEmail(email) {
  if (!email) return null;
  const domain = extractEmailDomain(email);
  if (!domain) return null;
  
  // Remove common TLDs and convert to company name
  const companyName = domain
    .replace(/\.(com|org|net|gov|edu)$/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return companyName;
}

function analyzeAndFixAssignments(people) {
  console.log('🔧 EMPLOYMENT ASSIGNMENT FIXES');
  console.log('==============================\n');
  
  const fixes = [];
  const removals = [];
  const warnings = [];
  
  people.forEach(person => {
    const assignedCompany = person.company?.name;
    const email = person.email;
    const coresignalData = person.customFields?.coresignalData;
    const enrichedData = person.customFields?.enrichedData;
    
    // Priority 1: Use CoreSignal data (most reliable)
    if (coresignalData?.active_experience_company_name) {
      const actualCompany = coresignalData.active_experience_company_name;
      if (actualCompany !== assignedCompany) {
        fixes.push({
          personId: person.id,
          name: person.fullName,
          currentAssignment: assignedCompany,
          correctAssignment: actualCompany,
          source: 'coresignal',
          email,
          confidence: 'high'
        });
      }
    }
    // Priority 2: Use enriched data
    else if (enrichedData?.career?.currentCompany) {
      const actualCompany = enrichedData.career.currentCompany;
      if (actualCompany !== assignedCompany) {
        fixes.push({
          personId: person.id,
          name: person.fullName,
          currentAssignment: assignedCompany,
          correctAssignment: actualCompany,
          source: 'enriched',
          email,
          confidence: 'medium'
        });
      }
    }
    // Priority 3: Use email domain to infer company
    else if (email && assignedCompany) {
      const emailDomain = extractEmailDomain(email);
      const inferredCompany = generateCompanyNameFromEmail(email);
      
      if (inferredCompany && inferredCompany !== assignedCompany) {
        fixes.push({
          personId: person.id,
          name: person.fullName,
          currentAssignment: assignedCompany,
          correctAssignment: inferredCompany,
          source: 'email_domain',
          email,
          confidence: 'low'
        });
      }
    }
    // Priority 4: Flag people with no employment data
    else if (!coresignalData && !enrichedData?.career) {
      warnings.push({
        personId: person.id,
        name: person.fullName,
        assignedCompany,
        email,
        issue: 'no_employment_data'
      });
    }
  });
  
  // Generate fix recommendations
  console.log(`📊 FIX ANALYSIS:`);
  console.log(`Total People: ${people.length}`);
  console.log(`High Confidence Fixes: ${fixes.filter(f => f.confidence === 'high').length}`);
  console.log(`Medium Confidence Fixes: ${fixes.filter(f => f.confidence === 'medium').length}`);
  console.log(`Low Confidence Fixes: ${fixes.filter(f => f.confidence === 'low').length}`);
  console.log(`People with No Data: ${warnings.length}`);
  console.log(`\n`);
  
  // Show high confidence fixes
  const highConfidenceFixes = fixes.filter(f => f.confidence === 'high');
  if (highConfidenceFixes.length > 0) {
    console.log('✅ HIGH CONFIDENCE FIXES (CoreSignal Data):');
    console.log('===========================================');
    highConfidenceFixes.slice(0, 10).forEach(fix => {
      console.log(`• ${fix.name}`);
      console.log(`  Current: ${fix.currentAssignment}`);
      console.log(`  Should be: ${fix.correctAssignment}`);
      console.log(`  Email: ${fix.email}`);
      console.log('');
    });
    if (highConfidenceFixes.length > 10) {
      console.log(`... and ${highConfidenceFixes.length - 10} more high confidence fixes`);
    }
    console.log('');
  }
  
  // Show medium confidence fixes
  const mediumConfidenceFixes = fixes.filter(f => f.confidence === 'medium');
  if (mediumConfidenceFixes.length > 0) {
    console.log('⚠️ MEDIUM CONFIDENCE FIXES (Enriched Data):');
    console.log('===========================================');
    mediumConfidenceFixes.slice(0, 5).forEach(fix => {
      console.log(`• ${fix.name}`);
      console.log(`  Current: ${fix.currentAssignment}`);
      console.log(`  Should be: ${fix.correctAssignment}`);
      console.log(`  Email: ${fix.email}`);
      console.log('');
    });
    if (mediumConfidenceFixes.length > 5) {
      console.log(`... and ${mediumConfidenceFixes.length - 5} more medium confidence fixes`);
    }
    console.log('');
  }
  
  // Show warnings
  if (warnings.length > 0) {
    console.log('⚠️ PEOPLE WITH NO EMPLOYMENT DATA:');
    console.log('==================================');
    warnings.slice(0, 5).forEach(warning => {
      console.log(`• ${warning.name}`);
      console.log(`  Assigned to: ${warning.assignedCompany || 'No company'}`);
      console.log(`  Email: ${warning.email || 'No email'}`);
      console.log('');
    });
    if (warnings.length > 5) {
      console.log(`... and ${warnings.length - 5} more people without employment data`);
    }
    console.log('');
  }
  
  // Generate SQL update statements
  console.log('🔧 SQL UPDATE STATEMENTS:');
  console.log('=========================');
  console.log('-- High confidence fixes (CoreSignal data)');
  highConfidenceFixes.slice(0, 5).forEach(fix => {
    console.log(`UPDATE people SET companyId = (SELECT id FROM companies WHERE name = '${fix.correctAssignment}') WHERE id = '${fix.personId}';`);
  });
  
  if (highConfidenceFixes.length > 5) {
    console.log(`-- ... and ${highConfidenceFixes.length - 5} more high confidence updates`);
  }
  
  console.log('\n-- Medium confidence fixes (Enriched data)');
  mediumConfidenceFixes.slice(0, 3).forEach(fix => {
    console.log(`UPDATE people SET companyId = (SELECT id FROM companies WHERE name = '${fix.correctAssignment}') WHERE id = '${fix.personId}';`);
  });
  
  if (mediumConfidenceFixes.length > 3) {
    console.log(`-- ... and ${mediumConfidenceFixes.length - 3} more medium confidence updates`);
  }
  
  return {
    totalPeople: people.length,
    fixes,
    warnings,
    summary: {
      highConfidence: highConfidenceFixes.length,
      mediumConfidence: mediumConfidenceFixes.length,
      lowConfidence: fixes.filter(f => f.confidence === 'low').length,
      noData: warnings.length
    }
  };
}

async function main() {
  try {
    console.log('🚀 Starting Employment Assignment Fix Analysis...\n');
    
    const people = await fetchPeopleData();
    console.log(`📊 Fetched ${people.length} people records\n`);
    
    const fixResults = analyzeAndFixAssignments(people);
    
    console.log('✅ Fix analysis completed successfully!');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review the high confidence fixes');
    console.log('2. Apply the SQL updates to fix company assignments');
    console.log('3. Implement employment verification for people without data');
    console.log('4. Add data quality checks to prevent future mismatches');
    
  } catch (error) {
    console.error('❌ Fix analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeAndFixAssignments, fetchPeopleData };
