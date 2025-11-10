#!/usr/bin/env node

/**
 * Verify that rich contact details with validation are saved
 * Checks email, phone, LinkedIn with verification status
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function verifyContactDetails() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying rich contact details with validation...\n');
    
    // Get people with buyer group data
    const people = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        isBuyerGroupMember: true,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        emailVerified: true,
        emailConfidence: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        phoneVerified: true,
        phoneConfidence: true,
        phoneQualityScore: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        linkedinConnections: true,
        linkedinFollowers: true,
        coresignalData: true,
        enrichedData: true,
        aiIntelligence: true,
        customFields: true
      },
      take: 10
    });
    
    console.log(`📊 Found ${people.length} buyer group members with contact data\n`);
    
    let emailVerifiedCount = 0;
    let phoneVerifiedCount = 0;
    let linkedinCount = 0;
    let highConfidenceEmail = 0;
    let highConfidencePhone = 0;
    
    for (const person of people) {
      console.log(`👤 ${person.fullName} (${person.jobTitle || 'N/A'})`);
      console.log(`   ID: ${person.id}`);
      
      // Email verification
      if (person.email) {
        console.log(`\n   📧 Email: ${person.email}`);
        console.log(`      Verified: ${person.emailVerified ? '✅ YES' : '❌ NO'}`);
        console.log(`      Confidence: ${person.emailConfidence || 0}%`);
        if (person.emailVerified) emailVerifiedCount++;
        if ((person.emailConfidence || 0) >= 80) highConfidenceEmail++;
        
        // Check for additional emails
        if (person.workEmail) console.log(`      Work Email: ${person.workEmail}`);
        if (person.personalEmail) console.log(`      Personal Email: ${person.personalEmail}`);
      } else {
        console.log(`\n   📧 Email: ❌ NOT FOUND`);
      }
      
      // Phone verification
      if (person.phone || person.mobilePhone || person.workPhone) {
        const primaryPhone = person.phone || person.mobilePhone || person.workPhone;
        console.log(`\n   📞 Phone: ${primaryPhone}`);
        console.log(`      Verified: ${person.phoneVerified ? '✅ YES' : '❌ NO'}`);
        console.log(`      Confidence: ${person.phoneConfidence || 0}%`);
        console.log(`      Quality Score: ${person.phoneQualityScore || 0}`);
        if (person.phoneVerified) phoneVerifiedCount++;
        if ((person.phoneConfidence || 0) >= 80) highConfidencePhone++;
        
        // Check for additional phones
        if (person.mobilePhone && person.mobilePhone !== primaryPhone) {
          console.log(`      Mobile: ${person.mobilePhone}`);
        }
        if (person.workPhone && person.workPhone !== primaryPhone) {
          console.log(`      Work: ${person.workPhone}`);
        }
      } else {
        console.log(`\n   📞 Phone: ❌ NOT FOUND`);
      }
      
      // LinkedIn verification
      if (person.linkedinUrl) {
        console.log(`\n   🔗 LinkedIn: ${person.linkedinUrl}`);
        console.log(`      Connections: ${person.linkedinConnections || 'N/A'}`);
        console.log(`      Followers: ${person.linkedinFollowers || 'N/A'}`);
        linkedinCount++;
      } else {
        console.log(`\n   🔗 LinkedIn: ❌ NOT FOUND`);
      }
      
      // Check for verification details in enriched data
      if (person.enrichedData && typeof person.enrichedData === 'object') {
        const enriched = person.enrichedData;
        if (enriched.emailVerificationDetails) {
          console.log(`\n   📋 Email Verification Details:`);
          enriched.emailVerificationDetails.forEach((detail, i) => {
            console.log(`      ${i + 1}. ${detail.source || 'Unknown'}: ${detail.status || 'N/A'} (${detail.confidence || 0}%)`);
          });
        }
        if (enriched.phoneVerificationDetails) {
          console.log(`\n   📋 Phone Verification Details:`);
          enriched.phoneVerificationDetails.forEach((detail, i) => {
            console.log(`      ${i + 1}. ${detail.source || 'Unknown'}: ${detail.status || 'N/A'} (${detail.confidence || 0}%)`);
          });
        }
      }
      
      // Check coresignal data for raw contact info
      if (person.coresignalData && typeof person.coresignalData === 'object') {
        const coresignal = person.coresignalData;
        if (coresignal.emails && coresignal.emails.length > 0) {
          console.log(`\n   📊 Coresignal Emails: ${coresignal.emails.length} found`);
        }
        if (coresignal.phones && coresignal.phones.length > 0) {
          console.log(`   📊 Coresignal Phones: ${coresignal.phones.length} found`);
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
    // Summary
    console.log(`📈 Contact Verification Summary:`);
    console.log(`   Total People: ${people.length}`);
    console.log(`   Emails Found: ${people.filter(p => p.email).length}`);
    console.log(`   Emails Verified: ${emailVerifiedCount} (${Math.round(emailVerifiedCount / people.length * 100)}%)`);
    console.log(`   High Confidence Emails (≥80%): ${highConfidenceEmail}`);
    console.log(`   Phones Found: ${people.filter(p => p.phone || p.mobilePhone || p.workPhone).length}`);
    console.log(`   Phones Verified: ${phoneVerifiedCount} (${Math.round(phoneVerifiedCount / people.length * 100)}%)`);
    console.log(`   High Confidence Phones (≥80%): ${highConfidencePhone}`);
    console.log(`   LinkedIn URLs: ${linkedinCount} (${Math.round(linkedinCount / people.length * 100)}%)`);
    
  } catch (error) {
    console.error('❌ Error verifying contact details:', error.message);
    if (error.message.includes('coreCompanyId')) {
      console.error('\n⚠️  Prisma client needs regeneration. Run: npx prisma generate');
    }
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifyContactDetails().catch(console.error);

