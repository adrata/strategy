#!/usr/bin/env node

/**
 * Snowflake Commercial Segment Buyer Group Discovery
 * 
 * CONTEXT FROM SALES FEEDBACK:
 * ============================
 * - Ariel Fleming (Strategic Account Exec) is "Majors" segment = FARMER (expansion, badged at one client)
 * - We need to target "Commercial" segment = HUNTERS (acquisition, new business)
 * - Recommended targeting: RVPs of Commercial segment
 * 
 * SNOWFLAKE SALES ORG STRUCTURE:
 * ==============================
 * 1. Commercial: High-volume, digital-native companies - manages ACQUISITION to expansion
 * 2. Enterprise: Mid-market - both acquisition and expansion
 * 3. Majors: World's largest companies - dedicated account teams (farmers)
 * 
 * TARGET PERSONAS:
 * ================
 * - RVP Commercial Sales (Regional Vice President)
 * - Director Commercial Sales
 * - Commercial Account Executive (NOT Strategic/Enterprise AE)
 * - Sales Leadership in Commercial org
 * 
 * KNOWN CONTACTS:
 * ===============
 * - Adam Rosenbloom: RVP Commercial Sales - US West & Canada (Denver, CO)
 * - Ben Compton: LinkedIn https://www.linkedin.com/in/benkcompton/ (need to verify role)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// Commercial Sales targeting configuration
const COMMERCIAL_SALES_PROFILE = {
  // Target departments - focus on Commercial sales org
  targetDepartments: [
    'sales',
    'commercial',
    'business development',
    'revenue'
  ],
  
  // Exclude departments that are NOT hunters
  excludeDepartments: [
    'customer success',
    'support',
    'services',
    'implementation',
    'engineering',
    'product',
    'marketing',
    'hr',
    'finance',
    'legal'
  ],
  
  // Target titles - Commercial segment leadership and AEs
  targetTitles: [
    'regional vice president',
    'rvp',
    'vice president commercial',
    'vp commercial',
    'director commercial',
    'commercial director',
    'commercial sales',
    'account executive',
    'ae ',
    'sales director',
    'sales manager',
    'head of sales',
    'chief revenue officer',
    'cro'
  ],
  
  // Exclude titles - farmers and expansion roles
  excludeTitles: [
    'strategic account',          // Majors segment (farmers)
    'majors',                     // Explicit Majors segment
    'global account',             // Large account managers
    'enterprise account executive', // Enterprise segment  
    'customer success',
    'account manager',            // Farmers, not hunters
    'renewal',
    'expansion',
    'implementation',
    'solutions engineer',
    'solutions architect',
    'technical account',
    'partner',
    'channel',
    'alliances'
  ]
};

async function researchLinkedInProfile(linkedinUrl) {
  /**
   * Use Coresignal to get profile details from LinkedIn URL
   */
  const apiKey = process.env.CORESIGNAL_API_KEY;
  if (!apiKey) {
    console.log('⚠️ No Coresignal API key - skipping LinkedIn research');
    return null;
  }
  
  try {
    // Extract LinkedIn username from URL
    const username = linkedinUrl.split('/in/')[1]?.replace(/\/$/, '');
    if (!username) return null;
    
    console.log(`🔍 Researching LinkedIn profile: ${username}`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/member/collect/' + username, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Coresignal lookup failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`⚠️ LinkedIn research error: ${error.message}`);
    return null;
  }
}

