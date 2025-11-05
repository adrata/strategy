#!/usr/bin/env node

/**
 * Analyze Buyer Group Discovery Failures
 * 
 * Investigates why 7 out of 20 companies didn't get buyer groups
 * Checks database records, buyer groups, and people counts
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

async function analyzeFailures() {
  console.log('🔍 Analyzing Buyer Group Discovery Failures');
  console.log('═'.repeat(60));
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get companies added today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        createdAt: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Analyzing ${companies.length} companies added today\n`);

    // Check buyer groups
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        companyName: { in: companies.map(c => c.name) }
      },
      select: {
        id: true,
        companyName: true,
        totalMembers: true,
        cohesionScore: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create a map of company names to buyer groups
    const buyerGroupMap = new Map();
    buyerGroups.forEach(bg => {
      buyerGroupMap.set(bg.companyName, bg);
    });

    // Categorize companies
    const withBuyerGroups = [];
    const withoutBuyerGroups = [];
    const withPeople = [];
    const withoutPeople = [];

    companies.forEach(company => {
      const bg = buyerGroupMap.get(company.name);
      const hasPeople = company._count.people > 0;

      if (bg) {
        withBuyerGroups.push({ company, buyerGroup: bg });
      } else {
        withoutBuyerGroups.push(company);
      }

      if (hasPeople) {
        withPeople.push(company);
      } else {
        withoutPeople.push(company);
      }
    });

    console.log('📊 CATEGORIZATION');
    console.log('═'.repeat(60));
    console.log(`✅ Companies with buyer groups: ${withBuyerGroups.length}`);
    console.log(`❌ Companies without buyer groups: ${withoutBuyerGroups.length}`);
    console.log(`👥 Companies with people: ${withPeople.length}`);
    console.log(`👤 Companies without people: ${withoutPeople.length}\n`);

    // Analyze companies with buyer groups
    if (withBuyerGroups.length > 0) {
      console.log('✅ COMPANIES WITH BUYER GROUPS');
      console.log('─'.repeat(60));
      withBuyerGroups.forEach(({ company, buyerGroup }) => {
        console.log(`\n${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   Buyer Group Members: ${buyerGroup.totalMembers}`);
        console.log(`   People in DB: ${company._count.people}`);
        console.log(`   Cohesion: ${buyerGroup.cohesionScore || 0}%`);
      });
    }

    // Analyze companies without buyer groups
    if (withoutBuyerGroups.length > 0) {
      console.log('\n\n❌ COMPANIES WITHOUT BUYER GROUPS');
      console.log('─'.repeat(60));
      withoutBuyerGroups.forEach((company, index) => {
        const hasPeople = company._count.people > 0;
        const status = hasPeople ? '⚠️ (has people but no buyer group record)' : '❌ (no people)';
        console.log(`\n${index + 1}. ${company.name} ${status}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   People in DB: ${company._count.people}`);
        console.log(`   Company ID: ${company.id}`);
        
        // Check if there's a buyer group with similar name (fuzzy match)
        const similarBG = buyerGroups.find(bg => 
          bg.companyName.toLowerCase().includes(company.name.toLowerCase()) ||
          company.name.toLowerCase().includes(bg.companyName.toLowerCase())
        );
        if (similarBG) {
          console.log(`   ⚠️  Found similar buyer group: "${similarBG.companyName}"`);
        }
      });
    }

    // Check for companies with people but no buyer group record
    const peopleButNoBG = companies.filter(c => 
      c._count.people > 0 && !buyerGroupMap.has(c.name)
    );

    if (peopleButNoBG.length > 0) {
      console.log('\n\n⚠️  COMPANIES WITH PEOPLE BUT NO BUYER GROUP RECORD');
      console.log('─'.repeat(60));
      console.log('These companies have people in the database but no buyer group record.');
      console.log('This suggests the buyer group discovery ran but failed to save to database.\n');
      
      peopleButNoBG.forEach(company => {
        console.log(`   - ${company.name}: ${company._count.people} people`);
        
        // Check for people details
        prisma.people.findMany({
          where: {
            companyId: company.id,
            deletedAt: null
          },
          select: {
            id: true,
            fullName: true,
            buyerGroupRole: true
          },
          take: 5
        }).then(people => {
          if (people.length > 0) {
            console.log(`     Sample people:`);
            people.forEach(p => {
              console.log(`       - ${p.fullName} (${p.buyerGroupRole || 'no role'})`);
            });
          }
        });
      });
    }

    // Summary and recommendations
    console.log('\n\n📋 SUMMARY & ANALYSIS');
    console.log('═'.repeat(60));
    console.log(`Total companies: ${companies.length}`);
    console.log(`Successfully created buyer groups: ${withBuyerGroups.length}`);
    console.log(`Failed to create buyer groups: ${withoutBuyerGroups.length}`);
    console.log(`Success rate: ${((withBuyerGroups.length / companies.length) * 100).toFixed(1)}%\n`);

    if (withoutBuyerGroups.length > 0) {
      console.log('🔍 POSSIBLE REASONS FOR FAILURES:');
      console.log('─'.repeat(60));
      
      const noPeople = withoutBuyerGroups.filter(c => c._count.people === 0);
      const hasPeople = withoutBuyerGroups.filter(c => c._count.people > 0);
      
      if (noPeople.length > 0) {
        console.log(`\n1. No employees found (${noPeople.length} companies):`);
        noPeople.forEach(c => console.log(`   - ${c.name}`));
        console.log('   → Possible causes:');
        console.log('     • Company not found in Coresignal database');
        console.log('     • LinkedIn URL/website incorrect or not matching');
        console.log('     • Company too small or data not available');
        console.log('     • API rate limiting or errors during preview search');
      }
      
      if (hasPeople.length > 0) {
        console.log(`\n2. Database save failures (${hasPeople.length} companies):`);
        hasPeople.forEach(c => console.log(`   - ${c.name} (${c._count.people} people)`));
        console.log('   → Possible causes:');
        console.log('     • Schema mismatch (e.g., companyTier field issue)');
        console.log('     • Database constraint violations');
        console.log('     • Error during buyer group record creation');
        console.log('     • Transaction rollback');
      }
    }

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(60));
    console.log('1. Check Coresignal API logs for companies with no people');
    console.log('2. Verify LinkedIn URLs and websites are correct');
    console.log('3. Check database schema for missing fields (companyTier issue)');
    console.log('4. Re-run buyer group discovery for companies with people but no BG record');
    console.log('5. Review error logs from the buyer group discovery run\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeFailures().catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
}

module.exports = { analyzeFailures };

