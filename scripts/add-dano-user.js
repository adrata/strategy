#!/usr/bin/env node

/**
 * Add Dano as a user for email scheduling
 * Sets up Dano with ET timezone and proper workspace membership
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDanoUser() {
  try {
    console.log('👤 Adding Dano as a user...');
    
    // First, check if Dano already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'dan@adrata.com' }
    });
    
    if (existingUser) {
      console.log('✅ Dano already exists, updating timezone...');
      
      await prisma.user.update({
        where: { email: 'dan@adrata.com' },
        data: {
          timezone: 'America/New_York',
          title: 'Founder',
          department: 'Executive',
          isActive: true
        }
      });
      
      console.log('✅ Dano updated with ET timezone');
    } else {
      console.log('🆕 Creating new user for Dano...');
      
      // Create Dano as a user
      const dano = await prisma.user.create({
        data: {
          email: 'dan@adrata.com',
          name: 'Dano',
          firstName: 'Dano',
          lastName: 'Adrata',
          timezone: 'America/New_York',
          title: 'Founder',
          department: 'Executive',
          isActive: true,
          communicationStyle: 'consultative',
          preferredDetailLevel: 'detailed'
        }
      });
      
      console.log('✅ Dano created successfully');
    }
    
    // Get or create workspace
    let workspace = await prisma.workspace.findFirst({
      where: { name: 'Notary Everyday' }
    });
    
    if (!workspace) {
      console.log('🏢 Creating Notary Everyday workspace...');
      
      workspace = await prisma.workspace.create({
        data: {
          name: 'Notary Everyday',
          isActive: true,
          settings: {
            emailNotifications: true,
            timezone: 'America/New_York'
          }
        }
      });
      
      console.log('✅ Workspace created');
    }
    
    // Add Dano to workspace
    const existingMembership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: existingUser?.id || (await prisma.user.findUnique({ where: { email: 'dan@adrata.com' } })).id,
        workspaceId: workspace.id
      }
    });
    
    if (!existingMembership) {
      console.log('🔗 Adding Dano to workspace...');
      
      await prisma.workspaceMembership.create({
        data: {
          userId: existingUser?.id || (await prisma.user.findUnique({ where: { email: 'dan@adrata.com' } })).id,
          workspaceId: workspace.id,
          role: 'OWNER',
          isActive: true
        }
      });
      
      console.log('✅ Dano added to workspace');
    }
    
    console.log('🎉 Dano setup complete!');
    console.log('📧 Email schedule:');
    console.log('   - Monday 8 AM ET: Monday Prep Email');
    console.log('   - Tuesday-Thursday 5 PM ET: Daily Wrap');
    console.log('   - Friday 5 PM ET: Friday Combined Email');
    
  } catch (error) {
    console.error('❌ Error setting up Dano:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  addDanoUser().catch(console.error);
}

module.exports = { addDanoUser };
