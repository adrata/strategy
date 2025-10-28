#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find Victoria's user record
    const victoria = await prisma.users.findFirst({
      where: {
        name: { contains: 'Victoria' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeWorkspaceId: true
      }
    });
    
    console.log('=== VICTORIA USER INFO ===');
    console.log('User ID:', victoria.id);
    console.log('Active Workspace ID:', victoria.activeWorkspaceId);
    console.log('');
    
    // Check people in Victoria's ACTIVE workspace assigned to her
    const peopleInActiveWorkspace = await prisma.people.findMany({
      where: {
        workspaceId: victoria.activeWorkspaceId,
        mainSellerId: victoria.id,
        deletedAt: null,
        companyId: { not: null }
      },
      orderBy: { globalRank: 'asc' },
      take: 10,
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        workspaceId: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log('=== PEOPLE IN VICTORIA\'S ACTIVE WORKSPACE ===');
    console.log(`Workspace: ${victoria.activeWorkspaceId}`);
    console.log(`Found: ${peopleInActiveWorkspace.length} people`);
    peopleInActiveWorkspace.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });
    console.log('');
    
    // Count total people in Victoria's active workspace
    const totalPeopleCount = await prisma.people.count({
      where: {
        workspaceId: victoria.activeWorkspaceId,
        mainSellerId: victoria.id,
        deletedAt: null,
        companyId: { not: null }
      }
    });
    
    console.log(`Total people assigned to Victoria in her workspace: ${totalPeopleCount}`);
    console.log('');
    
    // Check companies in Victoria's workspace
    const companiesCount = await prisma.companies.count({
      where: {
        workspaceId: victoria.activeWorkspaceId,
        mainSellerId: victoria.id,
        deletedAt: null
      }
    });
    
    console.log(`Total companies assigned to Victoria: ${companiesCount}`);
    console.log('');
    
    // Check what ranks exist for Victoria's people
    const rankDistribution = await prisma.people.groupBy({
      by: ['globalRank'],
      where: {
        workspaceId: victoria.activeWorkspaceId,
        mainSellerId: victoria.id,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null }
      },
      _count: true,
      orderBy: { globalRank: 'asc' },
      take: 20
    });
    
    console.log('=== RANK DISTRIBUTION (first 20 ranks) ===');
    rankDistribution.forEach(r => {
      console.log(`  Rank ${r.globalRank}: ${r._count} people`);
    });
    console.log('');
    
    // Check for people with ranks in the 1-50 range
    const topRankedPeople = await prisma.people.findMany({
      where: {
        workspaceId: victoria.activeWorkspaceId,
        mainSellerId: victoria.id,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { gte: 1, lte: 50 }
      },
      orderBy: { globalRank: 'asc' },
      select: {
        globalRank: true,
        fullName: true,
        company: { select: { name: true } }
      }
    });
    
    console.log('=== PEOPLE WITH RANKS 1-50 ===');
    console.log(`Found: ${topRankedPeople.length} people`);
    topRankedPeople.slice(0, 10).forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();
