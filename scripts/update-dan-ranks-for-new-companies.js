#!/usr/bin/env node

/**
 * Update Dan's Ranks for New Companies
 * 
 * Updates lastActionDate to today for Dan's newly added companies and their people
 * to reflect today's engagement, then triggers re-ranking so they rank high
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function updateRanksForNewCompanies() {
  console.log('🚀 Updating Ranks for Dan\'s New Companies');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get companies added today for Dan
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastActionDate: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${newCompanies.length} new companies added today\n`);

    if (newCompanies.length === 0) {
      console.log('⚠️  No new companies found. Exiting.');
      await prisma.$disconnect();
      return;
    }

    // Update companies with today's date
    const now = new Date();
    console.log('📝 Updating company lastActionDate to today...');
    
    let companiesUpdated = 0;
    for (const company of newCompanies) {
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          lastAction: 'Company added and engaged',
          lastActionDate: now,
          updatedAt: now
        }
      });
      companiesUpdated++;
      console.log(`   ✅ ${company.name} - Updated lastActionDate`);
    }

    console.log(`\n✅ Updated ${companiesUpdated} companies\n`);

    // Get all people from these companies
    const companyIds = newCompanies.map(c => c.id);
    
    const people = await prisma.people.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: { in: companyIds },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: {
          select: { name: true }
        },
        lastActionDate: true
      }
    });

    console.log(`📊 Found ${people.length} people from new companies\n`);

    // Update people with today's date
    if (people.length > 0) {
      console.log('📝 Updating people lastActionDate to today...');
      
      let peopleUpdated = 0;
      for (const person of people) {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: 'Engaged today',
            lastActionDate: now,
            updatedAt: now
          }
        });
        peopleUpdated++;
        console.log(`   ✅ ${person.fullName} at ${person.company?.name}`);
      }

      console.log(`\n✅ Updated ${peopleUpdated} people\n`);
    }

    // Trigger re-ranking
    console.log('🔄 Triggering re-ranking...');
    console.log('─'.repeat(60));

    try {
      const apiUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const reRankUrl = `${apiUrl}/api/v1/speedrun/re-rank`;

      console.log(`   Calling: ${reRankUrl}`);

      const response = await fetch(reRankUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': ADRATA_WORKSPACE_ID,
          'x-user-id': DAN_USER_ID
        },
        body: JSON.stringify({
          completedCount: 0,
          trigger: 'manual-re-rank-new-companies',
          timestamp: now.toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Re-ranking failed: ${result.error || 'Unknown error'}`);
      }

      console.log('   ✅ Re-ranking completed successfully');
      console.log(`   📊 ${result.message || 'Ranking updated'}`);

    } catch (error) {
      console.error(`   ⚠️  Re-ranking via API failed: ${error.message}`);
      console.log('   💡 Note: Re-ranking may need to be triggered manually from the UI');
      console.log('   💡 The lastActionDate updates will still affect ranking when re-rank runs');
    }

    // Show summary of updated records
    console.log('\n\n📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Companies updated: ${companiesUpdated}`);
    console.log(`✅ People updated: ${people.length}`);
    console.log(`🔄 Re-ranking: ${companiesUpdated > 0 ? 'Triggered' : 'Skipped'}`);
    
    console.log('\n✅ All new companies and people now have today\'s engagement date');
    console.log('   They should rank high in the next speedrun ranking!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateRanksForNewCompanies().catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

module.exports = { updateRanksForNewCompanies };

