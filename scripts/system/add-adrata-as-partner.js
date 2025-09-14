#!/usr/bin/env node

/**
 * Add Adrata as Technology/Data/AI Partner to All Customer Workspaces
 * 
 * This script adds Adrata as a strategic technology partner to all customer
 * workspaces (except Adrata's own workspace) to maintain visibility and
 * relationship tracking.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Adrata's own workspace ID (exclude from partner additions)
const ADRATA_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';

async function addAdrataAsPartner() {
  console.log('🤝 ADDING ADRATA AS PARTNER TO ALL CUSTOMER WORKSPACES\n');

  try {
    // 1. Get all workspaces except Adrata's own
    const customerWorkspaces = await prisma.workspace.findMany({
      where: {
        id: { not: ADRATA_WORKSPACE_ID }
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log(`📊 Found ${customerWorkspaces.length} customer workspaces to update\n`);

    let addedCount = 0;
    let skippedCount = 0;

    // 2. Process each customer workspace
    for (const workspace of customerWorkspaces) {
      console.log(`🔄 Processing workspace: ${workspace.name} (${workspace.id})`);

      try {
        // Check if Adrata partnership already exists
        const existingPartnership = await prisma.partnership.findFirst({
          where: {
            workspaceId: workspace.id,
            name: { contains: 'Adrata', mode: 'insensitive' }
          }
        });

        if (existingPartnership) {
          console.log(`   ⏭️  Adrata partnership already exists, skipping`);
          skippedCount++;
          continue;
        }

        // Create Adrata partnership record
        const partnership = await prisma.partnership.create({
          data: {
            workspaceId: workspace.id,
            name: 'Adrata',
            partnerType: 'Technology',
            relationshipStatus: 'Active',
            relationshipStrength: 'Strong',
            website: 'https://adrata.com',
            contactEmail: 'partnerships@adrata.com',
            contactName: 'Partnership Team',
            contactTitle: 'Strategic Partnerships',
            notes: 'Strategic technology partner providing buyer group intelligence, Sales Acceleration, and AI-powered insights. Capabilities include real-time buyer group mapping, executive decision maker identification, competitive intelligence gathering, sales process automation, and revenue attribution modeling.',
            lastContactDate: new Date(),
            nextContactDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            nextAction: 'Quarterly partnership review',
            createdBy: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
            assignedTo: '01K1VBYYV7TRPY04NW4TW4XWRB' // Dano's user ID
          }
        });

        console.log(`   ✅ Added Adrata partnership (ID: ${partnership.id})`);
        addedCount++;

        // Optional: Add a note about the partnership
        await prisma.note.create({
          data: {
            workspaceId: workspace.id,
            authorId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Dano's user ID
            title: 'Adrata Partnership Established',
            content: 'Strategic technology partnership with Adrata established for buyer group intelligence and Sales Acceleration capabilities.',
            type: 'partnership',
            priority: 'normal',
            isPrivate: false,
            isPinned: false,
            tags: ['partnership', 'technology', 'strategic'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

      } catch (error) {
        console.error(`   ❌ Error adding partnership to ${workspace.name}:`, error.message);
      }
    }

    // 3. Summary
    console.log('\n📊 PARTNERSHIP ADDITION SUMMARY:');
    console.log(`✅ Successfully added: ${addedCount} partnerships`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} partnerships`);
    console.log(`📈 Total customer workspaces: ${customerWorkspaces.length}`);
    
    if (addedCount > 0) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Verify partnerships appear in customer workspace partner lists');
      console.log('2. Test partner-related functionality and data sharing');
      console.log('3. Set up automated partnership health monitoring');
    }

  } catch (error) {
    console.error('❌ PARTNERSHIP ADDITION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the partnership addition
addAdrataAsPartner()
  .then(() => {
    console.log('✅ Partnership addition completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Partnership addition failed:', error);
    process.exit(1);
  });
