/**
 * Create Tony Luthor test user in Adrata workspace
 * Username: tony
 * Password: tonypass
 * Purpose: Battle testing the system before Monday launch
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTonyLuthorUser() {
  try {
    console.log('🚀 Creating Tony Luthor test user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'tony@adrata.com' }
    });

    if (existingUser) {
      console.log('✅ Tony Luthor user already exists');
      console.log('User ID:', existingUser.id);
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('tonypass', 12);

    // Get Adrata workspace
    const adrataWorkspace = await prisma.workspace.findUnique({
      where: { id: '01K1VBYXHD0J895XAN0HGFBKJP' } // Adrata workspace ID
    });

    if (!adrataWorkspace) {
      throw new Error('Adrata workspace not found');
    }

    // Create Tony Luthor user
    const tonyUser = await prisma.user.create({
      data: {
        id: 'tony-luthor-test',
        email: 'tony@adrata.com',
        name: 'Tony Luthor',
        firstName: 'Tony',
        lastName: 'Luthor',
        password: hashedPassword,
        isActive: true,
        title: 'Sales Representative', // Entry level seller
        department: 'Sales',
        seniorityLevel: 'Entry',
        intelligenceFocus: JSON.stringify({
          priorities: ['lead_generation', 'company_research'],
          industries: ['technology', 'finance'],
          signals: []
        })
      }
    });

    // Connect user to Adrata workspace
    await prisma.workspaceUser.create({
      data: {
        userId: tonyUser.id,
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        role: 'member'
      }
    });

    // Also create workspace membership for full access
    await prisma.workspaceMembership.create({
      data: {
        userId: tonyUser.id,
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        role: 'SELLER',
        isActive: true,
        joinedAt: new Date()
      }
    });

    console.log('✅ Tony Luthor user created successfully');
    console.log('User ID:', tonyUser.id);
    console.log('Email:', tonyUser.email);
    console.log('Name:', tonyUser.name);
    console.log('Title:', tonyUser.title);
    console.log('Department:', tonyUser.department);
    console.log('Workspace: Adrata');

    return tonyUser;

  } catch (error) {
    console.error('❌ Error creating Tony Luthor user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTonyLuthorUser()
    .then(() => {
      console.log('🎯 Tony Luthor user setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create Tony Luthor user:', error);
      process.exit(1);
    });
}

module.exports = { createTonyLuthorUser };
