#!/usr/bin/env node

/**
 * 📞 ENRICH CONTACTS WITH PHONE NUMBERS - LINKEDIN APPROACH
 * 
 * Uses Lusha Person API with LinkedIn URLs for better phone discovery
 * Much more accurate than company domain + job title approach
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

/**
 * 📞 Extract and organize phone numbers from Lusha response
 * CORRECTED for actual Lusha v2 response format
 */
function extractPhoneData(lushaResponse) {
  const phones = lushaResponse.phoneNumbers || [];
  
  if (phones.length === 0) {
    return {
      phoneEnrichmentSource: 'lusha_v2_linkedin',
      phoneEnrichmentDate: new Date(),
      phoneDataQuality: 0
    };
  }
  
  // Lusha v2 uses 'phoneType' not 'type', and different type values
  const directDial = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
  const mobile = phones.find(p => p.phoneType === 'mobile');
  const work = phones.find(p => p.phoneType === 'work' || p.phoneType === 'office');
  const main = phones.find(p => p.phoneType === 'main' || p.phoneType === 'company');
  
  // Get the two most valuable phone numbers
  const prioritizedPhones = [directDial, mobile, work, main].filter(Boolean);
  
  const result = {
    phoneEnrichmentSource: 'lusha_v2_linkedin',
    phoneEnrichmentDate: new Date(),
    phoneDataQuality: calculatePhoneQuality(phones)
  };
  
  // Set phone1 (highest priority)
  if (prioritizedPhones[0]) {
    result.phone1 = prioritizedPhones[0].number;
    result.phone1Type = prioritizedPhones[0].phoneType;
    result.phone1Verified = !prioritizedPhones[0].doNotCall; // Lusha uses doNotCall flag
    result.phone1Extension = prioritizedPhones[0].extension;
  }
  
  // Set phone2 (second highest priority)
  if (prioritizedPhones[1]) {
    result.phone2 = prioritizedPhones[1].number;
    result.phone2Type = prioritizedPhones[1].phoneType;
    result.phone2Verified = !prioritizedPhones[1].doNotCall;
    result.phone2Extension = prioritizedPhones[1].extension;
  }
  
  // Set specific phone type fields for quick access
  if (directDial) {
    result.directDialPhone = directDial.number;
  }
  
  if (mobile) {
    result.mobilePhone = mobile.number;
    result.mobilePhoneVerified = !mobile.doNotCall;
  }
  
  if (work) {
    result.workPhone = work.number;
    result.workPhoneVerified = !work.doNotCall;
  }
  
  return result;
}

/**
 * 🎯 Calculate phone data quality score (0-100)
 */
