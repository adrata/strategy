#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const ADRATA_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
const DAVID_EMAIL = 'd.beitler@winningvariant.com';
const NEW_ROLE = 'champion';

async function updateDavidBeitlerRole() {
  try {
    console.log('🎯 UPDATING DAVID BEITLER TO CHAMPION ROLE');
    console.log('=' .repeat(60));
    console.log(`Workspace: Adrata (${ADRATA_WORKSPACE_ID})`);
    console.log(`Email: ${DAVID_EMAIL}`);
    console.log(`New Role: ${NEW_ROLE}\n`);

    // Find David Beitler's person record
    console.log('🔍 Looking for David Beitler...');
    const david = await prisma.people.findFirst({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
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
        company: {
          select: {
            name: true
          }
        }
      }
    });

    if (!david) {
      console.log('❌ David Beitler not found in the Adrata workspace');
      console.log('   Please verify the email address and workspace ID');
      return;
    }

    console.log('✅ Found David Beitler:');
    console.log(`   ID: ${david.id}`);
    console.log(`   Name: ${david.fullName}`);
    console.log(`   Email: ${david.email || david.workEmail || david.personalEmail}`);
    console.log(`   Title: ${david.jobTitle || 'Unknown'}`);
    console.log(`   Company: ${david.company?.name || 'Unknown'}`);
    console.log(`   Current Role: ${david.buyerGroupRole || 'None'}`);
    console.log(`   In Buyer Group: ${david.isBuyerGroupMember || false}`);

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
        updatedAt: true
      }
    });

    if (verification.buyerGroupRole === NEW_ROLE && verification.isBuyerGroupMember === true) {
      console.log('✅ Verification successful! David Beitler is now a champion in the Winning Variant buyer group.');
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
updateDavidBeitlerRole().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
