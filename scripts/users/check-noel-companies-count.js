#!/usr/bin/env node

/**
 * Check how many companies Noel has as main seller in Notary Everyday workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================================');
  console.log('   CHECK NOEL COMPANIES COUNT');
  console.log('============================================================\n');

  try {
    await prisma.$connect();
    console.log('Connected to database\n');

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    console.log(`Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Noel user
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      throw new Error('Noel user not found!');
    }
    console.log(`Found Noel: ${noel.name || noel.email} (${noel.id})\n`);

    // Count companies assigned to Noel
    const companyCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
      }
    });

    console.log(`✅ Noel has ${companyCount} companies as main seller in Notary Everyday workspace\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
