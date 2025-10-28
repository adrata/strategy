#!/usr/bin/env node

/**
 * Audit Dano's Ranking in Production Database
 * 
 * Checks current global ranking for both companies and people assigned to Dano
 * 
 * Usage: node scripts/audit-dano-ranking.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function auditDanoRanking() {
  try {
    console.log('🔍 AUDITING DANO\'S RANKING IN PRODUCTION DATABASE\n');
    console.log('=' .repeat(60));
    
    // Step 1: Find Dano's user account
    console.log('\n📋 Step 1: Finding Dano\'s user account...\n');
    
    const danoUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'dano', mode: 'insensitive' } },
          { firstName: { contains: 'dano', mode: 'insensitive' } },
          { name: { contains: 'dano', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        activeWorkspaceId: true
      }
    });
    
    if (!danoUser) {
      console.log('❌ Could not find Dano\'s user account');
      return;
    }
    
    console.log('✅ Found Dano:');
    console.log(`   ID: ${danoUser.id}`);
    console.log(`   Name: ${danoUser.name || `${danoUser.firstName} ${danoUser.lastName}`}`);
    console.log(`   Email: ${danoUser.email}`);
    console.log(`   Active Workspace: ${danoUser.activeWorkspaceId}`);
    
    // Step 2: Audit Companies assigned to Dano
    console.log('\n📋 Step 2: Auditing Companies assigned to Dano...\n');
    
    const danoCompanies = await prisma.companies.findMany({
      where: {
        mainSellerId: danoUser.id,
        deletedAt: null
      },
      orderBy: [
        { globalRank: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        globalRank: true,
        status: true,
        city: true,
        state: true,
        industry: true,
        _count: {
          select: { people: true }
        }
      },
      take: 50 // Show first 50
    });
    
    console.log(`📊 Total companies assigned to Dano: ${danoCompanies.length}`);
    
    if (danoCompanies.length > 0) {
      console.log('\n🏢 Top 20 Companies by Global Rank:');
      console.log('-'.repeat(60));
      
      const top20Companies = danoCompanies.slice(0, 20);
      top20Companies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name}`);
        console.log(`   Global Rank: ${company.globalRank || 'NOT SET'}`);
        console.log(`   Status: ${company.status}`);
        console.log(`   Location: ${company.city || 'N/A'}, ${company.state || 'N/A'}`);
        console.log(`   Industry: ${company.industry || 'N/A'}`);
        console.log(`   People Count: ${company._count.people}`);
      });
      
      // Analyze ranking distribution
      const rankedCompanies = danoCompanies.filter(c => c.globalRank && c.globalRank > 0);
      const unrankedCompanies = danoCompanies.filter(c => !c.globalRank || c.globalRank === 0);
      
      console.log('\n📊 Company Ranking Analysis:');
      console.log('-'.repeat(60));
      console.log(`✅ Companies with rank: ${rankedCompanies.length}`);
      console.log(`❌ Companies without rank: ${unrankedCompanies.length}`);
      
      if (rankedCompanies.length > 0) {
        const ranks = rankedCompanies.map(c => c.globalRank).sort((a, b) => a - b);
        console.log(`   Min rank: ${Math.min(...ranks)}`);
        console.log(`   Max rank: ${Math.max(...ranks)}`);
        console.log(`   Expected range: 1 to ${danoCompanies.length}`);
      }
    }
    
    // Step 3: Audit People assigned to Dano
    console.log('\n📋 Step 3: Auditing People assigned to Dano...\n');
    
    const danoPeople = await prisma.people.findMany({
      where: {
        mainSellerId: danoUser.id,
        deletedAt: null
      },
      orderBy: [
        { globalRank: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        jobTitle: true,
        status: true,
        company: {
          select: {
            name: true,
            globalRank: true
          }
        }
      },
      take: 100 // Show first 100
    });
    
    console.log(`📊 Total people assigned to Dano: ${danoPeople.length}`);
    
    if (danoPeople.length > 0) {
      console.log('\n👥 Top 30 People by Global Rank:');
      console.log('-'.repeat(60));
      
      const top30People = danoPeople.slice(0, 30);
      top30People.forEach((person, index) => {
        console.log(`\n${index + 1}. ${person.fullName}`);
        console.log(`   Global Rank: ${person.globalRank || 'NOT SET'}`);
        console.log(`   Title: ${person.jobTitle || 'N/A'}`);
        console.log(`   Status: ${person.status}`);
        console.log(`   Company: ${person.company?.name || 'N/A'} (Company Rank: ${person.company?.globalRank || 'NOT SET'})`);
      });
      
      // Analyze ranking distribution
      const rankedPeople = danoPeople.filter(p => p.globalRank && p.globalRank > 0);
      const unrankedPeople = danoPeople.filter(p => !p.globalRank || p.globalRank === 0);
      
      console.log('\n📊 People Ranking Analysis:');
      console.log('-'.repeat(60));
      console.log(`✅ People with rank: ${rankedPeople.length}`);
      console.log(`❌ People without rank: ${unrankedPeople.length}`);
      
      if (rankedPeople.length > 0) {
        const ranks = rankedPeople.map(p => p.globalRank).sort((a, b) => a - b);
        console.log(`   Min rank: ${Math.min(...ranks)}`);
        console.log(`   Max rank: ${Math.max(...ranks)}`);
        console.log(`   Expected range: 1 to ${danoPeople.length}`);
      }
      
      // Analyze people grouped by company
      console.log('\n🏢 People Distribution by Company:');
      console.log('-'.repeat(60));
      
      const peopleByCompany = {};
      danoPeople.forEach(person => {
        const companyName = person.company?.name || 'No Company';
        const companyRank = person.company?.globalRank || 'NOT SET';
        const key = `${companyName} (Rank: ${companyRank})`;
        
        if (!peopleByCompany[key]) {
          peopleByCompany[key] = [];
        }
        peopleByCompany[key].push(person);
      });
      
      const sortedCompanies = Object.entries(peopleByCompany)
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 10);
      
      sortedCompanies.forEach(([company, people]) => {
        console.log(`\n${company}: ${people.length} people`);
        people.slice(0, 5).forEach((person, index) => {
          console.log(`  ${index + 1}. ${person.fullName} (Rank: ${person.globalRank || 'NOT SET'})`);
        });
        if (people.length > 5) {
          console.log(`  ... and ${people.length - 5} more`);
        }
      });
    }
    
    // Step 4: Check ranking logic expectations
    console.log('\n📋 Step 4: Checking Ranking Logic Expectations...\n');
    console.log('-'.repeat(60));
    
    console.log('\n🎯 EXPECTED RANKING BEHAVIOR:');
    console.log('1. Companies should be ranked 1 to N (where N = total companies assigned to Dano)');
    console.log('2. People should be ranked 1 to N (where N = total people assigned to Dano)');
    console.log('3. People ranking should prioritize:');
    console.log('   - Company rank first (people from rank 1 company come before rank 2 company)');
    console.log('   - Then individual priority within each company');
    console.log('4. Each user (Dano) should have their own independent ranking (1-N)');
    
    console.log('\n🔍 ACTUAL BEHAVIOR:');
    const hasCompanyRanks = danoCompanies.some(c => c.globalRank && c.globalRank > 0);
    const hasPeopleRanks = danoPeople.some(p => p.globalRank && p.globalRank > 0);
    
    if (!hasCompanyRanks) {
      console.log('❌ Companies are NOT ranked (all ranks are 0 or null)');
    } else {
      const rankedCount = danoCompanies.filter(c => c.globalRank && c.globalRank > 0).length;
      const expectedSequential = Array.from({ length: rankedCount }, (_, i) => i + 1);
      const actualRanks = danoCompanies
        .filter(c => c.globalRank && c.globalRank > 0)
        .map(c => c.globalRank)
        .sort((a, b) => a - b);
      
      const isSequential = expectedSequential.every((rank, i) => rank === actualRanks[i]);
      
      if (isSequential) {
        console.log(`✅ Companies are properly ranked 1-${rankedCount}`);
      } else {
        console.log(`⚠️ Company ranks are NOT sequential:`);
        console.log(`   Expected: 1-${rankedCount}`);
        console.log(`   Actual: ${actualRanks.slice(0, 10).join(', ')}...`);
      }
    }
    
    if (!hasPeopleRanks) {
      console.log('❌ People are NOT ranked (all ranks are 0 or null)');
    } else {
      const rankedCount = danoPeople.filter(p => p.globalRank && p.globalRank > 0).length;
      const expectedSequential = Array.from({ length: rankedCount }, (_, i) => i + 1);
      const actualRanks = danoPeople
        .filter(p => p.globalRank && p.globalRank > 0)
        .map(p => p.globalRank)
        .sort((a, b) => a - b);
      
      const isSequential = expectedSequential.every((rank, i) => rank === actualRanks[i]);
      
      if (isSequential) {
        console.log(`✅ People are properly ranked 1-${rankedCount}`);
      } else {
        console.log(`⚠️ People ranks are NOT sequential:`);
        console.log(`   Expected: 1-${rankedCount}`);
        console.log(`   Actual: ${actualRanks.slice(0, 10).join(', ')}...`);
      }
    }
    
    console.log('\n✅ Audit complete!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditDanoRanking().catch(console.error);