function calculatePhoneQuality(phones) {
  if (phones.length === 0) return 0;
  
  let quality = 30; // Base score for having any phone
  
  // Bonus for phone types (business value) - using Lusha's phoneType field
  const hasDirectDial = phones.some(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
  const hasMobile = phones.some(p => p.phoneType === 'mobile');
  const hasWork = phones.some(p => p.phoneType === 'work' || p.phoneType === 'office');
  
  if (hasDirectDial) quality += 30; // Direct dial is most valuable
  if (hasMobile) quality += 20;     // Mobile is very valuable
  if (hasWork) quality += 15;       // Work phone is valuable
  
  // Bonus for verification (Lusha uses doNotCall: false as verification)
  const verifiedPhones = phones.filter(p => !p.doNotCall).length;
  quality += verifiedPhones * 5; // 5 points per verified phone
  
  // Bonus for multiple phone numbers
  if (phones.length >= 2) quality += 10;
  if (phones.length >= 3) quality += 5;
  
  return Math.min(quality, 100);
}

/**
 * 🔍 Enrich contact with Lusha phone data using LinkedIn URL
 */
async function enrichContactWithLinkedInPhone(linkedinUrl, apiKey) {
  try {
    console.log(`   🔗 LinkedIn enrichment: ${linkedinUrl.split('/in/')[1] || 'profile'}...`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'api_key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Lusha v2 response format: { contact: { data: {...}, error: {...}, isCreditCharged: boolean } }
      if (data.contact && data.contact.data && !data.contact.error) {
        const personData = data.contact.data;
        
        if (personData.phoneNumbers && personData.phoneNumbers.length > 0) {
          const phoneData = extractPhoneData(personData);
          
          console.log(`   ✅ LinkedIn Phone: Found ${personData.phoneNumbers.length} phones for ${personData.fullName || 'contact'}`);
          console.log(`   💳 Credit charged: ${data.contact.isCreditCharged}`);
          
          return phoneData;
        } else {
          console.log(`   ⚠️ LinkedIn Phone: No phone numbers in response`);
        }
      } else if (data.contact && data.contact.error) {
        console.log(`   ⚠️ LinkedIn Phone: ${data.contact.error.message} (${data.contact.error.name})`);
        console.log(`   💳 Credit charged: ${data.contact.isCreditCharged}`);
      } else {
        console.log(`   ⚠️ LinkedIn Phone: Unexpected response format`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ⚠️ LinkedIn Phone API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }
    
  } catch (error) {
    console.log(`   ⚠️ LinkedIn Phone error:`, error.message);
  }
  
  return null;
}

/**
 * 📞 Main LinkedIn phone enrichment function
 */
async function enrichContactsWithLinkedInPhones() {
  console.log('📞 ENRICHING CONTACTS WITH LINKEDIN PHONE NUMBERS');
  console.log('=================================================\n');
  
  const apiKey = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').replace(/"/g, '').trim();
  
  if (!apiKey) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('Please set LUSHA_API_KEY in your .env file');
    return;
  }
  
  try {
    await prisma.$connect();
    
    // Get high-priority contacts with LinkedIn URLs but no phone enrichment
    const contactsToEnrich = await prisma.contacts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano',
        linkedinUrl: { not: null },
        phoneEnrichmentSource: null // Not yet enriched - remove filters to get ALL contacts
      },
      orderBy: [
        { seniorityScore: 'desc' },
        { targetPriority: 'desc' }
      ],
      // take: 389 // Process ALL contacts - remove limit
    });
    
    console.log(`📋 Found ${contactsToEnrich.length} high-priority contacts with LinkedIn URLs to enrich\n`);
    
    let enrichedCount = 0;
    let phonesFound = 0;
    
    for (const [index, contact] of contactsToEnrich.entries()) {
      console.log(`📞 [${index + 1}/${contactsToEnrich.length}] ${contact.fullName}`);
      console.log(`   💼 ${contact.jobTitle} (${contact.seniority})`);
      console.log(`   🎯 ${contact.buyerGroupRole} - Priority: ${contact.targetPriority}`);
      console.log(`   🔗 ${contact.linkedinUrl}`);
      
      // Get phone data from Lusha using LinkedIn URL
      const phoneData = await enrichContactWithLinkedInPhone(
        contact.linkedinUrl,
        apiKey
      );
      
      if (phoneData && (phoneData.phone1 || phoneData.phone2)) {
        // Update contact with phone data
        await prisma.contacts.update({
          where: { id: contact.id },
          data: phoneData
        });
        
        enrichedCount++;
        if (phoneData.phone1) phonesFound++;
        if (phoneData.phone2) phonesFound++;
        
        console.log(`   ✅ LinkedIn phone enrichment successful!`);
        if (phoneData.phone1) {
          console.log(`      📞 Phone 1: ${phoneData.phone1} (${phoneData.phone1Type})`);
        }
        if (phoneData.phone2) {
          console.log(`      📞 Phone 2: ${phoneData.phone2} (${phoneData.phone2Type})`);
        }
        if (phoneData.directDialPhone) {
          console.log(`      🎯 Direct Dial: ${phoneData.directDialPhone}`);
        }
        console.log(`      📊 Quality Score: ${phoneData.phoneDataQuality}/100`);
        
      } else {
        // Mark as attempted even if no phones found
        await prisma.contacts.update({
          where: { id: contact.id },
          data: {
            phoneEnrichmentSource: 'lusha_v2_linkedin',
            phoneEnrichmentDate: new Date(),
            phoneDataQuality: 0
          }
        });
        
        console.log(`   ⚠️ No phone numbers found via LinkedIn`);
      }
      
      console.log(''); // Empty line for readability
      
      // Rate limiting - Lusha allows 50 requests per second, we'll be conservative
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay = 10 requests/second for faster processing
    }
    
    console.log('📊 LINKEDIN PHONE ENRICHMENT COMPLETE!');
    console.log('======================================');
    console.log(`📋 Contacts processed: ${contactsToEnrich.length}`);
    console.log(`✅ Contacts enriched: ${enrichedCount}`);
    console.log(`📞 Total phones found: ${phonesFound}`);
    console.log(`📈 Success rate: ${((enrichedCount / contactsToEnrich.length) * 100).toFixed(1)}%`);
    
    if (enrichedCount > 0) {
      console.log(`\n🎯 NEXT STEPS:`);
      console.log(`1. Scale to more contacts (increase 'take' limit)`);
      console.log(`2. Process all 389 contacts with LinkedIn URLs`);
      console.log(`3. Integrate phone data into sales outreach`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ LinkedIn phone enrichment error:', error.message);
  }
}

enrichContactsWithLinkedInPhones();
