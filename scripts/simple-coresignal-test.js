#!/usr/bin/env node

/**
 * 🔍 SIMPLE CORESIGNAL API TEST
 * 
 * Test CoreSignal API with basic endpoints
 */

require('dotenv').config();

async function testCoreSignalAPI() {
  console.log('🔍 SIMPLE CORESIGNAL API TEST');
  console.log('==============================');
  
  const apiKey = process.env.CORESIGNAL_API_KEY;
  
  if (!apiKey) {
    console.log('❌ CORESIGNAL_API_KEY not found in environment');
    return;
  }
  
  console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
  console.log('');
  
  // Test basic company enrichment
  console.log('Testing company enrichment...');
  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=dairylandpower.com', {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Company enrichment working');
      console.log('Company:', data.name || 'Not found');
      console.log('Industry:', data.industry || 'Not found');
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
  
  console.log('');
  
  // Test person enrichment with LinkedIn
  console.log('Testing person enrichment with LinkedIn...');
  try {
    const linkedinUrl = 'https://www.linkedin.com/in/jeffrey-sexton-362b6829';
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/enrich?website=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Person enrichment working');
      console.log('Name:', data.full_name || 'Not found');
      console.log('Title:', data.active_experience_title || 'Not found');
      console.log('Company:', data.active_experience_company || 'Not found');
      console.log('Email:', data.primary_professional_email || 'Not found');
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
  
  console.log('');
  console.log('📊 AUDIT SUMMARY:');
  console.log('==================');
  console.log('CoreSignal API Status: Testing completed');
  console.log('Recommendation: Check API documentation for correct endpoints');
}

// Run the test
testCoreSignalAPI().catch(console.error);
