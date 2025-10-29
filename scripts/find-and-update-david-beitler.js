#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const DAVID_EMAIL = 'd.beitler@winningvariant.com';
const NEW_ROLE = 'champion';

async function findAndUpdateDavidBeitler() {
  try {
    console.log('🔍 FINDING AND UPDATING DAVID BEITLER');
    console.log('=' .repeat(60));
    console.log(`Email: ${DAVID_EMAIL}`);
    console.log(`New Role: ${NEW_ROLE}\n`);

    // Find David Beitler across all workspaces
    console.log('🔍 Searching for David Beitler across all workspaces...');
    const david = await prisma.people.findFirst({
      where: {
        OR: [
          { email: DAVID_EMAIL },
          { workEmail: DAVID_EMAIL },
          { personalEmail: DAVID_EMAIL }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        jobTitle: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        workspaceId: true,
        company: {
          select: {
            name: true,
            id: true
          }
        },
        workspace: {
          select: {
            name: true
          }
        }
      }
    });

    if (!david) {
      console.log('❌ David Beitler not found in any workspace');
      console.log('   Please verify the email address');
      return;
    }

    console.log('✅ Found David Beitler:');
    console.log(`   ID: ${david.id}`);
    console.log(`   Name: ${david.fullName}`);
    console.log(`   Email: ${david.email || david.workEmail || david.personalEmail}`);
    console.log(`   Title: ${david.jobTitle || 'Unknown'}`);
    console.log(`   Company: ${david.company?.name || 'Unknown'} (${david.company?.id})`);
    console.log(`   Workspace: ${david.workspace?.name || 'Unknown'} (${david.workspaceId})`);
    console.log(`   Current Role: ${david.buyerGroupRole || 'None'}`);
    console.log(`   In Buyer Group: ${david.isBuyerGroupMember || false}`);

    // Check if he's connected to Winning Variant
    if (david.company?.name?.toLowerCase().includes('winning variant') || 
        david.company?.name?.toLowerCase().includes('winningvariant')) {
      console.log('✅ David is connected to Winning Variant company');
    } else {
      console.log('⚠️  David is not connected to Winning Variant company');
      console.log(`   Current company: ${david.company?.name}`);
    }

    // Update David's buyer group role
    console.log(`\n🔄 Updating to ${NEW_ROLE} role...`);
    
    const updatedDavid = await prisma.people.update({
      where: { id: david.id },
      data: {
        buyerGroupRole: NEW_ROLE,
        isBuyerGroupMember: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        updatedAt: true
      }
    });

    console.log('✅ Successfully updated David Beitler!');
    console.log(`   New Role: ${updatedDavid.buyerGroupRole}`);
    console.log(`   In Buyer Group: ${updatedDavid.isBuyerGroupMember}`);
    console.log(`   Updated At: ${updatedDavid.updatedAt.toISOString()}`);

    // Verify the update
    console.log('\n🔍 Verifying the update...');
    const verification = await prisma.people.findUnique({
      where: { id: david.id },
      select: {
        fullName: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        updatedAt: true,
        company: {
          select: {
            name: true
          }
        }
      }
    });

    if (verification.buyerGroupRole === NEW_ROLE && verification.isBuyerGroupMember === true) {
      console.log('✅ Verification successful! David Beitler is now a champion in the buyer group.');
      console.log(`   Company: ${verification.company?.name}`);
    } else {
      console.log('❌ Verification failed! The update may not have been applied correctly.');
      console.log(`   Expected role: ${NEW_ROLE}, got: ${verification.buyerGroupRole}`);
      console.log(`   Expected in buyer group: true, got: ${verification.isBuyerGroupMember}`);
    }

  } catch (error) {
    console.error('❌ Error updating David Beitler:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
findAndUpdateDavidBeitler().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