async function enrichWithPhoneNumbers(members) {
  /**
   * Use Prospeo to find phone numbers for buyer group members
   */
  const prospeoKey = process.env.PROSPEO_API_KEY;
  if (!prospeoKey) {
    console.log('⚠️ No Prospeo API key - skipping phone enrichment');
    return members;
  }
  
  console.log('\n📞 Enriching with phone numbers...');
  
  for (const member of members) {
    if (member.phone) continue; // Already has phone
    
    if (!member.linkedin) {
      console.log(`  ⏭️ ${member.name}: No LinkedIn URL for phone lookup`);
      continue;
    }
    
    try {
      console.log(`  🔍 Looking up phone for ${member.name}...`);
      
      const response = await fetch('https://api.prospeo.io/linkedin-email-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KEY': prospeoKey
        },
        body: JSON.stringify({
          url: member.linkedin,
          profile_only: false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.response?.phone) {
          member.phone = data.response.phone;
          console.log(`  ✅ ${member.name}: Found phone ${member.phone}`);
        }
        if (data.response?.email && !member.email) {
          member.email = data.response.email;
          console.log(`  ✅ ${member.name}: Found email ${member.email}`);
        }
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.log(`  ⚠️ ${member.name}: Phone lookup failed - ${error.message}`);
    }
  }
  
  return members;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🎯 SNOWFLAKE COMMERCIAL SEGMENT BUYER GROUP DISCOVERY');
  console.log('   Targeting: Commercial RVPs and Sales Leadership (HUNTERS)');
  console.log('   Excluding: Strategic/Majors Account Executives (FARMERS)');
  console.log('═'.repeat(80));
  
  // Find Dan's workspace and seller ID
  const workspace = await prisma.workspaces.findFirst({
    where: { name: { contains: 'adrata', mode: 'insensitive' } }
  });
  
  const dan = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'dan', mode: 'insensitive' } },
        { name: { contains: 'dan', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`\n📋 Workspace: ${workspace?.name || 'Not found'}`);
  console.log(`👤 Seller: ${dan?.name || dan?.email || 'Not found'}`);
  
  // Step 1: Research the known contacts first
  console.log('\n' + '─'.repeat(80));
  console.log('📊 STEP 1: Research Known Contacts');
  console.log('─'.repeat(80));
  
  const knownContacts = [
    {
      linkedin: 'https://www.linkedin.com/in/adam-rosenbloom-43430864/',
      name: 'Adam Rosenbloom',
      knownTitle: 'RVP Commercial Sales - US West & Canada',
      knownRole: 'decision'
    },
    {
      linkedin: 'https://www.linkedin.com/in/benkcompton/',
      name: 'Ben Compton',
      knownTitle: null,  // Need to research
      knownRole: 'champion'
    }
  ];
  
  const researchedContacts = [];
  
  for (const contact of knownContacts) {
    console.log(`\n🔍 Researching: ${contact.name}`);
    
    const profile = await researchLinkedInProfile(contact.linkedin);
    
    if (profile) {
      console.log(`   ✅ Found: ${profile.title || 'No title'} at ${profile.company_name || 'Unknown'}`);
      
      researchedContacts.push({
        name: profile.name || contact.name,
        title: profile.title || contact.knownTitle || 'Sales Leadership',
        company: profile.company_name || 'Snowflake',
        linkedin: contact.linkedin,
        email: profile.email || null,
        phone: profile.phone || null,
        location: profile.location || null,
        role: contact.knownRole
      });
    } else {
      // Use known info if Coresignal fails
      console.log(`   ⚠️ Using known info for ${contact.name}`);
      researchedContacts.push({
        name: contact.name,
        title: contact.knownTitle || 'Commercial Sales Leadership',
        company: 'Snowflake',
        linkedin: contact.linkedin,
        email: null,
        phone: null,
        location: null,
        role: contact.knownRole
      });
    }
  }
  
  // Step 2: Run pipeline to discover more Commercial segment contacts
  console.log('\n' + '─'.repeat(80));
  console.log('📊 STEP 2: Pipeline Discovery for Commercial Segment');
  console.log('─'.repeat(80));
  
  const pipelineOptions = {
    dealSize: 100000,
    maxPages: 5,
    productCategory: 'sales',
    customFiltering: COMMERCIAL_SALES_PROFILE,
    workspaceId: workspace?.id,
    sellerId: dan?.id,
    usaOnly: true,
    skipDatabase: false,
    prisma: prisma
  };
  
  const pipeline = new SmartBuyerGroupPipeline(pipelineOptions);
  
  const companyObj = {
    name: 'Snowflake',
    linkedinUrl: 'https://www.linkedin.com/company/snowflake-computing/',
    website: 'https://www.snowflake.com',
    originalIdentifier: 'https://www.linkedin.com/company/snowflake-computing/'
  };
  
  let pipelineResults = null;
  try {
    pipelineResults = await pipeline.run(companyObj);
    console.log(`\n✅ Pipeline found ${pipelineResults?.buyerGroup?.length || 0} candidates`);
  } catch (error) {
    console.log(`⚠️ Pipeline error: ${error.message}`);
  }
  
  // Step 3: Merge known contacts with pipeline results
  console.log('\n' + '─'.repeat(80));
  console.log('📊 STEP 3: Building Final Buyer Group');
  console.log('─'.repeat(80));
  
  // Start with researched contacts
  let buyerGroup = [...researchedContacts];
  
  // Add pipeline results (if any) that aren't duplicates
  if (pipelineResults?.buyerGroup) {
    for (const member of pipelineResults.buyerGroup) {
      const isDuplicate = buyerGroup.some(
        existing => existing.name?.toLowerCase() === member.name?.toLowerCase()
      );
      
      // Filter out farmer roles
      const isFarmer = COMMERCIAL_SALES_PROFILE.excludeTitles.some(
        title => member.title?.toLowerCase().includes(title.toLowerCase())
      );
      
      if (!isDuplicate && !isFarmer) {
        buyerGroup.push({
          name: member.name,
          title: member.title,
          company: 'Snowflake',
          linkedin: member.linkedin || member.linkedinUrl,
          email: member.email,
          phone: member.phone,
          role: member.role || 'stakeholder'
        });
      }
    }
  }
  
  // Step 4: Enrich with phone numbers
  console.log('\n' + '─'.repeat(80));
  console.log('📊 STEP 4: Phone Number Enrichment');
  console.log('─'.repeat(80));
  
  buyerGroup = await enrichWithPhoneNumbers(buyerGroup);
  
  // Step 5: Update database
  console.log('\n' + '─'.repeat(80));
  console.log('📊 STEP 5: Updating Database');
  console.log('─'.repeat(80));
  
  // Find or create Snowflake buyer group
  let bg = await prisma.buyerGroups.findFirst({
    where: { id: 'bg_1762372704358_skscr7v2v' }
  });
  
  if (bg) {
    // Clear existing members
    await prisma.buyerGroupMembers.deleteMany({
      where: { buyerGroupId: bg.id }
    });
    console.log('✅ Cleared existing buyer group members');
    
    // Add new members
    for (const member of buyerGroup) {
      await prisma.buyerGroupMembers.create({
        data: {
          id: 'bgm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          buyerGroupId: bg.id,
          name: member.name,
          title: member.title,
          role: member.role,
          linkedin: member.linkedin,
          email: member.email,
          phone: member.phone,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Added: ${member.name} (${member.role})`);
    }
  }
  
  // Final report
  console.log('\n' + '═'.repeat(80));
  console.log('✅ SNOWFLAKE COMMERCIAL BUYER GROUP COMPLETE');
  console.log('═'.repeat(80));
  
  console.log(`\n👥 Total Members: ${buyerGroup.length}`);
  console.log('\n📋 BUYER GROUP:');
  
  const roleEmoji = {
    decision: '🎯 DECISION',
    champion: '🏆 CHAMPION',
    stakeholder: '📋 STAKEHOLDER',
    blocker: '🚫 BLOCKER'
  };
  
  buyerGroup.forEach(m => {
    console.log(`\n${roleEmoji[m.role] || '• ' + m.role.toUpperCase()}`);
    console.log(`   Name: ${m.name}`);
    console.log(`   Title: ${m.title}`);
    console.log(`   LinkedIn: ${m.linkedin || 'N/A'}`);
    console.log(`   Email: ${m.email || 'N/A'}`);
    console.log(`   Phone: ${m.phone || 'N/A'}`);
  });
  
  // Return results
  return buyerGroup;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
