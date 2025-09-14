#!/usr/bin/env node

/**
 * 📞 ENRICH EXISTING CONTACTS WITH PHONE NUMBERS
 * 
 * Uses Lusha API to add phone numbers to our discovered contacts
 * Focuses on senior executives with high buyer group scores
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

/**
 * 📞 Extract and organize phone numbers from Lusha response
 */
function extractPhoneData(lushaResponse) {
  const phones = lushaResponse.phoneNumbers || [];
  
  if (phones.length === 0) {
    return {
      phoneEnrichmentSource: 'lusha_v2_api',
      phoneEnrichmentDate: new Date(),
      phoneDataQuality: 0
    };
  }
  
  // Prioritize phone types by business value
  const directDial = phones.find(p => p.type === 'direct');
  const mobile = phones.find(p => p.type === 'mobile');
  const work = phones.find(p => p.type === 'work' || p.type === 'office');
  const main = phones.find(p => p.type === 'main');
  
  // Get the two most valuable phone numbers
  const prioritizedPhones = [directDial, mobile, work, main].filter(Boolean);
  
  const result = {
    phoneEnrichmentSource: 'lusha_v2_api',
    phoneEnrichmentDate: new Date(),
    phoneDataQuality: calculatePhoneQuality(phones)
  };
  
  // Set phone1 (highest priority)
  if (prioritizedPhones[0]) {
    result.phone1 = prioritizedPhones[0].number;
    result.phone1Type = prioritizedPhones[0].type;
    result.phone1Verified = prioritizedPhones[0].verified || false;
    result.phone1Extension = prioritizedPhones[0].extension;
  }
  
  // Set phone2 (second highest priority)
  if (prioritizedPhones[1]) {
    result.phone2 = prioritizedPhones[1].number;
    result.phone2Type = prioritizedPhones[1].type;
    result.phone2Verified = prioritizedPhones[1].verified || false;
    result.phone2Extension = prioritizedPhones[1].extension;
  }
  
  // Set specific phone type fields for quick access
  if (directDial) {
    result.directDialPhone = directDial.number;
  }
  
  if (mobile) {
    result.mobilePhone = mobile.number;
    result.mobilePhoneVerified = mobile.verified || false;
  }
  
  if (work) {
    result.workPhone = work.number;
    result.workPhoneVerified = work.verified || false;
  }
  
  return result;
}

/**
 * 🎯 Calculate phone data quality score (0-100)
 */
function calculatePhoneQuality(phones) {
  if (phones.length === 0) return 0;
  
  let quality = 30; // Base score for having any phone
  
  // Bonus for phone types (business value)
  const hasDirectDial = phones.some(p => p.type === 'direct');
  const hasMobile = phones.some(p => p.type === 'mobile');
  const hasWork = phones.some(p => p.type === 'work' || p.type === 'office');
  
  if (hasDirectDial) quality += 30; // Direct dial is most valuable
  if (hasMobile) quality += 20;     // Mobile is very valuable
  if (hasWork) quality += 15;       // Work phone is valuable
  
  // Bonus for verification
  const verifiedPhones = phones.filter(p => p.verified).length;
  quality += verifiedPhones * 5; // 5 points per verified phone
  
  // Bonus for multiple phone numbers
  if (phones.length >= 2) quality += 10;
  if (phones.length >= 3) quality += 5;
  
  return Math.min(quality, 100);
}

/**
 * 🎯 Get seniority level for Lusha filtering
 */
function getSeniorityForRole(role) {
  const roleLower = role.toLowerCase();
  
  if (['ceo', 'cfo', 'coo', 'president', 'owner'].some(r => roleLower.includes(r))) {
    return ['executive', 'c_level'];
  }
  
  if (['vp', 'vice president', 'director'].some(r => roleLower.includes(r))) {
    return ['director', 'vp'];
  }
  
  if (['manager', 'head of'].some(r => roleLower.includes(r))) {
    return ['manager', 'senior'];
  }
  
  return ['manager', 'senior', 'director'];
}

/**
 * 🔍 Enrich contact with Lusha phone data
 */
async function enrichContactWithLushaPhones(companyDomain, jobTitle, apiKey) {
  try {
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_domain: companyDomain,
        job_title: jobTitle,
        seniority: getSeniorityForRole(jobTitle)
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const person = data.data[0];
        const phoneData = extractPhoneData(person);
        
        return phoneData;
      }
    }
    
  } catch (error) {
    console.log(`   ⚠️ Lusha Phone error:`, error.message);
  }
  
  return null;
}

/**
 * 📞 Main phone enrichment function
 */
async function enrichContactsWithPhones() {
  console.log('📞 ENRICHING CONTACTS WITH PHONE NUMBERS');
  console.log('=========================================\n');
  
  const apiKey = process.env.LUSHA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('Please set LUSHA_API_KEY in your .env file');
    return;
  }
  
  try {
    await prisma.$connect();
    
    // Get high-priority contacts without phone enrichment
    const contactsToEnrich = await prisma.contacts.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano',
        phoneEnrichmentSource: null, // Not yet enriched
        OR: [
          { seniorityScore: { gte: 60 } }, // Director level and above
          { buyerGroupRole: 'decision_maker' },
          { buyerGroupRole: 'champion' }
        ]
      },
      include: {
        accounts: {
          select: { website: true, name: true }
        }
      },
      orderBy: [
        { seniorityScore: 'desc' },
        { targetPriority: 'desc' }
      ],
      take: 50 // Limit to top 50 contacts for testing
    });
    
    console.log(`📋 Found ${contactsToEnrich.length} high-priority contacts to enrich\n`);
    
    let enrichedCount = 0;
    let phonesFound = 0;
    
    for (const [index, contact] of contactsToEnrich.entries()) {
      console.log(`📞 [${index + 1}/${contactsToEnrich.length}] ${contact.fullName}`);
      console.log(`   🏢 ${contact.accounts?.name || 'Unknown Company'}`);
      console.log(`   💼 ${contact.jobTitle} (${contact.seniority})`);
      console.log(`   🎯 ${contact.buyerGroupRole} - Priority: ${contact.targetPriority}`);
      
      if (!contact.accounts?.website) {
        console.log(`   ⚠️ No website found for account\n`);
        continue;
      }
      
      // Clean up domain
      const domain = contact.accounts.website
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0];
      
      console.log(`   🌐 Enriching from: ${domain}`);
      
      // Get phone data from Lusha
      const phoneData = await enrichContactWithLushaPhones(
        domain,
        contact.jobTitle || 'Executive',
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
        
        console.log(`   ✅ Phone enrichment successful!`);
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
            phoneEnrichmentSource: 'lusha_v2_api',
            phoneEnrichmentDate: new Date(),
            phoneDataQuality: 0
          }
        });
        
        console.log(`   ⚠️ No phone numbers found`);
      }
      
      console.log(''); // Empty line for readability
      
      // Rate limiting - Lusha allows 50 requests per second
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay = 10 requests/second (conservative)
    }
    
    console.log('📊 PHONE ENRICHMENT COMPLETE!');
    console.log('==============================');
    console.log(`📋 Contacts processed: ${contactsToEnrich.length}`);
    console.log(`✅ Contacts enriched: ${enrichedCount}`);
    console.log(`📞 Total phones found: ${phonesFound}`);
    console.log(`📈 Success rate: ${((enrichedCount / contactsToEnrich.length) * 100).toFixed(1)}%`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Phone enrichment error:', error.message);
  }
}

enrichContactsWithPhones();
