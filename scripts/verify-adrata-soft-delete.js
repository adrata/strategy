#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySoftDelete() {
  try {
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    
    console.log('🔍 Verifying Adrata workspace soft delete...');
    
    const [activeCompanies, activePeople, deletedCompanies, deletedPeople] = await Promise.all([
      prisma.companies.count({
        where: { workspaceId, deletedAt: null }
      }),
      prisma.people.count({
        where: { workspaceId, deletedAt: null }
      }),
      prisma.companies.count({
        where: { workspaceId, deletedAt: { not: null } }
      }),
      prisma.people.count({
        where: { workspaceId, deletedAt: { not: null } }
      })
    ]);
    
    console.log('\n📊 VERIFICATION RESULTS:');
    console.log('========================');
    console.log(`Active Companies: ${activeCompanies}`);
    console.log(`Active People: ${activePeople}`);
    console.log(`Deleted Companies: ${deletedCompanies}`);
    console.log(`Deleted People: ${deletedPeople}`);
    
    if (activeCompanies === 0 && activePeople === 0) {
      console.log('\n✅ SUCCESS: All companies and people have been soft deleted!');
    } else {
      console.log('\n❌ WARNING: Some records are still active');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySoftDelete();
