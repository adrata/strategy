#!/usr/bin/env node

/**
 * Fix TOP Workspace Ranks Script
 * 
 * This script assigns proper sequential ranks (1-N) to all records
 * in the TOP workspace only, with the correct counts:
 * - 475 companies
 * - 2,384 people
 * - 1,701 leads
 * - 587 prospects
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTopWorkspaceRanks() {
  try {
    console.log('🔧 Starting TOP workspace ranks fix...');
    
    // Define TOP workspace ID
    const topWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    
    // 1. Fix Companies ranks (1-475)
    console.log('\n📊 Fixing Companies ranks...');
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        workspaceId: topWorkspaceId
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
    
    console.log(`📊 Found ${companies.length} companies to rank (target: 475)`);
    
    // Update companies in batches
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
    
    // 2. Fix People ranks (1-2384)
    console.log('\n📊 Fixing People ranks...');
    const people = await prisma.people.findMany({
      where: {
        deletedAt: null,
        workspaceId: topWorkspaceId
      },
      orderBy: [
        { updatedAt: 'desc' },
        { fullName: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        updatedAt: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${people.length} people to rank (target: 2,384)`);
    
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
    
    // 3. Fix Leads ranks (1-1701)
    console.log('\n📊 Fixing Leads ranks...');
    const leads = await prisma.leads.findMany({
      where: {
        deletedAt: null,
        workspaceId: topWorkspaceId
      },
      orderBy: [
        { updatedAt: 'desc' },
        { fullName: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        updatedAt: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${leads.length} leads to rank (target: 1,701)`);
    
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
    
    // 4. Fix Prospects ranks (1-587)
    console.log('\n📊 Fixing Prospects ranks...');
    const prospects = await prisma.prospects.findMany({
      where: {
        deletedAt: null,
        workspaceId: topWorkspaceId
      },
      orderBy: [
        { updatedAt: 'desc' },
        { fullName: 'asc' }
      ],
      select: {
        id: true,
        fullName: true,
        updatedAt: true,
        rank: true
      }
    });
    
    console.log(`📊 Found ${prospects.length} prospects to rank (target: 587)`);
    
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
    
    // 5. Verify results
    console.log('\n🔍 Verification - Sample records with ranks:');
    
    const sampleCompanies = await prisma.companies.findMany({
      where: { 
        deletedAt: null,
        workspaceId: topWorkspaceId
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
        workspaceId: topWorkspaceId
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
        workspaceId: topWorkspaceId
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
        workspaceId: topWorkspaceId
      },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('🔥 Sample Prospects:');
    sampleProspects.forEach(prospect => {
      console.log(`  Rank ${prospect.rank}: ${prospect.fullName}`);
    });
    
    // 6. Final counts verification
    console.log('\n📊 Final Counts Verification:');
    const finalCompanyCount = await prisma.companies.count({
      where: { 
        deletedAt: null,
        workspaceId: topWorkspaceId,
        rank: { gt: 0 }
      }
    });
    
    const finalPeopleCount = await prisma.people.count({
      where: { 
        deletedAt: null,
        workspaceId: topWorkspaceId,
        rank: { gt: 0 }
      }
    });
    
    const finalLeadsCount = await prisma.leads.count({
      where: { 
        deletedAt: null,
        workspaceId: topWorkspaceId,
        rank: { gt: 0 }
      }
    });
    
    const finalProspectsCount = await prisma.prospects.count({
      where: { 
        deletedAt: null,
        workspaceId: topWorkspaceId,
        rank: { gt: 0 }
      }
    });
    
    console.log(`✅ Final Results:`);
    console.log(`  Companies: ${finalCompanyCount} (target: 475)`);
    console.log(`  People: ${finalPeopleCount} (target: 2,384)`);
    console.log(`  Leads: ${finalLeadsCount} (target: 1,701)`);
    console.log(`  Prospects: ${finalProspectsCount} (target: 587)`);
    
    console.log('\n🎉 TOP workspace ranks fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing TOP workspace ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixTopWorkspaceRanks()
    .then(() => {
      console.log('🎉 TOP workspace ranks fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 TOP workspace ranks fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTopWorkspaceRanks };
