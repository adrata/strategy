#!/usr/bin/env node

/**
 * Backfill Missing Buyer Group Data
 * 
 * Ensures all buyer group data is properly saved to people records:
 * - Emails from buyer group members
 * - Phones from buyer group members
 * - Coresignal data
 * - Enriched data (verification details, Lusha data)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function backfillMissingData() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔄 Backfilling Missing Buyer Group Data\n');
    console.log('='.repeat(70));

    // Get all buyer groups with companyId
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: { not: null }
      },
      select: {
        id: true,
        companyId: true,
        companyName: true,
        metadata: true
      }
    });

    console.log(`Found ${buyerGroups.length} buyer groups to check\n`);

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const bg of buyerGroups) {
      // Get buyer group members
      const members = await prisma.buyerGroupMembers.findMany({
        where: { buyerGroupId: bg.id }
      });

      if (members.length === 0) {
        skipped++;
        continue;
      }

      // Get company
      const company = await prisma.companies.findUnique({
        where: { id: bg.companyId },
        select: { id: true, name: true, mainSellerId: true }
      });

      if (!company) {
        console.log(`⚠️  Company not found for buyer group: ${bg.companyName}`);
        continue;
      }

      // Get existing people for this company
      const existingPeople = await prisma.people.findMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          companyId: company.id
        }
      });

      for (const member of members) {
        // Try to find matching person
        let person = existingPeople.find(p => 
          (member.email && (p.email === member.email || p.workEmail === member.email || p.personalEmail === member.email)) ||
          (member.linkedin && p.linkedinUrl === member.linkedin) ||
          (member.name && p.fullName && p.fullName.toLowerCase() === member.name.toLowerCase())
        );

        // Extract data from buyer group member
        const email = member.email;
        const phone = member.phone;
        const linkedin = member.linkedin;
        const customFields = member.customFields && typeof member.customFields === 'object' ? member.customFields : {};
        
        // Extract Coresignal data from customFields if available
        const coresignalData = customFields.coresignalData || customFields.fullProfile || null;
        const enrichedData = customFields.enrichedData || customFields.emailVerificationDetails || customFields.phoneVerificationDetails ? {
          emailVerificationDetails: customFields.emailVerificationDetails || [],
          emailSource: customFields.emailSource || 'unverified',
          phoneVerificationDetails: customFields.phoneVerificationDetails || [],
          phoneSource: customFields.phoneSource || 'unverified',
          phoneType: customFields.phoneType || 'unknown',
          phoneMetadata: customFields.phoneMetadata || {}
        } : null;

        if (person) {
          // Update existing person with missing data
          const updateData = {};
          let needsUpdate = false;

          // Update email if missing
          if (email && !person.email && !person.workEmail && !person.personalEmail) {
            updateData.email = email;
            needsUpdate = true;
          }

          // Update phone if missing
          if (phone && !person.phone && !person.mobilePhone && !person.workPhone) {
            updateData.phone = phone;
            needsUpdate = true;
          }

          // Update LinkedIn if missing
          if (linkedin && !person.linkedinUrl) {
            updateData.linkedinUrl = linkedin;
            needsUpdate = true;
          }

          // Update Coresignal data if missing
          if (coresignalData && (!person.coresignalData || typeof person.coresignalData !== 'object')) {
            updateData.coresignalData = coresignalData;
            needsUpdate = true;
          }

          // Update enriched data if missing
          if (enrichedData && (!person.enrichedData || typeof person.enrichedData !== 'object')) {
            const existingEnriched = person.enrichedData && typeof person.enrichedData === 'object' 
              ? person.enrichedData 
              : {};
            updateData.enrichedData = {
              ...existingEnriched,
              ...enrichedData
            };
            needsUpdate = true;
          }

          // Ensure buyer group tags
          const currentTags = person.tags || [];
          if (!currentTags.includes('in_buyer_group')) {
            const newTags = [...currentTags.filter(t => t !== 'out_of_buyer_group'), 'in_buyer_group'];
            updateData.tags = newTags;
            updateData.isBuyerGroupMember = true;
            updateData.buyerGroupStatus = 'in_buyer_group';
            needsUpdate = true;
          }

          if (needsUpdate) {
            await prisma.people.update({
              where: { id: person.id },
              data: updateData
            });
            updated++;
          }
        } else {
          // Create new person if doesn't exist
          const nameParts = (member.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          try {
            await prisma.people.create({
              data: {
                workspaceId: TOP_TEMP_WORKSPACE_ID,
                companyId: company.id,
                mainSellerId: company.mainSellerId,
                firstName: firstName,
                lastName: lastName,
                fullName: member.name,
                jobTitle: member.title || null,
                title: member.title || null,
                email: email || null,
                phone: phone || null,
                linkedinUrl: linkedin || null,
                isBuyerGroupMember: true,
                buyerGroupRole: member.role || null,
                buyerGroupStatus: 'in_buyer_group',
                tags: ['in_buyer_group'],
                buyerGroupOptimized: true,
                coresignalData: coresignalData,
                enrichedData: enrichedData,
                lastEnriched: new Date(),
                dataLastVerified: new Date()
              }
            });
            created++;
          } catch (error) {
            console.log(`   ⚠️  Failed to create person ${member.name}: ${error.message}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ Backfill Complete:`);
    console.log(`   - Updated: ${updated} people`);
    console.log(`   - Created: ${created} people`);
    console.log(`   - Skipped: ${skipped} buyer groups (no members)`);
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  backfillMissingData();
}

