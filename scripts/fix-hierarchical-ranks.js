#!/usr/bin/env node

/**
 * Fix Hierarchical Ranks Script
 * 
 * This script assigns proper hierarchical ranks per workspace:
 * - Companies: 1-N (ranked by value/importance)
 * - People: 1-N (ranked by company first, then by person within company)
 * - Leads: 1-N (subset of people who are leads, keep their people rank)
 * - Prospects: 1-N (subset of people who are prospects, keep their people rank)
 * - Speedrun: 1-30 (top 30 people from people ranking)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixHierarchicalRanks(workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP') {
  try {
    console.log(`🔧 Starting hierarchical ranks fix for workspace: ${workspaceId}`);
    
    // 1. Fix Companies ranks (1-N)
    console.log('\n📊 Fixing Companies ranks...');
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        updatedAt: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${companies.length} companies to rank`);
    
    // Update companies in batches to avoid connection pool issues
    const batchSize = 100;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      const updatePromises = batch.map((company, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.companies.update({
          where: { id: company.id },
          data: { rank: newRank }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated companies ${i + 1}-${Math.min(i + batchSize, companies.length)}`);
    }
    
    console.log(`✅ Successfully updated ranks for ${companies.length} companies`);
    
    // 2. Fix People ranks (1-N, ranked by company first, then by person within company)
    console.log('\n📊 Fixing People ranks...');
    const people = await prisma.people.findMany({
      where: {
        deletedAt: null,
        workspaceId: workspaceId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            rank: true
          }
        }
      },
      orderBy: [
        { company: { rank: 'asc' } },
        { updatedAt: 'desc' },
        { fullName: 'asc' }
      ]
    });
    
    console.log(`📊 Found ${people.length} people to rank`);
    
    // Update people in batches
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      const updatePromises = batch.map((person, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.people.update({
          where: { id: person.id },
          data: { rank: newRank }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated people ${i + 1}-${Math.min(i + batchSize, people.length)}`);
    }
    
    console.log(`✅ Successfully updated ranks for ${people.length} people`);
    
    // 3. Fix Leads ranks (1-N, subset of people who are leads)
    console.log('\n📊 Fixing Leads ranks...');
    const leads = await prisma.leads.findMany({
      where: {
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: [
        { rank: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${leads.length} leads to rank`);
    
    // Update leads in batches
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      const updatePromises = batch.map((lead, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.leads.update({
          where: { id: lead.id },
          data: { rank: newRank }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated leads ${i + 1}-${Math.min(i + batchSize, leads.length)}`);
    }
    
    console.log(`✅ Successfully updated ranks for ${leads.length} leads`);
    
    // 4. Fix Prospects ranks (1-N, subset of people who are prospects)
    console.log('\n📊 Fixing Prospects ranks...');
    const prospects = await prisma.prospects.findMany({
      where: {
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: [
        { rank: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${prospects.length} prospects to rank`);
    
    // Update prospects in batches
    for (let i = 0; i < prospects.length; i += batchSize) {
      const batch = prospects.slice(i, i + batchSize);
      const updatePromises = batch.map((prospect, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.prospects.update({
          where: { id: prospect.id },
          data: { rank: newRank }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated prospects ${i + 1}-${Math.min(i + batchSize, prospects.length)}`);
    }
    
    console.log(`✅ Successfully updated ranks for ${prospects.length} prospects`);
    
    // 5. Fix Speedrun ranks (1-30, top 30 people from people ranking)
    console.log('\n📊 Fixing Speedrun ranks...');
    const speedrunPeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: [
        { rank: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        rank: true
      },
      take: 30
    });
    
    console.log(`📊 Found ${speedrunPeople.length} people for speedrun ranking`);
    
    // Update speedrun people in batches
    for (let i = 0; i < speedrunPeople.length; i += batchSize) {
      const batch = speedrunPeople.slice(i, i + batchSize);
      const updatePromises = batch.map((person, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.people.update({
          where: { id: person.id },
          data: { 
            rank: newRank,
            // Mark as speedrun if not already
            customFields: {
              ...person.customFields,
              isSpeedrun: true,
              speedrunRank: newRank
            }
          }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated speedrun people ${i + 1}-${Math.min(i + batchSize, speedrunPeople.length)}`);
    }
    
    console.log(`✅ Successfully updated ranks for ${speedrunPeople.length} speedrun people`);
    
    // 6. Verify results
    console.log('\n🔍 Verification - Sample records with ranks:');
    
    const sampleCompanies = await prisma.companies.findMany({
      where: { 
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: { rank: 'asc' },
      select: { name: true, rank: true },
      take: 5
    });
    
    console.log('🏢 Sample Companies:');
    sampleCompanies.forEach(company => {
      console.log(`  Rank ${company.rank}: ${company.name}`);
    });
    
    const samplePeople = await prisma.people.findMany({
      where: { 
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('👥 Sample People:');
    samplePeople.forEach(person => {
      console.log(`  Rank ${person.rank}: ${person.fullName}`);
    });
    
    const sampleLeads = await prisma.leads.findMany({
      where: { 
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('🎯 Sample Leads:');
    sampleLeads.forEach(lead => {
      console.log(`  Rank ${lead.rank}: ${lead.fullName}`);
    });
    
    const sampleProspects = await prisma.prospects.findMany({
      where: { 
        deletedAt: null,
        workspaceId: workspaceId
      },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('🔥 Sample Prospects:');
    sampleProspects.forEach(prospect => {
      console.log(`  Rank ${prospect.rank}: ${prospect.fullName}`);
    });
    
    console.log('\n🎉 Hierarchical ranks fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing hierarchical ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  const workspaceId = process.argv[2] || '01K1VBYXHD0J895XAN0HGFBKJP';
  fixHierarchicalRanks(workspaceId)
    .then(() => {
      console.log('🎉 Hierarchical ranks fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Hierarchical ranks fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixHierarchicalRanks };
