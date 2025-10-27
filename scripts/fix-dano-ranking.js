#!/usr/bin/env node

/**
 * Fix Dano's Ranking in Production Database
 * 
 * Recalculates and updates global ranking for both companies and people assigned to Dano
 * - Companies: Ranked 1-N based on industry, size, and people count
 * - People: Ranked 1-N with company hierarchy (company rank first, then person priority)
 * - Updates nextActionDate based on rank (1-50 = today, 51-200 = this week, etc.)
 * 
 * Usage: node scripts/fix-dano-ranking.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  // Rank-based date calculation (Speedrun integration)
  if (!globalRank || globalRank <= 50) {
    // Top 50 (Speedrun tier): TODAY (or tomorrow if action already today)
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    // High priority (51-200): THIS WEEK (2-3 days)
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    // Medium priority (201-500): NEXT WEEK (7 days)
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Lower priority (500+): THIS MONTH (14 days)
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Push weekend dates to Monday
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) { // Saturday
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

async function fixDanoRanking() {
  try {
    console.log('🔧 FIXING DANO\'S RANKING IN PRODUCTION DATABASE\n');
    console.log('='.repeat(60));
    
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
    
    // Step 2: Rank Companies (1-N per user)
    console.log('\n📋 Step 2: Ranking Companies assigned to Dano...\n');
    
    const allCompanies = await prisma.companies.findMany({
      where: {
        mainSellerId: danoUser.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: { people: true }
        }
      }
    });
    
    console.log(`📊 Found ${allCompanies.length} companies to rank`);
    
    if (allCompanies.length > 0) {
      // Create company ranking data
      const companyRankingData = allCompanies.map(company => ({
        id: company.id,
        name: company.name,
        industry: company.industry,
        size: company.size,
        location: company.location,
        peopleCount: company._count.people,
        status: company.status
      }));

      // Sort companies by priority
      const sortedCompanies = companyRankingData.sort((a, b) => {
        // Priority 1: Industry (title/real estate companies first)
        const industryScore = (company) => {
          const industry = (company.industry || '').toLowerCase();
          if (industry.includes('title') || industry.includes('real estate') || industry.includes('escrow')) return 3;
          if (industry.includes('insurance') || industry.includes('legal')) return 2;
          return 1;
        };
        
        const industryDiff = industryScore(b) - industryScore(a);
        if (industryDiff !== 0) return industryDiff;
        
        // Priority 2: Company size (larger companies first)
        const sizeScore = (company) => {
          const size = (company.size || '').toLowerCase();
          if (size.includes('large') || size.includes('enterprise')) return 3;
          if (size.includes('medium') || size.includes('mid')) return 2;
          return 1;
        };
        
        const sizeDiff = sizeScore(b) - sizeScore(a);
        if (sizeDiff !== 0) return sizeDiff;
        
        // Priority 3: People count (more people = higher priority)
        return (b.peopleCount || 0) - (a.peopleCount || 0);
      });

      // Update company global ranks in database
      console.log(`🏢 Updating company global ranks...`);
      for (let i = 0; i < sortedCompanies.length; i++) {
        const company = sortedCompanies[i];
        await prisma.companies.update({
          where: { id: company.id },
          data: { globalRank: i + 1 }
        });
        
        if (i < 10) {
          console.log(`   ${i + 1}. ${company.name} (Industry: ${company.industry || 'N/A'}, People: ${company.peopleCount})`);
        }
      }

      console.log(`✅ Updated ${sortedCompanies.length} company ranks (1-${sortedCompanies.length})`);
    }
    
    // Step 3: Rank People with Company Hierarchy (1-N per user)
    console.log('\n📋 Step 3: Ranking People assigned to Dano with company hierarchy...\n');
    
    const allPeople = await prisma.people.findMany({
      where: {
        mainSellerId: danoUser.id,
        deletedAt: null
      },
      include: {
        company: true
      }
    });
    
    console.log(`📊 Found ${allPeople.length} people to rank`);
    
    if (allPeople.length > 0) {
      // Get updated company ranks
      const companies = await prisma.companies.findMany({
        where: {
          mainSellerId: danoUser.id,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          globalRank: true
        }
      });
      
      // Create a map of company ranks for quick lookup
      const companyRankMap = new Map();
      companies.forEach(company => {
        companyRankMap.set(company.name, company.globalRank || 999999);
      });

      // Group people by company and sort by company rank
      const peopleByCompany = new Map();
      allPeople.forEach(person => {
        const companyName = person.company?.name || 'Unknown Company';
        if (!peopleByCompany.has(companyName)) {
          peopleByCompany.set(companyName, []);
        }
        peopleByCompany.get(companyName).push(person);
      });

      // Sort companies by their rank and then people within each company
      const sortedPeopleByCompany = Array.from(peopleByCompany.entries())
        .sort(([companyA], [companyB]) => {
          const rankA = companyRankMap.get(companyA) || 999999;
          const rankB = companyRankMap.get(companyB) || 999999;
          return rankA - rankB;
        });

      // Rank people sequentially across all companies
      let globalPersonRank = 1;
      const rankedPeople = [];

      for (const [companyName, companyPeople] of sortedPeopleByCompany) {
        // Sort people within each company by priority
        const sortedCompanyPeople = companyPeople.sort((a, b) => {
          // Priority 1: Status (LEAD > PROSPECT > etc.)
          const statusPriority = { 'LEAD': 3, 'PROSPECT': 2, 'OPPORTUNITY': 4, 'CUSTOMER': 5 };
          const statusDiff = (statusPriority[b.status] || 1) - (statusPriority[a.status] || 1);
          if (statusDiff !== 0) return statusDiff;
          
          // Priority 2: Job title seniority
          const titleScore = (title) => {
            const t = (title || '').toLowerCase();
            if (t.includes('ceo') || t.includes('president') || t.includes('owner')) return 5;
            if (t.includes('vp') || t.includes('vice president') || t.includes('director')) return 4;
            if (t.includes('manager') || t.includes('head')) return 3;
            if (t.includes('senior') || t.includes('lead')) return 2;
            return 1;
          };
          
          const titleDiff = titleScore(b.jobTitle) - titleScore(a.jobTitle);
          if (titleDiff !== 0) return titleDiff;
          
          // Priority 3: Last contact date (more recent = higher priority)
          const lastContactA = a.lastActionDate || new Date(0);
          const lastContactB = b.lastActionDate || new Date(0);
          return lastContactB.getTime() - lastContactA.getTime();
        });

        // Assign sequential ranks to people in this company
        for (const person of sortedCompanyPeople) {
          rankedPeople.push({
            ...person,
            globalRank: globalPersonRank,
            companyRank: companyRankMap.get(companyName) || 999999
          });
          globalPersonRank++;
        }
      }

      // Update people global ranks and nextActionDate in database
      console.log(`👥 Updating people global ranks and nextActionDate...`);
      for (const person of rankedPeople) {
        const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
        
        await prisma.people.update({
          where: { id: person.id },
          data: { 
            globalRank: person.globalRank,
            nextActionDate: nextActionDate
          }
        });
        
        if (person.globalRank <= 10) {
          const timing = person.globalRank <= 50 ? 'TODAY' : person.globalRank <= 200 ? 'THIS WEEK' : 'NEXT WEEK';
          console.log(`   ${person.globalRank}. ${person.fullName} at ${person.company?.name} (Rank ${person.companyRank}) - Contact: ${timing}`);
        }
      }

      console.log(`✅ Updated ${rankedPeople.length} people ranks (1-${rankedPeople.length}) with nextActionDate`);
      
      // Summary
      console.log('\n📊 RANKING SUMMARY:');
      console.log('='.repeat(60));
      console.log(`🏢 Companies ranked: ${allCompanies.length} (1-${allCompanies.length})`);
      console.log(`👥 People ranked: ${rankedPeople.length} (1-${rankedPeople.length})`);
      console.log(`\n⏰ Contact Scheduling:`);
      console.log(`   📅 Today (Rank 1-50): ${rankedPeople.filter(p => p.globalRank <= 50).length} people`);
      console.log(`   📅 This Week (Rank 51-200): ${rankedPeople.filter(p => p.globalRank > 50 && p.globalRank <= 200).length} people`);
      console.log(`   📅 Next Week (Rank 201-500): ${rankedPeople.filter(p => p.globalRank > 200 && p.globalRank <= 500).length} people`);
      console.log(`   📅 This Month (Rank 500+): ${rankedPeople.filter(p => p.globalRank > 500).length} people`);
    }
    
    console.log('\n✅ Ranking fix complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDanoRanking().catch(console.error);

