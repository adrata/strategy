#!/usr/bin/env ts-node
/**
 * Check what workspace the "toptemp" slug maps to
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWorkspaceSlug() {
  console.log('\n🔍 [SEARCH] Looking for workspace with slug "toptemp"...\n');

  // Find workspace by slug
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { slug: 'toptemp' },
        { id: '01K9QAP09FHT6EAP1B4G2KP3D2' }, // The actual LiteLinx workspace
        { id: '01K7DNYR5VZ7JY36KGKKN76XZ1' }, // The "toptemp" workspace I was checking
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (workspace) {
    console.log(`✅ Found workspace:`);
    console.log(`   ID: ${workspace.id}`);
    console.log(`   Name: ${workspace.name}`);
    console.log(`   Slug: ${workspace.slug || 'Not set'}\n`);
  } else {
    console.log('❌ Workspace not found\n');
  }

  // Also list all workspaces to see what's available
  const allWorkspaces = await prisma.workspaces.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    take: 20,
  });

  console.log(`📊 Found ${allWorkspaces.length} workspaces:\n`);

  allWorkspaces.forEach((ws, i) => {
    console.log(`${i + 1}. ${ws.name}`);
    console.log(`   ID: ${ws.id}`);
    console.log(`   Slug: ${ws.slug || 'Not set'}\n`);
  });
}

async function main() {
  try {
    await checkWorkspaceSlug();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

