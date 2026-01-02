#!/usr/bin/env node
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.people.count({
    where: {
      workspaceId: '01KBDP8ZXDTAHJNT14S3WB1DTA',
      phone: { not: null },
      deletedAt: null,
      source: { contains: 'BatchData' }
    }
  });
  
  console.log('\n============================================================');
  console.log('   PARADISE VALLEY LEADS IN JOSH\'S WORKSPACE');
  console.log('============================================================');
  console.log(`   Total leads with phone numbers: ${count}`);
  console.log('============================================================\n');
  
  // Show sample
  const samples = await prisma.people.findMany({
    where: {
      workspaceId: '01KBDP8ZXDTAHJNT14S3WB1DTA',
      phone: { not: null },
      deletedAt: null,
      source: { contains: 'BatchData' }
    },
    take: 5,
    select: {
      fullName: true,
      phone: true,
      address: true,
      city: true
    }
  });
  
  console.log('   Sample leads:');
  samples.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.fullName} - ${s.phone} - ${s.address}, ${s.city}`);
  });
  console.log('');
  
  await prisma.$disconnect();
}

main().catch(console.error);

