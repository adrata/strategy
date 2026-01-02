#!/usr/bin/env node

/**
 * Diagnostic: Check what employees Coresignal actually has for Renesas
 * in the departments we configured for TruthKeep.ai
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys
const cleanEnvKeys = () => {
  const keysToClean = ['CORESIGNAL_API_KEY'];
  keysToClean.forEach(key => {
    if (process.env[key]) {
      process.env[key] = process.env[key].replace(/\\n/g, '').replace(/\n/g, '').trim();
    }
  });
};
cleanEnvKeys();

const fetch = require('node-fetch');

async function searchCoresignal(keywords, page = 1) {
  const apiKey = process.env.CORESIGNAL_API_KEY;
  const url = 'https://api.coresignal.com/cdapi/v1/professional_network/member/search/filter';

  const payload = {
    title: keywords.join(' OR '),
    company_website: 'renesas.com',
    application_id: 3 // LinkedIn
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Coresignal API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

async function diagnose() {
  console.log('\n🔍 DIAGNOSTIC: Renesas Employee Search by Department\n');
  console.log('='.repeat(80));
  console.log('\nSearching for employees in target departments:\n');

  const targetDepartments = {
    'Product Management': ['product manager', 'product management', 'product director', 'head of product', 'vp product'],
    'Customer Support': ['customer support', 'technical support', 'customer success', 'support director', 'support manager'],
    'Quality': ['quality assurance', 'quality director', 'quality manager', 'qa director', 'qa manager'],
    'Data Analytics': ['data analyst', 'data analytics', 'business intelligence', 'analytics director', 'analytics manager'],
    'Field Application': ['field application engineer', 'fae', 'field applications', 'application engineer'],
    'Sales (for comparison)': ['sales', 'account manager', 'sales director', 'vp sales']
  };

  for (const [dept, keywords] of Object.entries(targetDepartments)) {
    console.log(`\n📊 ${dept}:`);
    console.log(`   Keywords: ${keywords.join(', ')}`);

    try {
      const result = await searchCoresignal(keywords);
      console.log(`   ✅ Found: ${result.length || 0} employees`);

      if (result.length > 0) {
        const sample = result.slice(0, 5);
        sample.forEach((emp, idx) => {
          console.log(`      ${idx + 1}. ${emp.name} - ${emp.title}`);
        });
        if (result.length > 5) {
          console.log(`      ... and ${result.length - 5} more`);
        }
      }

      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 Summary:');
  console.log('   This diagnostic shows what employees Coresignal actually has for Renesas');
  console.log('   in the departments we configured for TruthKeep.ai.');
  console.log('\n   If Product Management, Customer Support, and Quality show 0 or very few employees,');
  console.log('   then either:');
  console.log('   1. Coresignal has limited data for Renesas in these departments');
  console.log('   2. Our keyword matching is too strict');
  console.log('   3. These roles have different titles at Renesas\n');
}

diagnose().catch(console.error);
