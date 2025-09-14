#!/usr/bin/env node

/**
 * 🧪 TEST LUSHA PHONE ENRICHMENT
 * 
 * Test what phone data we can get from Lusha API
 * and understand the structure for database enhancement
 */

const { PrismaClient } = require('@prisma/client');

async function testLushaPhoneEnrichment() {
  console.log('🧪 TESTING LUSHA PHONE ENRICHMENT');
  console.log('=================================\n');
  
  const apiKey = process.env.LUSHA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  // Test with a known executive from our discovered contacts
  const testContact = {
    companyDomain: 'azgat.com', // Great American Title Agency
    jobTitle: 'CEO',
    seniority: 'executive'
  };
  
  console.log(`🎯 Testing Lusha API for: ${testContact.jobTitle} at ${testContact.companyDomain}`);
  
  try {
    // Use Lusha v2 Prospecting API
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_domain: testContact.companyDomain,
        job_title: testContact.jobTitle,
        seniority: [testContact.seniority]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📋 LUSHA API RESPONSE STRUCTURE:');
      console.log('===============================');
      console.log(`Status: ${response.status}`);
      console.log(`Total Results: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        const person = data.data[0];
        
        console.log('\n👤 PERSON DATA STRUCTURE:');
        console.log('========================');
        console.log(`Full Name: ${person.fullName}`);
        console.log(`Job Title: ${person.jobTitle?.title}`);
        console.log(`Company: ${person.companyName}`);
        
        console.log('\n📧 EMAIL ADDRESSES:');
        console.log('==================');
        if (person.emailAddresses && person.emailAddresses.length > 0) {
          person.emailAddresses.forEach((email, index) => {
            console.log(`  ${index + 1}. ${email.email} (type: ${email.type || 'unknown'})`);
          });
        } else {
          console.log('  No email addresses found');
        }
        
        console.log('\n📞 PHONE NUMBERS:');
        console.log('================');
        if (person.phoneNumbers && person.phoneNumbers.length > 0) {
          person.phoneNumbers.forEach((phone, index) => {
            console.log(`  ${index + 1}. ${phone.number} (type: ${phone.type || 'unknown'})`);
            console.log(`     Country: ${phone.country || 'unknown'}`);
            console.log(`     Verified: ${phone.verified || false}`);
            if (phone.extension) {
              console.log(`     Extension: ${phone.extension}`);
            }
          });
          
          console.log('\n🔍 PHONE ANALYSIS:');
          console.log('==================');
          const directDial = person.phoneNumbers.find(p => p.type === 'direct' || p.type === 'direct_dial');
          const mobile = person.phoneNumbers.find(p => p.type === 'mobile');
          const work = person.phoneNumbers.find(p => p.type === 'work' || p.type === 'office');
          const main = person.phoneNumbers.find(p => p.type === 'main');
          
          console.log(`Direct Dial: ${directDial?.number || 'Not found'}`);
          console.log(`Mobile: ${mobile?.number || 'Not found'}`);
          console.log(`Work/Office: ${work?.number || 'Not found'}`);
          console.log(`Main/Company: ${main?.number || 'Not found'}`);
          
        } else {
          console.log('  No phone numbers found');
        }
        
        console.log('\n📄 FULL RESPONSE SAMPLE:');
        console.log('========================');
        console.log(JSON.stringify(person, null, 2));
        
      } else {
        console.log('❌ No people found in Lusha response');
      }
      
    } else {
      console.log(`❌ Lusha API error: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Lusha API:', error.message);
  }
}

testLushaPhoneEnrichment();
