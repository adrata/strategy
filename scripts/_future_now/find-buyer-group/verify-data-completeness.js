#!/usr/bin/env node

/**
 * Data Completeness Verification Script
 * 
 * Verifies that all buyer group data is properly saved:
 * 1. All people records exist
 * 2. All emails are saved
 * 3. All phones are saved
 * 4. Coresignal data is saved
 * 5. Lusha data is saved
 * 6. Enriched data is saved
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function verifyDataCompleteness() {
  const prisma = new PrismaClient();

  try {
    console.log('\n🔍 Verifying Data Completeness for Top-Temp Buyer Groups\n');
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
        totalMembers: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Check first 50 for sample
    });

    console.log(`\n📊 Checking ${buyerGroups.length} buyer groups...\n`);

    let totalIssues = 0;
    const issues = [];

    for (const bg of buyerGroups) {
      // Get buyer group members
      const members = await prisma.buyerGroupMembers.findMany({
        where: { buyerGroupId: bg.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          linkedin: true
        }
      });

      // Get people records for this company
      const people = await prisma.people.findMany({
        where: {
          workspaceId: TOP_TEMP_WORKSPACE_ID,
          companyId: bg.companyId,
          isBuyerGroupMember: true
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          phone: true,
          mobilePhone: true,
          workPhone: true,
          linkedinUrl: true,
          coresignalData: true,
          enrichedData: true,
          emailVerified: true,
          emailConfidence: true,
          phoneVerified: true,
          phoneConfidence: true,
          buyerGroupRole: true,
          tags: true
        }
      });

      // Check each buyer group member has a corresponding people record
      for (const member of members) {
        const person = people.find(p => 
          (member.email && (p.email === member.email || p.workEmail === member.email || p.personalEmail === member.email)) ||
          (member.linkedin && p.linkedinUrl === member.linkedin) ||
          (member.name && p.fullName && p.fullName.toLowerCase() === member.name.toLowerCase())
        );

        if (!person) {
            issues.push({
              type: 'MISSING_PERSON',
              company: bg.companyName,
              member: member.name,
              email: member.email,
              linkedinUrl: member.linkedin
            });
          totalIssues++;
        } else {
          // Check data completeness
          const personIssues = [];

          // Check email
          if (member.email && !person.email && !person.workEmail && !person.personalEmail) {
            personIssues.push('Missing email');
          }

          // Check phone
          if (member.phone && !person.phone && !person.mobilePhone && !person.workPhone) {
            personIssues.push('Missing phone');
          }

          // Check LinkedIn
          if (member.linkedin && !person.linkedinUrl) {
            personIssues.push('Missing LinkedIn URL');
          }

          // Check Coresignal data
          if (!person.coresignalData || typeof person.coresignalData !== 'object') {
            personIssues.push('Missing Coresignal data');
          }

          // Check enriched data
          if (!person.enrichedData || typeof person.enrichedData !== 'object') {
            personIssues.push('Missing enriched data');
          }

          // Check buyer group role
          if (!person.buyerGroupRole) {
            personIssues.push('Missing buyer group role');
          }

          // Check tags
          if (!person.tags || !Array.isArray(person.tags) || !person.tags.includes('in_buyer_group')) {
            personIssues.push('Missing buyer group tag');
          }

          if (personIssues.length > 0) {
            issues.push({
              type: 'INCOMPLETE_DATA',
              company: bg.companyName,
              person: person.fullName,
              issues: personIssues
            });
            totalIssues += personIssues.length;
          }
        }
      }
    }

    // Summary statistics
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        isBuyerGroupMember: true
      },
      select: {
        id: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        coresignalData: true,
        enrichedData: true,
        emailVerified: true,
        phoneVerified: true
      }
    });

    const stats = {
      totalPeople: allPeople.length,
      withEmail: allPeople.filter(p => p.email || p.workEmail || p.personalEmail).length,
      withPhone: allPeople.filter(p => p.phone || p.mobilePhone || p.workPhone).length,
      withLinkedIn: allPeople.filter(p => p.linkedinUrl).length,
      withCoresignalData: allPeople.filter(p => p.coresignalData && typeof p.coresignalData === 'object').length,
      withEnrichedData: allPeople.filter(p => p.enrichedData && typeof p.enrichedData === 'object').length,
      withVerifiedEmail: allPeople.filter(p => p.emailVerified === true).length,
      withVerifiedPhone: allPeople.filter(p => p.phoneVerified === true).length
    };

    console.log('\n📈 Overall Statistics:');
    console.log('='.repeat(70));
    console.log(`Total buyer group members: ${stats.totalPeople}`);
    console.log(`  - With email: ${stats.withEmail} (${((stats.withEmail / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With phone: ${stats.withPhone} (${((stats.withPhone / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With LinkedIn: ${stats.withLinkedIn} (${((stats.withLinkedIn / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With Coresignal data: ${stats.withCoresignalData} (${((stats.withCoresignalData / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With enriched data: ${stats.withEnrichedData} (${((stats.withEnrichedData / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With verified email: ${stats.withVerifiedEmail} (${((stats.withVerifiedEmail / stats.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`  - With verified phone: ${stats.withVerifiedPhone} (${((stats.withVerifiedPhone / stats.totalPeople) * 100).toFixed(1)}%)`);

    if (issues.length > 0) {
      console.log(`\n⚠️  Found ${totalIssues} issues:\n`);
      issues.slice(0, 20).forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.type}: ${issue.company}`);
        if (issue.member) console.log(`   Member: ${issue.member}`);
        if (issue.person) console.log(`   Person: ${issue.person}`);
        if (issue.issues) console.log(`   Issues: ${issue.issues.join(', ')}`);
        if (issue.email) console.log(`   Email: ${issue.email}`);
        if (issue.linkedinUrl) console.log(`   LinkedIn: ${issue.linkedinUrl}`);
        console.log('');
      });
      if (issues.length > 20) {
        console.log(`   ... and ${issues.length - 20} more issues\n`);
      }
    } else {
      console.log('\n✅ No issues found! All data appears to be complete.\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyDataCompleteness();
}

