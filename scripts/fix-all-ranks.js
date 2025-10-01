#!/usr/bin/env node

/**
 * Fix All Ranks Script
 * 
 * This script assigns proper sequential ranks (1, 2, 3, ...) to all records
 * in the database: companies, people, leads, prospects, and opportunities.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllRanks() {
  try {
    console.log('🔧 Starting comprehensive ranks fix...');
    
    // 1. Fix People ranks
    console.log('\n📊 Fixing People ranks...');
    const people = await prisma.people.findMany({
      where: {
        deletedAt: null
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
    
    console.log(`📊 Found ${people.length} people to rank`);
    
    const peopleUpdatePromises = people.map((person, index) => {
      const newRank = index + 1;
      return prisma.people.update({
        where: { id: person.id },
        data: { rank: newRank }
      });
    });
    
    await Promise.all(peopleUpdatePromises);
    console.log(`✅ Successfully updated ranks for ${people.length} people`);
    
    // 2. Fix Leads ranks
    console.log('\n📊 Fixing Leads ranks...');
    const leads = await prisma.leads.findMany({
      where: {
        deletedAt: null
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
    
    console.log(`📊 Found ${leads.length} leads to rank`);
    
    const leadsUpdatePromises = leads.map((lead, index) => {
      const newRank = index + 1;
      return prisma.leads.update({
        where: { id: lead.id },
        data: { rank: newRank }
      });
    });
    
    await Promise.all(leadsUpdatePromises);
    console.log(`✅ Successfully updated ranks for ${leads.length} leads`);
    
    // 3. Fix Prospects ranks
    console.log('\n📊 Fixing Prospects ranks...');
    const prospects = await prisma.prospects.findMany({
      where: {
        deletedAt: null
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
    
    console.log(`📊 Found ${prospects.length} prospects to rank`);
    
    const prospectsUpdatePromises = prospects.map((prospect, index) => {
      const newRank = index + 1;
      return prisma.prospects.update({
        where: { id: prospect.id },
        data: { rank: newRank }
      });
    });
    
    await Promise.all(prospectsUpdatePromises);
    console.log(`✅ Successfully updated ranks for ${prospects.length} prospects`);
    
    // 4. Fix Opportunities ranks
    console.log('\n📊 Fixing Opportunities ranks...');
    const opportunities = await prisma.opportunities.findMany({
      where: {
        deletedAt: null
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
    
    console.log(`📊 Found ${opportunities.length} opportunities to rank`);
    
    const opportunitiesUpdatePromises = opportunities.map((opportunity, index) => {
      const newRank = index + 1;
      return prisma.opportunities.update({
        where: { id: opportunity.id },
        data: { rank: newRank }
      });
    });
    
    await Promise.all(opportunitiesUpdatePromises);
    console.log(`✅ Successfully updated ranks for ${opportunities.length} opportunities`);
    
    // 5. Verify results
    console.log('\n🔍 Verification - Sample records with ranks:');
    
    const samplePeople = await prisma.people.findMany({
      where: { deletedAt: null },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('👥 Sample People:');
    samplePeople.forEach(person => {
      console.log(`  Rank ${person.rank}: ${person.fullName}`);
    });
    
    const sampleLeads = await prisma.leads.findMany({
      where: { deletedAt: null },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('🎯 Sample Leads:');
    sampleLeads.forEach(lead => {
      console.log(`  Rank ${lead.rank}: ${lead.fullName}`);
    });
    
    const sampleProspects = await prisma.prospects.findMany({
      where: { deletedAt: null },
      orderBy: { rank: 'asc' },
      select: { fullName: true, rank: true },
      take: 5
    });
    
    console.log('🔥 Sample Prospects:');
    sampleProspects.forEach(prospect => {
      console.log(`  Rank ${prospect.rank}: ${prospect.fullName}`);
    });
    
    console.log('\n🎉 All ranks fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixAllRanks()
    .then(() => {
      console.log('🎉 All ranks fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 All ranks fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAllRanks };
