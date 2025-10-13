#!/usr/bin/env node

/**
 * 🐛 DEBUG CLOUDCADDIE APIs
 * 
 * Debug why the APIs are failing with detailed error messages
 */

const { PrismaClient } = require('@prisma/client');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config();

// API Configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim(),
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

const LUSHA_CONFIG = {
  apiKey: process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim(),
  baseUrl: 'https://api.lusha.com/v2'
};

async function debugCloudCaddieAPIs() {
  console.log('🐛 DEBUGGING CLOUDCADDIE APIs');
  console.log('==============================\n');
  
  console.log('🔑 API Keys Status:');
  console.log(`   Coresignal: ${CORESIGNAL_CONFIG.apiKey ? `✅ Available (${CORESIGNAL_CONFIG.apiKey.length} chars)` : '❌ Missing'}`);
  console.log(`   Lusha: ${LUSHA_CONFIG.apiKey ? `✅ Available (${LUSHA_CONFIG.apiKey.length} chars)` : '❌ Missing'}\n`);

  // Get a sample person from CloudCaddie
  const prisma = new PrismaClient();
  
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { name: { contains: 'Cloud Caddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found!');
      return;
    }

    const person = await prisma.people.findFirst({
      where: { 
        workspaceId: workspace.id,
        linkedinUrl: { not: null }
      },
      include: {
        company: {
          select: {
            name: true,
            domain: true,
            website: true
          }
        }
      }
    });

    if (!person) {
      console.log('❌ No person with LinkedIn found!');
      return;
    }

    console.log(`🎯 Testing with: ${person.fullName}`);
    console.log(`   LinkedIn: ${person.linkedinUrl}`);
    console.log(`   Email: ${person.email || person.workEmail || 'None'}`);
    console.log(`   Company: ${person.company?.name || 'None'}\n`);

    // Test Coresignal with detailed error handling
    await debugCoresignalLinkedIn(person.linkedinUrl);
    await debugCoresignalEmail(person.email || person.workEmail);
    
    // Test Lusha with detailed error handling
    if (LUSHA_CONFIG.apiKey) {
      await debugLushaLinkedIn(person.linkedinUrl);
      await debugLushaNameSearch(person.firstName, person.lastName, person.company?.name);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function debugCoresignalLinkedIn(linkedinUrl) {
  console.log('🔍 DEBUG: Coresignal LinkedIn Search...');
  
  try {
    const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
    const data = {
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                linkedin_url: linkedinUrl
              }
            }
          ]
        }
      }
    };

    console.log(`   URL: ${url}`);
    console.log(`   Request:`, JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_CONFIG.apiKey
      },
      body: JSON.stringify(data)
    });

    console.log(`   Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log(`   ✅ Success! Found ${result.hits?.total || 0} results`);
    } else {
      console.log(`   ❌ Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

async function debugCoresignalEmail(email) {
  if (!email) {
    console.log('🔍 DEBUG: Coresignal Email Search... (SKIPPED - no email)\n');
    return;
  }

  console.log('🔍 DEBUG: Coresignal Email Search...');
  
  try {
    const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
    const data = {
      query: {
        bool: {
          must: [
            {
              match_phrase: {
                work_email: email
              }
            }
          ]
        }
      }
    };

    console.log(`   URL: ${url}`);
    console.log(`   Request:`, JSON.stringify(data, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_CONFIG.apiKey
      },
      body: JSON.stringify(data)
    });

    console.log(`   Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log(`   ✅ Success! Found ${result.hits?.total || 0} results`);
    } else {
      console.log(`   ❌ Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

async function debugLushaLinkedIn(linkedinUrl) {
  console.log('🔍 DEBUG: Lusha LinkedIn Search...');
  
  try {
    const requestBody = {
      contacts: [
        {
          contactId: "1",
          linkedinUrl: linkedinUrl
        }
      ],
      metadata: {
        revealEmails: true,
        revealPhones: true
      }
    };

    console.log(`   URL: https://api.lusha.com/v2/person`);
    console.log(`   Request:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.lusha.com/v2/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`   Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log(`   ✅ Success!`);
    } else {
      console.log(`   ❌ Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

async function debugLushaNameSearch(firstName, lastName, companyName) {
  if (!firstName || !lastName || !companyName) {
    console.log('🔍 DEBUG: Lusha Name Search... (SKIPPED - missing data)\n');
    return;
  }

  console.log('🔍 DEBUG: Lusha Name Search...');
  
  try {
    const requestBody = {
      contacts: [
        {
          contactId: "1",
          firstName: firstName,
          lastName: lastName,
          companyName: companyName
        }
      ],
      metadata: {
        revealEmails: true,
        revealPhones: true
      }
    };

    console.log(`   URL: https://api.lusha.com/v2/person`);
    console.log(`   Request:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.lusha.com/v2/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`   Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`   Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log(`   ✅ Success!`);
    } else {
      console.log(`   ❌ Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
}

// Run the debug
if (require.main === module) {
  debugCloudCaddieAPIs();
}

module.exports = { debugCloudCaddieAPIs };
